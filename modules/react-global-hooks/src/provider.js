/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// @flow

/* globals __RGH_DEVTOOLS__ */

import {createContext, useContext} from 'react';
import {createStoreMap} from './store-map';

const storeMap = createStoreMap();
if (typeof __RGH_DEVTOOLS__ !== 'undefined') {
  __RGH_DEVTOOLS__.registerStoreMap(storeMap);
}
const context = createContext<StoreMap>(storeMap);
context.displayName = 'ReactGlobalHooks';

export const useStoreMap = () => useContext(context);

const {Provider} = context;
export default Provider;
