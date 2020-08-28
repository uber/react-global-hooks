/** Copyright (c) Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @flow

import type {InitialState} from './types.flow';
import createSharedReducer from './create-shared-reducer';

export default function createSharedState<State>(
  initialState: InitialState<State>,
  name: ?string = 'useSharedState',
) {
  const [useSelector, useSetState] = createSharedReducer<State, State>(
    null,
    initialState,
    name,
  );
  return [useSelector, useSetState];
}
