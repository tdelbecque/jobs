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

    var aggregatedData = {};
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
