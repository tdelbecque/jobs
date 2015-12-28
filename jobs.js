#!/usr/bin/node

var ja = require ('./nsjobads');
var F = new ja ().setNSFull ();

var fileout = require ('path').dirname (process.argv [1]) + '/save/tothor-' + new Date ().getTime () + '.csv';

F.requestNSToBing (fileout);


