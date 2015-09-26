'use strict';

var fs = require('fs');
var PNGDecoder = require('..').PNGDecoder;

var image = fs.readFileSync(__dirname + '/img/ColorGrid5x5.png');

var decoder = new PNGDecoder(image);
var png = decoder.decode();
//delete png.data;
console.log(png);
