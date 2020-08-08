/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
import {useRef} from 'react';

const useWatched = (fn: Function, args: Array = []): void => {
  const {current} = useRef({args: [], cleanup: null});
  if (
    args.length !== current.args.length ||
    args.some((val, i) => val !== current.args[i])
  ) {
    if (typeof current.cleanup === 'function') {
      current.cleanup(args);
    }
    current.cleanup = fn(current.args);
    current.args = args;
  }
};
export default useWatched;
