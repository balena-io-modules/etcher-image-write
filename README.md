resin-image-write
-----------------

[![npm version](https://badge.fury.io/js/resin-image-write.svg)](http://badge.fury.io/js/resin-image-write)
[![dependencies](https://david-dm.org/resin-io/resin-image-write.png)](https://david-dm.org/resin-io/resin-image-write.png)
[![Build Status](https://travis-ci.org/resin-io/resin-image-write.svg?branch=master)](https://travis-ci.org/resin-io/resin-image-write)
[![Build status](https://ci.appveyor.com/api/projects/status/qkn859e7gcbo6lb9?svg=true)](https://ci.appveyor.com/project/jviotti/resin-image-write)

Join our online chat at [![Gitter chat](https://badges.gitter.im/resin-io/chat.png)](https://gitter.im/resin-io/chat)

Write a Resin.io image to a device.

Role
----

The intention of this module is to provide low level access to how a Resin.io image is written to a device.

**THIS MODULE IS LOW LEVEL AND IS NOT MEANT TO BE USED BY END USERS DIRECTLY**.

Installation
------------

Install `resin-image-write` by running:

```sh
$ npm install --save resin-image-write
```

Documentation
-------------

<a name="module_imageWrite.write"></a>
### imageWrite.write(device, stream) ⇒ <code>EventEmitter</code>
**NOTICE:** You might need to run this function as sudo/administrator to avoid permission issues.

The returned EventEmitter instance emits the following events:

- `progress`: A progress event that passes a state object of the form:

		{
			percentage: 9.05,
			transferred: 949624,
			length: 10485760,
			remaining: 9536136,
			eta: 10,
			runtime: 0,
			delta: 295396,
			speed: 949624
		}

- `error`: An error event.
- `done`: An event emitted when the readable stream was written completely.

If you're passing a readable stream from a custom location, you can configure the length by adding a `.length` number property to the stream.

**Kind**: static method of <code>[imageWrite](#module_imageWrite)</code>  
**Summary**: Write a readable stream to a device  
**Returns**: <code>EventEmitter</code> - emitter  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| device | <code>String</code> | device |
| stream | <code>ReadStream</code> | readable stream |

**Example**  
```js
myStream = fs.createReadStream('my/image')
myStream.length = fs.statAsync('my/image').size

emitter = imageWrite.write('/dev/disk2', myStream)

emitter.on 'progress', (state) ->
	console.log(state)

emitter.on 'error', (error) ->
	console.error(error)

emitter.on 'done', ->
	console.log('Finished writing to device')
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io/resin-image-write/issues/new) on GitHub and the Resin.io team will be happy to help.

Tests
-----

Run the test suite by doing:

```sh
$ gulp test
```

Contribute
----------

- Issue Tracker: [github.com/resin-io/resin-image-write/issues](https://github.com/resin-io/resin-image-write/issues)
- Source Code: [github.com/resin-io/resin-image-write](https://github.com/resin-io/resin-image-write)

Before submitting a PR, please make sure that you include tests, and that [coffeelint](http://www.coffeelint.org/) runs without any warning:

```sh
$ gulp lint
```

License
-------

The project is licensed under the Apache 2.0 license.
