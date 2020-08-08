/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

// Verify callback changes/refreshes as args change
// Verify referential integrity of callback between multiple different call positions

import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {
  Provider,
  createStoreMap,
  createCommonHook,
  useCommonCallback,
} from '../src';

const storeMap = createStoreMap();
const wrapper = ({children}) => (
  <Provider value={storeMap}>{children}</Provider>
);

test('Verify referential integrity of callback between multiple different call positions', () => {
  const useTestCallback = createCommonHook(variable => {
    return useCommonCallback(() => {
      variable;
    }, [variable]);
  });
  const {result: result1} = renderHook(useTestCallback, {wrapper});
  const {result: result2} = renderHook(useTestCallback, {wrapper});
  expect(typeof result1.current).toBe('function');
  expect(result1.current).toEqual(result2.current);
});

test('Verify callback changes/refreshes as args change', () => {
  const useTestCallback = createCommonHook(variable => {
    return useCommonCallback(() => {
      variable;
    }, [variable]);
  });
  const {result, rerender} = renderHook(useTestCallback, {
    wrapper,
    initialProps: 0,
  });
  const result1 = {...result};
  expect(typeof result1.current).toBe('function');
  rerender(0);
  const result2 = {...result};
  expect(result1.current).toEqual(result2.current);
  rerender(1);
  const result3 = {...result};
  expect(typeof result2.current).toBe('function');
  expect(result1.current).not.toEqual(result3.current);
});
