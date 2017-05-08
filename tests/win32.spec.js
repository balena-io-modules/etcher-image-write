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
const os = require('os');
const childProcess = require('child_process');
const win32 = require('../lib/win32');

if (os.platform() === 'win32') {

  describe('Win32', function() {

    describe('.prepare()', function() {

      this.timeout(30000);

      describe('given the diskpart child process always fails', function() {

        beforeEach(function() {
          this.childProcessExecStub = m.sinon.stub(childProcess, 'exec');
          const error = new Error('diskpart failure');
          error.code = 'EPERM';
          this.childProcessExecStub.yields(error);
        });

        afterEach(function() {
          this.childProcessExecStub.restore();
        });

        it('should yield an informational error message', function() {
          return win32.prepare('\\\\.\\PHYSICALDRIVE2').catch((error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.message).to.equal('Couldn\'t clean the drive, diskpart failure (code EPERM)');
          });
        });

      });

    });

  });

}
