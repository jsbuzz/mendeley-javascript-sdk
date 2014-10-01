/**
 * This script will package up the various require JS modules into a standalone
 * package using namespaces.
 */
'use strict';

var fs = require('fs');

var TPL = fs.readFileSync('./bin/standalone.tpl.js').toString();
var AUTH_MODULE = fs.readFileSync('./lib/auth.js').toString();
var REQUEST_MODULE = fs.readFileSync('./lib/request.js').toString();
var API_MODULE = fs.readFileSync('./lib/api.js').toString();

var STANDALONE = TPL.replace('AUTH_MODULE', AUTH_MODULE)
    .replace('REQUEST_MODULE', REQUEST_MODULE)
    .replace('API_MODULE', API_MODULE);

process.stdout.write(STANDALONE);

