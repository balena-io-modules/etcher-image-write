/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const path = require('path');
const zlib = require('zlib');
const PassThroughStream = require('stream').PassThrough;
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const imageWrite = require('../lib/index');

const images = [
  path.join(__dirname, 'images', 'divisible-by-1024kb'),
  path.join(__dirname, 'images', 'divisible-by-512kb'),
  path.join(__dirname, 'images', 'divisible-by-128b'),
  path.join(__dirname, 'images', 'divisible-by-65536b'),
  path.join(__dirname, 'images', 'gzip'),
  path.join(__dirname, 'images', 'not-divisible-by-pow-2')
];

describe('E2E: Images', function() {

  images.forEach((dirname) => {
    it(path.basename(dirname), function() {

      const inputPath = path.join(dirname, 'input');
      const expectedPath = path.join(dirname, 'expected');
      const outputPath = path.join(dirname, 'output');
      const checksumPath = path.join(dirname, 'checksum');
      const transformPath = path.join(dirname, 'transform');
      const fd = fs.openSync(outputPath, 'rs+');

      const checksum = fs.readFileSync(checksumPath, {
        encoding: 'utf8'
      }).trim();

      const transform = fs.readFileSync(transformPath, {
        encoding: 'utf8'
      }).trim();

      const transforms = {
        gzip: zlib.createGunzip()
      };

      return new Bluebird((resolve, reject) => {
        const writer = imageWrite.write({
          fd: fd,
          device: outputPath,
          size: fs.statSync(outputPath).size
        }, {
          stream: fs.createReadStream(inputPath),
          size: fs.statSync(inputPath).size
        }, {
          check: true,
          transform: transforms[transform] || new PassThroughStream()
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).tap(() => {
        return fs.closeAsync(fd);
      }).then((results) => {
        const expected = fs.readFileAsync(expectedPath);
        const output = fs.readFileAsync(outputPath);
        m.chai.expect(results.sourceChecksum).to.equal(checksum);
        m.chai.expect(expected).to.deep.equal(output);
      });

    });
  });

});
