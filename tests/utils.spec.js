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
var utils = require('../lib/utils');

describe('Utils', function() {

  describe('.getRawDevice()', function() {

    it('should return the raw device given an OS X disk', function() {
      m.chai.expect(utils.getRawDevice('/dev/disk2')).to.equal('/dev/rdisk2');
    });

    it('should return the same device given a linux drive', function() {
      m.chai.expect(utils.getRawDevice('/dev/sda1')).to.equal('/dev/sda1');
    });

    it('should return the same device given a Windows physical drive', function() {
      m.chai.expect(utils.getRawDevice('\\\\.\\PHYSICALDRIVE1')).to.equal('\\\\.\\PHYSICALDRIVE1');
    });

  });

});

