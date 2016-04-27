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

var m = require('mochainon');
var path = require('path');
var zlib = require('zlib');
var wary = require('wary');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var imageWrite = require('../lib/write');

var RANDOM1 = path.join(__dirname, 'images', '1.random');
var RANDOM2 = path.join(__dirname, 'images', '2.random');
var RANDOM3 = path.join(__dirname, 'images', '3.random');
var RANDOM1_GZ = path.join(__dirname, 'images', '1.random.gz');

wary.it('write: should be able to burn data to a file', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(images.random1);
    var writer = imageWrite.write(images.random2, stream, {
      size: fs.statSync(images.random1).size
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(passed) {
    m.chai.expect(passed).to.be.true;

    return Promise.props({
      random1: fs.readFileAsync(images.random1),
      random2: fs.readFileAsync(images.random2)
    }).then(function(results) {
      m.chai.expect(results.random1).to.deep.equal(results.random2);
    });
  });
});

wary.it('write: should be rejected if the size is missing', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  var promise = new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(images.random1);
    var writer = imageWrite.write(images.random2, stream, {
      size: null
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  });

  m.chai.expect(promise).to.be.rejectedWith('Missing size option');
});

wary.it('check: should eventually be true on success', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(images.random1);
    var writer = imageWrite.write(images.random2, stream, {
      check: true,
      size: fs.statSync(images.random1).size
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(passed) {
    m.chai.expect(passed).to.be.true;
  });
});

wary.it('check: should eventually be false on failure', {
  random1: RANDOM1,
  random2: RANDOM2,
  random3: RANDOM3
}, function(images) {
  var stream = fs.createReadStream(images.random1);
  var stream2 = fs.createReadStream(images.random3);

  var createReadStreamStub = m.sinon.stub(fs, 'createReadStream');
  createReadStreamStub.returns(stream2);

  return new Promise(function(resolve, reject) {
    var writer = imageWrite.write(images.random2, stream, {
      check: false,
      size: fs.statSync(images.random1).size
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(passed) {
    m.chai.expect(passed).to.be.true;
    createReadStreamStub.restore();
  });
});

wary.it('transform: should be able to decompress an gz image', {
  input: RANDOM1_GZ,
  real: RANDOM1,
  output: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(images.input);
    var writer = imageWrite.write(images.output, stream, {
      check: true,
      size: fs.statSync(images.input).size,
      transform: zlib.createGunzip()
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(passed) {
    m.chai.expect(passed).to.be.true;

    return Promise.props({
      real: fs.readFileAsync(images.real),
      output: fs.readFileAsync(images.output)
    }).then(function(results) {
      m.chai.expect(results.real).to.deep.equal(results.output);
    });
  });
});

wary.run().catch(function(error) {
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
});
