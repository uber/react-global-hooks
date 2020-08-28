/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify referential integrity of state and setState across call positions and renders
// Verify setState causes one rerender per call position
// Verify no rerenders are triggered when returning current state from a setState callback
// Verify setState passes current state as prop when passed a callback
// Verify initialState passes setState as prop when passed a callback
// Verify initialState initializes with returned value when passed a callback
// Verify initialState sets returned value when the passed callback and then sets state asynchrounously with setState

import React from 'react';
import {renderHook, act} from '@testing-library/react-hooks';
import {
  Provider,
  createStoreMap,
  createCommonHook,
  useCommonState,
} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify referential integrity of state and setState across call positions and renders', () => {
  let value = {};
  const useTestState = createCommonHook((value) => {
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result: result1} = renderHook(useTestState, {
    wrapper,
    initialProps: value,
  });
  const {result: result2} = renderHook(useTestState, {
    wrapper,
    initialProps: value,
  });
  const {setState} = result1.current;
  expect(result1.current.state).toBe(value);
  expect(result1.current.state).toBe(result2.current.state);
  expect(result1.current.setState).toBe(result2.current.setState);
  value = {};
  act(() => setState(value));
  expect(result1.current.state).toBe(value);
  expect(result1.current.state).toBe(result2.current.state);
  expect(result1.current.setState).toBe(setState);
  expect(result1.current.setState).toBe(result2.current.setState);
});

test('Verify setState causes one rerender per call position', () => {
  let count = 0;
  let value = 0;
  const useTestState = createCommonHook((value) => {
    count++;
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result: result1} = renderHook(useTestState, {
    wrapper,
    initialProps: value,
  });
  expect(count).toBe(1);
  renderHook(useTestState, {
    wrapper,
    initialProps: value,
  });
  const {setState} = result1.current;
  expect(count).toBe(2);
  value++;
  act(() => setState(value));
  expect(count).toBe(4);
});

test('Verify no rerenders are triggered when returning current state from a setState callback', () => {
  let count = 0;
  const useTestState = createCommonHook((value) => {
    count++;
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: {},
  });
  expect(count).toBe(1);
  renderHook(useTestState, {
    wrapper,
    initialProps: {},
  });
  expect(count).toBe(2);
  const {setState} = result.current;
  act(() => setState((state) => state));
  expect(count).toBe(2);
});

test('Verify setState passes current state as prop when passed a callback', () => {
  const useTestState = createCommonHook((value) => {
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: {},
  });
  renderHook(useTestState, {
    wrapper,
    initialProps: {},
  });
  const {state, setState} = result.current;
  let stateArg;
  act(() =>
    setState((state) => {
      stateArg = state;
      return state;
    }),
  );
  expect(stateArg).toBe(state);
});

test('Verify initialState passes setState as prop when passed a callback', () => {
  let setStateArg;
  const useTestState = createCommonHook((value) => {
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: (setState) => {
      setStateArg = setState;
      return 0;
    },
  });
  const {setState} = result.current;
  expect(setStateArg).toBe(setState);
});

test('Verify initialState initializes with returned value when passed a callback', () => {
  const value = {};
  const useTestState = createCommonHook((value) => {
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: () => value,
  });
  const {state} = result.current;
  expect(state).toBe(value);
});

test('Verify initialState sets returned value when the passed callback and then sets state asynchrounously with setState', async () => {
  const value1 = 0;
  const value2 = 1;
  expect.assertions(2);
  const useTestState = createCommonHook((value) => {
    const [state, setState] = useCommonState(value);
    return {state, setState};
  });
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: (setState) => {
      setTimeout(() => {
        act(() => {
          setState((state) => state + 1);
        });
      }, 0);
      return value1;
    },
  });
  expect(result.current.state).toBe(value1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(result.current.state).toBe(value2);
});
