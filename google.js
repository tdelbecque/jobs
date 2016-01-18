var https = require ('https')
var p = require ('./process')

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in jobs download process: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
});

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
