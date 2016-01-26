var u = require ('./utils');
var mail = require ('./mail');
var cp = require ('child_process');
var fs = require ('fs');

var undef;

function filter (f) {
    return /M_campaignlist-\d+\.csv/.exec (f)
}

var fresherFile = u.getFresherFileSync ('/home/jobs/lz', filter);

if (fresherFile !== undef) {
    var timeStamp = /M_campaignlist-(\d+)\.csv/.exec (fresherFile) [1];
    var lzdir = '/home/jobs/lz/'
    var sectorsFilePath = lzdir + 'sectors-' + timeStamp + '.csv';
    var jobsFreqsFilePath = lzdir + 'jobsfreqs-' + timeStamp + '.csv';
    var diagnosticFilePath = lzdir + 'Diagnostic_campaignlist-' + timeStamp + '.csv';
    var parametersFilePath = lzdir + 'parameters-' + timeStamp + '.csv';
    var nblines = '?'
    var is_UTF8 = '?'
    var body = '';
    var sectorTables = '';
    var jobsFreqs = '';
    var parameters = ''
    
    try {
	var drows = fs.readFileSync (diagnosticFilePath).toString().split ('\n')
	nblines = /\d+/.exec (drows [0])[0]
	is_UTF8 = (drows [1].indexOf ('UTF-8') >= 0)
    }
    catch (e) {
    }

    try {
	parameters =
	    '\n\n' +
	    fs.readFileSync (parametersFilePath).
	    toString ().
	    replace (/\t/g, ': ') +
	    '\n\n'
    }
    catch (e) {
	parameters = ''
    }
    
    if (fs.statSync (sectorsFilePath)) {
	sectorsTable = fs.
	    readFileSync (sectorsFilePath).
	    toString ()}
    
    if (fs.statSync (jobsFreqsFilePath)) {
	jobsFreqs = fs.
	    readFileSync (jobsFreqsFilePath).
	    toString ().
	    split ('\n').
	    slice (0, 10).
	    join ('\n')}
    
    body = 'Timestamp: ' + timeStamp +
	parameters +
	'Nb lines: ' + nblines +
	'\n\nIs UTF-8: ' + is_UTF8 +
	'\n\nSECTORS:\n\n' + sectorsTable +
	'\n\nTOP 10 JOBS FREQUENCIES:\n\n' + jobsFreqs +
	'\n\n';
		 
    mail.sendMeMail ('New file on LZ', body)
} else {
    mail.sendMeMail ('New file on LZ', 'Unable to get the fresher file')
}


    
