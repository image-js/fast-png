'use strict';

var fs = require('fs');
var PNGDecoder = require('..').PNGDecoder;

var image = fs.readFileSync(__dirname + '/img/ecoli.png');

var decoder = new PNGDecoder(image);
var t = process.hrtime();
var png = decoder.decode();
console.log('all');
console.log(process.hrtime(t));
//delete png.data;
//console.log(png);
