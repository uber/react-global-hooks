/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify callback execution occurs only when expected (on first component mount, on args change)
// Verify cleanup function occurs only when expected (on last component unmount, on args change)

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {
  Provider,
  createStoreMap,
  createCommonHook,
  useCommonLayoutEffect,
} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify callback execution occurs only when expected (on first component mount, on args change)', () => {
  let count = 0;
  let variable = 0;
  const useTestLayoutEffect = createCommonHook((variable) => {
    useCommonLayoutEffect(() => {
      count++;
    }, [variable]);
  });
  const {rerender: rerender1} = renderHook(useTestLayoutEffect, {
    wrapper,
    initialProps: variable,
  });
  expect(count).toBe(1);
  const {rerender: rerender2} = renderHook(useTestLayoutEffect, {
    wrapper,
    initialProps: variable,
  });
  expect(count).toBe(1);
  variable++;
  rerender1(variable);
  expect(count).toBe(2);
  rerender2(variable);
  expect(count).toBe(2);
});

test('Verify cleanup function occurs only when expected (on last component unmount, on args change)', () => {
  let cleanup = 0;
  let variable = 0;
  const useTestLayoutEffect = createCommonHook((variable) => {
    useCommonLayoutEffect(() => {
      return () => cleanup++;
    }, [variable]);
  });
  const {rerender: rerender1, unmount: unmount1} = renderHook(
    useTestLayoutEffect,
    {
      wrapper,
      initialProps: variable,
    },
  );
  expect(cleanup).toBe(0);
  const {rerender: rerender2, unmount: unmount2} = renderHook(
    useTestLayoutEffect,
    {
      wrapper,
      initialProps: variable,
    },
  );
  expect(cleanup).toBe(0);
  variable++;
  rerender1(variable);
  expect(cleanup).toBe(1);
  rerender2(variable);
  expect(cleanup).toBe(1);
  unmount1();
  expect(cleanup).toBe(1);
  unmount2();
  expect(cleanup).toBe(2);
});
