#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest    = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist as local file, checking as URL", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfileContents) {
    return cheerio.load(htmlfileContents);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfileContents, checksfile) {
    $ = cheerioHtmlFile(htmlfileContents);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var processFile = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	/* might be a URL instead */
	rest.get(instr).on('complete', performChecksHTML);
    } else {
	var contents = fs.readFileSync(instr);
	var checkJson = checkHtmlFile(contents, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
};

var performChecksHTML = function(result, response) {
    if (result instanceof Error) {
	console.error('Error: ' + util.format(response.message));
	process.exit(1);
    } else {
	var checkJson = checkHtmlFile(result, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
};

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json',        clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>',   'Path (or URL) to index.html', clone(processFile), HTMLFILE_DEFAULT)
        .parse(process.argv);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
