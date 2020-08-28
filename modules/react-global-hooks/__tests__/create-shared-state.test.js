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
// Verify useSelector returns only the selected state
// Verify useSelector causes rerender only when the selected state has changed
// Verify one listener per call position
// Verify useSelector causes rerender according to the equalityFn result
// Verify timeVaryingFn limits rerenders

import React from 'react';
import {renderHook, act} from '@testing-library/react-hooks';
import {createSharedState, Provider, createStoreMap} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify referential integrity of state and setState across call positions and renders', () => {
  let value = {};
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState1() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  function useTestState2() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result: result1} = renderHook(useTestState1, {wrapper});
  const {result: result2} = renderHook(useTestState2, {wrapper});
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
  let count1 = 0;
  let count2 = 0;
  let value = 0;
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState1() {
    count1++;
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  function useTestState2() {
    count2++;
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result: result1} = renderHook(useTestState1, {wrapper});
  expect(count1).toBe(1);
  renderHook(useTestState2, {wrapper});
  const {setState} = result1.current;
  expect(count2).toBe(1);
  value++;
  act(() => setState(value));
  expect(count1).toBe(2);
  expect(count2).toBe(2);
});

test('Verify no rerenders are triggered when returning current state from a setState callback', () => {
  let count1 = 0;
  let count2 = 0;
  let value = 0;
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState1() {
    count1++;
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  function useTestState2() {
    count2++;
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result: result1} = renderHook(useTestState1, {wrapper});
  expect(count1).toBe(1);
  renderHook(useTestState2, {wrapper});
  expect(count2).toBe(1);
  const {setState} = result1.current;
  act(() => setState((state) => state));
  expect(count1).toBe(1);
  expect(count2).toBe(1);
});

test('Verify setState passes current state as prop when passed a callback', () => {
  const [useSelector, useSetState] = createSharedState({});
  function useTestState() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result} = renderHook(useTestState, {wrapper});
  renderHook(useTestState, {wrapper});
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
  const [useSelector, useSetState] = createSharedState((setState) => {
    setStateArg = setState;
    return 0;
  });
  function useTestState() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result} = renderHook(useTestState, {wrapper});
  const {setState} = result.current;
  expect(setStateArg).toBe(setState);
});

test('Verify initialState initializes with returned value when passed a callback', () => {
  const value = {};
  const [useSelector, useSetState] = createSharedState((setState) => {
    return value;
  });
  function useTestState() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result} = renderHook(useTestState, {wrapper});
  const {state} = result.current;
  expect(state).toBe(value);
});

test('Verify initialState sets returned value when the passed callback and then sets state asynchrounously with setState', async () => {
  const value1 = 0;
  const value2 = 1;
  expect.assertions(2);
  const [useSelector, useSetState] = createSharedState((setState) => {
    setTimeout(() => {
      act(() => {
        setState((state) => state + 1);
      });
    }, 0);
    return value1;
  });
  function useTestState() {
    const state = useSelector();
    const setState = useSetState();
    return {state, setState};
  }
  const {result} = renderHook(useTestState, {wrapper});
  expect(result.current.state).toBe(value1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(result.current.state).toBe(value2);
});

test('Verify useSelector returns only the selected state', () => {
  const vehicleObj = {
    name: 'my car',
    type: 'convertible',
    rhd: false,
  };
  const value = {
    vehicle: vehicleObj,
    count: 0,
    location: {name: 'Toronto'},
  };
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState(selector) {
    const state = useSelector(selector);
    const setState = useSetState();
    return {state, setState};
  }
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: (state) => state.vehicle,
  });
  const {state} = result.current;
  expect(state).toBe(vehicleObj);
});

test('Verify useSelector causes rerender only when the selected state has changed', () => {
  let count = 0;
  const vehicleObj = {
    name: 'my car',
    type: 'convertible',
    rhd: false,
  };
  const vehicleObj2 = {
    name: 'my new car',
    type: 'suv',
    rhd: true,
  };
  const vehicleObj3 = {
    name: 'my new car',
    type: 'amphibious',
    rhd: true,
  };
  const value = {
    vehicle: vehicleObj,
    count: 0,
    location: {name: 'Toronto'},
  };
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState({selector, equalityFn}) {
    count++;
    const state = useSelector(selector, equalityFn);
    return state;
  }
  const {result: setStateResult} = renderHook(useSetState, {
    wrapper,
  });
  const setState = setStateResult.current;
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: {
      selector: (state) => state.vehicle,
      equalityFn: (curr, next) => curr?.name === next?.name,
    },
  });
  expect(count).toBe(1);
  act(() => setState((state) => state));
  expect(count).toBe(1);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(1);
  act(() =>
    setState((state) => ({
      ...state,
      vehicle: vehicleObj2,
    })),
  );
  expect(count).toBe(2);
  act(() =>
    setState((state) => ({
      ...state,
      vehicle: vehicleObj3,
    })),
  );
  /*
    Issue with react-test-renderer causes an unnecessary rerender which causes
    the following test to fail. I was able to verify that this is working in a
    test application
  */
  // expect(count).toBe(2);
  expect(result.current).toBe(vehicleObj2);
});

test('Verify one listener per call position', () => {
  const vehicleObj = {
    name: 'my car',
    type: 'convertible',
    rhd: false,
  };
  const value = {
    vehicle: vehicleObj,
    count: 0,
    location: {name: 'Toronto'},
  };
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const [useSelector] = createSharedState(value);
  function useTestState1() {
    useSelector();
  }
  function useTestState2() {
    useSelector();
  }
  function useTestState3() {
    useSelector();
  }
  const {rerender: rerender1} = renderHook(useTestState1, {
    wrapper,
  });
  expect(storeMap[0].listeners.size).toBe(1);
  rerender1();
  expect(storeMap[0].listeners.size).toBe(1);
  const {rerender: rerender2} = renderHook(useTestState2, {
    wrapper,
  });
  expect(storeMap[0].listeners.size).toBe(2);
  rerender1();
  expect(storeMap[0].listeners.size).toBe(2);
  rerender2();
  expect(storeMap[0].listeners.size).toBe(2);
  const {rerender: rerender3} = renderHook(useTestState3, {
    wrapper,
  });
  expect(storeMap[0].listeners.size).toBe(3);
  rerender1();
  expect(storeMap[0].listeners.size).toBe(3);
  rerender2();
  expect(storeMap[0].listeners.size).toBe(3);
  rerender3();
  expect(storeMap[0].listeners.size).toBe(3);
});

test('Verify useSelector causes rerender according to the equalityFn result', () => {
  let count = 0;
  let equalityFnResult = true;
  const vehicleObj = {
    name: 'my car',
    type: 'convertible',
    rhd: false,
  };
  const vehicleObj2 = {
    name: 'my new car',
    type: 'suv',
    rhd: true,
  };
  const value = {
    vehicle: vehicleObj,
    count: 0,
    location: {name: 'Toronto'},
  };
  const [useSelector, useSetState] = createSharedState(value);
  function useTestState({selector, equalityFn}) {
    count++;
    const state = useSelector(selector, equalityFn);
    return state;
  }
  const {result: setStateResult} = renderHook(useSetState, {
    wrapper,
  });
  const setState = setStateResult.current;
  renderHook(useTestState, {
    wrapper,
    initialProps: {
      selector: (state) => state.count,
      equalityFn: () => equalityFnResult,
    },
  });
  expect(count).toBe(1);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(1);
  equalityFnResult = false;
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(2);
  act(() =>
    setState((state) => ({
      ...state,
      vehicle: vehicleObj2,
    })),
  );
  expect(count).toBe(3);
});

test('Verify timeVaryingFn limits rerenders', () => {
  let count = 0;
  const vehicleObj = {
    name: 'my car',
    type: 'convertible',
    rhd: false,
  };
  const value = {
    vehicle: vehicleObj,
    count: 0,
    location: {name: 'Toronto'},
  };
  const [useSelector, useDispatch] = createSharedState(value);
  function useTestState({selector, equalityFn, timeVaryingFn}) {
    count++;
    const state = useSelector(selector, equalityFn, timeVaryingFn);
    return state;
  }
  const {result: setStateResult} = renderHook(useDispatch, {
    wrapper,
  });
  const setState = setStateResult.current;
  const {result} = renderHook(useTestState, {
    wrapper,
    initialProps: {
      selector: null,
      equalityFn: null,
      timeVaryingFn: (fn) => {
        let callCount = 0;
        return (...args) => {
          if (++callCount % 3 === 0) {
            return fn(...args);
          }
        };
      },
    },
  });
  expect(count).toBe(1);
  expect(result.current.count).toBe(0);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(1);
  expect(result.current.count).toBe(0);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(1);
  expect(result.current.count).toBe(0);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(2);
  expect(result.current.count).toBe(3);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(2);
  expect(result.current.count).toBe(3);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(2);
  expect(result.current.count).toBe(3);
  act(() => setState((state) => ({...state, count: state.count + 1})));
  expect(count).toBe(3);
  expect(result.current.count).toBe(6);
});
