var express = require('express');
var app = express();
var request = require('request');
require('ssl-root-cas').addFile('SymantecClass3SecureServerCA-G4-bogi.txt').inject();

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


