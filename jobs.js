#!/usr/bin/node --max-old-space-size=1024

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var sendMeAlert = require ('./mail').sendMeAlert;

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in jobs download process: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
    sendMeAlert (message)
});

var ja = require ('./nsjobads');
var F = new ja ().setNSFull ();

var stamp = new Date ().getTime ();

F.requestNSToBing (stamp);

