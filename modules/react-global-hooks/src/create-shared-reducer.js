/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// @flow

/* globals __RGH_DEVTOOLS__ */

import {useEffect, useState, useCallback, useMemo} from 'react';
import useWatched from './use-watched';
import {useStoreMap} from './provider';
import type {
  SelectorFn,
  EqualityFn,
  ReducerFn,
  TimeVariationFn,
  Dispatch,
  InitialStateRedux,
} from './types.flow';
import Store from './store';

const defaultSelector = state => state;
function createSharedReducer<State, Action>(
  reducer: ?ReducerFn<State, Action>,
  initialState: InitialStateRedux<State, Action>,
  name: ?string = 'useSharedReducer'
) {
  const symbol = Symbol(name);
  function useStore() {
    const storeMap = useStoreMap();
    // $FlowFixMe: flow does not handle symbols as object keys
    const firstRun = !(symbol in storeMap);
    if (firstRun) {
      // $FlowFixMe: flow does not handle symbols as object keys
      storeMap[symbol] = storeMap.index++;
    }
    // $FlowFixMe: flow does not handle symbols as object keys
    const storeKey = storeMap[symbol];
    if (!(storeMap[storeKey] instanceof Store)) {
      const state =
        storeKey in storeMap ? storeMap[storeKey] /* hydrate */ : initialState;
      storeMap[storeKey] = new Store<State, Action>(reducer, state, name);
    }
    return storeMap[storeKey];
  }
  return [
    function useSelector<SelectedState = State>(
      selector?: ?SelectorFn<State, SelectedState>,
      equalityFn?: ?EqualityFn<SelectedState | State>,
      timeVariationFn?: TimeVariationFn<State>
    ): SelectedState {
      // $FlowFixMe
      selector = typeof selector === 'function' ? selector : defaultSelector;
      equalityFn = typeof equalityFn === 'function' ? equalityFn : Object.is;
      const {state, listeners} = useStore();
      const [selectedState, setState] = useState(() => ({
        // $FlowFixMe
        current: selector(state),
      }));
      const listener = useCallback(
        state => {
          setState(curr => {
            const {current} = curr;
            const next = selector(state);
            if (!equalityFn(current, next)) {
              if (
                typeof __RGH_DEVTOOLS__ !== 'undefined' &&
                !Object.is(current, next)
              ) {
                __RGH_DEVTOOLS__.componentEffectedUpdate({
                  name,
                  state: next,
                  previousState: current,
                });
              }
              return {current: next};
            } else {
              return curr;
            }
          });
        },
        [selector, equalityFn]
      );
      const listenerTv = useMemo(
        () =>
          typeof timeVariationFn === 'function'
            ? timeVariationFn(listener)
            : listener,
        [listener, timeVariationFn]
      );
      // syncronous registration/unregistration when listener changes
      useWatched(() => {
        listeners.add(listenerTv);
        return () => {
          listeners.delete(listenerTv);
        };
      }, [listeners, listenerTv]);
      // unregister when component unmounts
      useEffect(
        () => () => {
          listeners.delete(listenerTv);
        },
        [listeners, listenerTv]
      );
      return selectedState.current;
    },
    function useDispatch(): Dispatch<Action> {
      const {dispatch} = useStore();
      return dispatch;
    },
  ];
}
export default createSharedReducer;
