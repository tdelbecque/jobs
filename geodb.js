var fs = require ('fs');
var utils = require ('./utils');

var undef;
var rootdir = require ('path').dirname (process.argv [1]);
var savedir = rootdir + '/save';

function mkPath (stamp) {
    return savedir + '/' + 'geodb-' + stamp + '.json'}

function GeoDB (reference) {
    var self = this;
    var geoDB = {};
    this.geoDB = geoDB;

    this.loadReference = function (reference) {
	var referenceFullPath = rootdir + '/' + reference;
	var refValues = JSON.parse (fs.readFileSync (referenceFullPath).toString ());
	Object.keys (refValues).forEach (function (l) {self.geoDB [l] = refValues [l]})
    }
    
    this.load = function () {
	var lastGeoDB = utils.getFresherFileSync (
	    savedir,
	    function (f) {return /geodb-\d+\.json/.exec (f)});
	
	if (lastGeoDB !== undef) {
	    self.geoDB = JSON.parse (fs.readFileSync (savedir + '/' + lastGeoDB).
				     toString ())}
	if (reference !== undef) self.loadReference (reference);
    }
    
    this.get = function (location) {
	return self.geoDB [location]}
    
    this.update = function (update) {
	Object.keys (update).forEach (function (l) {
	    self.geoDB [l] = update [l]});}
    
    this.set = function (location, latitude, longitude, countries, source) {
	self.geoDB [location] = {
	    source: source === undef ? 'undef' : source,
	    info: {
		countries: countries === undef ? [] : countries,
		longitude: longitude,
		latitude: latitude }}}
    
    this.save = function (stamp) {
	fs.writeFileSync (mkPath (stamp), JSON.stringify (self.geoDB, null, '\t'))
	require ('./google').syncCountries ()
    }

    this.size = function () {return Object.keys (self.geoDB).length}   
}

exports.load = function (reference) {
    var geodb = new GeoDB (reference);
    geodb.load ();
    return geodb;
}

