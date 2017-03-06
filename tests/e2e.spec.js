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

const path = require('path');

const tests = [
  'bmap',
  'errors',
  'not-large-enough',
  'evalidation'
];

describe('E2E: Tests', () => {

  tests.forEach((name) => {

    context(name, function() {
      const cases = require(path.join(__dirname, name, 'test.js'));
      cases.forEach((test) => {
        it(test.name, function() {
          this.timeout(10e3);
          return test.case(test.data);
        });
      });
    });

  });

});
