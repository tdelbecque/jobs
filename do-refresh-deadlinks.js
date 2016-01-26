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
var rootdir = require ('path').dirname (process.argv [1]);
var savedir = rootdir + '/save';
var deadLinksFile = savedir + '/deadLinks'

m.getDeadLinks (deadLinksFile)

