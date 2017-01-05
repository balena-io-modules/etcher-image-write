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

const _ = require('lodash');

/**
 * @summary Safely pipe multiple streams
 * @function
 * @public
 *
 * @description
 * This function attaches error handlers to all streams
 * in the pipe, providing a central place to handle errors.
 *
 * @param {Object[]} streams - streams
 * @param {Function} callback - error handler (error)
 *
 * @example
 * utils.safePipe([
 *   {
 *     stream: mystream
 *   },
 *   {
 *     stream: mystream2,
 *     events: {
 *       myevent: () => {
 *         console.log('`myevent` was emitted');
 *       }
 *     }
 *   }
 * ], (error) => {
 *   console.error('An error happened!');
 *   console.error(error);
 * });
 */
exports.safePipe = (streams, callback) => {
  let current = null;

  // Make sure all event handlers are
  // attached before piping the streams.
  _.each(streams, (stream) => {
    stream.stream.on('error', callback);

    _.each(stream.events || {}, (handler, event) => {
      stream.stream.on(event, handler);
    });
  });

  _.last(streams).stream
    .on('done', callback)
    .on('finish', callback);

  _.each(streams, (stream) => {
    if (current) {
      current = current.pipe(stream.stream);
    } else {
      current = stream.stream;
    }
  });
};

/**
 * @summary Pad a buffer chunk
 * @function
 * @public
 *
 * @description
 * The buffer is padded with null bytes.
 *
 * @param {Buffer} chunk - chunk
 * @param {Number} desiredChunkSize - desired chunk size
 * @returns {Buffer} padded chunk
 *
 * @example
 * const buffer = Buffer.alloc(128, 1);
 * const paddedBuffer = utils.padChunk(buffer, 512);
 * console.log(paddedBuffer.length);
 * > 512
 */
exports.padChunk = (chunk, desiredChunkSize) => {
  if (desiredChunkSize < chunk.length) {
    return chunk;
  }

  return Buffer.concat([
    chunk,
    Buffer.alloc(desiredChunkSize - chunk.length, 0)
  ], desiredChunkSize);
};
