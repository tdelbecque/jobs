var fs = require ('fs');
var http = require('http');
var https = require ('https');
var xmldom = require ('xmldom');
var xpath = require ('xpath');

var undef;

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
    /*
    this.jobs = fulldata.result.jobs.filter (
	function (x) {return ! x.isExpiring});
    */
    this.jobs = fulldata.result.jobs;
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
    this.locations = this.jobs.map (function (x) {return x.location.trim ()});
    this.nbLocations = this.locations.map (getLength);
    this.hasLocations = this.nbLocations.map (hasFeature);
    this.nbHasLocations = (this.hasLocations.length && this.hasLocations.reduce (add)) || 0;

    this.titles = this.jobs.map (function (x) {return x.title.trim().replace ("\\n", " ")});
    this.posted = this.jobs.map (function (x) {return x.posted});
    this.descriptions = this.jobs.map (function (x) {return x.description.replace (/\n|\r/g, ' ').replace (/\s+/g, ' ')});
    this.applyUrl = this.jobs.map (function (x) {return x.applyInfo.applyUrl});
    this.expiryDate = this.jobs.map (function (x) {return x.expiryDate});
    this.expiryTime = this.expiryDate.map (function (x) {return new Date (x).getTime ()});
    this.isExpiring = this.jobs.map (function (x) {return x.isExpiring});
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
    var tuple = flattenArray (zip (data.id, data.locations, data.titles, data.descriptions, data.applyUrl, latitudes, longitudes, sectorsToHC (data.flattenSectors), data.expiryDate, data.expiryTime, data.nbFlattenSectors, data.flattenSectors).
	map (function (t) {
	    var x = [];
	    t [7].forEach (function (y) {x.push (t.slice (0, 7).concat (y).concat (t.slice (8,12)))})
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
    var tuples = toTuples (data).filter (function (x) {return x [9] > expiryTimeLowerBound && x [10] < nbFlattenSectorsUpperBound});
    var str = tuples.map (function (x) {
	return [x [0], q (x [1]), q (x [2]), q (x [3]), q (x [4]), q (x [5]), x [6], x [7], x [8], x [9], x [10], q(x [11])].join ('\t') 
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

var savedir = require ('path').dirname (process.argv [1]) + '/save/';

function loadLegacy () {
    var files = fs.readdirSync (savedir).filter (
	function (f) {return /tothor/.exec (f)});
    var ids = {};
    var locations = {};
    files.forEach (function (f) {
	fs.
	    readFileSync (savedir + f).
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

function deg2rad (d) {
    return Math.PI * (d / 180)
}

function distanceOnEarth (lat1, long1, lat2, long2) {
    var dlat = deg2rad (lat2 - lat1);
    var dlong = deg2rad (long2 - long1);
    return 6371 * Math.acos (Math.cos (dlat)*Math.cos(dlong))
}

exports.distanceOnEarth = distanceOnEarth;

function sexagesimalToDecimal (x) {
    if (x === undef) return undef;
    var y = /(\d+)°(\d+)′(\d+)″(E|W|N|S)/.exec (x) || /(\d+)°(\d+)′(E|W|N|S)/.exec (x) || /(\d+)°(E|W|N|S)/.exec (x) ||
	/(\d+)°(\d+)′(\d+\.\d+)″(E|W|N|S)/.exec (x);
    if (! y) return NaN;
    if (y [4]) {
	y2 = y [2];
	y3 = y [3];
	y4 = y [4]
    } else if (y [3]) {
	y3 = 0;
	y2 = y [2];
	y4 = y [3]
    } else {
	y2 = y3 = 0;
	y4 = y [2]
    }
    var z = 1*y [1] + y2/60 + y3/3600;
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

function getDeadLinks () {
    var rootdir = require ('path').dirname (process.argv [1]);
    var savedir = rootdir + '/save';
    var deadLinksFile = savedir + '/deadLinks'
    var deadLinks = {}
    try {
	var str = fs.readFileSync (deadLinksFile).toString ()
	var urls = JSON.parse (str)
	urls.forEach (function (url) {deadLinks [url] = 1})
    }
    catch (e) {
	console.error (e)
	deadLinks = {}
    }
    return deadLinks
}

function aggregateData (patchGeo, daysAhead, acceptDeadLinks) {
    var deadLinks = acceptDeadLinks ? {} : getDeadLinks ()
    var listFile = fs.readdirSync (savedir).
	filter (function (f) {
	    return f.indexOf ('data') === 0}).
	sort (function (a, b) {
	    var ta = 1*(/.*?(\d+)/.exec (a) [1]);
	    var tb = 1*(/.*?(\d+)/.exec (b) [1]);
	    return ta - tb});

    var timeNow = new Date ().getTime ();
    daysAhead = daysAhead || 0;
    var lowerTime = timeNow + daysAhead * 24 * 3600 * 1000; 
    var aggregatedData = {};
    listFile.forEach (function (f) {
	var data = JSON.parse (fs.readFileSync (savedir + f).toString ());
	data.id.forEach (function (id, i) {
	    if (data.expiryTime [i] > lowerTime &&
		! data.isExpiring [i] &&
		! deadLinks [data.applyUrl [i]]) 
		aggregatedData [id] = {
		    id: id,
		    nbFlattenSectors: data.nbFlattenSectors [i],
		    flattenSectors: data.flattenSectors [i].join (';'),
		    location: data.locations [i].trim (),
		    title: data.titles [i],
		    posted: data.posted [i],
		    description: data.descriptions [i].trim (),
		    applyUrl: data.applyUrl [i],
		    expiryDate: data.expiryDate [i],
		    expiryTime: data.expiryTime [i],
		    latitude: data.latitudes [i] || 0,
		    longitude: data.longitudes [i] || 0}
	    else delete aggregatedData [id]})});

    if (patchGeo) {
//	var geodb = require ('./geodb').load ('georeference.js');
	var geodb = require ('./ctrdb').load ('ctrreference.js');
	Object.keys (aggregatedData).forEach (function (id) {
	    var x = aggregatedData [id];
	    var y = geodb.get (x.location);
	    if (y) {
		x.latitude = sexagesimalToDecimal (y.info.latitude)
		x.longitude = sexagesimalToDecimal (y.info.longitude)
		x.countryCode = y.countryCode }})}
    return aggregatedData
}

exports.aggregateData = aggregateData;

function validatorForGeo (previousValidator) {
    var self = this || {}
    if (previousValidator) {
	self.valids = previousValidator.valids
	self.invalids = previousValidator.invalids
    } else {
	self.valids = {}
	self.invalids = {}
    }

    self.validate = function (data) {
	if (previousValidator) previousValidator.validate (data);
	Object.keys (data).forEach (function (k) {
	    var x = data [k]
	    if (isNaN (x.latitude + x.longitude))
		self.invalids [k] = x
	    else
		self.valids [k] = x
	})
	return this === undef ? {valids: self.valids, invalids: self.invalids} : undef
    }
}

exports.validatorForGeo = validatorForGeo;
    
function asArray (aggregatedData) {
    var ids = Object.keys (aggregatedData);
    var ret = [];
    ids.forEach (function (id) {ret.push (aggregatedData [id])});
    return ret;
}

function asColumns (aggregatedData) {
    var ids = Object.keys (aggregatedData);
    return {
	id: ids,
	nbFlattenSectors: ids.map (function (id) {return aggregatedData [id].nbFlattenSectors}),
	flattenSectors: ids.map (function (id) {return aggregatedData [id].flattenSectors}),
	locations: ids.map (function (id) {return aggregatedData [id].location}),
	titles: ids.map (function (id) {return aggregatedData [id].title}),
	posted: ids.map (function (id) {return aggregatedData [id].posted}),
	descriptions: ids.map (function (id) {return aggregatedData [id].description}),
	applyUrl: ids.map (function (id) {return aggregatedData [id].applyUrl}),
	expiryDate: ids.map (function (id) {return aggregatedData [id].expiryDate}),
	expiryTime: ids.map (function (id) {return aggregatedData [id].expiryTime}),
	latitudes: ids.map (function (id) {return aggregatedData [id].latitude || 0}),
	longitudes: ids.map (function (id) {return aggregatedData [id].longitude || 0})
    }
}

exports.asArray = asArray;
exports.asColumns = asColumns;

/*
	FEED_JOB_LAYOUT := RECORD 
		STRING JobId;
		UNICODE location;
		UNSIGNED nbFlattenSectors;
		STRING flattenSectors;
		UNICODE title;
		UNICODE description;
		REAL latitude;
		REAL longitude;
		STRING applyUrl;
		STRING posted;
		STRING expiryDate;
		UNSIGNED expiryTime
	END;
*/

function asDelimited (array, fields) {
    if (fields == undef)
	fields = ['id', 'location', 'nbFlattenSectors', 'flattenSectors',
		  'title', 'description', 'latitude', 'longitude',
		  'applyUrl', 'posted', 'expiryDate', 'expiryTime'];
    var str = '';
    array.forEach (function (r) {
	var xs = fields.map (function (f) {return r [f]});
	str += xs.join ('\t') + "\n";
    });

    return str.
	replace (/–/g, '-').
	replace (/’/g, "'").
	replace (/…/g, '...').
	replace (/“|”/g, "'").
	replace (/•/g, '').
	replace (/‘/g, "'").
	replace (/€/g, "(Euro)").
	replace (/[\x00-\x1f]/g, '')
	
}

exports.asDelimited = asDelimited;

function saveAsDelimited (file, daysAhead) {
    fs.writeFileSync (file, asDelimited (asArray (aggregateData (1, daysAhead))))
}

exports.saveAsDelimited = saveAsDelimited;

function asXML (array, fields) {
    if (fields === undef) fields = Object.keys (array [0]);
    var d = new xmldom.DOMParser ().parseFromString ('<root></root>');
    var root = d.firstChild;
    array.forEach (function (r) {
	var re = d.createElement ('row');
	fields.forEach (function (f) {
	    var te = d.createTextNode (r [f] === undef ? 'undef' : r [f].
				       toString ().
				       replace (/&/g, '&amp;').
				       replace (/–/g, '-').
				       replace (/’/g, "'").
				       replace (/…/g, '...').
				       replace (/“|”/g, "'").
				       replace (/•/g, '').
				       replace (/‘/g, "'").
				       replace (/€/g, "(Euro)").
				       replace (/[\x00-\x1f]/g, '')
				      );
	    var fe = d.createElement (f);
	    fe.appendChild (te);
	    re.appendChild (fe);
	});
	root.appendChild (re);
    });
    return d
}

exports.asXML = asXML;

function HCTuplesAsXML (array) {
    var d = new xmldom.DOMParser ().parseFromString ('<root></root>');
    var root = d.firstChild;
    array.forEach (function (r) {
	var headCategories = sectorsToHC (r.flattenSectors.split (';'));
	headCategories.forEach (function (hc) {
	    var re = d.createElement ('row');
	    var e = d.createElement ('id');
	    var te = d.createTextNode (r.id);
	    e.appendChild (te);
	    re.appendChild (e);
	    e = d.createElement ('hc');
	    te = d.createTextNode (hc);
	    e.appendChild (te);
	    re.appendChild (e);
	    root.appendChild (re)})})
    
    return d;
}

exports.HCTuplesAsXML = HCTuplesAsXML;

function HCTuplesAsDelimited (array) {
    var str = '';
    array.forEach (function (r) {
	var headCategories = sectorsToHC (r.flattenSectors.split (';'));
	headCategories.forEach (function (hc) {
	    str += r.id + '\t' + hc + '\n'})});
    return str
}

exports.HCTuplesAsDelimited = HCTuplesAsDelimited;

function saveHCTuplesAsDelimited (file, daysAhead) {
    fs.writeFileSync (file, HCTuplesAsDelimited (asArray (aggregateData (0, daysAhead))))
}

exports.saveHCTuplesAsDelimited = saveHCTuplesAsDelimited;

function createMailBody (header) {
    if (header === undef) header = '';
    var data = aggregateData (1, 0);
    data = Object.keys (data).
	map (function (k) {return data [k]});
    var sectors = data.map (function (x) {return x.flattenSectors.split (';')});

    var locationIssues = data.filter (function (x) {return isNaN (x.latitude + x.longitude) || x.latitude === 0 || x.longitude === 0});
    
    var x = {};
    tabulate.call (x, sectors);
    var body = header;

    body = body + "NB ADS : " + data.length + "\n\n";
    body = body + "SECTORS TABULATION\n\n";
    body += x.tablePerFrequency.join ("\n") + "\n\n";

    var g = require ('./geodb').load ()
    body += "GEO LOCATION ISSUES : " + locationIssues.length + " :\n\n";
    var d = {};
    locationIssues.forEach (function (x) {
	if (d [x.location] == undef) {d [x.location] = 1} else {d [x.location] ++}});
    body += Object.keys (d).
	map (function (k){return k + "\t" + d [k] + (g.get (k) ? '*' : '')}).
	join ("\n") + "\n\n";

    d = {};
    data.forEach (function (x) {return d [x.expiryDate] = x.expiryTime});
    var sortedDates = Object.keys (d).sort (function (a, b) {return d [a] - d [b]})
    var t = table (data.map (function (x) {return x.expiryDate}));
    body += "EXPIRY DATES:\n\n";
    body += sortedDates.
	map (function (x) {return x + "\t" + t [x]}).
	join ('\n') + "\n";
    
    return body;
}

exports.createMailBody = createMailBody;
