var xmldom = require ('xmldom')

var undef

function f (str) {
    try {
	return parser.parseFromString ('<R>' + str.replace (/&nbsp;/g, ' ') + '</R>').childNodes [0].textContent
    }
    catch (e) {
	console.log (e)
	return null
    }
}

exports.f = f

function tokenize (str) {
    var tokens = {}
    str.split (/\W/).forEach (function (x) {
	if (tokens [x] === undef) tokens [x] = 1
	else tokens [x] ++
    })
    return tokens
}

exports.tokenize = tokenize;

function aggregateTokens (tokenSets) {
    var allTokens = {}
    tokenSets.forEach (function (xs) {
	Object.keys (xs).forEach (function (x) {
	    if (allTokens [x] === undef) allTokens [x] = xs [x]
	    else allTokens [x] += xs [x]
	})
    })
    return allTokens
}


exports.aggregateTokens = aggregateTokens

function docFrequencies (tokenSets) {
    var allTokens = {}
    tokenSets.forEach (function (xs) {
	Object.keys (xs).forEach (function (x) {
	    if (allTokens [x] === undef) allTokens [x] = 1
	    else allTokens [x] ++;
	})
    })
    return allTokens
}

exports.docFrequencies = docFrequencies

function tfidf (tokenSets) {
    var docFreq = docFrequencies (tokenSets)
    return tokenSets.map (function (xs) {
	var res = {}
	Object.keys(xs).forEach (function (x) {
	    if (docFreq [x] < 500 && docFreq [x] > 2)
		res [x] = -xs [x]*Math.log (docFreq [x])
	})
	return res
    })
}

exports.tfidf = tfidf
