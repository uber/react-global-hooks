/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow
import {type Scope} from './create-common-hook';

export default class StoreMap extends Array<any> {
  index: number = 0;
  currentScope: Scope | null = null;
}

export const createStoreMap = (): StoreMap => new StoreMap();
