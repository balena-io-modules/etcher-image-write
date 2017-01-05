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

const m = require('mochainon');
const utils = require('../lib/utils');

describe('Utils', function() {

  describe('.padChunk()', function() {

    it('should pad a chunk with zeroes', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 20);
      m.chai.expect(result).to.deep.equal(Buffer.concat([
        buffer,
        Buffer.alloc(4, 0)
      ]));
    });

    it('should do nothing if the desired chunk size is smaller than the chunk', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 12);
      m.chai.expect(result).to.deep.equal(buffer);
    });

    it('should do nothing if the desired chunk size is equal to the chunk', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 16);
      m.chai.expect(result).to.deep.equal(buffer);
    });

  });

});
