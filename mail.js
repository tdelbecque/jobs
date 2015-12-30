var sendmail = require('sendmail')();
var SERVICE_ALERT_SUBJ = 'SERVICE ALERT';

function sendMeMail (subject, body) {
    sendmail({
	from: 'jobs@sodad.com',
	to: 'jobs@sodad.com ',
	subject: subject,
	content: body,
    }, function(err, reply) {
	if (err) console.log(err.stack);
    });		
};

exports.sendMeMail = sendMeMail;

function sendMeAlert (body) {
    sendMeMail (SERVICE_ALERT_SUBJ, body)
}

exports.sendMeAlert = sendMeAlert;


