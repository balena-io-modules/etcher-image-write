etcher-image-write
=================

> The cross-platform way to stream an OS image to a device

[![npm version](https://badge.fury.io/js/etcher-image-write.svg)](http://badge.fury.io/js/etcher-image-write)
[![dependencies](https://david-dm.org/resin-io-modules/etcher-image-write.svg)](https://david-dm.org/resin-io-modules/etcher-image-write.svg)
[![Build Status](https://travis-ci.org/resin-io-modules/etcher-image-write.svg?branch=master)](https://travis-ci.org/resin-io-modules/etcher-image-write)
[![Build status](https://ci.appveyor.com/api/projects/status/nmjinr68wtd9ne2h/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/etcher-image-write/branch/master)

Installation
------------

Install `etcher-image-write` by running:

```sh
$ npm install --save etcher-image-write
```

Documentation
-------------

<a name="module_imageWrite.write"></a>

### imageWrite.write(device, stream, options) ⇒ <code>EventEmitter</code>
**NOTICE:** You might need to run this function as sudo/administrator to
avoid permission issues.

The returned EventEmitter instance emits the following events:

- `progress`: A progress event that passes a state object of the form:

```js
{
  type: 'write' // possible values: 'write', 'check'.
  percentage: 9.05,
  transferred: 949624,
  length: 10485760,
  remaining: 9536136,
  eta: 10,
  runtime: 0,
  delta: 295396,
  speed: 949624
}
```

- `error`: An error event.
- `done`: An event emitted with a boolean success value.

Enabling the `check` option is useful to ensure the image was
successfully written to the device. This is checked by calculating and
comparing checksums from both the original image and the data written
to the device.

The `transform` option is used to handle cases like decompression of
an image on the fly. The stream is piped through this transform stream
*after* the progress stream and *before* any writing and alignment.

This allows the progress to be accurately displayed even when the
client doesn't know the final uncompressed size.

For example, to handle writing a compressed file, you pass the
compressed stream to `.write()`, pass the *compressed stream size*,
and a transform stream to decompress the file.

**Kind**: static method of <code>[imageWrite](#module_imageWrite)</code>  
**Summary**: Write a readable stream to a device  
**Returns**: <code>EventEmitter</code> - emitter  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| device | <code>String</code> |  | device |
| stream | <code>ReadStream</code> |  | readable stream |
| options | <code>Object</code> |  | options |
| options.size | <code>Number</code> |  | input stream size |
| [options.transform] | <code>TransformStream</code> |  | transform stream |
| [options.check] | <code>Boolean</code> | <code>false</code> | enable write check |

**Example**  
```js
var myStream = fs.createReadStream('my/image');

var emitter = imageWrite.write('/dev/disk2', myStream, {
  check: true,
  size: fs.statSync('my/image').size
});

emitter.on('progress', function(state) {
  console.log(state);
});

emitter.on('error', function(error) {
  console.error(error);
});

emitter.on('done', function(success) {
  if (success) {
    console.log('Success!');
  } else {
    console.log('Failed!');
  }
});
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io-modules/etcher-image-write/issues/new) on GitHub and the Resin.io team will be happy to help.

Tests
-----

Run the test suite by doing:

```sh
$ npm test
```

Contribute
----------

- Issue Tracker: [github.com/resin-io-modules/etcher-image-write/issues](https://github.com/resin-io-modules/etcher-image-write/issues)
- Source Code: [github.com/resin-io-modules/etcher-image-write](https://github.com/resin-io-modules/etcher-image-write)

Before submitting a PR, please make sure that you include tests, and that [jshint](http://jshint.com) runs without any warning:

```sh
$ npm run lint
```

License
-------

`etcher-image-write` is free software, and may be redistributed under the terms specified in the [license](https://github.com/resin-io-modules/etcher-image-write/blob/master/LICENSE).
