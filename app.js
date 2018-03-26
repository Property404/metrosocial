const express = require("express");
const app = express();
const fs = require("fs");
const Twitter = require('twitter-node-client').Twitter;
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

idsToIgnore = []
var cresponse = undefined

// Callbacks
const errorWithReturn = function (err, response, body) {
	error(err, response, body);
	cresponse.send("{success: 'false', status: 500}");

};
const successWithReturn = function (data) {
	success(data);
	cresponse.send("{success: 'true', status: 200}");

};
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

// Ignore id
app.post("/api/ignoreid", function(req, res){
	const id = req.body.id;
	idsToIgnore.push(id);
	console.log("Ignoring " + id);
	successWithReturn("Success in ignoration!");
});

// Return mentions
app.get("/twitter/timeline/", function(req, res) { 
	cresponse = res;
	const count = req.query.count == undefined?20:req.query.count;
	twitter.getMentionsTimeline({screen_name: config.twitter_handle, count: count}, errorWithReturn, function(data){
		var  d = [];
		for(var t of JSON.parse(data)){
			if(-1 == idsToIgnore.indexOf(t.id_str))
			{
				d.push(t);
			}
		}
		res.send(d);
	})
});

// Reply to a tweet
app.post("/twitter/tweet/", function(req, res) { 
	cresponse = res;
	const id = req.body.id
	const status = req.body.status
	twitter.postTweet({in_reply_to_status_id: id, status: status}, errorWithReturn, function(data){
		console.log("Posting tweet: ");
		idsToIgnore.push(id);
		res.send(data);
	})
});

// Reply to a tweet privately
app.post("/twitter/message/", function(req, res) { 
	cresponse = res;
	const id = req.body.id;
	const status = req.body.status;
	const screen_name = req.body.screen_name;
	twitter.doPost(twitter.baseUrl + "/direct_messages/new.json", {screen_name: screen_name, text: status}, errorWithReturn, function(data){
		console.log("Posting Message: ");
		idsToIgnore.push(id);
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
