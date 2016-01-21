var csv = require ('csv')
var fs = require ('fs');

process.on('uncaughtException', function (err) {
    var message = 'uncaughtException in server: ' +
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
	if (onFinish) onFinish ()
	else console.log ('finish') })
    

    function load () {
        try {
	    var stream = fs.createReadStream (path).
		on ('error', function (err) {console.log (err);});
	    stream.on ('end', function () {parser.end ()})
	    stream.on ('data',
		       function (data) {parser.write (data.toString ())})    
	}
	catch (err) {
	   console.error (err)
	}
    }
    
    load ()
}

exports.digest = function (path) {return new digest (path)}
