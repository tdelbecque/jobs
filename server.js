process.on('uncaughtException', function (err) {
  console.log(err);
});

var http = require('http');
var https = require ('https');
var xmldom = require ('xmldom');
var xpath = require ('xpath');

var undef;

function createServer () {
    var req = null;
    http.createServer(function (request, response) {
	req = request;
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end('Woohoo!');
    }).listen(8081);
}

function onResponse (response) {
    var body = '';
    response.on('data', function(d) {
        body += d;
    });
    response.on ('end', function() {
	foobar = {content: body};
	var x = /.*(<html[^]*)/.exec (body);
	if (x) {
	    foobar.doc = new xmldom.DOMParser ().parseFromString (x [1]);
	    var countries = xpath.select ('//tr', foobar.doc).
		map (function (x) {
		    var nodes = xpath.select ('*[self::th or self::td]', x);
		    if (nodes.length !== 2) return null;
		    if (! /.*[Cc]ountry$/.exec (nodes [0].textContent)) return null;
		    return nodes [1].textContent;
		}).
		filter (function (x) {return x});
	    foobar.countries = countries;
	    if (! foobar.countries.length) {
		if (xpath.select ('//a', foobar.doc).
		    filter (function (x) {return x.firstChild && x.firstChild.data === 'ISO 3166 code'}).length > 0) {
		    foobar.countries = [xpath.select ('//h1', foobar.doc) [0].firstChild.data]
		} 
	    }
	    xpath.select ('//span', foobar.doc).
		forEach (function (x) {
		    var c = x.getAttribute ('class'); 
		    if (c === 'longitude' || c === 'latitude') {
			foobar [c] = x.firstChild.data
		    }
		});
	}
	console.log ("Got " + body.length)
    })
}
//https.get ('https://www.bing.com/search?q=Abingdon,%20Oxfordshire', m.onResponse)
exports.onResponse = onResponse;

function dohttps (url, responseHandler) {
    if (! responseHandler) responseHandler = onResponse;
    if (! url) url = 'https://en.wikipedia.org/wiki/West_Sussex';
    if (url.indexOf ('/') === -1) url = 'https://en.wikipedia.org/wiki/' + url;
    return https.get (url, responseHandler).on ('error', function (err) {console.log (err)})
}

exports.dohttps = dohttps;

function percentEncode (s) {
    s = encodeURIComponent(s);
    s = s.replace(/\!/g, "%21");
    s = s.replace(/\*/g, "%2A");
    s = s.replace(/\'/g, "%27");
    s = s.replace(/\(/g, "%28");
    s = s.replace(/\)/g, "%29");
    return s;
}

function BingIth (xs, i, onFinish) {
    if (! i) console.log ('XBinging ' + xs.length + ' items');
    if (i === xs.length) {
	console.log ('Bing finished');
	if (onFinish !== undef) 
	    onFinish ();
	return
    }
    var onResponse = function (response) {
	var body = '';
	response.on('data', function(d) {
            body += d;
	});
	response.on ('end', function() {
	    xs [i].length = 2;
	    var x = /(https:\/\/...wikipedia.org\/wiki\/.*?)"/.exec (body);
	    if (x) {
		xs [i].push (x [1]);
		console.log ('found ' + i)
	    } else {
		xs [i].push (null);
		console.log ('not found ' + i)
	    }
	    BingIth (xs, i + 1, onFinish)
	})
    };
    var query = 'https://www.bing.com/search?q=' + percentEncode (xs [i][1].trim () + " en.wikipedia");
    https.get (query, onResponse).
	on ('error', function (err) {console.log (err)})
}

exports.BingIth = BingIth;

function WikiIth (xs, i, onFinish) {
    if (! i) console.log ('Wikiing ' + xs.length + ' items'); 
    if (i === xs.length) {
	console.log ('Wiki finished');
	if (onFinish !== undef) 
	    onFinish ();
	return
    }
    var onResponse = function (response) {
	var body = '';
	response.on ('data', function (d) {
	    body += d;
	});
	response.on ('end', function () {
	    var foobar = {content: body};
	    var x = /.*(<html[^]*)/.exec (body);
	    if (x) {
		foobar.doc = new xmldom.DOMParser ().parseFromString (x [1]);
		var countries = xpath.select ('//tr', foobar.doc).
		    map (function (x) {
			var nodes = xpath.select ('*[self::th or self::td]', x);
			if (nodes.length !== 2) return null;
			if (! /.*[Cc]ountry$/.exec (nodes [0].textContent)) return null;
			return nodes [1].textContent
		    }).
		    filter (function (x) {return x});
		foobar.countries = countries;
		if (! foobar.countries.length) {
		    if (xpath.select ('//a', foobar.doc).
			filter (function (x) {return x.firstChild && x.firstChild.data === 'ISO 3166 code'}).length > 0) {
			foobar.countries = [xpath.select ('//h1', foobar.doc) [0].firstChild.data]
		    } 
		}
		xpath.select ('//span', foobar.doc).
		    forEach (function (x) {
			var c = x.getAttribute ('class'); 
			if (c === 'longitude' || c === 'latitude') {
			    foobar [c] = x.firstChild.data
			}
		    });
		xs [i].push ({countries: foobar.countries, longitude: foobar.longitude, latitude: foobar.latitude});
		if (foobar.longitude) console.log ('Wiki got ' + i);
		else console.log ('Wiki not got ' + i);
	    }
	    else console.log ('Wiki not got ' + i);
	    WikiIth (xs, i + 1, onFinish)
	})
    };
    var query = xs [i][2];
    if (query) {
	https.get (query, onResponse).
	    on ('error', function (err) {console.log (err)})
	
    } else {
	console.log ('Wiki skip ' + i);
	xs [i].push (null);
	WikiIth (xs, i + 1, onFinish)
    }
}

exports.WikiIth = WikiIth;

function clusterArrayPerValues (xs) {
    var clusters = {};
    xs.forEach (function (x) {(clusters [x [1]] || (clusters [x [1]] = [])). push (x [0])});
    var ret = [];
    Object.keys (clusters).forEach (
	function (x) {
	    ret.push ([clusters [x], x])
	});
    return ret;
} 

function unclusterArray (xs) {
    var ret = []
    xs.forEach (function (x) {
	var v = x.slice (1);
	x [0].forEach (function (y) {
	    ret.push ([y].concat (v))
	})
    });
    return ret;
}

exports.clusterArrayPerValues = clusterArrayPerValues;
exports.unclusterArray = unclusterArray;

function sexagesimalToDecimal (x) {
    if (x === undef) return undef;
    var y = /(\d+).(\d+).(\d+).(E|W|N|S)/.exec (x) || /(\d+).(\d+).(E|W|N|S)/.exec (x);
    if (! y) return NaN;
    if (y [4]) {
	y3 = y [3];
	y4 = y [4]
    } else {
	y3 = 0;
	y4 = y [3]
    }
    var z = 1*y [1] + y [2]/60 + y3/3600;
    return y4 === 'E' || y4 === 'N' ? z : -z;
}
exports.sexagesimalToDecimal = sexagesimalToDecimal;

function clusteredWikiToData (wiki, data) {
    var keyToLocation = {};
    var unclustered = unclusterArray (wiki).forEach (
	function (x) {
	    keyToLocation [x [0]] = {
		latitude: (x [3] && sexagesimalToDecimal (x [3].latitude)) || undef,
		longitude: (x [3] && sexagesimalToDecimal (x [3].longitude)) || undef
	    }
	}
    );

    data.latitudes = data.id.map (function (k) {return (keyToLocation [k] && keyToLocation [k].latitude) || undef});
    data.longitudes = data.id.map (function (k) {return (keyToLocation [k] && keyToLocation [k].longitude) || undef});
}
 
exports.clusteredWikiToData = clusteredWikiToData;
