/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
/* Subscribe pattern inspired by andregardi/use-global-hook */
/* globals __RGH_DEVTOOLS__ */

import type {
  Dispatch,
  SetState,
  ReducerFn,
  InitialState,
  LazyState_NotAHook,
  Listener,
} from './types.flow';

class Store<State, Action = void> {
  listeners: Set<Listener<State>> = new Set();
  reducer: ?ReducerFn<State, Action>;
  state: State;
  name: ?string;
  constructor(
    reducer: ?ReducerFn<State, Action>,
    initialState: InitialState<State> | LazyState_NotAHook<State>,
    name: ?string
  ) {
    this.reducer = reducer;
    this.state =
      typeof initialState === 'function'
        ? initialState(this.dispatch)
        : initialState;
    this.name = name;
  }
  dispatch: Dispatch<Action> | SetState<State> = action => {
    if (typeof __RGH_DEVTOOLS__ !== 'undefined') {
      __RGH_DEVTOOLS__.componentCausedUpdate({
        name: this.name,
        action,
      });
    }
    this.state =
      typeof this.reducer === 'function'
        ? this.reducer(this.state, action)
        : typeof action === 'function'
        ? /* $FlowFixMe: dispatch falls back to setState if a reducer is not provided */
          action(this.state)
        : action;
    this.listeners.forEach(listener => {
      listener(this.state);
    });
  };
}
export default Store;
