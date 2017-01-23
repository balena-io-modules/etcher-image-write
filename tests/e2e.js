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
const imageWrite = require('../lib/index');

const runImageTest = (directory) => {
  const input = path.join(directory, 'input');
  const expected = path.join(directory, 'expected');
  const output = path.join(directory, 'output');

  const checksum = require(path.join(directory, 'checksum.json'));

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
    const outputFileDescriptor = fs.openSync(data.output, 'rs+');
    return new Bluebird((resolve, reject) => {
      const writer = imageWrite.write({
        fd: outputFileDescriptor,
        device: data.output,
        size: fs.statSync(data.output).size
      }, {
        stream: fs.createReadStream(data.input),
        size: fs.statSync(data.input).size
      }, {
        check: true,
        transform: transforms[transform] || new PassThroughStream(),
        checksumAlgorithms: [ 'crc32', 'md5', 'sha1' ]
      });

      writer.on('error', reject);
      writer.on('done', resolve);
    }).tap(() => {
      return fs.closeAsync(outputFileDescriptor);
    }).then((results) => {
      m.chai.expect(results.sourceChecksum).to.deep.equal(checksum);

      return Bluebird.props({
        expected: fs.readFileAsync(expected),
        output: fs.readFileAsync(data.output)
      }).then((files) => {
        m.chai.expect(files.expected).to.deep.equal(files.output);
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
