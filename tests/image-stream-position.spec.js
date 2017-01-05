/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const ImageStreamPosition = require('../lib/image-stream-position');

describe('ImageStreamPosition', function() {

  describe('.getStreamPosition()', function() {

    it('should default to zero', function() {
      const position = new ImageStreamPosition();
      m.chai.expect(position.getStreamPosition()).to.equal(0);
    });

  });

  describe('.setStreamPosition()', function() {

    it('should be able to update the stream position', function() {
      const position = new ImageStreamPosition();
      m.chai.expect(position.getStreamPosition()).to.equal(0);
      position.setStreamPosition(65536);
      m.chai.expect(position.getStreamPosition()).to.equal(65536);
    });

  });

  describe('.incrementStreamPosition()', function() {

    it('should be able to increment a pristine instance', function() {
      const position = new ImageStreamPosition();
      m.chai.expect(position.getStreamPosition()).to.equal(0);
      position.incrementStreamPosition(100);
      m.chai.expect(position.getStreamPosition()).to.equal(100);
    });

    it('should be able to increment a dirty instance', function() {
      const position = new ImageStreamPosition();
      position.setStreamPosition(100);
      position.incrementStreamPosition(28);
      m.chai.expect(position.getStreamPosition()).to.equal(128);
    });

  });

});
