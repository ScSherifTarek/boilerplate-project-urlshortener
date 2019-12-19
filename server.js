"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var dns = require("dns");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Define a way to hash strings
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Check if this string is in a valid url format 
var validURL = function(str, success, fail) {
  var pattern = new RegExp(
    "^((http|https)?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  var isValid = pattern.test(str);
  if(isValid) {
    success();
  }
  else {
    fail();
  }
};

// Our Shorten Urls
var shorten_urls = {};

app.post("/api/shorturl/new", function(req, res) {
  var original_url = req.body.url;
  validURL(original_url, () => {
    var hostname = original_url.split("/")[2] //Get what is after http://
                                .split("?")[0]; // if there's (?) in the URL remove it
    dns.lookup(hostname, function(err, addresses, family) {
      if (err) {
        console.log(err);
        res.json({
          error: "invalid URL"
        });
      } else {
        var short_url = original_url.hashCode(); 
        shorten_urls[short_url] = original_url;
        res.json({
          original_url: original_url,
          short_url: short_url
        });
      }
    });
  }, () => {
    res.json({
      error: "invalid URL"
    });
  });
  
});

app.get("/api/shorturl/:short_url", (req, res) => {
  var short_url = req.params.short_url;
  if(typeof shorten_urls[short_url] === "undefined") {
    res.end()
  }
  else {
    res.writeHead(301,
      {
        Location: shorten_urls[short_url]
      }
    );
    res.end();
  }
})

app.listen(port, function() {
  console.log("Node.js listening ...");
});
