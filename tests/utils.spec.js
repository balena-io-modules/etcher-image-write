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
const through2 = require('through2');
const stream = require('stream');
const mockStream = require('./mock-stream');
const utils = require('../lib/utils');

describe('Utils', function() {

  describe('.padChunk()', function() {

    it('should pad a chunk with zeroes', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 20);
      m.chai.expect(result).to.deep.equal(Buffer.concat([
        buffer,
        Buffer.alloc(4, 0)
      ]));
    });

    it('should do nothing if the desired chunk size is smaller than the chunk', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 12);
      m.chai.expect(result).to.deep.equal(buffer);
    });

    it('should do nothing if the desired chunk size is equal to the chunk', function() {
      const buffer = Buffer.alloc(16, 1);
      const result = utils.padChunk(buffer, 16);
      m.chai.expect(result).to.deep.equal(buffer);
    });

  });

  describe('.safePipe()', function() {

    it('should create a stream chain', function(done) {
      const collector = new mockStream.Writable();

      utils.safePipe([
        {
          stream: new mockStream.Readable([ 'foo', 'bar', 'baz' ])
        },
        {
          stream: through2.obj((chunk, encoding, callback) => {
            return callback(null, chunk.toUpperCase());
          })
        },
        {
          stream: collector
        }
      ], (error) => {
        if (error) {
          return done(error);
        }

        m.chai.expect(collector.data).to.deep.equal([
          'FOO',
          'BAR',
          'BAZ'
        ]);
        done();
      });
    });

    it('should catch an error from the first stream', function(done) {
      const input = new stream.Readable({
        read() {
          return;
        }
      });

      this.timeout(10000);

      setTimeout(() => {
        input.emit('error', new Error('Input error'));
      }, 1);

      utils.safePipe([
        {
          stream: input
        },
        {
          stream: through2.obj((chunk, encoding, callback) => {
            return callback(null, chunk.toUpperCase());
          })
        },
        {
          stream: new mockStream.Writable()
        }
      ], (error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('Input error');
        done();
      });
    });

    it('should be able to handle custom event handlers', function(done) {
      const input = new stream.Readable({
        objectMode: true,
        read() {
          input.emit('foo', 'FOO');
          input.emit('bar', 'BAR');
          this.push('foo');
          this.push(null);
          return;
        }
      });

      const transform = through2.obj((chunk, encoding, callback) => {
        transform.emit('baz', 'BAZ');
        return callback(null, chunk.toUpperCase());
      });

      const fooInputSpy = m.sinon.spy();
      const barInputSpy = m.sinon.spy();
      const bazTransformSpy = m.sinon.spy();
      const quxTransformSpy = m.sinon.spy();

      utils.safePipe([
        {
          stream: input,
          events: {
            foo: fooInputSpy,
            bar: barInputSpy
          }
        },
        {
          stream: transform,
          events: {
            baz: bazTransformSpy
          }
        },
        {
          stream: new mockStream.Writable()
        }
      ], (error) => {
        if (error) {
          return done(error);
        }

        m.chai.expect(fooInputSpy).to.have.been.calledOnce;
        m.chai.expect(barInputSpy).to.have.been.calledOnce;
        m.chai.expect(bazTransformSpy).to.have.been.calledOnce;
        m.chai.expect(quxTransformSpy).to.not.have.been.calledOnce;

        m.chai.expect(fooInputSpy).to.have.been.calledWith('FOO');
        m.chai.expect(barInputSpy).to.have.been.calledWith('BAR');
        m.chai.expect(bazTransformSpy).to.have.been.calledWith('BAZ');

        done();
      });
    });

  });

});
