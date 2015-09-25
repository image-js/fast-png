'use strict';

var fs = require('fs');
var PNGDecoder = require('..').PNGDecoder;

var image = fs.readFileSync(__dirname + '/img/BW2x2.png');

var decoder = new PNGDecoder(image);
var png = decoder.decode();

console.log(png.data);
