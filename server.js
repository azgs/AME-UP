const config = require('./server.config.json');

const express = require('express');
const app = express();
const request = require('request');
require('ssl-root-cas').addFile('SymantecClass3SecureServerCA-G4-bogi.txt').inject();

const logger = require('morgan');
const fs = require('fs');
const path = require('path')
const rfs = require('rotating-file-stream')

const url = require('url');
const logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
});
app.use(logger('common', {
	stream: accessLogStream, 
	skip: function (req, res) {
		//return req.url.includes("bower_components"); 
		const path = url.parse(req.url).pathname;
		return path !== '/';
	}
}));

//Create http listener always
const http = require('http');
app.set('port', config.nonTLSPort);
console.log("creating http server");
let server = http.createServer(app);
server.listen(config.nonTLSPort, function () {
    console.log('Express http server listening on port ' + config.nonTLSPort);
});

//Create https listener if configured
if (config.useTLS) {
    const options = {
        key: fs.readFileSync('cert/ameup_private.key'),
        cert: fs.readFileSync('cert/ameup_usgin_org_cert.cer'),
        ca: fs.readFileSync('cert/ameup_usgin_org_interm.cer')
    };    
    const https = require('https');
    app.set('port', config.TLSPort);
	console.log("before app.all");
	console.log("creating https server");
    server = https.createServer(options, app);
	server.listen(config.TLSPort, function () {
		console.log('Express https server listening on port ' + config.TLSPort);
	});
	//redirect all traffic to https
	app.all('*', function (req, res, next){
		if(req.secure){
			return next();
		};
		res.redirect('https://' + req.hostname + ":" + config.TLSPort + req.url); 
	});
};

app.use('/', express.static(__dirname + '/app'));

//this path is used for api's that haven't implemented CORS
app.use('/proxy', function(req, res) {  
	var url = req.url.replace(/^\//,'');
	req.pipe(request(url, function(error, response, body){
		if (error != null) {
			console.error('Connection problem with ' + url); 
			console.error(error);
		}
	})).pipe(res);
});

if (config.ignoreCertErrors) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 
}





