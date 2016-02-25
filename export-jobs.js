var fs = require ('fs')
var p = require ('./process')
var http = require ('http')

var undef
var savedir = require ('path').dirname (process.argv [1]) + '/save/';

function aggregateData () {
    var listFile = fs.readdirSync (savedir).
	filter (function (f) {
	    return f.indexOf ('data') === 0}).
	sort (function (a, b) {
	    var ta = 1*(/.*?(\d+)/.exec (a) [1]);
	    var tb = 1*(/.*?(\d+)/.exec (b) [1]);
	    return ta - tb});

    var aggregatedData = {
	extractfun: function (field) {
	    return function (key, i, o) {
		return aggregatedData [key][field]
	    }
	}
    };
    listFile.forEach (function (f) {
	var data = JSON.parse (fs.readFileSync (savedir + f).toString ());
	data.id.forEach (function (id, i) {
	    aggregatedData [id] = {
		id: id,
		nbFlattenSectors: data.nbFlattenSectors [i],
		flattenSectors: data.flattenSectors [i].join (';'),
		location: data.locations [i],
		title: data.titles [i],
		posted: data.posted [i],
		description: data.descriptions [i],
		applyUrl: data.applyUrl [i],
		expiryDate: data.expiryDate [i],
		expiryTime: data.expiryTime [i],
		latitude: data.latitudes [i] || 0,
		longitude: data.longitudes [i] || 0} })});

    var geodb = require ('./geodb').load ('georeference.js');
    Object.keys (aggregatedData).forEach (function (id) {
	var x = aggregatedData [id];
	var y = geodb.get (x.location);
	if (y) {
	    x.latitude = p.sexagesimalToDecimal (y.info.latitude);
	    x.longitude = p.sexagesimalToDecimal (y.info.longitude) }})
    return aggregatedData
}

exports.aggregateData = aggregateData

function exportSnapshort (prefix) {
    var data = p.asArray (aggregateData ())
    fs.writeFileSync (prefix + '-info.csv', p.asDelimited (data))
    fs.writeFileSync (prefix + '-hc.csv', p.HCTuplesAsDelimited (data))

    fd = fs.createWriteStream (prefix + '-sectors.csv')
    fd.on ('finish', function () {
	console.log ('finish');
	fd.close ();
    })
    data.forEach (function (x) {
	x.flattenSectors.
	    split (';').
	    forEach (function (s) {
		fd.write (x.id + "\t" + s + "\t" +
			  (/:/.exec (s) ? 'S' : 'M') + "\n")})})
    
    fd.end ()
}

exports.exportSnapshort = exportSnapshort

function jobsByIdsFile (idsfile) {
    var data = aggregateData ()
    var jobs= fs.readFileSync (idsfile).toString ().split ('\n').
	map (function (i) {return data [i]}).
	filter (function (x) {return x !== undef})
    return jobs
}

exports.jobsByIdsFile = jobsByIdsFile;

function writeJobs (jobs, file) {
    var header = 'id\tsectors\tlatitude\tlongitude\n'
    var str = jobs.map (function (x) {return [x.id, x.flattenSectors, x.latitude, x.longitude].join ('\t')}).join ('\n')
    fs.writeFileSync (file, header + str)
}

exports.writeJobs = writeJobs;

function doExports () {
    var countryCodes2to3 = {}
    var countryCodes = fs.readFileSync ('countryCodes.csv').
	toString ().
	split ('\r\n').
	filter (function (x) {return x !== ''}).
	forEach (function (x) {var y = x.split (';'); countryCodes2to3 [y[1]] = y [2]})
    
    var dic = {}
    var x3 = m.jobsByIdsFile ('../campaigns/current/jobids-C3')
    x3.forEach (function (y) {dic ['' + y.latitude + ',' + y.longitude] = 1})
    writeJobs (x3, 'jobs-C3.tsv')

    var x2 = m.jobsByIdsFile ('../campaigns/20160201/jobids-C2')
    x2.forEach (function (y) {dic ['' + y.latitude + ',' + y.longitude] = 1})
    writeJobs (x2, 'jobs-C2.tsv')

    var x1 = m.jobsByIdsFile ('../campaigns/20160126/jobids-C1')
    x1.forEach (function (y) {dic ['' + y.latitude + ',' + y.longitude] = 1})
    m.writeJobs (x1, 'jobs-C1.tsv')

    xs = Object.keys (dic).map (function (x) {return {strLatitudeLongitude: x}})
    googleCountryFromGeoIth (xs, 0)

    var ctr = {}
    xs.forEach (function (x) {ctr [x.strLatitudeLongitude] = x.country})
    x1.forEach (function (x) {x.country = ctr ['' + x.latitude + ',' + x.longitude ]})
    x2.forEach (function (x) {x.country = ctr ['' + x.latitude + ',' + x.longitude ]})
    x3.forEach (function (x) {x.country = ctr ['' + x.latitude + ',' + x.longitude ]})
    fs.writeFileSync ('jobscountries-C1', x1.map (function (x) {return [x.id, x.location, x.country].join ('\t')}).join ('\n'))
    fs.writeFileSync ('jobscountries-C2', x2.map (function (x) {return [x.id, x.location, x.country].join ('\t')}).join ('\n'))
    fs.writeFileSync ('jobscountries-C3', x3.map (function (x) {return [x.id, x.location, x.country].join ('\t')}).join ('\n'))
}

function googleCountryFromGeo (strLatitudeLongitude, state) {
    onResponse = function (response) {
	var body = '';
	response.on ('data', function (d) {body += d})
	response.on ('end', function () {
	    var data = JSON.parse (body.toString ())
	    state.country = data.results.map (function (x) {return x.address_components}).
		filter (function (x) {return x}).
		map (function (x) {return x.filter (function (x) {return x.types [0] === 'country'})})[0][0].short_name
	})
    }
    var query = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
	strLatitudeLongitude;
    
    http.get (query, onResponse).on ('error', function (err) {console.log (err)})
}

exports.googleCountryFromGeo = googleCountryFromGeo;

function googleCountryFromGeoIth (xs, i) {
    if (i === xs.length) {
	console.log ('Fini')
	return
    }
    onResponse = function (response) {
	var body = '';
	response.on ('data', function (d) {body += d})
	response.on ('end', function () {
	    var data = JSON.parse (body.toString ())
	    xs [i].country = data.results.map (function (x) {return x.address_components}).
		filter (function (x) {return x}).
		map (function (x) {return x.filter (function (x) {return x.types [0] === 'country'})})[0][0].short_name
	    console.log (xs [i].strLatitudeLongitude + ' ==> ' + xs [i].country);
	    setTimeout (function () {googleCountryFromGeoIth (xs, i + 1)}, 200)
	})
    }
    var query = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
	xs [i].strLatitudeLongitude;
    
    http.get (query, onResponse).on ('error', function (err) {console.log (err)})
}

exports.googleCountryFromGeoIth = googleCountryFromGeoIth
