/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// @flow
export type Listener<State> = State => void;
export type SetState<State> = (State | (State => State)) => void;
export type UseSharedSetState<State> = () => SetState<State>;
export type LazyStateRedux_NotAHook<State, Action> = (
  Dispatch<Action> | void
) => State;
export type LazyState_NotAHook<State> = LazyStateRedux_NotAHook<State, State>;
export type SelectorFn<State, SelectedState> = State => SelectedState;
export type EqualityFn<SelectedState> = (
  SelectedState,
  SelectedState
) => boolean;
export type ReducerFn<State, Action> = (State, Action) => State;
export type TimeVariationFn<State> = (Listener<State>) => Listener<State>;
export type Dispatch<Action> = Action => void;
export type InitialState<State> = State | LazyState_NotAHook<State>;
export type InitialStateRedux<State, Action> =
  | State
  | LazyStateRedux_NotAHook<State, Action>;
export type Hook<T> = () => T;
export type SharedHook<T> = () => T;
export type CommonHook = Function;
