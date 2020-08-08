/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
import {useStoreMap} from './provider';

export default function createCommonMemo(name = 'useCommonMemo'): Function {
  const symbol = Symbol(name);
  return function useCommonMemo<T>(fn: () => T, args: Array<any> = []): T {
    const storeMap = useStoreMap();
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      storeMap[symbol] = {value: undefined, watched: [...args]};
    }
    const container = storeMap[symbol];
    const {watched} = container;
    if (
      firstRun ||
      watched.length !== args.length ||
      watched.some((_, i) => !Object.is(watched[i], args[i]))
    ) {
      watched.splice(0, watched.length, ...args);
      container.value = fn();
    }
    return container.value;
  };
}
