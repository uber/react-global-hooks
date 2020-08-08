/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// @flow
import {useStoreMap} from './provider';

export default function createSharedRef<T>(
  arg: T,
  name: ?string = 'useSharedRef'
): Function {
  const symbol = Symbol(name);
  return function useSharedRef(): {current: T} {
    const storeMap = useStoreMap();
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      storeMap[symbol] = {current: arg};
    }
    return storeMap[symbol];
  };
}
