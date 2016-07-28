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
var through2 = require('through2');
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

var safePipe = function(streams, callback) {
  var current = null;

  _.each(streams, function(stream) {
    if (!current) {
      current = stream.stream;
      return;
    }

    stream.stream.on('error', callback);

    _.each(stream.events || {}, function(handler, event) {
      stream.stream.on(event, handler);
    });

    current = current.pipe(stream.stream);
  });
};

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
 * @param {Object} drive - drive
 * @param {String} drive.device - drive device
 * @param {Number} drive.size - drive size
 * @param {Object} image - image
 * @param {ReadStream} image.stream - image readable stream
 * @param {Number} image.size - image stream size
 * @param {Object} options - options
 * @param {TransformStream} [options.transform] - transform stream
 * @param {Boolean} [options.check=false] - enable write check
 * @returns {EventEmitter} emitter
 *
 * @example
 * var emitter = imageWrite.write({
 *   device: '/dev/disk2',
 *   size: 2014314496
 * }, {
 *   stream: fs.createWriteStream('my/image'),
 *   size: fs.statSync('my/image').size
 * }, {
 *   check: true
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
 * emitter.on('done', function(results) {
 *   if (results.passedValidation) {
 *     console.log('Success!');
 *   } else {
 *     console.log('Failed!');
 *   }
 * });
 */
exports.write = function(drive, image, options) {
  options = options || {};

  var emitter = new EventEmitter();

  if (!image.size || !_.isNumber(image.size)) {
    throw new Error('Invalid image size: ' + image.size);
  }

  if (!drive.size || !_.isNumber(drive.size)) {
    throw new Error('Invalid drive size: ' + drive.size);
  }

  var devicePath = utils.getRawDevice(drive.device);

  // Prevent disks from auto-mounting, since some OSes, like
  // Windows and OS X, "touch" files in FAT partitions,
  // causing our checksum comparison to fail.
  denymount(devicePath, function(callback) {

    return win32.prepare(devicePath).then(function() {
      return new Promise(function(resolve, reject) {
        var checksumStream = new CRC32Stream();
        var transferredBytes = 0;

        return safePipe([
          {
            stream: image.stream
          },
          {
            stream: progressStream({
              length: _.parseInt(image.size),
              time: 500
            }),
            events: {
              progress: function(state) {
                state.type = 'write';
                emitter.emit('progress', state);
              }
            }
          },
          {
            stream: options.transform || new PassThroughStream()
          },
          {
            stream: checksumStream
          },
          {
            stream: streamChunker(CHUNK_SIZE, {
              flush: true,
              align: true
            })
          },
          {
            stream: through2(function(chunk, encoding, callback) {
              transferredBytes += chunk.length;

              if (transferredBytes + CHUNK_SIZE > drive.size) {
                var error = new Error('Not enough space on the drive');
                error.code = 'ENOSPC';
                return callback(error);
              }

              return callback(null, chunk);
            })
          },
          {
            stream: fs.createWriteStream(devicePath, {
              flags: 'rs+'
            }),
            events: {
              close: function() {
                return resolve({
                  checksum: checksumStream.hex().toLowerCase(),
                  size: checksumStream.size()
                });
              }
            }
          }
        ], function(error) {
          error.type = 'write';
          return reject(error);
        });
      });
    }).then(function(results) {
      if (!options.check) {
        return win32.rescan().then(function() {
          emitter.emit('done', {
            passedValidation: true,
            sourceChecksum: results.checksum
          });
        });
      }

      return new Promise(function(resolve, reject) {
        var checksumStream = new CRC32Stream();
        var deviceStream = fs.createReadStream(devicePath);

        return safePipe([
          {
            stream: deviceStream
          },
          {

            // Only calculate the checksum from the bytes that correspond
            // to the original image size and not the whole drive since
            // the drive might contain empty space that changes the
            // resulting checksum.
            // See https://help.ubuntu.com/community/HowToMD5SUM#Check_the_CD
            stream: sliceStream({
              bytes: results.size
            })

          },
          {
            stream: progressStream({
              length: _.parseInt(results.size),
              time: 500
            }),
            events: {
              progress: function(state) {
                state.type = 'check';
                emitter.emit('progress', state);
              }
            }
          },
          {
            stream: checksumStream
          },
          {
            stream: new DevNullStream(),
            events: {
              finish: function() {

                // Make sure the device stream file descriptor is closed
                // before returning control the the caller. Not closing
                // the file descriptor (and waiting for it) results in
                // `EBUSY` errors when attempting to unmount the drive
                // right afterwards in some Windows 7 systems.
                deviceStream.close(function() {
                  return resolve(checksumStream.hex().toLowerCase());
                });

              }
            }
          }
        ], function(error) {
          error.type = 'check';
          return reject(error);
        });
      }).tap(win32.rescan).then(function(deviceChecksum) {
        emitter.emit('done', {
          passedValidation: results.checksum === deviceChecksum,
          sourceChecksum: results.checksum
        });
      });
    }).asCallback(callback);

  }).catch(function(error) {
    emitter.emit('error', error);
  });

  return emitter;
};
