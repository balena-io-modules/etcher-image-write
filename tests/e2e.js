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
var imageWrite = require('../lib/index');

var RANDOM1 = path.join(__dirname, 'images', '1.random');
var RANDOM2 = path.join(__dirname, 'images', '2.random');
var RANDOM3 = path.join(__dirname, 'images', '3.random');
var RANDOM1_GZ = path.join(__dirname, 'images', '1.random.gz');
var UNALIGNED = path.join(__dirname, 'images', 'unaligned.random');
var IMAGE_WITH_HOLES_IMG = path.join(__dirname, 'images', 'image-with-holes.raw');
var IMAGE_WITH_HOLES_BMAP = path.join(__dirname, 'images', 'image-with-holes.bmap');

wary.it('write: should be able to burn data to a file', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.random1).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize * 1.2
    }, {
      stream: fs.createReadStream(images.random1),
      size: imageSize
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(results) {
    m.chai.expect(results.sourceChecksum).to.equal('2f73fef');

    return Promise.props({
      random1: fs.readFileAsync(images.random1),
      random2: fs.readFileAsync(images.random2)
    }).then(function(results) {
      m.chai.expect(results.random1).to.deep.equal(results.random2);
    });
  });
});

wary.it('write: should be able to burn a bmap image to a file', {
  input: IMAGE_WITH_HOLES_IMG,
  bmap: IMAGE_WITH_HOLES_BMAP,
  output: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.input).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.output, 'rs+'),
      device: images.output,
      size: imageSize * 1.2
    }, {
      stream: fs.createReadStream(images.input),
      size: imageSize
    }, {
      bmap: fs.readFileSync(images.bmap, {
        encoding: 'utf8'
      })
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(results) {
    m.chai.expect(results.sourceChecksum).to.be.undefined;

    return Promise.props({
      input: fs.readFileAsync(images.input),
      output: fs.readFileAsync(images.output)
    }).then(function(results) {
      m.chai.expect(results.input).to.not.deep.equal(results.output);
    });
  });
});

wary.it('write: should be rejected if the image size is missing', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: fs.statSync(images.random2).size
    }, {
      stream: fs.createReadStream(images.random1),
      size: null
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.be.an.instanceof(Error);
    m.chai.expect(error.message).to.equal('Invalid image size: null');
  });
});

wary.it('write: should be rejected if the image size is not a number', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: fs.statSync(images.random2).size
    }, {
      stream: fs.createReadStream(images.random1),
      size: 'foo'
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.be.an.instanceof(Error);
    m.chai.expect(error.message).to.equal('Invalid image size: foo');
  });
});

wary.it('write: should be rejected if the drive size is missing', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: null
    }, {
      stream: fs.createReadStream(images.random1),
      size: fs.statSync(images.random1).size
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.be.an.instanceof(Error);
    m.chai.expect(error.message).to.equal('Invalid drive size: null');
  });
});

wary.it('write: should be rejected if the drive size is not a number', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: 'foo'
    }, {
      stream: fs.createReadStream(images.random1),
      size: fs.statSync(images.random1).size
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.be.an.instanceof(Error);
    m.chai.expect(error.message).to.equal('Invalid drive size: foo');
  });
});

wary.it('write: should be rejected if the drive is not large enough', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.random1).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize - 1
    }, {
      stream: fs.createReadStream(images.random1),
      size: imageSize
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.be.an.instanceof(Error);
    m.chai.expect(error.code).to.equal('ENOSPC');
    m.chai.expect(error.message).to.equal('Not enough space on the drive');
  });
});

wary.it('write: should not be rejected if the drive has the same capacity as the image size', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.random1).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize
    }, {
      stream: fs.createReadStream(images.random1),
      size: imageSize
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).catch(function(error) {
    m.chai.expect(error).to.not.exist;
  });
});

wary.it('check: should eventually be true on success', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.random1).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize * 1.2
    }, {
      stream: fs.createReadStream(images.random1),
      size: imageSize
    }, {
      check: true
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  });
});

wary.it('check: should eventually be true on success even if the image size is incorrect', {
  random1: RANDOM1,
  random2: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.random1).size * 0.8;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize * 2
    }, {
      stream: fs.createReadStream(images.random1),
      size: imageSize
    }, {
      check: true
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  });
});

wary.it('check: should correctly check an unaligned image', {
  input: UNALIGNED,
  output: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.input).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.output, 'rs+'),
      device: images.output,
      size: imageSize * 1.2
    }, {
      stream: fs.createReadStream(images.input),
      size: imageSize
    }, {
      check: true
    });

    writer.on('error', reject);
    writer.on('done', resolve);
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
    var imageSize = fs.statSync(images.random1).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.random2, 'rs+'),
      device: images.random2,
      size: imageSize * 1.2
    }, {
      stream: stream,
      size: imageSize
    }, {
      check: true
    });

    writer.on('error', reject);
    writer.on('done', resolve);

  // Ensure we don't get false positives if the `.catch()`
  // block is never called because validation passed.
  }).then(function() {
    throw new Error('Validation Passed');

  }).catch(function(error) {
    m.chai.expect(error.code).to.equal('EVALIDATION');
  }).finally(createReadStreamStub.restore);
});

wary.it('transform: should be able to decompress an gz image', {
  input: RANDOM1_GZ,
  real: RANDOM1,
  output: RANDOM2
}, function(images) {
  return new Promise(function(resolve, reject) {
    var imageSize = fs.statSync(images.input).size;

    var writer = imageWrite.write({
      fd: fs.openSync(images.output, 'rs+'),
      device: images.output,
      size: imageSize * 1.2
    }, {
      stream: fs.createReadStream(images.input),
      size: imageSize
    }, {
      check: true,
      transform: zlib.createGunzip()
    });

    writer.on('error', reject);
    writer.on('done', resolve);
  }).then(function(results) {
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
