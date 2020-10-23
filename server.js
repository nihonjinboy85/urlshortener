'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const dns = require('dns');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const url = require('url');

// Basic Configuration 
const port = process.env.PORT || 3000;
const app = express();

// CORS Middleware
app.use(cors());

// Set the MongoDB Client that will be used
const client = new MongoClient(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let urlCollection = '';
client.connect(err => {
  if(err) {
    res.json({ status: 'failure', msg: err });
  } else {
    urlCollection = client.db('url-shortener').collection('urls');
    console.log('Connected to db...');
  }
});

// body-parser Middleware
app.use(bodyParser.urlencoded({extended: true}));

// Set static HTML folder
app.use('/public', express.static(process.cwd() + '/public'));

// Handle root route GET requests
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// Handle POST requests to add new URLs to collection and return short URL
app.post('/api/shorturl/new', (req, res) => {
  const myURL = new URL(req.body.url);
  dns.lookup(myURL.host, (err) => {
    if(err) {
      res.json({ error: 'invalid URL' });
    } else {
      const urlDocument = { original_url: req.body.url };
      urlCollection.insertOne(urlDocument)
        .then(() => { urlCollection.findOne({original_url: req.body.url})
          .then(result => result === null ? 
                res.json({ error: 'URL not added to DB' }) :
                res.json({ original_url: result.original_url, short_url: result._id }))
          .catch(error => res.json({ error: 'invalid query' }));
        })
        .catch(error => res.json({ error: 'invalid URL' }));
    }
  });
});

// Lookup URL ID provided and redirect to corresponding long URL
app.get('/api/shorturl/:id', (req, res) => {
  urlCollection.findOne({ original_url: 'https://forum.freecodecamp.org' })
    .then(result => {
      result === null ? res.json({ error: 'invalid URL' }) : res.redirect(result.original_url);
    })
    .catch(err => res.json({ error: 'invalid query'}));
});

// Start server
app.listen(port, function () {
  console.log(`Node.js listening at port ${process.env.PORT}`);
});
