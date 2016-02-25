var fs = require ('fs');
var utils = require ('./utils');

var undef;
var rootdir = require ('path').dirname (process.argv [1]);
var savedir = rootdir + '/save';

function CtrDB (reference) {
    var self = this;
    var ctrDB = {};
    this.ctrDB = ctrDB;

    this.loadReference = function (reference) {
	var referenceFullPath = rootdir + '/' + reference;
	var refValues = JSON.parse (fs.readFileSync (referenceFullPath).toString ());
	Object.keys (refValues).forEach (function (l) {self.ctrDB [l] = refValues [l]})
    }
    
    this.load = function () {
	var lastCtrDB = utils.getFresherFileSync (
	    savedir,
	    function (f) {return /ctrdb-\d+\.json/.exec (f)});
	
	if (lastCtrDB !== undef) {
	    self.ctrDB = JSON.parse (fs.readFileSync (savedir + '/' + lastCtrDB).
				     toString ())}
	if (reference !== undef) self.loadReference (reference);
    }
    
    this.get = function (location) {
	return self.ctrDB [location]}
    
}

exports.load = function (reference) {
    var ctrdb = new CtrDB (reference);
    ctrdb.load ();
    return ctrdb;
}

