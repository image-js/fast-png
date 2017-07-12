# fast-png

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![npm download][download-image]][download-url]

PNG image decoder and encoder written entirely in JavaScript

## Installation

```
$ npm install --save fast-png
```

## Usage

### `decode(png[, options])`

__Arguments__

* `png` - A TypedArray or Buffer that contains the PNG data.
* `options` - An object of options

__Options__

* `checkCrc` - If set to `true`, the CRC will be checked for each chunk and an error will be throw in case it's wrong (default: false).

### `encode(image)`

__Arguments__

* `png` - An object representing the image. You can pass an ImageData from the Canvas API or an object with the following properties:
  * `width` - The width of the image
  * `height` - The height of the image
  * `data` - An array or TypedArray with the image data
  * `bitDepth` - A number indicating the bit depth (only 8 and 16 are supported now). Defaults to 8.
  * `kind` - One of `'RGBA'`, `'RGB'`, `'GREYA'`, `'GREY'`. This will determine the number of channels and the colour type of the image. Defaults to `'RGBA'`.

## PNG standard

Spec can be found at: https://www.w3.org/TR/PNG/

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/fast-png.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fast-png
[travis-image]: https://img.shields.io/travis/image-js/fast-png/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/image-js/fast-png
[download-image]: https://img.shields.io/npm/dm/fast-png.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/fast-png
