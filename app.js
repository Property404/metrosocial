const crypto = require('crypto')
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mysql = require("mysql");
const app = express();
const fs = require("fs");
const Twitter = require('twitter-node-client').Twitter;
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
var token = "unset";
crypto.randomBytes(48, function(err, buffer) {
  token = buffer.toString('hex');
});
app.use(session({secret: token}));

const TABLE_NAME = "ms_users";
const ERROR = "{status: 500}";
var idsToIgnore = [];

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
global.btoa = function (str) {return new Buffer(str).toString('base64');}

// Auth functions
var hash = function(password){
	return crypto.createHash('sha256').update(password).digest('base64');
}
function checkAuth (req, res, next) {
	console.log('checkAuth ' + req.url);

	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (req.url == '/' && (!req.session || !req.session.authenticated)) {
		if(req.url !== '/js/bulma.js' && !(req.url.endsWith('css')))
		{
			console.log('Redirect from ' + req.url);
			res.redirect('/login.html');
		}
		return;
	}

	next();
}

function authenticate(username, password){
	password  = hash(password);
	username = btoa(username)
	rv = 3
	query = "SELECT * FROM "+TABLE_NAME+" WHERE username='"+username+"' and hash='"+password+"';";
	console.log(query);
	con.query(query, function(err, result, fields){
			if(err)throw err;
			if(result.length == 0){
				rv = false;
				console.log("Auth failed");
			}else{
				console.log("Auth passed");
			}
			console.log(result);
			console.log(result.length);
		});
}
app.post("/auth", function(req, res){
	const username = btoa(req.body.username);
	const password = hash(req.body.password);
	query = "SELECT * FROM "+TABLE_NAME+" WHERE username='"+username+"' and hash='"+password+"';";
	con.query(query, function(err, result, fields){
		if(err)throw err;
		if(result.length == 0){
			res.redirect("/login.html?fail=1");
		}else{
			req.session.authenticated = true;
			res.redirect("/");
		}
		console.log(result);
		console.log(result.length);
	});
});
app.get("/logout", function(req, res){
	try{
		delete res.session.authenticated;
	}catch(e){
		console.log(e);
	}
	res.redirect("/login.html");
});
app.use(checkAuth);


// Setup mysql
var db_config = JSON.parse(fs.readFileSync('./db_config.json', encoding="ascii"));
var con = mysql.createConnection({
	 host: db_config.host,
	 user: db_config.user,
	 password: db_config.password,
	database: db_config.database
 });
con.connect(function(err){
	if(err)throw err;
	console.log("Connected!");
});
con.query("CREATE TABLE IF NOT EXISTS "+TABLE_NAME+" (id int NOT NULL AUTO_INCREMENT, username varchar(255) NOT NULL UNIQUE, hash varchar(255), PRIMARY KEY (id));", function(err, result){
	if(err) throw err;
	console.log("Create table result: " + result);
	con.query("INSERT INTO "+TABLE_NAME+" (username, hash) VALUES ('"+btoa('admin')+"', '"+hash('hunter2')+"');" , function(err, result){
		if(err)
		{
			console.log("Admin already set;");
		}
		else{
			console.log("Created Admin");
		}
	});
});

// Set up twitter API
var twitter_config = JSON.parse(fs.readFileSync('./twitter_config.json', encoding="ascii"));
var twitter = new Twitter(twitter_config);

// Ignore id
app.post("/api/ignoreid", function(req, res){
	const id = req.body.id;
	idsToIgnore.push(id);
	console.log("Ignoring " + id);
	res.send("{}");
});

// Return mentions
app.get("/twitter/timeline/", function(req, res) { 
	cresponse = res;
	const count = req.query.count == undefined?20:req.query.count;
	twitter.getMentionsTimeline({screen_name: config.twitter_handle, count: count}, function(e, r, b){res.send(ERROR);console.log(e);},
		function(data){
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
	twitter.postTweet({in_reply_to_status_id: id, status: status}, function(e,r,b){res.send(ERROR);console.log(e);}, function(data){
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
	twitter.doPost(twitter.baseUrl + "/direct_messages/new.json", {screen_name: screen_name, text: status}, function(e,r,b){res.send(ERROR);console.log(e);}, function(data){
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
