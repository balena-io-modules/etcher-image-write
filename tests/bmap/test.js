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
const fs = require('fs');
const Bluebird = require('bluebird');
const imageWrite = require('../../lib');

module.exports = [

  {
    name: 'should be able to write and check a bmap image',
    data: {
      input: path.join(__dirname, 'input'),
      bmap: path.join(__dirname, 'input.bmap'),
      output: path.join(__dirname, 'output')
    },
    case: (data) => {
      return new Bluebird((resolve, reject) => {
        const imageSize = fs.statSync(data.input).size;

        const writer = imageWrite.write({
          fd: fs.openSync(data.output, 'rs+'),
          device: data.output,
          size: imageSize
        }, {
          stream: fs.createReadStream(data.input),
          size: imageSize
        }, {
          check: true,
          bmap: fs.readFileSync(data.bmap, {
            encoding: 'utf8'
          })
        });

        writer.on('error', reject);
        writer.on('done', resolve);
      }).then((results) => {
        m.chai.expect(results.sourceChecksum).to.be.undefined;

        return Bluebird.props({
          input: fs.readFileAsync(data.input),
          output: fs.readFileAsync(data.output)
        }).then((files) => {
          m.chai.expect(files.input).to.not.deep.equal(files.output);
        });
      });
    }
  }

];
