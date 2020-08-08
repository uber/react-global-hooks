/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
import {useLayoutEffect} from 'react';
import {useStoreMap} from './provider';

export default function createCommonLayoutEffect(
  name = 'useCommonLayoutEffect'
): Function {
  const symbol = Symbol(name);
  return function useCommonLayoutEffect<T>(
    fn: () => T,
    args: Array<any> = []
  ): void {
    const storeMap = useStoreMap();
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      storeMap[symbol] = {value: undefined, watched: [...args], mounted: 0};
    }
    const container = storeMap[symbol];
    const {watched} = container;
    let firstMount = false;
    useLayoutEffect(() => {
      container.mounted++;
      firstMount = container.mounted === 1;
      return () => {
        container.mounted--;
        if (container.mounted === 0 && typeof container.value === 'function') {
          container.value();
          container.value = null;
        }
      };
    }, []);
    useLayoutEffect(() => {
      if (
        firstRun ||
        firstMount ||
        watched.length !== args.length ||
        watched.some((_, i) => !Object.is(watched[i], args[i]))
      ) {
        watched.splice(0, watched.length, ...args);
        if (typeof container.value === 'function') {
          // cleanup previous
          container.value();
        }
        container.value = fn();
      }
    }, [...args, container.mounted]);
  };
}
