var fs = require ('fs')
var p = require ('./process')

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
    var x = m.jobsByIdsFile ('../campaigns/current/jobids-C3')
    m.writeJobs (x, 'jobs-C3.tsv')
    x = m.jobsByIdsFile ('../campaigns/20160201/jobids-C2')
    m.writeJobs (x, 'jobs-C2.tsv')
    x = m.jobsByIdsFile ('../campaigns/20160126/jobids-C1')
    m.writeJobs (x, 'jobs-C1.tsv')
}
