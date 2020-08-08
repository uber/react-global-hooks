/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify referential integrity of memoized value between different call positions
// Verify callback execution occurs only when expected (on first component mount, on args change)

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {
  Provider,
  createStoreMap,
  createCommonHook,
  useCommonMemo,
} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify referential integrity of memoized value between different call positions', () => {
  let variable = 0;
  let value = {};
  const value1 = value;
  const useTestMemo = createCommonHook(({value, variable}) => {
    return useCommonMemo(() => {
      return value;
      // eslint-disable-next-line @uber/react-global-hooks/exhaustive-deps
    }, [variable]);
  });
  const {result: result1, rerender: rerender1} = renderHook(useTestMemo, {
    wrapper,
    initialProps: {value, variable},
  });
  expect(result1.current).toBe(value1);
  const {result: result2, rerender: rerender2} = renderHook(useTestMemo, {
    wrapper,
    initialProps: {value, variable},
  });
  expect(result1.current).toBe(value1);
  expect(result1.current).toBe(result2.current);
  rerender1({value, variable});
  expect(result1.current).toBe(value1);
  expect(result1.current).toBe(result2.current);
  value = {};
  const value2 = value;
  rerender1({value, variable});
  expect(result1.current).toBe(value1);
  expect(result1.current).toBe(result2.current);
  variable++;
  rerender1({value, variable});
  rerender2({value, variable});
  expect(result1.current).toBe(value2);
  expect(result1.current).not.toBe(value1);
  expect(result1.current).toBe(result2.current);
});

test('Verify callback execution occurs only when expected (on first component mount, on args change)', () => {
  let variable = 0;
  let count = 0;
  let value = {};
  const value1 = value;
  const useTestMemo = createCommonHook(({value, variable}) => {
    return useCommonMemo(() => {
      count++;
      return value;
      // eslint-disable-next-line @uber/react-global-hooks/exhaustive-deps
    }, [variable]);
  });
  const {result, rerender} = renderHook(useTestMemo, {
    wrapper,
    initialProps: {value, variable},
  });
  expect(count).toBe(1);
  expect(result.current).toBe(value1);
  value = {};
  const value2 = value;
  rerender({value, variable});
  expect(count).toBe(1);
  expect(result.current).toBe(value1);
  expect(result.current).not.toBe(value2);
  variable++;
  rerender({value, variable});
  expect(count).toBe(2);
  expect(result.current).toBe(value2);
});
