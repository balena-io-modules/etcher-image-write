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

const stream = require('stream');
const filesystem = require('./filesystem');
const ImageStreamPosition = require('./image-stream-position');

module.exports = class ImageWriteStream extends stream.Readable {

  /**
   * @summary Create an instance of ImageReadStream
   * @name ImageReadStream
   * @class
   * @public
   *
   * @param {Number} fileDescriptor - file descriptor
   * @param {Object} options - options
   * @param {Number} options.chunkSize - chunk size
   *
   * @example
   * const fd = fs.openSync('/dev/rdisk2', 'rs+');
   *
   * const stream = new ImageReadStream(fd, {
   *   chunkSize: 65536 * 16
   * });
   *
   * stream.pipe(fs.createWriteStream('path/to/output/img'))
   *   .pipe(new ImageWriteStream(fd));
   */
  constructor(fileDescriptor, options) {
    const position = new ImageStreamPosition();

    super({
      highWaterMark: options.chunkSize,
      objectMode: false,
      read: (size) => {
        const streamPosition = position.getStreamPosition();

        filesystem.readChunk(this.fileDescriptor, size, streamPosition, (error, buffer) => {
          if (error) {
            return this.emit('error', error);
          }

          if (buffer) {
            position.incrementStreamPosition(buffer.length);
          }

          this.push(buffer);
        });
      }
    });

    this.fileDescriptor = fileDescriptor;
  }

};
