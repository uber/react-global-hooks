/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
import createSharedState from './create-shared-state';
import {useStoreMap} from './provider';
import type {InitialState} from './types.flow';

export default function createCommonState(name = 'useCommonState'): Function {
  const symbol = Symbol(name);
  return function useCommonState<State>(value: InitialState<State>) {
    const storeMap = useStoreMap();
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      storeMap[symbol] = createSharedState<State>(value, name);
    }
    const [useState, useDispatch] = storeMap[symbol];
    return [useState(), useDispatch()];
  };
}
