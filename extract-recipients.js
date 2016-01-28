var csv = require ('csv')
var fs = require ('fs')

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in extract-recipient: ' +
	err + "\n\n" +
	err.stack;
    console.error(message);
});

var undef

if (process.argv.length !== 5) {
    console.error (process.argv [1] +
		   " (file to analyse) (campaignid) (variantid)")
    return -1
}

var filein = process.argv [2]
var campaignId = process.argv [3]
var variantId = process.argv [4]

var parser = csv.parse ({quote: '"', columns: true})

var emails = [];

parser.
    on ('readable', function () {
	var r;
	while (r = parser.read ()) 
	    emails.push (r.EMAIL) }).
    on ('error', function (err) {console.error (err)}).
    on ('finish', function () {
	emails.forEach (function (e) {
	    console.log ([e, campaignId, variantId].join ('\t'))})})

var stream = fs.createReadStream (filein).
    on ('error', function (err) {console.error (err)}).
    on ('end', function () {parser.end ()}).
    on ('data', function (data) {parser.write (data.toString ())})



