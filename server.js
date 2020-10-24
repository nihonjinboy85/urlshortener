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
    console.error(err);
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
  try {
    const myURL = new URL(req.body.url);
  } catch {
    res.json({ error: 'invalid url' });
  }
  dns.lookup(myURL.host, (err) => {
    if(err) {
      res.json({ error: 'invalid url' });
    } else {
      const urlDocument = { original_url: req.body.url };
      urlCollection.findOne(urlDocument).then(result => {
        if(result === null) {
          getNextSequenceValue('urlid').then(sequenceDocument => {
            const short_url = sequenceDocument.value.sequence_value;
            urlCollection.insertOne({ ...urlDocument, short_url: short_url }).then(() => {
              urlCollection.findOne(urlDocument).then(result => {
                if(result === null) {
                  res.json({ error: 'URL not added to DB' });
                } else {
                  res.json({
                    original_url: result.original_url,
                    short_url: result.short_url
                  });
                }
              })
              .catch(error => res.json({ error: 'invalid query' }));
            })
            .catch(error => res.json({ error: 'invalid url' }));
          })
          .catch(error => res.json({ error: 'new ID not created' }));
        } else {
          res.json({
            original_url: result.original_url,
            short_url: result.short_url
          });
        }
      });
    }
  });
});

// Lookup URL ID provided and redirect to corresponding long URL
app.get('/api/shorturl/:short_url', (req, res) => {
  urlCollection.findOne({ short_url: Number(req.params.short_url) })
    .then(result => {
      result === null ? res.json({ error: 'invalid URL' }) : res.redirect(result.original_url);
    })
    .catch(err => res.json({ error: 'invalid query'}));
});

// Start server
app.listen(port, function () {
  console.log(`Node.js listening at port ${process.env.PORT}`);
});

function getNextSequenceValue(sequenceName) {
  return client.db('url-shortener').collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { returnNewDocument: true }
  );
}
