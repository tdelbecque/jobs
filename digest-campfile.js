var csv = require ('csv')
var fs = require ('fs')
var UTILS = require ('./process')
var EXPORT = require ('./export-jobs')

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in digest: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
});

function digest (path, onFinish) {
    var self = this || {}

    self.path = path
    self.emails = []
    self.job1_ids = []
    self.job2_ids = []
    self.job3_ids = []
    
    var parser = csv.parse ({quote: '"', columns: true})
    parser.on ('readable',
	       function () {
		   var r
		   while (r = parser.read ()) {
		       self.emails.push (r.EMAIL)
		       var e = /(\d+)/.exec (r.FLEX4)
		       self.job1_ids.push (e [1])
		       var e = /(\d+)/.exec (r.FLEX8)
		       self.job2_ids.push (e [1])
		       var e = /(\d+)/.exec (r.FLEX12)
		       self.job3_ids.push (e [1])
		   }})
    parser.on ('error', function (err) {console.error (err)})
    parser.on ('finish', function () {
	if (onFinish) onFinish (self)
	else console.log ('finish') })
    

    function load () {
	var stream = fs.createReadStream (path).
	    on ('error', function (err) {console.log (err);});
	stream.on ('end', function () {parser.end ()})
	stream.on ('data',
		   function (data) {parser.write (data.toString ())})    
    }
    
    load ()
}

exports.digest = function (path) {return new digest (path)}

function analyse (filein, onFinish) {
    function onDigestFinish (dg) {
	var jobsdb = EXPORT.aggregateData ()
	var extractfun = jobsdb.extractfun

	var allDates = {}
	var allSectorsTable = {}
	
	function extractForRank (i) {
	    function updateAllDates (dates, times) {
		dates.forEach (function (d, i) {allDates [d] = times [i]})
	    }
	    function feat (what) {return 'job' + i + '_' + what}
	    var ids = dg ['job' + i + '_ids']
	    
	    dg [feat ('expiryTimes')] = ids.map (extractfun ('expiryTime'))
	    dg [feat ('expiryDates')] = ids.map (extractfun ('expiryDate'))
	    updateAllDates (dg [feat ('expiryDates')], dg [feat ('expiryTimes')])
	    dg [feat ('expiryDatesTable')] = UTILS.table (dg [feat ('expiryDates')])
	    var flattenSectors = ids.map (extractfun ('flattenSectors'))
	    var st = dg [feat ('sectorsTable')] = {}
	    flattenSectors.forEach (function (x) {
		x.split (';').forEach (function (x) {
		    allSectorsTable [x] = (allSectorsTable [x] || 0) + 1
		    st [x] = (st [x] || 0) + 1 })})
	}

	[1,2,3].forEach (extractForRank)

	function tableRowBuilder (xs) {
	    return function (rowname) {
		return [rowname].concat (xs.map (function (x) {return x [rowname] || 0}))}}

	function feat (what) {
	    return function (i) {return dg ['job' + i + '_' + what]}}
	
	dg.expiryDatesSpreadSheet = Object.keys (allDates).
	    sort (function (a, b) {return allDates [a] - allDates [b]}).
	    map (tableRowBuilder ([1,2,3].map (feat ('expiryDatesTable'))))

	dg.sectorsSpreadSheet = Object.keys (allSectorsTable).sort ().
	    map (tableRowBuilder ([1,2,3].map (feat ('sectorsTable')).concat ([allSectorsTable])))

	dg.jobIdTable = UTILS.table (dg.job1_ids.concat (dg.job2_ids.concat (dg.job3_ids)))
				     
	if (onFinish) onFinish (dg)
    }
    
    try {
	new digest (filein, onDigestFinish)
    }
    catch (e) {
	console.error (e)
	return -1
    }

}

if (!module.parent) {
    if (process.argv.length !== 3) {
	console.error (process.argv [1] + " (file to analyse)")
	return -1;
    }

    function onFinish (dg) {
 	function toString (x) {
	    return x.map (function (x) {return x.join ('\t')}).join ('\n')}

	console.log ('' + Object.keys (dg.jobIdTable).length + ' unique jobs')
	Object.keys (dg.jobIdTable).
	    sort (function (a, b) {return dg.jobIdTable [b] - dg.jobIdTable [a]}).
	    slice (0, 10).
	    forEach (function (id) {console.log (id + '\t' + dg.jobIdTable [id])})
	
	console.log ('\nExpiry dates')
	console.log (toString (dg.expiryDatesSpreadSheet))
	console.log ('\nSectors')
	console.log (toString (dg.sectorsSpreadSheet))
   }
    
    var filein = process.argv [2]

    analyse (filein, onFinish)
}
