var u = require ('./utils');
var mail = require ('./mail');
var cp = require ('child_process');

var undef;

function filter (f) {
    return /M_campaignlist-\d+\.csv/.exec (f)
}

var fresherFile = u.getFresherFileSync ('/home/jobs/lz', filter);

if (fresherFile !== undef) {
    var nbLinesStr;
    cp.exec ('wc -l /home/jobs/lz/' + fresherFile,
	     function (err, stdout, strerr) {
		 mail.sendMeMail ('New file on LZ', stdout)})
} else {
    mail.sendMeMail ('New file on LZ', 'Unable to get the fresher file')
}


    
