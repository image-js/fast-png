'use strict';

var fs = require('fs');
var PNGDecoder = require('..').PNGDecoder;

var image = fs.readFileSync(__dirname + '/img/img.png');

var decoder = new PNGDecoder(image);
var png = decoder.decode();

console.log(png);
