'use strict';

var fs = require('fs');
var PNGDecoder = require('..').PNGDecoder;

var image = fs.readFileSync(__dirname + '/img/ecoli.png');

var t = process.hrtime();
for (var i = 0; i < 10; i++) {
    var decoder = new PNGDecoder(image);
    var png = decoder.decode();
}
console.log(process.hrtime(t));
//delete png.data;
//console.log(png);
