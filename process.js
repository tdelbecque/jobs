var fs = require ('fs');

function flattenSectors (sectors) {
    return sectors.reduce (
	function (acc, x) {
	    return typeof x == 'string' ?
		acc.concat (x)
		:
		acc.concat (
		    x [0],
		    (x [1] || []).reduce (
			function (acc, y) {
			    return acc.concat (x [0] + ':' + y)}, 
			[]))}, 
	[])
}

exports.flatten = flattenSectors 

var undef;

// mode: 
//  - merge
//  - newest

function utils (fulldata, referenceFile, mode) {
    function add (x, y) {return x + y};
    function getLength (x) {return x.length};
    function hasFeature (x) {return x > 0}

    this.fulldata = fulldata;
    if (referenceFile) {
	try {
	    var referenceData = JSON.parse (fs.readFileSync (referenceFile).toString ());
	    (function () {
		var newKeys = {};
		var removeKeys = {};
		var jobs = fulldata.result.jobs;
		jobs.forEach (function (x) {newKeys [x.id] = 1});
		referenceData.result.jobs.forEach (
		    function (x) {
			var isCandidate = (newKeys [x.id] === 1);
			if (! isCandidate && mode === 'merge') {
			    jobs.push (x);
			} 
			if (isCandidate && mode !== 'merge') {
			    removeKeys [x.id] = 1; // remove as we really keep the newest
			}
		    });
		if (Object.keys (removeKeys).length > 0) 
		    fulldata.result.jobs = jobs.filter (function (x) {return ! removeKeys [x.id]});
	    })();
	    fulldata.result.totalResults += fulldata.result.jobs.length
	}
	catch (err) {
	    console.log (err);
	    return null
	}
    }
    this.jobs = fulldata.result.jobs.filter (
	function (x) {return ! x.isExpiring});
    this.categories = this.jobs.map (function (x) {return x.categories});

    this.id = this.jobs.map (function (x) {return x.id});
    this.salaries = this.categories.map (function (x) {return x.salary});
    this.nbSalaries = this.salaries.map (getLength);
    this.hasSalaries = this.nbSalaries.map (hasFeature);
    this.nbHasSalaries = (this.hasSalaries.length && this.hasSalaries.reduce (add)) || 0;

    this.sectors = this.categories.map (function (x) {return x.sector});
    this.nbSectors = this.sectors.map (getLength);
    this.hasSectors = this.nbSectors.map (hasFeature);
    this.nbHasSectors = (this.hasSectors.length && this.hasSectors.reduce (add)) || 0;
    this.flattenSectors = this.sectors.map (flattenSectors);
    this.nbFlattenSectors = this.flattenSectors.map (getLength);
    this.locations = this.jobs.map (function (x) {return x.location});
    this.nbLocations = this.locations.map (getLength);
    this.hasLocations = this.nbLocations.map (hasFeature);
    this.nbHasLocations = (this.hasLocations.length && this.hasLocations.reduce (add)) || 0;

    this.titles = this.jobs.map (function (x) {return x.title.trim().replace ("\\n", " ")});
    this.posted = this.jobs.map (function (x) {return x.posted});
    this.descriptions = this.jobs.map (function (x) {return x.description.replace (/\n|\r/g, ' ').replace (/\s+/g, ' ')});
    this.applyUrl = this.jobs.map (function (x) {return x.applyInfo.applyUrl});
    this.expiryDate = this.jobs.map (function (x) {return x.expiryDate});
    this.expiryTime = this.expiryDate.map (function (x) {return new Date (x).getTime ()});
}

exports.utils = utils;

function tabulate (xs) {
    var self = this; 
    this.table = {};
    xs.forEach (
	function (ys) {
	    ys.forEach (
		function (y) {
		    self.table [y] = (self.table [y] + 1) || 1})});
    this.sectors = Object.keys (this.table).sort ();
    this.tablePerSector = this.sectors.map (
	function (x) {
	    return x + "\t" + self.table [x]});
    this.sectorsPerFrequency = Object.keys (this.table).sort (
	function (a, b) {
	    var xa = self.table [a], xb = self.table [b];
	    return xa < xb ? 1 : xa > xb ? -1 : 0});
    this.tablePerFrequency = this.sectorsPerFrequency.map (
	function (x) {
	    return x + "\t" + self.table [x]});
    this.exportToFile = function (file) {
	var fs = require('fs');
	var stream = fs.createWriteStream(file);
	stream.once('open', function(fd) {
	    self.tablePerFrequency.forEach (
		function (x) {
		    stream.write(x + "\n");});
	    stream.end()})};

}

exports.tabulate = tabulate;

exports.sectorsToString = function (x) {
    return x.flattenSectors.map (function (y, i) {return y.map (function (z) {return x.jobs [i].id + "\t" + z}).join ("\n")}).join ("\n")
}

function table (xs) {
    return xs.reduce (
	function (acc, x) {
	    acc [x] = (acc [x] + 1) || 1;
	    return acc},
	{})
}

exports.table = table;

function exportTable (xs, file) {
    var fs = require('fs');
    var stream = fs.createWriteStream(file);
    stream.once('open', function(fd) {
	Object.keys (xs).sort ().forEach (
	    function (x) {
		stream.write(x + "\t" + xs [x] + "\n");});
	stream.end()})
}

exports.exportTable = exportTable;

function zip () {
    if (arguments.length == 0) return;
    var args = [];
    var lengths = [];
    var n = 0;
    for (var i = 0; i < arguments.length; i ++) {
	var x = arguments [i];
	var y = Array.isArray (x) ? x : [x];
	n = Math.max (n, y.length);
	args.push (y);
	lengths.push (y.length);
    }
    var res = [];
    for (var i = 0; i < n; i ++) {
	var xs = [];
	args.forEach (function (x, j) {
	    xs.push (x [ i % lengths [j] ])
	});
	res.push (xs)
    }
    return res;
}

exports.zip = zip;

function toKeyed (x, keyname) {
    var res = {};
    x.forEach (function (x) {
	res [x [keyname]] = x
    });
    return res;
}

exports.toKeyed = toKeyed;

function extractXMLval (node) {
    var str = node.val;
    node.children.forEach (function (n) {str += extractXMLval (n)}); 
    return str;
}

exports.extractXMLval = extractXMLval;

var Countries = ['Switzerland', 'Germany', 'DE', 'United States', 'US', 'Canada', 'CA', 'United Kingdom', 'UK', 'England', 'GB', 'Belgium', 'BE', 'Netherland', 'Florida', 'FL', 'Seattle', 'California', 'Pennsylvania', 'MA', 'AU', 'NY', 'NH'];

function foo (x) {
    for (var i = 0; i < Countries.length; i ++) {
	if (x.indexOf (Countries [i]) > -1) break;
    }
    return i < Countries.length
}

exports.foo = foo;

function getSectors2HCTable (file) {
    if (file == undef) file = require ('path').dirname (process.argv [1]) + '/sectors2HC.tsv';
    var x = fs.
	readFileSync (file).
	toString ().
	split ('\r\n').
	filter (function (x) {return x != ''}).
	map (function (x) {
	    var v = x.split ('\t');
	    return [v [2], v [0]]});
	
    var table = {};
    x.forEach (function (x) {
	var v = table [x [0]];
	if (v == undef) table [x [0]] = [x [1]];
	else v.push (x [1])
    });
    return table;
}

exports.getSectors2HCTable = getSectors2HCTable;

function dedupArray (xs) {
    var vs = {};
    xs.forEach (function (x) {vs [x] = 1});
    return Object.keys (vs);
}

function flattenArray (x, depth) {
    if (! Array.isArray (x) || depth == 0) return x;
    var y = [];
    if (depth == undef) depth = -1
    x.forEach (function (x) {y = y.concat (flattenArray (x, depth - 1))});
    return y;
}

exports.flattenArray = flattenArray;

function flattenAndDedupArray (x) {
    return dedupArray (flattenArray (x))
}

exports.flattenAndDedupArray = flattenAndDedupArray;

function sectorsToHC (sectors, mapTable) {
    if (mapTable == undef) mapTable = getSectors2HCTable ();
    if (! Array.isArray (sectors))
	return mapTable [sectors] || [];
    if (sectors.length == 0) return [];
    if (Array.isArray (sectors [0]))
	return sectors.map (function (s) {return sectorsToHC (s, mapTable)});
    return flattenAndDedupArray (sectors.map (
	function (x) {
	    return mapTable [x] || []}))
}

exports.sectorsToHC = sectorsToHC;

function toTuples (data) {
    var latitudes = data.latitudes || 0;
    var longitudes = data.longitudes || 0;
    var tuple = flattenArray (zip (data.id, data.locations, data.titles, data.descriptions, data.applyUrl, latitudes, longitudes, data.expiryDate, data.expiryTime, data.nbFlattenSectors, sectorsToHC (data.flattenSectors)).
	map (function (t) {
	    var x = [];
	    t [10].forEach (function (y) {x.push (t.slice (0, 10).concat (y))})
	    return x
	}), 1);
    return tuple;
}

exports.toTuples = toTuples;

var defaultDaysBeforeExpiry = 2;
var defaultNbFlattenSectorsUpperBound = 11;

function writeTuplesToFile (data, file, daysBeforeExpiry, nbFlattenSectorsUpperBound) {
    daysBeforeExpiry = daysBeforeExpiry || defaultDaysBeforeExpiry;
    var expiryTimeLowerBound = new Date ().getTime () + daysBeforeExpiry * 24*3600000;
    nbFlattenSectorsUpperBound = nbFlattenSectorsUpperBound || defaultNbFlattenSectorsUpperBound;
    var q = function (s) {return '"' + s + '"'};
    var tuples = toTuples (data).filter (function (x) {return x [8] > expiryTimeLowerBound && x [9] < nbFlattenSectorsUpperBound});
    var str = tuples.map (function (x) {
	return [x [0], q (x [1]), q (x [2]), q (x [3]), q (x [4]), q (x [5]), x [6], x [7], x [8], x [9], x [10]].join ('\t') 
    }).join ('\n');
    require ('fs').writeFileSync (file, str);
}

exports.writeTuplesToFile = writeTuplesToFile;

function objectValues (x) {
    var ret = [];
    Object.keys(x).map (function (k) {ret.push (x [k])});
    return ret
} 

function objectValuesTable (x) {
    return table (objectValues (x))
}

exports.objectValues = objectValues;
exports.objectValuesTable = objectValuesTable;

function loadLegacy () {
    var savedir = '/home/thierry/Elsevier/jobs/save';
    var files = fs.readdirSync (savedir).filter (
	function (f) {return /tothor/.exec (f)});
    var ids = {};
    var locations = {};
    files.forEach (function (f) {
	fs.
	    readFileSync (savedir + '/' + f).
	    toString ().
	    split ('\n').
	    forEach (function (l) {
		var fields = l.split ('\t');
		var id = fields [0];
		var location = fields [1];
		var latitude = fields [5];
		var longitude = fields [6];
		ids [id] = 1;
		if (latitude && /\d/.exec (latitude) && longitude && /\d/.exec (longitude)) 
		    locations [location] = [latitude, longitude]})});
    return {ids: ids, locations: locations}
}

exports.loadLegacy = loadLegacy;

