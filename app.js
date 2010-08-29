var express = require('express'),
    connect = require('connect'),
		faye = require('./lib/faye-0.5.2/faye-node.js')

// Utilities
Utils = function() {
	
	var BLURB_SIZE = HOSTED_ON_JOYENT ? 7 : 1
  		,BLURB_CHARS = "abcdefghijklmnopqrstuvxywz"
	
	this.baseUrl = function(req) {
		return req.headers['host'].split(":")[0];
	}
	this.generateBlurb = function() {
		var blurb = '';
	  for (i=0;i<BLURB_SIZE;i++){
	    blurb += BLURB_CHARS[Math.floor(Math.random()*BLURB_CHARS.length)]
	  }
	  return blurb;
	}
	
	this.getPubSubServerURL = function(req) {
		return "http://"+this.baseUrl(req)+":8000/pubsubhub"
	}
 }
utils = new Utils();

channels = {};

// Express setup
var app = module.exports = express.createServer();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
	res.render('index.html.haml', {
	    locals: {
	        title: 'Umeboshi Fireteam FTW'
	    }
	});
});

app.get('/channels/new', function(req, res) {
	var baseURL = utils.baseUrl(req);
  var blurb = utils.generateBlurb();
	var channelURL = utils.getPubSubServerURL(req)+"/"+blurb;
	channels[blurb] = channelURL;
	res.render('channels/new_channel.html.haml', {
		locals: {
			channel: channelURL
		}
	});
});

app.get('/channels/info/:id', function(req, res) {
	channelID = req.params.id;
	channelURL = channels[channelID];
	res.send(channelURL, { 'Content-Type': 'text/plain' }, 201);
});

app.get('/channels', function(req, res) {
	res.render('channels/channels.html.haml', {
		locals: {
			channelList: channels 
		}
	});
});

app.get('/demo/publisher/:id', function(req, res){
	channelID = req.params.id;
	channelURL = channels[channelID];
	pubsubURL = utils.getPubSubServerURL(req);
	jsFile = pubsubURL+".js"
	res.render('demo_widget/demo_publisher.html.haml', {
		locals: {
			pubsubJSFile: jsFile
			, pubsubURL: pubsubURL
			, channel: channelID
		}
	})
}); 

// Only listen on $ node app.js
var  HOSTED_ON_JOYENT = /\/home\/node\/node\-service\/releases\/[^\/]*\/server.js/.test(__filename)
    ,WEBSERVER_PORT = HOSTED_ON_JOYENT ? 80 : 8080

if (!module.parent) app.listen(WEBSERVER_PORT);