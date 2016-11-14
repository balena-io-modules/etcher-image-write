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
const wary = require('wary');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const sliceStream = require('slice-stream2');
const imageWrite = require('../lib/index');

const RANDOM1 = path.join(__dirname, 'images', '1.random');
const RANDOM2 = path.join(__dirname, 'images', '2.random');
const RANDOM3 = path.join(__dirname, 'images', '3.random');

const runImageTest = (directory) => {
  const input = path.join(directory, 'input');
  const expected = path.join(directory, 'expected');
  const output = path.join(directory, 'output');

  const checksum = fs.readFileSync(path.join(directory, 'checksum'), {
    encoding: 'utf8'
  }).trim();

  const transform = fs.readFileSync(path.join(directory, 'transform'), {
    encoding: 'utf8'
  }).trim();

  const transforms = {
    gzip: zlib.createGunzip()
  };

  wary.it(`RUNNING IMAGE TEST: ${path.basename(directory)}`, {
    input,
    output
  }, (data) => {
    return new Bluebird((resolve, reject) => {
      const imageSize = fs.statSync(input).size;

      const writer = imageWrite.write({
        fd: fs.openSync(output, 'rs+'),
        device: output,
        size: fs.statSync(output).size
      }, {
        stream: fs.createReadStream(input),
        size: fs.statSync(input).size
      }, {
        check: true,
        transform: transforms[transform] || new PassThroughStream()
      });

      writer.on('error', reject);
      writer.on('done', resolve);
    }).then((results) => {
      m.chai.expect(results.sourceChecksum).to.equal(checksum);

      return Bluebird.props({
        expected: fs.readFileAsync(expected),
        output: fs.readFileAsync(output)
      }).then((results) => {
        m.chai.expect(results.expected).to.deep.equal(results.output);
      });
    });

  });
};

const runTest = (name) => {
  require(path.join(__dirname, name, 'test')).forEach((test) => {
    wary.it(`RUNNING SUITE (${name}): ${test.name}`, test.data, test.case);
  });
};

runImageTest(path.join(__dirname, 'images', 'divisible-by-1024kb'));
runImageTest(path.join(__dirname, 'images', 'divisible-by-512kb'));
runImageTest(path.join(__dirname, 'images', 'divisible-by-128b'));
runImageTest(path.join(__dirname, 'images', 'divisible-by-65536b'));
runImageTest(path.join(__dirname, 'images', 'gzip'));

runTest('bmap');
runTest('errors');
runTest('not-large-enough');
runTest('evalidation');

wary.run().catch((error) => {
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
});
