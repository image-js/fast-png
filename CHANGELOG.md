# Changelog

### [5.0.4](https://www.github.com/image-js/fast-png/compare/v5.0.3...v5.0.4) (2021-03-26)


### Bug Fixes

* add Uint8ClampedArray to PNGDataArray union type ([#13](https://www.github.com/image-js/fast-png/issues/13)) ([ae1cc70](https://www.github.com/image-js/fast-png/commit/ae1cc70ccd0a4c644ad80b9b13fc7d27fcec513d))

### [5.0.3](https://www.github.com/image-js/fast-png/compare/v5.0.2...v5.0.3) (2020-12-14)


### Bug Fixes

* update pako to v2 ([9a5712d](https://www.github.com/image-js/fast-png/commit/9a5712d5cd4954453b076fbf42803fe825bf01b2))



## [5.0.2](https://github.com/image-js/fast-png/compare/v5.0.1...v5.0.2) (2020-02-28)


### Bug Fixes

* support tRNS chunk for palette images ([6d9e3ec](https://github.com/image-js/fast-png/commit/6d9e3ecf91d08db52772d011f87a6a765676e9cd))



## [5.0.1](https://github.com/image-js/fast-png/compare/v5.0.0...v5.0.1) (2019-11-12)


### Bug Fixes

* update iobuffer to fix browser build ([75d3e63](https://github.com/image-js/fast-png/commit/75d3e6318ec30c27611ed18ff5bd32adf6e92d6c))



# [5.0.0](https://github.com/image-js/fast-png/compare/v4.0.1...v5.0.0) (2019-11-12)


### chore

* update dependencies ([39cf43e](https://github.com/image-js/fast-png/commit/39cf43e59a571faf7f1bddd45dde5394a0eaf1dd))


### BREAKING CHANGES

* Node.js 6 and 8 are no longer supported.



## [4.0.1](https://github.com/image-js/fast-png/compare/v4.0.0...v4.0.1) (2019-04-01)


### Bug Fixes

* **decode:** set channels property of result ([683d61a](https://github.com/image-js/fast-png/commit/683d61a))



# [4.0.0](https://github.com/image-js/fast-png/compare/v3.1.3...v4.0.0) (2019-04-01)


### Code Refactoring

* rename bitDepth to depth ([306b32b](https://github.com/image-js/fast-png/commit/306b32b))
* replace components with channels and remove alpha ([35393fa](https://github.com/image-js/fast-png/commit/35393fa))


### BREAKING CHANGES

* * The components property has been replaced with channels, that includes
  alpha.
* The alpha property has been removed. It was unused after the previous
  change.
* The `bitDepth` field was renamed to `depth`.



## [3.1.3](https://github.com/image-js/fast-png/compare/v3.1.2...v3.1.3) (2019-04-01)


### Bug Fixes

* include src in package ([e7cf353](https://github.com/image-js/fast-png/commit/e7cf353))
* revert breaking change in PNGDecoder ([df9aa5e](https://github.com/image-js/fast-png/commit/df9aa5e))



## [3.1.2](https://github.com/image-js/fast-png/compare/v3.1.1...v3.1.2) (2019-03-29)


### Bug Fixes

* undo breaking change: alpha can be 0 or 1 again ([e82c80c](https://github.com/image-js/fast-png/commit/e82c80c))



## [3.1.1](https://github.com/image-js/fast-png/compare/v3.1.0...v3.1.1) (2019-03-27)



<a name="3.1.0"></a>
# [3.1.0](https://github.com/image-js/fast-png/compare/v3.0.0...v3.1.0) (2017-07-25)


### Features

* allow to specify zlib options - default level to 3 ([70ec732](https://github.com/image-js/fast-png/commit/70ec732))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/image-js/fast-png/compare/v2.0.1...v3.0.0) (2017-07-13)


### Bug Fixes

* remove misleading kind option ([9749e1c](https://github.com/image-js/fast-png/commit/9749e1c))


* rename "tEXt" field to "text" in decoded PNG ([0bdc855](https://github.com/image-js/fast-png/commit/0bdc855))


### BREAKING CHANGES

* The "tEXt" field returned by the decoder has been renamed to "text".
* The "kind" option was misleading and has been replaced by separate
"components" and "alpha" options.



<a name="2.0.1"></a>
## [2.0.1](https://github.com/image-js/fast-png/compare/v2.0.0...v2.0.1) (2017-07-12)


### Bug Fixes

* **decoder:** add missing byteOffset in IDAT decoding ([fd1d302](https://github.com/image-js/fast-png/commit/fd1d302))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/image-js/fast-png/compare/v1.1.0...v2.0.0) (2017-07-12)


* add CRC calculation and fix 16-bit encoding ([d11fa54](https://github.com/image-js/fast-png/commit/d11fa54))


### Bug Fixes

* detect endianess of the platform in decoder ([4f74ee7](https://github.com/image-js/fast-png/commit/4f74ee7))


### Features

* add a checkCrc option to the decoder ([d920bc0](https://github.com/image-js/fast-png/commit/d920bc0)), closes [#7](https://github.com/image-js/fast-png/issues/7)
* add support for decoding pHYs chunk ([800d428](https://github.com/image-js/fast-png/commit/800d428))
* implement PNG encoder ([00d1e3c](https://github.com/image-js/fast-png/commit/00d1e3c))


### BREAKING CHANGES

* To be consistent with the encoder, the data array returned by the decoder
is now a Uint16Array for 16-bit images.



<a name="1.1.0"></a>
# [1.1.0](https://github.com/image-js/fast-png/compare/v1.0.0...v1.1.0) (2016-06-12)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/image-js/fast-png/compare/v0.0.4...v1.0.0) (2015-11-23)



<a name="0.0.4"></a>
## [0.0.4](https://github.com/image-js/fast-png/compare/v0.0.3...v0.0.4) (2015-09-26)



<a name="0.0.3"></a>
## [0.0.3](https://github.com/image-js/fast-png/compare/v0.0.2...v0.0.3) (2015-09-26)



<a name="0.0.2"></a>
## [0.0.2](https://github.com/image-js/fast-png/compare/v0.0.1...v0.0.2) (2015-09-26)



<a name="0.0.1"></a>
## 0.0.1 (2015-09-26)
