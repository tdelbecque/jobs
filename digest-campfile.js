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
    self.arrayAsData = []
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

if (!module.parent) {
    if (process.argv.length !== 3) {
	console.error (process.argv [1] + " (file to analyse)")
	return -1;
    }
	
    var filein = process.argv [2]

    function onFinish (dg) {
	var jobsdb = EXPORT.aggregateData ()
	var extractfun = jobsdb.extractfun

	var allDates = {}
	function updateAllDates (dates, times) {
	    dates.forEach (function (d, i) {allDates [d] = times [i]})
	}
	
	dg.job1_expiryTimes = dg.job1_ids.map (extractfun ('expiryTime'))
	dg.job1_expiryDates = dg.job1_ids.map (extractfun ('expiryDate'))
	updateAllDates (dg.job1_expiryDates, dg.job1_expiryTimes)
	dg.job1_expiryDatesTable = UTILS.table (dg.job1_expiryDates)
	
	dg.job2_expiryTimes = dg.job2_ids.map (extractfun ('expiryTime'))
	dg.job2_expiryDates = dg.job2_ids.map (extractfun ('expiryDate'))
	updateAllDates (dg.job2_expiryDates, dg.job2_expiryTimes)
	dg.job2_expiryDatesTable = UTILS.table (dg.job2_expiryDates)
	
	dg.job3_expiryTimes = dg.job3_ids.map (extractfun ('expiryTime'))
	dg.job3_expiryDates = dg.job3_ids.map (extractfun ('expiryDate'))
	updateAllDates (dg.job3_expiryDates, dg.job3_expiryTimes)
	dg.job3_expiryDatesTable = UTILS.table (dg.job3_expiryDates)

	dg.expiryDatesReport = Object.keys (allDates).
	    sort (function (a, b) {return allDates [a] - allDates [b]}).
	    map (function (d) {
		return d + '\t' +
		    (dg.job1_expiryDatesTable [d] || 0) + '\t' +
		    (dg.job2_expiryDatesTable [d] || 0) + '\t' +
		    (dg.job3_expiryDatesTable [d] || 0)}).
	    join ('\n')

	console.log (dg.expiryDatesReport)

    }
    
    try {
	new digest (filein, onFinish)
    }
    catch (e) {
	console.error (e)
	return -1
    }

}
