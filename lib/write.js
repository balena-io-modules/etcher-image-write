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

const Bluebird = require('bluebird');
const _ = require('lodash');
const bmapflash = require('bmapflash');
const CRC32Stream = require('crc32-stream');
const streamChunker = require('stream-chunker');
const progressStream = require('progress-stream');
const PassThroughStream = require('stream').PassThrough;
const through2 = require('through2');
const ImageWriteStream = require('./image-write-stream');
const utils = require('./utils');

/**
 * @summary Write an image using bmap
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {Number} options.imageSize - image size
 * @param {ReadableStream} options.imageStream - image stream
 * @param {String} options.bmapContents - bmap xml contents
 * @param {Number} [options.bytesToZeroOutFromTheBeginning] - bytes to zero out from the beginning
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.usingBmap(fd, {
 *   imageStream: fs.createReadStream('path/to/image'),
 *   imageSize: 65536 * 128,
 *   bmapContents: fs.readFileSync('path/to/image.bmap', {
 *     encoding: 'utf8'
 *   }),
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.usingBmap = (deviceFileDescriptor, options = {}) => {
  return new Bluebird((resolve, reject) => {
    const flasher = bmapflash.flashImageToFileDescriptor(
      options.imageStream,
      deviceFileDescriptor,
      options.bmapContents,
      {
        bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning
      }
    );

    flasher.on('progress', options.progress);
    flasher.on('error', reject);
    flasher.on('done', () => {
      return resolve({
        transferredBytes: options.imageSize
      });
    });
  });
};

/**
 * @summary Write an image by streaming to the drive
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {ReadableStream} options.imageStream - image stream
 * @param {TransformStream} [options.transformStream] - transform stream
 * @param {Number} options.imageSize - image size
 * @param {Number} options.chunkSize - chunk size
 * @param {Number} options.minimumChunkSize - minimum chunk size
 * @param {Number} options.driveSize - drive size
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.usingStreaming(fd, {
 *   imageStream: fs.createReadStream('path/to/image'),
 *   imageSize: 65536 * 128,
 *   chunkSize: 65536,
 *   minimumChunkSize: 32768,
 *   driveSize: 65536 * 256,
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.usingStreaming = (deviceFileDescriptor, options = {}) => {
  return new Bluebird((resolve, reject) => {
    const PROGRESS_EMIT_INTERVAL = 1000;
    const PROGRESS_BUFFER_SECONDS = 10;

    const checksumStream = new CRC32Stream();
    let transferredBytes = 0;
    let paddingBytes = 0;

    return utils.safePipe([
      {
        stream: options.imageStream
      },
      {
        stream: progressStream({
          length: _.parseInt(options.imageSize),
          time: PROGRESS_EMIT_INTERVAL,
          speed: PROGRESS_BUFFER_SECONDS
        }),
        events: {
          progress: options.progress
        }
      },
      {
        stream: options.transformStream || new PassThroughStream()
      },
      {
        stream: checksumStream
      },
      {
        stream: streamChunker(options.chunkSize, {
          flush: true,
          align: false
        })
      },
      {
        stream: through2((chunk, encoding, callback) => {
          transferredBytes += chunk.length;

          if (chunk.length < options.chunkSize) {
            const finalChunkSize = Math.ceil(chunk.length / options.minimumChunkSize) * options.minimumChunkSize;
            paddingBytes += finalChunkSize - chunk.length;
            chunk = utils.padChunk(chunk, finalChunkSize);
          }

          if (transferredBytes + paddingBytes > options.driveSize) {
            const error = new Error('Not enough space on the drive');
            error.code = 'ENOSPC';
            return callback(error);
          }

          return callback(null, chunk);
        })
      },
      {
        stream: new ImageWriteStream(deviceFileDescriptor)
      }
    ], (error) => {
      if (error) {
        return reject(error);
      }

      return resolve({
        transferredBytes: transferredBytes,
        checksum: checksumStream.hex().toLowerCase()
      });
    });
  });
};

/**
 * @summary Infer writing strategy from options
 * @function
 * @public
 *
 * @description
 * This is a facade for the other `.using*()` functions
 * implemented on this file.
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.inferFromOptions(fd, { ... }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.inferFromOptions = (deviceFileDescriptor, options = {}) => {
  if (options.bmapContents) {
    return exports.usingBmap(deviceFileDescriptor, {
      imageStream: options.imageStream,
      imageSize: options.imageSize,
      bmapContents: options.bmapContents,
      bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning,
      progress: options.progress
    });
  }

  return exports.usingStreaming(deviceFileDescriptor, {
    imageStream: options.imageStream,
    imageSize: options.imageSize,
    transformStream: options.transformStream,
    chunkSize: options.chunkSize,
    minimumChunkSize: options.minimumChunkSize,
    driveSize: options.driveSize,
    progress: options.progress
  });
};
