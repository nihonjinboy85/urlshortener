'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const url = require('url');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(console.log('Connected to db...'));

app.use(cors());

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
    res.json(err ? {"error":"invalid URL"} : {"original_url": req.body.url,"short_url":1});
  });
});

app.listen(port, function () {
  console.log(`Node.js listening at port ${process.env.PORT}`);
});