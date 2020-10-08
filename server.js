'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const url = require('url');


// Basic Configuration 
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(console.log('Connected to db...'));

const urlSchema = new mongoose.Schema({ 
  id: { type: Number, default: 1 },
  longUrl: String 
});
const UrlModel = mongoose.model('UrlModel', urlSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', (req, res) => {
  const myURL = new URL(req.body.url);
  dns.lookup(myURL.host, (err) => {
    if(err) {
      res.json({ 'error': 'invalid URL' });
    } else {
      const urlRecord = new UrlModel({ longUrl: myURL });
      urlRecord.save((err, urlRecord) => {
        if(err) {
          res.json({ 'error': err });
        } else {
          res.json({ 'original_url': myURL.host, 'short_url': urlRecord.id });
        }
      })
    }
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  if(req.params.id === 'id') {
    res.redirect('https://forum.freecodecamp.org/');
  }
});

app.listen(port, function () {
  console.log(`Node.js listening at port ${process.env.PORT}`);
});
