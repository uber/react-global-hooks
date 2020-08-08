/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify useCommonRef returns proper stucture when no arguments are passed
// Verify referential integrity of ref across call positions
// Verify args passed to useCommonRef are included in the return value

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {Provider, createStoreMap, createCommonHook, useCommonRef} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify useCommonRef returns proper stucture when no arguments are passed', () => {
  const useRefTest = createCommonHook(value => {
    return useCommonRef(value);
  });
  const {result} = renderHook(useRefTest, {wrapper});
  expect(typeof result.current).toBe('object');
  expect(result.current.constructor.name).toBe('Object');
  expect(Object.keys(result.current).length).toBe(1);
  expect('current' in result.current).toBe(true);
  expect(result.current.curent).toBe(undefined);
});

test('Verify referential integrity of ref across call positions', () => {
  const useRefTest = createCommonHook(value => {
    return useCommonRef(value);
  });
  const {result: result1, rerender: rerender1} = renderHook(useRefTest, {
    wrapper,
  });
  const {result: result2, rerender: rerender2} = renderHook(useRefTest, {
    wrapper,
  });
  expect(result1.current).toBe(result2.current);
  rerender1();
  expect(result1.current).toBe(result2.current);
  rerender2();
  expect(result1.current).toBe(result2.current);
});

test('Verify args passed to useCommonRef are included in the return value', () => {
  const value = {};
  const useRefTest = createCommonHook(value => {
    return useCommonRef(value);
  });
  const {result, rerender} = renderHook(useRefTest, {
    wrapper,
    initialProps: value,
  });
  expect(result.current.current).toBe(value);
  rerender();
  expect(result.current.current).toBe(value);
});
