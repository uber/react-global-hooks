/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify common hooks are created only on first run
// Verify symbol registration for common hooks
// Verify the call order for common hooks of the same scope is preserved
// Verify the call orders for common hooks of multiple scopes are preserved
// Verify the call orders for common hooks of nested scopes are preserved
// Verify the currentScope of nested scopes is respected
// Verify the call positions do not collide

// Verify the commonality of common hooks for a scope across rerenders
// Verify the commonality of common hooks for nested scopes

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {
  Provider,
  createStoreMap,
  createCommonHook,
  useCommonCallback,
  useCommonLayoutEffect,
  useCommonEffect,
  useCommonMemo,
  useCommonRef,
  useCommonState,
} from '../src';
import Store from '../src/store';

function getSymbolName(symbol) {
  return String(symbol).replace(/^Symbol\(|\)$/g, '');
}
function getValueBySymbolName(name, obj) {
  const symbolKey = Object.getOwnPropertySymbols(obj).find(
    (symbol) => getSymbolName(symbol) === name,
  );
  return obj[symbolKey] || null;
}

test('Verify common hooks are created only on first run', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  let value = 0;
  const useCommonHookTest = createCommonHook((value) => {
    return useCommonRef(value);
  });
  const {result, rerender} = renderHook(useCommonHookTest, {
    wrapper,
    initialProps: value,
  });
  expect(result.current.current).toBe(0);
  rerender({initialProps: ++value});
  expect(result.current.current).toBe(0);
});

test('Verify symbol registration for common hooks', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest = createCommonHook(() => {
    useCommonCallback(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonLayoutEffect(() => {}, []);
    useCommonMemo(() => {}, []);
    useCommonRef();
    useCommonState(null);
  });
  const {rerender} = renderHook(useCommonHookTest, {
    wrapper,
  });
  expect(storeMap.length).toBe(1);
  expect(storeMap[0] instanceof Store).toBe(true);
  expect(Object.getOwnPropertySymbols(storeMap).length).toBe(8);
  expect(
    Object.getOwnPropertySymbols(storeMap)
      .map((symbol) => getSymbolName(symbol))
      .every((description) =>
        [
          'useCommonHook',
          'useCommonCallback',
          'useCommonEffect',
          'useCommonLayoutEffect',
          'useCommonMemo',
          'useCommonRef',
          'useCommonState',
          'useSharedState',
        ].includes(description),
      ),
  ).toBe(true);
  rerender();
  expect(storeMap.length).toBe(1);
  expect(storeMap[0] instanceof Store).toBe(true);
  expect(Object.getOwnPropertySymbols(storeMap).length).toBe(8);
  expect(
    Object.getOwnPropertySymbols(storeMap)
      .map((symbol) => getSymbolName(symbol))
      .every((description) =>
        [
          'useCommonHook',
          'useCommonCallback',
          'useCommonEffect',
          'useCommonLayoutEffect',
          'useCommonMemo',
          'useCommonRef',
          'useCommonState',
          'useSharedState',
        ].includes(description),
      ),
  ).toBe(true);
});

test('Verify the call order for common hooks of the same scope is preserved', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest = createCommonHook(() => {
    useCommonCallback(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonLayoutEffect(() => {}, []);
    useCommonMemo(() => {}, []);
    useCommonRef();
    useCommonState(null);
  });
  const callOrder = [
    'useCommonCallback',
    'useCommonEffect',
    'useCommonLayoutEffect',
    'useCommonMemo',
    'useCommonRef',
    'useCommonState',
  ];
  const {rerender} = renderHook(useCommonHookTest, {
    wrapper,
  });
  const {callPositions} = getValueBySymbolName('useCommonHook', storeMap);
  expect(callPositions.length).toBe(6);
  expect(callPositions.every((fn, index) => fn.name === callOrder[index])).toBe(
    true,
  );
  rerender();
  expect(callPositions.length).toBe(6);
  expect(callPositions.every((fn, index) => fn.name === callOrder[index])).toBe(
    true,
  );
});

test('Verify the call orders for common hooks of multiple scopes are preserved', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest1 = createCommonHook(function useCommonHookTest1() {
    useCommonCallback(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonLayoutEffect(() => {}, []);
    useCommonMemo(() => {}, []);
    useCommonRef();
    useCommonState(null);
  });
  const callOrder1 = [
    'useCommonCallback',
    'useCommonEffect',
    'useCommonLayoutEffect',
    'useCommonMemo',
    'useCommonRef',
    'useCommonState',
  ];
  const useCommonHookTest2 = createCommonHook(function useCommonHookTest2() {
    useCommonState(null);
    useCommonRef();
    useCommonMemo(() => {}, []);
    useCommonLayoutEffect(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonCallback(() => {}, []);
  });
  const callOrder2 = [...callOrder1].reverse();
  const {rerender: rerender1} = renderHook(useCommonHookTest1, {
    wrapper,
  });
  const {rerender: rerender2} = renderHook(useCommonHookTest2, {
    wrapper,
  });

  const scope1 = getValueBySymbolName('useCommonHookTest1', storeMap);
  const scope2 = getValueBySymbolName('useCommonHookTest2', storeMap);
  const {callPositions: callPositions1} = scope1;
  const {callPositions: callPositions2} = scope2;
  function validate() {
    expect(callPositions1.length).toBe(callOrder1.length);
    expect(
      callPositions1.every((fn, index) => fn.name === callOrder1[index]),
    ).toBe(true);
    expect(callPositions2.length).toBe(callOrder2.length);
    expect(
      callPositions2.every((fn, index) => fn.name === callOrder2[index]),
    ).toBe(true);
  }
  validate();
  rerender1();
  validate();
  rerender2();
  validate();
});

test('Verify the call orders for common hooks of nested scopes are preserved', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest1 = createCommonHook(function useCommonHookTest1() {
    useCommonCallback(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonLayoutEffect(() => {}, []);
    useCommonMemo(() => {}, []);
    useCommonRef();
    useCommonState(null);
  });
  const callOrder1 = [
    'useCommonCallback',
    'useCommonEffect',
    'useCommonLayoutEffect',
    'useCommonMemo',
    'useCommonRef',
    'useCommonState',
  ];
  const useCommonHookTest2 = createCommonHook(function useCommonHookTest2() {
    useCommonState(null);
    useCommonRef();
    useCommonMemo(() => {}, []);
    useCommonHookTest1();
    useCommonLayoutEffect(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonCallback(() => {}, []);
  });
  const callOrder2 = [
    'useCommonState',
    'useCommonRef',
    'useCommonMemo',
    'useCommonLayoutEffect',
    'useCommonEffect',
    'useCommonCallback',
  ];
  const useCommonHookTest3 = createCommonHook(function useCommonHookTest3() {
    useCommonState(null);
    useCommonRef();
    useCommonHookTest1();
    useCommonHookTest2();
    useCommonMemo(() => {}, []);
    useCommonHookTest1();
    useCommonLayoutEffect(() => {}, []);
    useCommonEffect(() => {}, []);
    useCommonCallback(() => {}, []);
  });
  const callOrder3 = [
    'useCommonState',
    'useCommonRef',
    'useCommonMemo',
    'useCommonLayoutEffect',
    'useCommonEffect',
    'useCommonCallback',
  ];

  const {rerender: rerender1} = renderHook(useCommonHookTest1, {
    wrapper,
  });
  const {rerender: rerender2} = renderHook(useCommonHookTest2, {
    wrapper,
  });
  const {rerender: rerender3} = renderHook(useCommonHookTest3, {
    wrapper,
  });

  const scope1 = getValueBySymbolName('useCommonHookTest1', storeMap);
  const scope2 = getValueBySymbolName('useCommonHookTest2', storeMap);
  const scope3 = getValueBySymbolName('useCommonHookTest3', storeMap);
  const {callPositions: callPositions1} = scope1;
  const {callPositions: callPositions2} = scope2;
  const {callPositions: callPositions3} = scope3;

  function validate() {
    expect(callPositions1.length).toBe(callOrder1.length);
    expect(
      callPositions1.every((fn, index) => fn.name === callOrder1[index]),
    ).toBe(true);

    expect(callPositions2.length).toBe(callOrder2.length);
    expect(
      callPositions2.every((fn, index) => fn.name === callOrder2[index]),
    ).toBe(true);

    expect(callPositions3.length).toBe(callOrder3.length);
    expect(
      callPositions3.every((fn, index) => fn.name === callOrder3[index]),
    ).toBe(true);
  }
  validate();
  rerender1();
  validate();
  rerender2();
  validate();
  rerender3();
  validate();
});

test('Verify the currentScope of nested scopes is respected', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest1 = createCommonHook(function useCommonHookTest1() {
    const scope1 = getValueBySymbolName('useCommonHookTest1', storeMap);
    expect(storeMap.currentScope).toBe(scope1);
  });
  const useCommonHookTest2 = createCommonHook(function useCommonHookTest2() {
    const scope2 = getValueBySymbolName('useCommonHookTest2', storeMap);
    expect(storeMap.currentScope).toBe(scope2);
    useCommonHookTest1();
    expect(storeMap.currentScope).toBe(scope2);
  });
  const useCommonHookTest3 = createCommonHook(function useCommonHookTest3() {
    const scope3 = getValueBySymbolName('useCommonHookTest3', storeMap);
    expect(storeMap.currentScope).toBe(scope3);
    useCommonHookTest1();
    expect(storeMap.currentScope).toBe(scope3);
    useCommonHookTest2();
    expect(storeMap.currentScope).toBe(scope3);
    useCommonHookTest1();
    expect(storeMap.currentScope).toBe(scope3);
  });
  const {rerender: rerender1} = renderHook(useCommonHookTest1, {
    wrapper,
  });
  const {rerender: rerender2} = renderHook(useCommonHookTest2, {
    wrapper,
  });
  const {rerender: rerender3} = renderHook(useCommonHookTest3, {
    wrapper,
  });
  expect(storeMap.currentScope).toBe(null);
  rerender1();
  expect(storeMap.currentScope).toBe(null);
  rerender2();
  expect(storeMap.currentScope).toBe(null);
  rerender3();
  expect(storeMap.currentScope).toBe(null);
});

test('Verify the call positions do not collide', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest1 = createCommonHook(function useCommonHookTest1() {
    return [useCommonRef(), useCommonRef(), useCommonRef(), useCommonRef()];
  });
  const useCommonHookTest2 = createCommonHook(function useCommonHookTest2() {
    return [useCommonRef(), ...useCommonHookTest1()];
  });
  const useCommonHookTest3 = createCommonHook(function useCommonHookTest3() {
    return [useCommonRef(), ...useCommonHookTest2()];
  });
  const {result: result1} = renderHook(useCommonHookTest1, {
    wrapper,
  });
  const {result: result2} = renderHook(useCommonHookTest2, {
    wrapper,
  });
  const {result: result3} = renderHook(useCommonHookTest3, {
    wrapper,
  });

  expect(new Set(result1.current).size).toBe(result1.current.length);
  expect(new Set(result2.current).size).toBe(result2.current.length);
  expect(new Set(result3.current).size).toBe(result3.current.length);
});

test('Verify the commonality of common hooks for a scope across rerenders', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest = createCommonHook(function useCommonHookTest() {
    return [useCommonRef(), useCommonRef(), useCommonRef(), useCommonRef()];
  });
  const {result, rerender} = renderHook(useCommonHookTest, {
    wrapper,
  });

  const refs = new Set(result.current);
  rerender();
  expect(result.current.every((ref) => refs.has(ref))).toBe(true);
  rerender();
  expect(result.current.every((ref) => refs.has(ref))).toBe(true);
});

test('Verify the commonality of common hooks for nested scopes', () => {
  const storeMap = createStoreMap();
  const wrapper = ({children}) => (
    <Provider value={storeMap}>{children}</Provider>
  );
  const useCommonHookTest1 = createCommonHook(function useCommonHookTest1() {
    return [useCommonRef(), useCommonRef(), useCommonRef(), useCommonRef()];
  });
  const useCommonHookTest2 = createCommonHook(function useCommonHookTest2() {
    return useCommonHookTest1();
  });
  const {result: result1, rerender: rerender1} = renderHook(
    useCommonHookTest1,
    {
      wrapper,
    },
  );
  const {result: result2, rerender: rerender2} = renderHook(
    useCommonHookTest2,
    {
      wrapper,
    },
  );

  const refs = new Set(result1.current);
  expect(result1.current.every((ref) => refs.has(ref))).toBe(true);
  expect(result2.current.every((ref) => refs.has(ref))).toBe(true);
  rerender1();
  expect(result1.current.every((ref) => refs.has(ref))).toBe(true);
  expect(result2.current.every((ref) => refs.has(ref))).toBe(true);
  rerender2();
  expect(result1.current.every((ref) => refs.has(ref))).toBe(true);
  expect(result2.current.every((ref) => refs.has(ref))).toBe(true);
});
