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
const fs = require('fs');
const os = require('os');
const tmp = require('tmp');
const filesystem = require('../lib/filesystem');

describe('Filesystem', function() {

  // For some strange reasons, setTimeout gets extremely slow after X
  // calls on Electron only. This big timeout ensures that all timeouts
  // have time to complete correctly.
  this.timeout(40000);

  beforeEach(function() {
    this.fileDescriptor = tmp.fileSync().fd;
  });

  afterEach(function() {
    fs.closeSync(this.fileDescriptor);
  });

  describe('.writeChunk()', function() {

    describe('given fs.write throws "UNKNOWN: unknown error, write"', function() {

      beforeEach(function() {
        this.fsWriteStub = m.sinon.stub(fs, 'write');
        const error = new Error('UNKNOWN: unknown error, write');
        error.code = 'UNKNOWN';
        this.fsWriteStub.yields(error);
      });

      afterEach(function() {
        this.fsWriteStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an UNKNOWN error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('UNKNOWN');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an UNKNOWN error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('UNKNOWN');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

    });

    describe('given fs.write throws "ENXIO: no such device or address, write"', function() {

      beforeEach(function() {
        this.fsWriteStub = m.sinon.stub(fs, 'write');
        const error = new Error('ENXIO: no such device or address, write');
        error.code = 'ENXIO';
        this.fsWriteStub.yields(error);
      });

      afterEach(function() {
        this.fsWriteStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENXIO error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENXIO');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENXIO error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENXIO');
            done();
          });
        });

      });

    });

    describe('given fs.write throws "ENOENT: no such file or directory, write"', function() {

      beforeEach(function() {
        this.fsWriteStub = m.sinon.stub(fs, 'write');
        const error = new Error('ENOENT: no such file or directory, write');
        error.code = 'ENOENT';
        this.fsWriteStub.yields(error);
      });

      afterEach(function() {
        this.fsWriteStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENOENT error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENOENT');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENOENT error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENOENT');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

    });

    describe('given fs.write throws "EIO: i/o error, write"', function() {

      beforeEach(function() {
        this.fsWriteStub = m.sinon.stub(fs, 'write');
        const error = new Error('EIO: i/o error, write');
        error.code = 'EIO';
        this.fsWriteStub.yields(error);
      });

      afterEach(function() {
        this.fsWriteStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EIO error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EIO');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EIO error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EIO');
            done();
          });
        });

      });

    });

    describe('given fs.write throws "EBUSY: resource busy or locked, write"', function() {

      beforeEach(function() {
        this.fsWriteStub = m.sinon.stub(fs, 'write');
        const error = new Error('EBUSY: resource body or locked, write');
        error.code = 'EBUSY';
        this.fsWriteStub.yields(error);
      });

      afterEach(function() {
        this.fsWriteStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EBUSY error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EBUSY');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EBUSY error', function(done) {
          filesystem.writeChunk(this.fileDescriptor, Buffer.alloc(512, 1), 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EBUSY');
            done();
          });
        });

      });

    });

  });

  describe('.readChunk()', function() {

    describe('given fs.read throws "UNKNOWN: unknown error, read"', function() {

      beforeEach(function() {
        this.fsReadStub = m.sinon.stub(fs, 'read');
        const error = new Error('UNKNOWN: unknown error, read');
        error.code = 'UNKNOWN';
        this.fsReadStub.yields(error);
      });

      afterEach(function() {
        this.fsReadStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an UNKNOWN error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('UNKNOWN');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an UNKNOWN error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('UNKNOWN');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

    });

    describe('given fs.read throws "ENXIO: no such device or address, read"', function() {

      beforeEach(function() {
        this.fsReadStub = m.sinon.stub(fs, 'read');
        const error = new Error('ENXIO: no such device or address, read');
        error.code = 'ENXIO';
        this.fsReadStub.yields(error);
      });

      afterEach(function() {
        this.fsReadStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENXIO error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENXIO');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENXIO error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENXIO');
            done();
          });
        });

      });

    });

    describe('given fs.read throws "ENOENT: no such file or directory, read"', function() {

      beforeEach(function() {
        this.fsReadStub = m.sinon.stub(fs, 'read');
        const error = new Error('ENOENT: no such file or directory, read');
        error.code = 'ENOENT';
        this.fsReadStub.yields(error);
      });

      afterEach(function() {
        this.fsReadStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENOENT error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENOENT');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an ENOENT error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENOENT');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

    });

    describe('given fs.read throws "EIO: i/o error, read"', function() {

      beforeEach(function() {
        this.fsReadStub = m.sinon.stub(fs, 'read');
        const error = new Error('EIO: i/o error, read');
        error.code = 'EIO';
        this.fsReadStub.yields(error);
      });

      afterEach(function() {
        this.fsReadStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EIO error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EIO');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EIO error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EIO');
            done();
          });
        });

      });

    });

    describe('given fs.read throws "EBUSY: resource busy or locked, read"', function() {

      beforeEach(function() {
        this.fsReadStub = m.sinon.stub(fs, 'read');
        const error = new Error('EBUSY: resource busy or locked, read');
        error.code = 'EBUSY';
        this.fsReadStub.yields(error);
      });

      afterEach(function() {
        this.fsReadStub.restore();
      });

      describe('given the current os is darwin', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('darwin');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an unplugged error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EUNPLUGGED');
            done();
          });
        });

      });

      describe('given the current os is linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EBUSY error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EBUSY');
            done();
          });
        });

      });

      describe('given the current os is win32', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('win32');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should yield back an EBUSY error', function(done) {
          filesystem.readChunk(this.fileDescriptor, 512, 1024, (error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('EBUSY');
            done();
          });
        });

      });

    });

  });

});
