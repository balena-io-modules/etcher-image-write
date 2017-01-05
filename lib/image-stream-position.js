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

module.exports = class ImageStreamPosition {

  /**
   * @summary Get current stream position
   * @method
   * @public
   *
   * @returns {Number} position - current stream position
   *
   * @example
   * const position = new ImageStreamPosition();
   * console.log(position.getStreamPosition());
   */
  getStreamPosition() {
    return this.position || 0;
  }

  /**
   * @summary Set current stream position
   * @method
   * @public
   *
   * @param {Number} position - current read position
   *
   * @example
   * const fd = fs.openSync('/dev/rdisk2', 'rs+');
   * const position = new ImageStreamPosition(fd);
   * position.setStreamPosition(65536);
   */
  setStreamPosition(position) {
    this.position = position;
  }

  /**
   * @summary Increment current stream position
   * @method
   * @public
   *
   * @param {Number} offset - increment offset
   *
   * @example
   * const fd = fs.openSync('/dev/rdisk2', 'rs+');
   * const position = new ImageStreamPosition(fd);
   * position.incrementStreamPosition(512);
   */
  incrementStreamPosition(offset) {
    this.setStreamPosition(this.getStreamPosition() + offset);
  }

};
