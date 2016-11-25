'use strict';

const fs = require('fs');
const decode = require('..').decode;

const image = fs.readFileSync(__dirname + '/img/NES_palette_sample_image.png');

const png = decode(image);

console.log(png.palette);
