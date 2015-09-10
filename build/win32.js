
/*
The MIT License

Copyright (c) 2015 Resin.io, Inc. https://resin.io.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
var Promise, diskpart, isWindows, os;

Promise = require('bluebird');

os = require('os');

isWindows = os.platform() === 'win32';

if (isWindows) {
  diskpart = Promise.promisifyAll(require('diskpart'));
}


/**
 * @summary Prepare Windows drives
 * @function
 * @protected
 *
 * @description
 * This function runs
 *
 * - diskpart `rescan` command.
 *
 * It will do nothing if not being run in Windows.
 *
 * @returns {Promise}
 *
 * @example
 * win32.prepare()
 */

exports.prepare = function() {
  return Promise["try"](function() {
    if (isWindows) {
      return diskpart.evaluateAsync(['rescan']);
    }
  });
};
