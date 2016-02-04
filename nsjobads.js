var crypto = require ('crypto');
var http = require ('http');
var UTILS = require ('./process');
var S = UTILS;
var fs = require ('fs');
var sendMeMail = require ('./mail').sendMeMail;

var undef;

function percentEncode (s) {
    s = encodeURIComponent(s);
    s = s.replace(/\!/g, "%21");
    s = s.replace(/\*/g, "%2A");
    s = s.replace(/\'/g, "%27");
    s = s.replace(/\(/g, "%28");
    s = s.replace(/\)/g, "%29");
    return s;
}

function HMACSHA1_B64 (x, secret) {
    var hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding ('base64');
    hmac.write (x);
    hmac.end ();
    return hmac.read ();
}

function genNonce () {
    return '' + Math.floor (Math.random () * Math.pow (2, 32))
}

function genTimestamp () {
    return Math.floor (new Date ().getTime () / 1000)
}

function F () {
    this.consumerSecret = process.env.NS_CONSUMER_SECRET;
    this.consumerKey = process.env.NS_CONSUMER_KEY;
    this.method = 'GET';
    this.protocol = 'http';
    this.host = 'localhost';
    this.path = '/';
    this.parameters = {};
    this.OAuthSignatureMethod = 'HMAC-SHA1';
    this.OAuthNonce = undef;
    this.OAuthNonceIsFree = true;
    this.OAuthTimestamp = undef;
    this.OAuthTimestampIsFree = true;
    this.OAuthVersion = '1.0';
    this.OAuthConsumerKey = undef;
    this.httpHeaders = {};
}

F.prototype = {
    setMethod: function (x) {this.method = x; return this},
    setHost: function (x) {this.host = x; return this},
    setProtocol: function (x) {this.protocol = x; return this},
    setPath: function (x) {this.path = x; return this},
    setParameters: function (x) {
	var self = this;
	this.parameters = {};
	Object.keys (x).forEach (
	    function (k) {
		self.parameters [k] = x [k]
	    }
	);
	return this;
    },
    setSignatureMethod: function (x) {this.OAuthSignatureMethod = x; return this},
    setConsumerKey: function (x) {this.OAuthConsumerKey = x; return this},
    setOAuthVersion: function (x) {this.OAuthVersion = x; return this},
    setNonce: function (x) {this.OAuthNonce = x; this.OAuthNonceIsFree = false; return this},
    setTimestamp: function (x) {this.OAuthTimestamp = x; this.OAuthTimestampIsFree = false; return this},
    setHeaders: function (x) {
	var self = this;
	this.httpHeaders = {};
	Object.keys (x).forEach (
	    function (k) {
		self.httpHeaders [k] = x [k]
	    }
	);
	return this;
    },
    digest: function (consumerSecret, tokenSecret) {
	var self = this;
	if (tokenSecret == undef) tokenSecret = '';
	var base = '';
	var nonce = this.OAuthNonceIsFree ? genNonce () : this.OAuthNonce;
	var timestamp = this.OAuthTimestampIsFree ? genTimestamp () : this.OAuthTimestamp;
	
	var allParams = {oauth_consumer_key: percentEncode (this.OAuthConsumerKey),
			 oauth_nonce: percentEncode (nonce),
			 oauth_signature_method: percentEncode (this.OAuthSignatureMethod),
		         oauth_timestamp: percentEncode (timestamp),
		         oauth_version: percentEncode (this.OAuthVersion)};
	Object.keys (this.parameters).forEach (
	    function (k) {allParams [percentEncode(k)] = percentEncode (self.parameters [k])});
	
	var sortedKeys = Object.keys (allParams).concat ([]).sort (
	    function (a, b) {
		if (a < b) return -1;
		if (a > b) return 1;
		var x = allParams [a], y = allParams [b];
		if (x < y) return -1;
		if (x > y) return 1;
		return 0;
	    }
	);
	
	var base = this.method + "&" + percentEncode (this.protocol + '://' + this.host + this.path) + "&" + 
		       percentEncode (sortedKeys.map (function (k) {return k + '=' + allParams [k]}).join ('&'));
	
	var secret = percentEncode (this.consumerSecret) + '&' + percentEncode (tokenSecret);
	var signature = HMACSHA1_B64 (base, secret);
	
	var OAuthHeader = 'OAuth ' +
	    'oauth_consumer_key="' + percentEncode (this.OAuthConsumerKey) + '",' +
	    'oauth_nonce="' + percentEncode (nonce) + '",' +
	    'oauth_signature="' + percentEncode (signature) + '",' +
	    'oauth_signature_method="' + percentEncode (this.OAuthSignatureMethod) + '",' +
	    'oauth_timestamp="' + timestamp + '",' +
	    'oauth_version="' + percentEncode (this.OAuthVersion) + '"';

	return {base: base, signature: signature, header: OAuthHeader}

    },

    request: function (header, params) {
	if (params === undef) params = {};
	var onEnd = params.onEnd;
	var onData = params.onData;
	var onError = params.onError;
	var stat = (params.state === undef ? {} : params.state); 
	stat.content = '';
	if (onData == undef) 
	    onData = function (chunk) {
		stat.content += chunk.toString ()
	    };
	
	if (onEnd == undef) 
	    onEnd = function () {
		console.log('No more data in response.')
	    };

	if (onError == undef) 
	    onError = function (e) {
		console.log('problem with request: ' + e.message)
	    };

	var self = this;
	var queryString = Object.keys (this.parameters).map (function (k) {return k + '=' + self.parameters [k]}).join ('&');
	if (queryString) queryString = '?' + queryString;
	var options = {
	    host: this.host,
	    hostname: this.host,
	    method: this.method,
	    path: this.path + queryString,
	    headers: {Authorization: header}};
	var req = http.request (
	    options,
	    function (res) {
		stat.STATUS = res.statusCode;
		stat.HEADERS = JSON.stringify(res.headers);
		res.setEncoding('utf8');
		res.on ('data', onData);
		res.on ('end', onEnd);
	    }).on ('error', onError);
				
	req.end ();
	return params.state === undef ? stat : undef;
    },

    testNS: function () {
	var h = this
	    .setHost (process.env.NS_HOST)
	    .setPath ('/restapi/jobinfo/search/full')
	    .setParameters ({
		dateFrom: '2015-10-13', 
		itemsPerPage: 10000, 
		truncateddescription: 0, 
		deviceid: 'Postman'})
	    .setConsumerKey (this.consumerKey)
	    .digest (this.consumerSecret).header;
	return this.request (h);
    },

    setNSSimple: function () {
	var h = this
	    .setHost (process.env.NS_HOST)
	    .setPath ('/restapi/jobinfo/search')
	    .setParameters ({
		dateFrom: new Date (new Date().getTime () - 24000*3600).toISOString ().slice (0, 10), 
		itemsPerPage: 10000, 
		includedescription: 0, 
		deviceid: 'Postman'})
	    .setConsumerKey (this.consumerKey);
	return this;
    },

    setNSFull: function () {
	var h = this
	    .setHost (process.env.NS_HOST)
	    .setPath ('/restapi/jobinfo/search/full')
	    .setParameters ({
		dateFrom: new Date (new Date().getTime () - 24000*3600).toISOString ().slice (0, 10), 
		itemsPerPage: 10000, 
		truncateddescription: 0, 
		deviceid: 'Postman'})
	    .setConsumerKey (this.consumerKey);
	return this;
    },

    requestNS: function (params) {
	return this.request (this.digest (this.consumerSecret).header, params);
    },

    requestNSToBing: function (stamp) {
	var geodb = require ('./geodb').load ('georeference.js');
	if (stamp === undef) stamp = new Date ().getTime ();
	var savedir = require ('path').dirname (process.argv [1]) + '/save/';
	var state = {};
	var onEnd = function () {
	    fs.writeFileSync (savedir + 'load-' + stamp + '.js', JSON.stringify (state));
	    state.data = new UTILS.utils (JSON.parse (state.content.toString ()));
	    state.locationsAll = S.clusterArrayPerValues (UTILS.zip (state.data.id, state.data.locations));
	    state.locations = [];
	    state.locationsAll.forEach (function (x) {
		var g = geodb.get (x [1]);
		if (g === undef)
		    state.locations.push (x);
		else
		    x.push (g.source, g.info);
	    });
	    
	    var onWikiEnd = function () {
		S.clusteredWikiToData (state.locationsAll, state.data);
		fs.writeFileSync (savedir + 'data-' + stamp + '.js', JSON.stringify (state.data));
		UTILS.writeTuplesToFile (state.data, savedir + 'tothor-' + stamp + '.csv');

		if (state.locations.filter (function (x) {
		    return x [3] && x [3].latitude !== undef && x [3].longitude !== undef
		}).length) {
		    var geoUpdate = {};
		    state.locationsAll.forEach (function (x) {
			if (x [3] && x [3].latitude !== undef && x [3].longitude !== undef)
			    geoUpdate [x [1]] = {source: x [2], info: x [3]} });
		    geodb.update (geoUpdate);
		    geodb.save (stamp)
		}

		sendMeMail ('Jobs Update',
			    UTILS.createMailBody ('New update : stamp = ' + stamp + ' ; N = ' + state.data.jobs.length + "\n\n"));

	    }
	    var onBingEnd = function () {
		var wikiFound = state.locations.filter (function (x) {return x.length === 3});
		S.WikiIth (wikiFound, 0, onWikiEnd);
	    }
	    S.BingIth (state.locations, 0, onBingEnd);
	}
	this.requestNS ({state: state, onEnd: onEnd});
	return state;
    }
};

module.exports = F;


