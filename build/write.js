
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

/**
 * @module imageWrite
 */
var CHUNK_SIZE, EventEmitter, Promise, StreamChunker, checksum, denymount, fs, progressStream, utils, win32, _;

EventEmitter = require('events').EventEmitter;

fs = require('fs');

_ = require('lodash');

Promise = require('bluebird');

progressStream = require('progress-stream');

StreamChunker = require('stream-chunker');

denymount = Promise.promisify(require('denymount'));

utils = require('./utils');

win32 = require('./win32');

checksum = require('./checksum');

CHUNK_SIZE = 65536 * 16;


/**
 * @summary Write a readable stream to a device
 * @function
 * @public
 *
 * @description
 *
 * **NOTICE:** You might need to run this function as sudo/administrator to
 * avoid permission issues.
 *
 * The returned EventEmitter instance emits the following events:
 *
 * - `progress`: A progress event that passes a state object of the form:
 *
 *		{
 *			type: 'write' // possible values: 'write', 'check'.
 *			percentage: 9.05,
 *			transferred: 949624,
 *			length: 10485760,
 *			remaining: 9536136,
 *			eta: 10,
 *			runtime: 0,
 *			delta: 295396,
 *			speed: 949624
 *		}
 *
 * - `error`: An error event.
 * - `done`: An event emitted with a boolean success value.
 *
 * If you're passing a readable stream from a custom location, you should
 * configure the length by adding a `.length` number property to the stream.
 *
 * Enabling the `check` option is useful to ensure the image was
 * successfully written to the device. This is checked by calculating and
 * comparing checksums from both the original image and the data written
 * to the device.
 *
 * @param {String} device - device
 * @param {ReadStream} stream - readable stream
 * @param {Object} [options={}] - options
 * @param {Boolean} [options.check=false] - enable write check
 * @returns {EventEmitter} emitter
 *
 * @example
 * myStream = fs.createReadStream('my/image')
 * myStream.length = fs.statSync('my/image').size
 *
 * emitter = imageWrite.write('/dev/disk2', myStream, check: true)
 *
 * emitter.on 'progress', (state) ->
 * 	console.log(state)
 *
 * emitter.on 'error', (error) ->
 * 	console.error(error)
 *
 * emitter.on 'done', (success) ->
 * 	if success
 * 		console.log('Success!')
 * 	else
 * 		console.log('Failed!')
 */

exports.write = function(device, stream, options) {
  var emitter, progress;
  if (options == null) {
    options = {};
  }
  emitter = new EventEmitter();
  if (stream.length == null) {
    throw new Error('Stream size missing');
  }
  device = utils.getRawDevice(device);
  progress = progressStream({
    length: _.parseInt(stream.length),
    time: 500
  });
  progress.on('progress', function(state) {
    state.type = 'write';
    return emitter.emit('progress', state);
  });
  utils.eraseMBR(device).then(win32.prepare).then(function() {
    return Promise.props({
      checksum: checksum.calculate(stream, {
        bytes: stream.length
      }),
      write: new Promise(function(resolve, reject) {
        return stream.pipe(progress).pipe(StreamChunker(CHUNK_SIZE, {
          flush: true
        })).pipe(fs.createWriteStream(device, {
          flags: 'rs+'
        })).on('close', resolve).on('error', reject);
      })
    });
  }).get('checksum').then(function(imageChecksum) {
    if (!options.check) {
      return win32.prepare().then(function() {
        return emitter.emit('done', true);
      });
    }
    return denymount(device, function(callback) {
      return checksum.calculate(fs.createReadStream(device), {
        bytes: stream.length,
        progress: function(state) {
          state.type = 'check';
          return emitter.emit('progress', state);
        }
      }).tap(win32.prepare).then(function(deviceChecksum) {
        return emitter.emit('done', imageChecksum === deviceChecksum);
      }).asCallback(callback);
    }, {
      autoMountOnSuccess: true
    });
  })["catch"](function(error) {
    if (error.code === 'EINVAL') {
      error = new Error('Yikes, your image appears to be invalid.\nPlease try again, or get in touch with support@resin.io');
    }
    return emitter.emit('error', error);
  });
  return emitter;
};
