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

app.set('port', process.env.PORT || 8000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


