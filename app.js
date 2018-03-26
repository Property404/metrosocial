const express = require("express");
const app = express();
const fs = require("fs");
const Twitter = require('twitter-node-client').Twitter;

// Callbacks
const error = function (err, response, body) {
	console.log('ERROR [%s]{%s}{%s}', err, response, body);
};
const success = function (data) {
	console.log('Data [%s]', data);
};

// General
config = {
	twitter_handle:"DaganMartinez"
}

// Set up twitter API
twitter_config = JSON.parse(fs.readFileSync('./twitter_config.json', encoding="ascii"));
var twitter = new Twitter(twitter_config);

// Return mentions
app.get("/twitter/timeline/", function(req, res) { 
	const count = req.query.count == undefined?20:req.query.count;
	twitter.getMentionsTimeline({screen_name: config.twitter_handle, count: count}, error, function(data){
		res.send(data);
	})
});

// Reply to a tweet
app.post("/twitter/tweet/", function(req, res) { 
	const id = req.query.id;
	const status = req.query.status;
	twitter.postTweet({in_response_to_status_id: id, status: status}, error, function(data){
		res.send(data);
	})
});




/* serves main page */
app.get("/", function(req, res) {
	res.sendfile('./html/index.html')
});

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){ 
	console.log('static file request : ' + req.params);
	res.sendfile( "html/" + req.params[0]); 
});




const  port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log("Listening on " + port);
});
