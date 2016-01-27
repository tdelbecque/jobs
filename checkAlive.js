process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in jobs download process: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
});

var exec = require('child_process').exec;
var UTILS = require ('./process');
var fs = require ('fs')

var undef;

function check (list, i) {
    var self = this || {}

    self.done = 0

    function fun0 (error, stdout, stderr, data) {
	data.error = error
	data.stdout = stdout && stdout.length
	data.stderr = stderr
	self.done ++
	if (self.done === list.length)
	    console.log ('fini')
    }

    function fun1 (url) {
	var d = {
	    child: exec ("wget -qO- " + url,
			 function (error, stdout, stderr) {
			     fun0 (error, stdout, stderr, d)})}
	return d
    }
    
    self.result = list.map (fun1)
}

exports.check = check

function checkIth (list, i, whenFinish) {
    if (i === list.length) {
	if (whenFinish !== undef)
	    whenFinish (list)
	
	return
    }

    function fun0 (error, stdout, stderr, data) {
	data.error = error
	data.stdout = stdout
	data.stderr = stderr
	checkIth (list, i + 1, whenFinish)
    }

    exec ("wget -qO- " + list [i].url,
	  function (error, stdout, stderr) {
	      fun0 (error, stdout, stderr, list [i]) })
}

exports.checkIth = checkIth;

function getDeadLinks (fileout) {
    function whenFinish (list) {
	var deadLinks = list.
	    filter (function (x) {return x.error !== null}).
	    map (function (x) {return x.url})
	var str = JSON.stringify (deadLinks)
	if (fileout)
	    fs.writeFileSync (fileout, str)
	else
	    process.stdout.write (str)
    }
    
    var urls = UTILS.asColumns (UTILS.aggregateData (false, 0, 1)).
	applyUrl.
	map (function (x) {return {url: x}})
    checkIth (urls, 0, whenFinish);
}

exports.getDeadLinks = getDeadLinks;

function getDeadLinks2 (linksToTest, whenFinish) {
    function whenFinishInner (list) {
	var deadLinks = list.
	    filter (function (x) {return x.error !== null}).
	    map (function (x) {return x.url})
	whenFinish (deadLinks)
    }
    
    var urls = linksToTest.map (function (x) {return {url: x}})
    checkIth (urls, 0, whenFinishInner);
}

exports.getDeadLinks2 = getDeadLinks2;
