'use strict';

const stream = require('stream');
const crypto = require('crypto');
const CRC32Stream = require('crc32-stream');

/**
 * @summary Get a hash stream
 * @function
 * @private
 * @example
 * var md5Stream = getHashStream('md5')
 *
 * @param {String} algorithm - either `crc32` or anything supported by `crypto.Hash`
 * @returns {Stream.Transform}
 */
const getHashStream = (algorithm) => {
  if (algorithm === 'crc32') {
    return new CRC32Stream();
  }
  return crypto.createHash(algorithm);
};

/**
 * @summary Create an instance of ChecksumStream
 * @name ChecksumStream
 * @class
 * @example
 * var checksum = new ChecksumStream({
 *   algorithms: [ 'crc32', 'md5' ]
 * })
 *
 * checksum.once('result', (result) => {
 *   // result: {
 *   //   crc32: 'EF28AF1C',
 *   //   md5: ''
 *   // }
 * })
 *
 * fs.createReadStream( 'os-image.img' )
 *   .pipe( checksum )
 *   .pipe( fs.createWriteStream( '/dev/rdisk2' ) )
 *   .once( 'finish', () => { ... })
 */
class ChecksumStream extends stream.Transform {

  /**
   * @summary Create an instance of ChecksumStream
   * @name ChecksumStream
   * @constructor
   * @param {Object} options - options
   * @param {String[]} options.algorithms - hash algorithms
   */
  constructor(options = {}) {
    super(options);
    this.results = {};
    this.algorithms = options.algorithms || [];
    this.hashes = this.algorithms.map(this.createHash, this);
  }

  /**
   * @summary Create & pipe to the Hash streams
   * @private
   * @param {String[]} algorithm - hash algorithm
   * @returns {Stream}
   */
  createHash(algorithm) {

    let hash = null;
    const self = this;

    try {
      hash = getHashStream(algorithm);
    } catch (error) {
      error.message += ' "' + algorithm + '"';
      throw error;
    }

    const check = () => {
      if (Object.keys(this.results).length === this.algorithms.length) {
        this.emit('result', Object.assign({}, this.results));
      }
    };

    hash.once('error', (error) => {
      return this.emit('error', error);
    });

    if (algorithm === 'crc32') {
      hash.once('end', function() {
        self.results[algorithm] = this.digest('hex');
        check();
      });
      hash.resume();
    } else {
      hash.once('readable', function() {
        self.results[algorithm] = this.read().toString('hex');
        check();
      });
    }

    return this.pipe(hash, {
      end: false
    });

  }

  /**
   * @summary Pass through chunks
   * @private
   * @param {Buffer} chunk - chunk
   * @param {String} _ - encoding
   * @param {Function} next - callback
   */
  _transform(chunk, _, next) {
    this.push(chunk);
    next();
  }

  /**
   * @summary Handle ending on flush
   * @private
   * @param {Function} done - callback
   */
  _flush(done) {

    if (!this.hashes.length) {
      this.emit('result', Object.assign({}, this.results));
      done();
      return;
    }

    this.hashes.forEach((hash) => {
      return hash.end();
    });

    this.once('result', () => {
      return done();
    });

  }

}

module.exports = ChecksumStream;
