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
    var sectorsFilePath = '/home/jobs/lz/sectors-' + timeStamp + '.csv';
    var jobsFreqsFilePath = '/home/jobs/lz/jobsfreqs-' + timeStamp + '.csv';
    cp.exec ('wc -l /home/jobs/lz/' + fresherFile,
	     function (err, stdout, strerr) {
		 var body = '';
		 var sectorTables = '';
		 var jobsFreqs = '';
		 var newFileSize = stdout;
		 
		 if (fs.statSync (sectorsFilePath)) {
		     sectorsTable = fs.readFileSync (sectorsFilePath).toString ();
		 }
		 if (fs.statSync (jobsFreqsFilePath)) {
		     jobsFreqs = fs.readFileSync (jobsFreqsFilePath).toString ().split ('\n').slice (0, 10).join ('\n');
		 }
		     
		 body = newFileSize +
		     '\n\nSECTORS:\n\n' + sectorsTable +
		     '\n\nTOP 10 JOBS FREQUENCIES:\n\n' + jobsFreqs +
		     '\n\n';
		 
		 mail.sendMeMail ('New file on LZ', body)})
} else {
    mail.sendMeMail ('New file on LZ', 'Unable to get the fresher file')
}


    
