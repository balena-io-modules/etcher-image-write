/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * @module imageWrite
 */

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');
var progressStream = require('progress-stream');
var streamChunker = require('stream-chunker');
var sliceStream = require('slice-stream2');
var CRC32Stream = require('crc32-stream');
var PassThroughStream = require('stream').PassThrough;
var DevNullStream = require('dev-null-stream');
var denymount = Promise.promisify(require('denymount'));
var utils = require('./utils');
var win32 = require('./win32');

var CHUNK_SIZE = 65536 * 16; // 64K * 16 = 1024K = 1M

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
 * ```js
 * {
 *   type: 'write' // possible values: 'write', 'check'.
 *   percentage: 9.05,
 *   transferred: 949624,
 *   length: 10485760,
 *   remaining: 9536136,
 *   eta: 10,
 *   runtime: 0,
 *   delta: 295396,
 *   speed: 949624
 * }
 * ```
 *
 * - `error`: An error event.
 * - `done`: An event emitted with a boolean success value.
 *
 * Enabling the `check` option is useful to ensure the image was
 * successfully written to the device. This is checked by calculating and
 * comparing checksums from both the original image and the data written
 * to the device.
 *
 * The `transform` option is used to handle cases like decompression of
 * an image on the fly. The stream is piped through this transform stream
 * *after* the progress stream and *before* any writing and alignment.
 *
 * This allows the progress to be accurately displayed even when the
 * client doesn't know the final uncompressed size.
 *
 * For example, to handle writing a compressed file, you pass the
 * compressed stream to `.write()`, pass the *compressed stream size*,
 * and a transform stream to decompress the file.
 *
 * @param {String} device - device
 * @param {ReadStream} stream - readable stream
 * @param {Object} options - options
 * @param {Number} options.size - input stream size
 * @param {TransformStream} [options.transform] - transform stream
 * @param {Boolean} [options.check=false] - enable write check
 * @returns {EventEmitter} emitter
 *
 * @example
 * var myStream = fs.createReadStream('my/image');
 *
 * var emitter = imageWrite.write('/dev/disk2', myStream, {
 *   check: true,
 *   size: fs.statSync('my/image').size
 * });
 *
 * emitter.on('progress', function(state) {
 *   console.log(state);
 * });
 *
 * emitter.on('error', function(error) {
 *   console.error(error);
 * });
 *
 * emitter.on('done', function(success) {
 *   if (success) {
 *     console.log('Success!');
 *   } else {
 *     console.log('Failed!');
 *   }
 * });
 */
exports.write = function(device, stream, options) {
  options = options || {};

  var emitter = new EventEmitter();

  if (!options.size) {
    throw new Error('Missing size option');
  }

  device = utils.getRawDevice(device);

  // Prevent disks from auto-mounting, since some OSes, like
  // Windows and OS X, "touch" files in FAT partitions,
  // causing our checksum comparison to fail.
  denymount(device, function(callback) {

    return utils.eraseMBR(device).then(win32.prepare).then(function() {
      return new Promise(function(resolve, reject) {
        var checksumStream = new CRC32Stream();

        stream
          .pipe(progressStream({
            length: _.parseInt(options.size),
            time: 500
          }))
          .on('progress', function(state) {
            state.type = 'write';
            emitter.emit('progress', state);
          })
          .pipe(options.transform || new PassThroughStream())
          .pipe(checksumStream)
          .pipe(streamChunker(CHUNK_SIZE, {
            flush: true,
            align: true
          }))
          .pipe(fs.createWriteStream(device, {
            flags: 'rs+'
          }))
          .on('error', function(error) {
            error.type = 'write';
            return reject(error);
          })
          .on('close', function() {
            return resolve({
              checksum: checksumStream.hex().toLowerCase(),
              size: checksumStream.size()
            });
          });
      });
    }).then(function(results) {
      if (!options.check) {
        return win32.prepare().then(function() {
          emitter.emit('done', true);
        });
      }

      return new Promise(function(resolve, reject) {
        var checksumStream = new CRC32Stream();

        fs.createReadStream(device)

          // Only calculate the checksum from the bytes that correspond
          // to the original image size and not the whole drive since
          // the drive might contain empty space that changes the
          // resulting checksum.
          // See https://help.ubuntu.com/community/HowToMD5SUM#Check_the_CD
          .pipe(sliceStream({
            bytes: results.size
          }))

          .pipe(progressStream({
            length: _.parseInt(results.size),
            time: 500
          }))
          .on('progress', function(state) {
            state.type = 'check';
            emitter.emit('progress', state);
          })
          .pipe(checksumStream)
          .pipe(new DevNullStream())
          .on('error', function(error) {
            error.type = 'check';
            return reject(error);
          })
          .on('finish', function() {
            return resolve(checksumStream.hex().toLowerCase());
          });

      }).tap(win32.prepare).then(function(deviceChecksum) {
        emitter.emit('done', results.checksum === deviceChecksum);
      });
    }).asCallback(callback);

  }).catch(function(error) {
    emitter.emit('error', error);
  });

  return emitter;
};
