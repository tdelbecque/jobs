#!/usr/bin/node --max-old-space-size=1024

var sendMeAlert = require ('./mail').sendMeAlert;

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in server: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
    sendMeAlert (message)
});

require ('./server').createServer ()
