/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

import hookFactory from './hook-factory';
import createCommonCallback from './create-common-callback';
import createCommonEffect from './create-common-effect';
import createCommonLayoutEffect from './create-common-layout-effect';
import createCommonMemo from './create-common-memo';
import createCommonRef from './create-common-ref';
import createCommonState from './create-common-state';

export {default as createSharedState} from './create-shared-state';
export {default as createSharedRef} from './create-shared-ref';
export {default as createSharedReducer} from './create-shared-reducer';
export {default as createCommonHook} from './create-common-hook';

export const useCommonCallback = hookFactory(createCommonCallback);
export const useCommonEffect = hookFactory(createCommonEffect);
export const useCommonLayoutEffect = hookFactory(createCommonLayoutEffect);
export const useCommonMemo = hookFactory(createCommonMemo);
export const useCommonRef = hookFactory(createCommonRef);
export const useCommonState = hookFactory(createCommonState);
export {hookFactory};
export {default as StoreMap, createStoreMap} from './store-map';
export {default as Provider} from './provider';
