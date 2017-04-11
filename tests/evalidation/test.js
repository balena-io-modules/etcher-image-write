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
const checksum = require('../../lib/checksum');

module.exports = [

  {
    name: 'should throw EVALIDATION is check fails',
    data: {
      input: path.join(__dirname, 'input'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      const outputFileDescriptor = fs.openSync(data.output, 'rs+');
      const stream = fs.createReadStream(data.input);

      const calculateDeviceChecksumStub = m.sinon.stub(checksum, 'calculateDeviceChecksum');
      calculateDeviceChecksumStub.returns(Bluebird.resolve('xxxxxxx'));

      return new Bluebird((resolve, reject) => {
        const imageSize = fs.statSync(data.input).size;

        const writer = imageWrite.write({
          fd: outputFileDescriptor,
          device: data.output,
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
      }).then(() => {
        throw new Error('Validation Passed');
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.code).to.equal('EVALIDATION');
      }).finally(() => {
        calculateDeviceChecksumStub.restore();
        return fs.closeAsync(outputFileDescriptor);
      });
    }
  }

];
