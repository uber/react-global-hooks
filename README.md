# react-global-hooks

## Motivation

React hooks have become quite popular since they were released. Developers have used the composable nature of react hooks to abstract logic into custom hooks. These custom hooks _enhance_ a functional component by providing behavior and local state.

**React Global Hooks** expands on this idea by introducing global versions of these same hooks. These are the foundational building blocks for writing custom hooks that are shared between components but effect _component independent_ interactions. Components _subscribe_ to behavior and state encapsulated within these global hooks.

---

## Usage

```js
// hooks/use-fibonocci.js
import {
  createSharedState,
  createCommonHook,
  useCommonCallback,
  useCommonEffect,
} from '@uber/react-global-hooks';

const [useGetFib, useSetFib] = createSharedState({prev: 0, curr: 1});
export {useGetFib}

export const useFibonocciOnMove = createCommonHook(() => {
  const setFibonocci = useSetFib();

  const handleMouseMove = useCommonCallback(() => {
    setFibonocci(({prev, curr}) => ({prev: curr, curr: prev + curr}));
  }, []); // setFibonocci is referentially stable and not needed in dependency array

  useCommonEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);
});


// components/fibonocci.js
import {useGetFib, useFibonocciOnMove} from '../hooks/use-fibonocci';

export const Fib = () => {
  useFibonocciOnMove();
  return null;
};

// selector for current fib value
const selectCurrent = ({curr}) => curr;

// Debounce rerenders with 500ms delay
const debounce = fn => _.debounce(fn, 500);

export const ShowFibDebounced = () => {
  const fib = useGetFib(selectCurrent, null, debounce);
  return fib;
};
```

---

## Definitions

### Shared vs Common

**Shared** hooks can be shared between multiple components and custom hooks. They provide referentially stable results across all call positions.

**Common** hooks partition behavior on call position. Each call position provides independent behavior and results.

### Call Position

A hook's call position is the expression where that hook is invoked. A hook invoked in multiple places is said to have multiple call positions.

For example, say Hook A is only invoked by Hook B, and Hook B is invoked by multiple components. Hook A is still said to have only one call position, (inside Hook B). Hook A's call position provides consistent behavior and referentially stable results for that call position across all call stacks.

**Example 1** Consistent Behavior

```
const useHookA = useCommonEffect;

const useHookB = createCommonHook(() => {
  useHookA(() => {
    console.log('runs only on first component mount');
    return () => console.log('runs only on last component unmount');
  }, []);
});
```

**Example 2** Referential Stability

```
const useHookA = useCommonRef;

const useHookB = createCommonHook(() => {
  const ref = useHookA();
  return ref
});

const CheckRef = () => {
  const ref1 = useHookB();
  const ref2 = useHookB();
  console.log(ref1 === ref2);  // true
  return null;
};
```

---

## Getting Started

```
import {createStoreMap, Provider as GlobalHooksProvider} from '@uber/react-global-hooks';

const storeMap = createStoreMap();
ReactDOM.render(
  <GlobalHooksProvider value={storeMap}>
    <App />
  </GlobalHooksProvider>,
  document.getElementById('root')
);
```

**Concurrent Mode**

```
import {createStoreMap, Provider as GlobalHooksProvider} from '@uber/react-global-hooks';

const storeMap = createStoreMap();
ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <GlobalHooksProvider value={storeMap}>
    <App />
  </GlobalHooksProvider>
);
```

---

## Shared Hooks

React's `useState` and `useReducer` are good solutions for state isolated to a component. This library expands on this idea by providing shareable versions of `useState` and `useReducer` so that atomic and molecular state can be shared across many components.

### createSharedState

Returns `useSelector` and `useSetState` hooks.

`useSelector` and `useSetState` are useful for sharing global data atomics.

`useSetState` returns `setState`.
`setState`'s API is similar to React's setState.

```js
type CreateSharedState = (
  InitialState | LazyInitialState,
  ?DebugName
) => [UseSelector, UseDispatch];
type LazyInitialState = Dispatch => InitialState;
type UseSelector = (?Selector, ?EqualityFn, ?TimeVaryingFn) => SelectedState;
type Selector = NextState => SelectedState;
type EqualityFn = (CurrentState, NextState) => boolean;
type TimeVaryingFn = Function => Function;
type UseDispatch = () => Dispatch;
type Dispatch = (State | LazyState) => void;
type LazyState = CurrentState => NextState;
type DebugName = string;
```

```js
const [useSelector, useSetState] = createSharedState(initialCount);
```

```js
const state = useSelector();
```

```js
const setState = useSetState();
```

Components that use this selector will only rerender when state.count changes

You can make the selector referentially stable to improve performance. The selector is otherwise run on every render.

```
const selectCount = useCallback(state => state.count, []);
const count = useSelector(selectCount);
```

Pass a equality function to override the default. The default equality function is `Object.is`.

```
const vehicleSelector = useCallback(state => state.vehicle, []);
const vehicleEquality = useCallback((curr, next) => curr.vin === next.vin), []);
const vehicle = useSelector(vehicleSelector, vehicleEquality);
```

Specify a time-varying function such as debounce or throttle to limit the number of rerenders.

Important Note: selector and equalityFn must be referentially stable for timeVaryingFn to work. Use useCallback or define outside the component to ensure stability.

```
const vehicleSelector = useCallback(state => state.vehicle, []);
const vehicleEquality = useCallback((curr, next) => curr.vin === next.vin), []);
const timeVaryingFn = useCallback(fn => _.debounce(fn, 500), []); // lodash debounce
const vehicle = useSelector(vehicleSelector, vehicleEquality, timeVaryingFn);
```

Set a simple state

```
setState(5);
```

or set state based on previous state

```
setState(count => count + 1);
```

Bail out of a render by returning the original state

```
setState(count => {
  if (someCondition) {
    return count;
  }
  return count + 1;
});
```

Lazy initial state

```
const [useSelector, useSetState] = createSharedState(
  () => someExpensiveComputation();
);
```

Async lazy initial state

```
const fetchPromise = fetch('example.api').then(data => data.json());
const [useGetState, useSetState, useSubscribe] = createSharedState(setState => {
  fetchPromise.then(setState);
  return {}; // use this value until example.api responds
});
```

### createSharedReducer

Returns `useSelector` and `useDispatch` hooks.

```js
type CreateSharedReducer = (
  Reducer,
  InitialState | LazyInitialState,
  ?DebugName
) => [UseSelector, UseDispatch];
type Reducer = (CurrentState, Action) => NextState;
type Action = Object;
type LazyInitialState = Dispatch => InitialState;
type UseSelector = (?Selector, ?EqualityFn, ?TimeVaryingFn) => SelectedState;
type Selector = NextState => SelectedState;
type EqualityFn = (CurrentState, NextState) => boolean;
type TimeVaryingFn = Function => Function;
type UseDispatch = () => Dispatch;
type Dispatch = Action => void;
type LazyState = CurrentState => NextState;
type DebugName = string;
```

```js
const initialState = {count: 0};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}

const [useSelector, useDispatch] = createSharedReducer(reducer, initialState);
```

Components that use this selector will only rerender when state.count changes

```
const countSelector = useCallback(state => state.count, []);
const count = useSelector(selectCount);
```

Pass a equality function to override the default. The default equality function is `Object.is`.

You can make the selector referentially stable to improve performance. The selector is otherwise run on every render.

```
const vehicleSelector = useCallback(state => state.vehicle, []);
const vehicleEquality = useCallback((curr, next) => curr.vin === next.vin), []);
const vehicle = useSelector(vehicleSelector, vehicleEquality);
```

Specify a time-varying function such as debounce or throttle to limit the number of rerenders.

Important Note: selector and equalityFn must be referentially stable for timeVaryingFn to work. Use useCallback or define outside the component to ensure stability.

```
const vehicleSelector = useCallback(state => state.vehicle, []);
const vehicleEquality = useCallback((curr, next) => curr.vin === next.vin), []);
const timeVaryingFn = useCallback(fn => _.debounce(fn, 500), []); // lodash debounce
const vehicle = useSelector(vehicleSelector, vehicleEquality, timeVaryingFn);
```

Dispatch an action

```
const dispatch = useDispatch();
dispatch({type: 'increment'});
```

Lazy initial state

```
const [useSelector, useDispatch] = createSharedReducer(reducer,
  () => someExpensiveComputation()
);
```

Async lazy initial state

```
const fetchPromise = fetch('example.api').then(data => data.json());
const [useSelector, useDispatch] = createSharedReducer(reducer, dispatch => {
  fetchPromise.then(value => {
    dispatch({type: 'INITIALIZE', value});
  });
  return {}; // use this value until example.api responds
});
```

### createSharedRef

Returns `useSharedRef` that provides a referentially stable ref that may be used by multiple hooks.

`useSharedRef` is useful for creating refs that are watched by other common hooks.

```js
type createSharedRef = (?any, ?DebugName) => useSharedRef;
type useSharedRef = () => Ref;
type Ref = {current: any};
type DebugName = string;
```

```js
const useSharedRef = createSharedRef();
```

---

## Common Hooks

### Build more logic into hooks with Common Hooks

If we intend to write truely shareable hooks, we need hooks that are not based on individual component lifecycle events. This library provides _Common_ hooks that compose into shareable custom hooks.

### createCommonHook

This higher order hook is required to use the `useCommon-*` hooks in this library.

`createCommonHook` internally tracks each call position and memoizes a separate common hook for each position. This is only possible inside a custom hook wrapped by `createCommonHook`.

```js
type createCommonHook = (Hook, ?DebugName) => SharedHook;
type Hook = Function;
type SharedHook = Hook;
type DebugName = string;
```

```js
import {
  createCommonHook,
  useCommonEffect,
  useCommonMemo,
  useCommonRef
} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook(() => {
  const ref = useCommonRef();
  useCommonEffect(() => {}, [ref]);
  useCommonEffect(() => {}, [ref]);
  return useCommonMemo(() => {}, []);
});
export default useCustomHook;
```

It is also safe to use react hooks within a `createCommonHook`. The function argument respects React's call position across renders.

```js
import {useEffect} from 'react';
import {
  createCommonHook,
  useCommonMemo,
} from `@uber/react-global-hooks`;

const useCustomHook = () => {
  useEffect(() => {}, []);
  return useCommonMemo(() => {}, []);
};
export default createCommonHook(useCustomHook);
```

### useCommonCallback

Provides a referentially stable callback across all call stacks of the enclosing hook.

This API is identical to React's useCallback.

```js
type useCommonCallback = (InputFn, WatchedArgs) => StableFn;
type InputFn = Function;
type WatchedArgs = Array<any>;
type StableFn = InputFn;
```

```js
import {createCommonHook, useCommonCallback} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook((fn) => {
  const stableFn = useCommonCallback(fn, []);
});
export default useCustomHook;
```

### useCommonEffect

Executes a function on the first component mount or whenever props change asynchronously post render. The returned cleanup function is executed on last component unmount or whenever props change. This API is identical to React's useEffect.

`useCommonEffect` is useful for registering event listeners, fetching data, and other side-effects that should applied only once.

```js
type useCommonEffect = (InputFn, WatchedArgs) => void;
type InputFn = () => Cleanup;
type Cleanup = () => void;
type WatchedArgs = Array<any>;
```

```js
import {createCommonHook, useCommonEffect} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook((fn) => {
  useCommonEffect(fn, []);
});
export default useCustomHook;
```

### useCommonLayoutEffect

Executes a function on the first component mount or whenever props change synchronously after all DOM mutations This API is identical to React's useLayoutEffect.

`useCommonLayoutEffect` is useful for DOM layout dependent effects that should be applied only once.

```js
type useCommonEffect = (InputFn, WatchedArgs) => void;
type InputFn = () => Cleanup;
type Cleanup = () => void;
type WatchedArgs = Array<any>;
```

```js
import {createCommonHook, useCommonLayoutEffect} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook((fn) => {
  useCommonLayoutEffect(fn, []);
});
export default useCustomHook;
```

### useCommonMemo

Provides a referentially stable memo across all call stacks of the enclosing hook. This API is identical to React's useMemo.

Fn will be called on first component mount or whenever any values change. `useCommonMemo` runs synchronously during render.

```js
type useCommonMemo = (InputFn, WatchedArgs) => MemoizedValue;
type InputFn = () => Value;
type Value = any;
type MemoizedValue = Value;
type WatchedArgs = Array<any>;
```

```js
import {createCommonHook, useCommonMemo} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook((fn) => {
  const stableMemo = useCommonMemo(fn, []);
});
export default useCustomHook;
```

### useCommonRef

Provides a referentially stable ref across all call stacks of the enclosing hook. This API is identical to React's useRef.

`useCommonRef` is useful for creating refs that are watched by other common hooks.

```js
type useCommonRef = Value => Ref;
type Value = any;
type Ref = {current: Value};
```

```js
import {createCommonHook, useCommonRef} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook(() => {
  const stableRef = useCommonRef();
});
export default useCustomHook;
```

### useCommonState

Provides a common state and setState. This API is identical to React's useState.

`useCommonState` is useful for storing atomic state that is local to the enclosing hook. Prefer `useSharedState` and `useSharedReducer` for organizing application state. These APIs provide extended capabilities for limiting the number of rerenders.

```js
type useCommonState = (State | LazyState) => [State, SetState];
type LazyState = SetState => NextState;
type SetState = State => NextState;
```

```js
import {createCommonHook, useCommonState} from `@uber/react-global-hooks`;

const useCustomHook = createCommonHook(() => {
  const [state, setState] = useCommonState();
});
export default useCustomHook;
```

---

### Register Custom Base Hooks

Need a hook that doesn't exist? You can register your own with `hookFactory` to piggyback off `createCommonHook`'s call position tracking.

To use `hookFactory` the callback must take the shape of `() => Function`.

```js
type HookFactory = CreateHook => CommonHook;
type CreateHook = () => Hook;
type CommonHook = Hook;
type Hook = Function;
```

```js
import {hookFactory} from '@uber/react-global-hooks';

const useDebounced = hookFactory(
  function createDebouncedHook() {
    let timeout;
    return function useDebounced(fn, value) {
      clearTimeout(timeout);
      timeout = setTimeout(fn, value);
    }
  }
);

const useHookA = createCommonHook((a, b, c) => {
  useDebounced(a);
  useDebounced(b);
  useDebounced(c);
});
const useHookB = createCommonHook((d) => {
  useDebounced(d);
});
```

## License

MIT
