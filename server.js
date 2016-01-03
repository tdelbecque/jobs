var http = require('http');
var https = require ('https');
var xmldom = require ('xmldom');
var xpath = require ('xpath');
var url = require ('url');
var qs = require ('querystring');
var fs = require ('fs');
var sendMeMail = require ('./mail').sendMeMail;
var sendMeAlert = require ('./mail').sendMeAlert;
var UTILS = require ('./process');

var undef;

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

function encode (x) {
    return x.replace (/</g, '&lt;').replace (/>/g, '&gt;');
}

function responseEnd200 (response, load) {
    response.writeHead(200, {'Content-Type': 'text/xml'});
    response.end('<root>' + load + '</root>');
}

function responseEnd404 (response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end('Service not implemented');
}

function responseEnd401 (response) {
    response.writeHead(401, {'Content-Type': 'text/plain'});
    response.end('Unauthorized');
}

function handleAlert (parameters, response) {
    var msg = parameters.msg || 'Unspecified';
    sendMeMail ('Alert from Thor', msg);
    responseEnd200 (response, 'OK');
}


function handleGetXML (parameters, response, transformer) {
    var data = UTILS.asArray (UTILS.aggregateData ());
    if (! (data && data.length)) {
	sendMeAlert ('Unable to build aggregated data');
	responseEnd200 ('FAILURE');
	return;
    }
    var xmldata = transformer (data);
    if (! xmldata) {
	sendMeAlert ('Unable to build XML load');
	responseEnd200 ('FAILURE');
	return;
    }
    var load = /<root>(.*)<\/root>/.exec (xmldata.toString ()) [1];
    if (! (load && typeof load === 'string' && load.length)) {
	sendMeAlert ('Unable to build XML load');
	responseEnd200 ('FAILURE');
	return;
    }
    load = encode (load);
    if (load.length > 9999000) {
	sendMeAlert ('Load too big (size = ' + load.length + ')');
	responseEnd200 ('FAILURE');
	return;
    }
    responseEnd200 (response, load);
}

function handleGetJobs (parameters, response) {
    handleGetXML (parameters, response, UTILS.asXML)
}

function handleGetJobshc (parameters, response) {
    handleGetXML (parameters, response, UTILS.HCTuplesAsXML)
}

var queryHandlers = {
    "/alert": handleAlert,
    "/jobs": handleGetJobs,
    "/jobshc": handleGetJobshc
};

var getIP = require('ipware')().get_ip;
var allowedIps = {};
process.env.ALLOWED_IPS.
    split (';').
    forEach (function (ip) {allowedIps [ip] = 1});

var defaultPort = 8081;
function createServer (port, handlers) {
    if (port === undef) port = defaultPort;
    if (handlers === undef) handlers = queryHandlers;
    return http.createServer (function (request, response) {
	var ip = getIP (request).clientIp;
	if (allowedIps [ip] === undef) {
	    responseEnd401 (response);
	    sendMeAlert ('Unauthorized query from ' + ip + ' : ' + request.url);
	} else {
	    var parsedUrl = url.parse (request.url);
	    var pathname = parsedUrl.pathname;
	    var parameters = qs.parse (parsedUrl.query);
	    var h = handlers [pathname];
	    if (h === undef) {
		responseEnd404 (response);
		sendMeAlert ('Suspicious query from ' + ip + ' : ' + request.url);
	    } else {
		h (parameters, response);
	    }
	}
    }).listen (port);
}

exports.createServer = createServer;
