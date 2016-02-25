var fs = require ('fs')
var https = require ('https')
var http = require ('http')
var p = require ('./process')
var utils = require ('./utils')

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in jobs download process: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
});

var rootdir = require ('path').dirname (process.argv [1]);
var savedir = rootdir + '/save';
var undef;

function GoogleIth (xs, i, onFinish) {
    var locations = Object.keys (xs);
    if (i === locations.length) {
	console.log ('Google finished');
	if (onFinish !== undef) onFinish ();
	return;
    }
    var l = locations [i];
    function onResponse (response) {
	var body = '';
	response.on ('data', function (d) {
	    body += d })
	response.on ('end', function () {
	    xs [l].google = JSON.parse (body);
	    console.log (l + ' ==> ' + xs [l].google.status);
	    setTimeout (function () {GoogleIth (xs, i+1, onFinish)}, 200)})}

    var url = 'https://maps.google.com/maps/api/geocode/json?address=' +
	encodeURIComponent (l);
    //+'&key=AIzaSyChlk7EUJYoG-CP2Vj7c_cSOp3VP1wzlgQ'
    https.get (url, onResponse).
	on ('error', function (err) {console.error (err)});
    return 0;
}

exports.GoogleIth = GoogleIth;

function foo (data) {
    function f (x) {
	if (x.google.status === 'OK') {
	    var lat = p.sexagesimalToDecimal (x.info.latitude);
	    var long = p.sexagesimalToDecimal (x.info.longitude);
	    return x.google.results.map (function (r) {
		var d = p.distanceOnEarth (lat, long, r.geometry.location.lat, r.geometry.location.lng);
		return {
		    distance: d,
		    latitude: r.geometry.location.lat,
		    longitude: r.geometry.location.lng
		}
	    })
	} else {
	    return null;
	}
    }
    Object.keys (data).
	forEach (function (l) {
	    var g = f (data [l]);
	    data [l].dmin = g && g.reduce (function (p, c) {
		return Math.min (p, c.distance)
	    }, 100000);
	    data [l].info.google = g
	});
    return 0;
}

exports.foo = foo;

function syncCountries () {
    var lastGeoDB = utils.getFresherFileSync (
	savedir,
	function (f) {return /geodb-\d+\.json/.exec (f)})
    
    var lastCtrDB = utils.getFresherFileSync (
	savedir,
	function (f) {return /ctrdb-\d+\.json/.exec (f)})

    var stamp = /\d+/.exec (lastGeoDB) [0]
    var currentCtrDic = {}
    
    if (lastCtrDB !== undef) 
	currentCtrDic = JSON.parse (fs.readFileSync (savedir + '/' + lastCtrDB).
				    toString ())
    
    var currentGeoDic = {}
    if (lastGeoDB !== undef)
	currentGeoDic = JSON.parse (fs.readFileSync (savedir + '/' + lastGeoDB).
				    toString ())

    var toUpdateDic = {}

    Object.keys (currentGeoDic).
	filter (function (x) {return currentCtrDic [x] === undef}).
	filter (function (x) {
	    var y = currentGeoDic [x]
	    return ! (isNaN (p.sexagesimalToDecimal (y.info.latitude)) || isNaN (p.sexagesimalToDecimal (y.info.longitude)))
	}).
	forEach (function (x) {toUpdateDic [x] = currentGeoDic [x]})

    var countryCodes2to3 = {}
    fs.readFileSync ('countryCodes.csv').
	toString ().
	split ('\r\n').
	filter (function (x) {return x !== ''}).
	forEach (function (x) {var y = x.split (';'); countryCodes2to3 [y[1]] = y [2]})

    whenFinish = function (db) {
	Object.keys (db).forEach (function (x) {currentCtrDic [x] = db [x]})
	fs.writeFileSync (savedir + '/' + 'ctrdb-' + stamp + '.json', JSON.stringify (currentCtrDic, null, '\t'))
	console.log ('finish')
    }
    
    googleCountryFromGeoIth (Object.keys(toUpdateDic), toUpdateDic, countryCodes2to3, 0, whenFinish)
}

exports.syncCountries = syncCountries

function googleCountryFromGeoIth (xs, db, codemap, i, whenFinish) {
    if (i === xs.length) {
	whenFinish (db)
	return
    }
    onResponse = function (response) {
	var body = '';
	response.on ('data', function (d) {body += d})
	response.on ('end', function () {
	    var data = JSON.parse (body.toString ())
	    db [xs [i]].countryCode =
		codemap [data.results.map (function (x) {return x.address_components}).
			 filter (function (x) {return x}).
			 map (function (x) {return x.filter (function (x) {return x.types [0] === 'country'})})[0][0].short_name]
	    console.log (db [xs [i]].countryCode)
	    setTimeout (function () {googleCountryFromGeoIth (xs, db, codemap, i + 1, whenFinish)}, 200)
	})
    }
    var query = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
	p.sexagesimalToDecimal (db [xs [i]].info.latitude) + ',' +
	p.sexagesimalToDecimal (db [xs [i]].info.longitude);
    console.log (query)
    http.get (query, onResponse).on ('error', function (err) {console.log (err)})
}

function syncGeoReference (filein, fileout) {
    var countryCodes2to3 = {}
    fs.readFileSync ('countryCodes.csv').
	toString ().
	split ('\r\n').
	filter (function (x) {return x !== ''}).
	forEach (function (x) {var y = x.split (';'); countryCodes2to3 [y[1]] = y [2]})

    var currentRefDic = JSON.parse (fs.readFileSync (filein).toString ())
    
    whenFinish = function (db) {
	fs.writeFileSync (fileout, JSON.stringify (db, null, '\t'))
	console.log ('finish')
    }

    googleCountryFromGeoIth (Object.keys(currentRefDic), currentRefDic, countryCodes2to3, 0, whenFinish)
    
}

exports.syncGeoReference = syncGeoReference
