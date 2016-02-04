var fs = require ('fs');

var undef;

function readLines (path, options) {
    if (options === undef) options = {};
    var lines = options.lines || [];
    var whenFinish = options.whenFinish;
    var whenError = options.whenError;
    var whenLine = options.whenLine;
    
    var str = '';
    if (lines === undef) lines = [];
    function doPart (x, i) {
	if (i == 0) {
	    str += x
	} else {
	    doLine (str);
	    str = x;
	}
    }
    function doLine (l) {
	if (whenLine !== undef)
	    l = whenLine (l);
	lines.push (l);
    }
    
    function onData (x) {
	x = x.toString ();
	var parts = x.split ('\n');
	if (parts [0] == '') {
	    parts.shift ();
	    doLine (str);
	    str = '';
	}
	parts.forEach (doPart);
    }
    function onEnd () {
	if (str != '') doLine (str);
	if (whenFinish !== undef) whenFinish (lines)
    }

    try {
	var stream = fs.createReadStream (path).
	    on ('error', 
		function (err) {
		    console.log (err);
		});
	stream.on ('end', onEnd);
	stream.on ('data', onData);
    }
    catch (err) {
	if (whenError !== undef) whenError (err)
    }
}

exports.readLines = readLines;

function countLines (path, options) {
    if (options === undef) options = {};
    
    function whenLine () {
	return 1;
    }
    function whenFinish (xs) {
	if (options.whenFinish !== undef) options.whenFinish (xs.length);
    }

    readLines (path,
	       {whenLine: whenLine,
		whenFinish: whenFinish,
		whenError: options.whenError})
}


exports.countLines = countLines;

function getFresherFileSync (directory, filter) {
    var fresherFile = undef;
    var n = 0;
    var fileList = fs.readdirSync (directory);
    if (filter !== undef) fileList = fileList.filter (filter);
    fileList.forEach (function (f) {
	var t = new Date (fs.statSync (directory + '/' + f).mtime).getTime ();
	if (t > n) {
	    n = t;
	    fresherFile = f}});
    return fresherFile;
}

exports.getFresherFileSync = getFresherFileSync;

function getIds (file, options) {
    function whenLine (s) {
	var m, l = [], re =/"(\d+)[^"]*trackid/g;
	while (m = re.exec (s)) {l.push (m [1])};
	return l
    }
    if (options == undef) options = {};
    options.whenLine = whenLine;
    readLines (file, options)
}

exports.getIds = getIds;
