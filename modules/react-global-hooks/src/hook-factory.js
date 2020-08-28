/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

/* globals __RGH_DEVTOOLS__ */

import {useStoreMap} from './provider';

const hookFactory = (createHook) => (...args) => {
  const storeMap = useStoreMap();
  const {currentScope} = storeMap;
  if (!currentScope) {
    throw new Error(
      `Scope not found for ${createHook.name}. Check that the enclosing hook is wrapped by createCommonHook.`,
    );
  }
  const {callPositions} = currentScope;
  const callIndex = currentScope.pointer++;
  if (!(callIndex in callPositions)) {
    callPositions[callIndex] = createHook();
  }
  const result = callPositions[callIndex](...args);
  if (typeof __RGH_DEVTOOLS__ !== 'undefined') {
    __RGH_DEVTOOLS__.commonHookCalled({name, args, result, currentScope});
  }
  return result;
};
export default hookFactory;
