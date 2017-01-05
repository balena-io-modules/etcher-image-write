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
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const imageWrite = require('../../lib');

module.exports = [

  {
    name: 'should be rejected if the image size is missing',
    data: {
      input: path.join(__dirname, 'input'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      const outputFileDescriptor = fs.openSync(data.output, 'rs+');

      return new Bluebird((resolve, reject) => {
        const writer = imageWrite.write({
          fd: outputFileDescriptor,
          device: data.output,
          size: fs.statSync(data.output).size
        }, {
          stream: fs.createReadStream(data.input),
          size: null
        }, {
          check: true
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('Invalid image size: null');
      }).finally(() => {
        return fs.closeAsync(outputFileDescriptor);
      });
    }
  },

  {
    name: 'should be rejected if the image size is not a number',
    data: {
      input: path.join(__dirname, 'input'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      const outputFileDescriptor = fs.openSync(data.output, 'rs+');

      return new Bluebird((resolve, reject) => {
        const writer = imageWrite.write({
          fd: outputFileDescriptor,
          device: data.output,
          size: fs.statSync(data.output).size
        }, {
          stream: fs.createReadStream(data.input),
          size: 'foo'
        }, {
          check: true
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('Invalid image size: foo');
      }).finally(() => {
        return fs.closeAsync(outputFileDescriptor);
      });
    }
  },

  {
    name: 'should be rejected if the drive size is missing',
    data: {
      input: path.join(__dirname, 'input'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      const outputFileDescriptor = fs.openSync(data.output, 'rs+');

      return new Bluebird((resolve, reject) => {
        const writer = imageWrite.write({
          fd: outputFileDescriptor,
          device: data.output,
          size: null
        }, {
          stream: fs.createReadStream(data.input),
          size: fs.statSync(data.input).size
        }, {
          check: true
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('Invalid drive size: null');
      }).finally(() => {
        return fs.closeAsync(outputFileDescriptor);
      });
    }
  },

  {
    name: 'should be rejected if the drive size is not a number',
    data: {
      input: path.join(__dirname, 'input'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      const outputFileDescriptor = fs.openSync(data.output, 'rs+');

      return new Bluebird((resolve, reject) => {
        const writer = imageWrite.write({
          fd: outputFileDescriptor,
          device: data.output,
          size: 'foo'
        }, {
          stream: fs.createReadStream(data.input),
          size: fs.statSync(data.input).size
        }, {
          check: true
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('Invalid drive size: foo');
      }).finally(() => {
        return fs.closeAsync(outputFileDescriptor);
      });
    }
  }

];
