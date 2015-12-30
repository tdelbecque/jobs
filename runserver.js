#!/usr/bin/node --max-old-space-size=1024

var sendMeAlert = require ('./mail').sendMeAlert;

process.on('uncaughtException', function (err) {
    console.log(err);
    sendMeAlert ('uncaughtException : ' + err)
});

require ('./server').createServer ()
