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
const _ = require('lodash');

/**
 * @summary Create a mock read stream
 * @class
 * @public
 */
exports.Readable = class MockReadStream extends stream.Readable {

  /**
   * @summary Create a mock read stream
   * @public
   *
   * @param {Array} data - data
   *
   * @example
   * const stream = new mockStream.Readable([ 1, 2, 3 ]);
   */
  constructor(data) {
    super({
      objectMode: true,
      read: () => {
        _.each(data, (item) => {
          this.push(item);
        });

        this.push(null);
      }
    });
  }

};

/**
 * @summary Create a collector mock writable stream
 * @class
 * @public
 */
exports.Writable = class CollectorWriteStream extends stream.Writable {

  /**
   * @summary Create a collector mock writable stream
   * @public
   *
   * @example
   * const stream = new mockStream.Writable();
   *
   * stream.on('finish', () => {
   *   console.log(stream.data);
   * });
   */
  constructor() {
    super({
      objectMode: true,
      write: (chunk, encoding, callback) => {
        this.data = this.data || [];
        this.data.push(chunk);
        return callback();
      }
    });
  }

};
