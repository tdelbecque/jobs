#!/usr/bin/node

var sendMeAlert = require ('./mail').sendMeAlert;

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in checkAlive process: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
    sendMeAlert (message)
});

var m = require ('./checkAlive')
var deadLinksFile = '/home/thierry/jobs/save/deadLinks'

m.getDeadLinks (deadLinksFile)

