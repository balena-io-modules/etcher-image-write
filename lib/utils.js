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

const _ = require('lodash');

/**
 * @summary Safely pipe multiple streams
 * @function
 * @public
 *
 * @description
 * This function attaches error handlers to all streams
 * in the pipe, providing a central place to handle errors.
 *
 * @param {Object[]} streams - streams
 * @param {Function} callback - error handler (error)
 *
 * @example
 * utils.safePipe([
 *   {
 *     stream: mystream
 *   },
 *   {
 *     stream: mystream2,
 *     events: {
 *       myevent: () => {
 *         console.log('`myevent` was emitted');
 *       }
 *     }
 *   }
 * ], (error) => {
 *   console.error('An error happened!');
 *   console.error(error);
 * });
 */
exports.safePipe = (streams, callback) => {
  var current = null;

  _.each(streams, function(stream) {
    if (!current) {
      current = stream.stream;
      return;
    }

    stream.stream.on('error', callback);

    _.each(stream.events || {}, function(handler, event) {
      stream.stream.on(event, handler);
    });

    current = current.pipe(stream.stream);
  });
};
