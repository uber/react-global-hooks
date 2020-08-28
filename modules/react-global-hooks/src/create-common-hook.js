/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

/* globals __RGH_DEVTOOLS__ */

import {useStoreMap} from './provider';
import type {Hook, SharedHook, CommonHook} from './types.flow';

export class Scope {
  callPositions: Array<CommonHook> = [];
  pointer: number = 0;
  name: ?string;
  constructor(name: ?string) {
    this.name = name;
  }
}

function createCommonHook<T>(
  fn: Hook<T>,
  name: ?string = fn.name || 'useCommonHook',
): SharedHook<T> {
  const symbol = Symbol(name);
  return (...args): T => {
    const storeMap = useStoreMap();
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      storeMap[symbol] = new Scope(name);
    }
    const scope = storeMap[symbol];
    const parentScope = storeMap.currentScope;
    storeMap.currentScope = scope;
    scope.pointer = 0;
    if (typeof __RGH_DEVTOOLS__ !== 'undefined') {
      __RGH_DEVTOOLS__.scopeStart({
        name,
        args,
        parentScope,
        currentScope: scope,
      });
    }
    const result = fn(...args);
    if (typeof __RGH_DEVTOOLS__ !== 'undefined') {
      __RGH_DEVTOOLS__.scopeEnd({
        name,
        args,
        result,
        parentScope,
        currentScope: scope,
      });
    }
    storeMap.currentScope = parentScope;
    return result;
  };
}
export default createCommonHook;
