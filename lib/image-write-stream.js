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

// This class is basically a re-implementation of the writable stream
// returned by `fs.createWriteStream()`, but with the following important
// difference: instead of writing linearly, this stream omits the first
// chunk, writes the rest, and comes back to the initial chunk once
// everything else was written.
//
// This is a workaround to avoid Windows throwing EPERM randomly in the
// middle of a write due to the operating system realizing that the drive
// contains a file system, given that Windows only permits writes to
// sectors that represent boot sectors, or sectors that reside outside a
// file system.
//
// See: https://msdn.microsoft.com/en-us/library/aa365747(VS.85).aspx

module.exports = class ImageWriteStream extends stream.Writable {

  /**
   * @summary Create an instance of ImageWriteStream
   * @name ImageWriteStream
   * @class
   * @public
   *
   * @param {Number} fileDescriptor - file descriptor
   *
   * @example
   * const fd = fs.openSync('/dev/rdisk2', 'rs+');
   *
   * fs.createReadStream('path/to/image.iso')
   *   .pipe(new ImageWriteStream(fd));
   */
  constructor(fileDescriptor) {
    super({
      write: (chunk, encoding, callback) => {
        const position = this.position.getStreamPosition();

        // Omit the first chunk. We're going to write it
        // after we complete all the remaining writes
        if (position === 0) {
          this.firstChunk = chunk;
          this.position.incrementStreamPosition(chunk.length);
          return callback();
        }

        filesystem.writeChunk(fileDescriptor, chunk, position, (error) => {
          if (error) {
            return callback(error);
          }

          this.position.incrementStreamPosition(chunk.length);
          return callback();
        });
      }
    });

    // Listeners should make sure to listen to the `done` event
    // instead of the typical `finish` event given we need to
    // intercept the latter to do some final computations.
    this.once('finish', () => {
      if (!this.firstChunk) {
        this.emit('done');
        return;
      }

      filesystem.writeChunk(fileDescriptor, this.firstChunk, 0, (error) => {
        if (error) {
          this.emit('error', error);
          return;
        }

        this.emit('done');
      });
    });

    this.position = new ImageStreamPosition();
  }

};
