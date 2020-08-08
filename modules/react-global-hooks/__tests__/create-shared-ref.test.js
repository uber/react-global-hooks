/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify useSharedRef returns proper stucture when no arguments are passed
// Verify referential integrity of ref across call positions
// Verify args passed to useSharedRef are included in the return value

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {createSharedRef, Provider, createStoreMap} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify useSharedRef returns proper stucture when no arguments are passed', () => {
  const useSharedRef = createSharedRef();
  const {result} = renderHook(useSharedRef, {wrapper});
  expect(typeof result.current).toBe('object');
  expect(result.current.constructor.name).toBe('Object');
  expect(Object.keys(result.current).length).toBe(1);
  expect('current' in result.current).toBe(true);
  expect(result.current.curent).toBe(undefined);
});

test('Verify referential integrity of ref across call positions', () => {
  const useSharedRef = createSharedRef();
  const {result: result1, rerender: rerender1} = renderHook(useSharedRef, {
    wrapper,
  });
  const {result: result2, rerender: rerender2} = renderHook(useSharedRef, {
    wrapper,
  });
  expect(result1.current).toBe(result2.current);
  rerender1();
  expect(result1.current).toBe(result2.current);
  rerender2();
  expect(result1.current).toBe(result2.current);
});

test('Verify args passed to useSharedRef are included in the return value', () => {
  const value = {};
  const useSharedRef = createSharedRef(value);
  const {result, rerender} = renderHook(useSharedRef, {wrapper});
  expect(result.current.current).toBe(value);
  rerender();
  expect(result.current.current).toBe(value);
});
