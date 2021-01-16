import React, { useReducer, createContext, useContext, useRef, useEffect, useCallback } from 'react'
import produce from 'immer'

declare global {
  interface Window { __REDUX_DEVTOOLS_EXTENSION__: any }
}

type ActionMap<S> = {
  [action: string]: (state: S, payload?) => void | S
}

type GetFnWithParamType<O, S> =
  ((S, payload: any) => any) extends O
  ? O extends (...args: [S, infer P]) => any ? (payload: P) => any : never : () => any

type GetTypeSecondParam<O, S> =
  ((S, payload: any) => any) extends O
  ? O extends (...args: [S, infer P]) => any ? P : never : never

type GetActionTypes<AM, S> = { [K in keyof AM]: ((S, payload: any) => any) extends AM[K]
  ? { type: K, payload: GetTypeSecondParam<AM[K], S> }
  : { type: K }
}

function createSimpleStore<
  TState extends Object,
  TActionMap extends ActionMap<TState>,
  TActionTypes extends GetActionTypes<TActionMap, TState>,
  TDispatch extends (action: TActionTypes[keyof TActionTypes]) => void,
  TAsyncDispatch extends (p: (dispatch: TDispatch, getState: () => TState) => Promise<any> | any) => void,
  TActions extends {
    [K in keyof TActionMap]: GetFnWithParamType<TActionMap[K], TState>
  },
  TAscynActionMap extends {
    [asyncAction: string]: (...payload) => (dispatch: TDispatch, getState: () => TState) => void
  },
  TOptions extends {
    cache?: {
      location?: 'LOCALSTORAGE' | 'SESSIONSTORAGE',
      key: string,
    }
  }
> (
  initialState: TState,
  actionsMap: TActionMap,
  additionalProps?: {
    thunks?: TAscynActionMap,
    options?: TOptions,
  }
): {
  useState: () => TState,
  useDispatch: () => TDispatch & TAsyncDispatch,
  Provider: ({ children, init }: { children, init?: (dispatch: TDispatch & TAsyncDispatch) => any }) => JSX.Element,
  GetState: ({ children }: {
    children: (state: TState) => JSX.Element
  }) => JSX.Element,
  thunks: TAscynActionMap,
  actions: TActions,
  useSelector: any,
} {

  const StateContext = createContext(null as any)
  const DispatchContext = createContext(null as any)

  const asyncActionsMap = additionalProps?.thunks || []
  const options = additionalProps?.options || { cache: { location: '', key: '' } }
  if (options.cache && !options.cache.location) options.cache.location = 'LOCALSTORAGE'

  const reducer = (state, action) => {
    const { type, payload } = action
    if (type === '__REDUX_DEVTOOLS_RELOAD__') return payload
    const nextState = produce(state, draftState => actionsMap[type](draftState, payload))
    return nextState
  }

  const useReduxDevtools = (name, handleDispatchReduxDevtools?) => {
    const reduxDevtoolsExtension = React.useRef(window?.__REDUX_DEVTOOLS_EXTENSION__ ?? null)
    const connection = React.useRef<any>()

    useEffect(() => {
      if (!reduxDevtoolsExtension.current) return
      const reduxDev = reduxDevtoolsExtension.current
      connection.current = reduxDev.connect({
        name,
      })

      connection.current?.init(initialState)
      connection.current?.subscribe(handleDispatchReduxDevtools)
      return () => {
        if (!reduxDevtoolsExtension.current) return
        reduxDev(connection.current)
      }
    }, [handleDispatchReduxDevtools, name])

    const send = React.useCallback((action, props) => {
      if (!reduxDevtoolsExtension.current) return
      connection.current?.send(action, props)
    }, [])

    return React.useMemo(() => ({
      send,
    }), [send])

  }

  const Provider = ({ children, init }: { children, init?}) => {
    const initialOrCachedState = _getInitialState({ initialState, cache: options.cache })
    const [reducerState, reducerDispatch] = useReducer(reducer as any, initialOrCachedState)
    const reducerStateRef = useRef<any>(reducerState)
    const handleDispatchReduxDevtools = useCallback(({ type, state, payload }) => {
      if (type !== 'DISPATCH') return
      switch (payload.type) {
        case 'COMMIT':
        case 'RESET':
        case 'ROLLBACK':
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          const _ = (reducerDispatch as any)({ type: '__REDUX_DEVTOOLS_RELOAD__', payload: JSON.parse(state) })
      }
    }, [])
    const reduxDevtools = useReduxDevtools('Store', handleDispatchReduxDevtools)

    useEffect(() => {
      reducerStateRef.current = reducerState
      if (options.cache?.key) {
        const { location, key } = options.cache
        _saveCache({ location, key, state: reducerState })
      }
    }, [reducerState])

    const DispatchWrapper = React.useCallback((actionOrAsyncAction) => {

      const _getNextStateAndSendToDevtools = (action) => {
        const nextState = reducer({ ...reducerStateRef.current }, action)
        reduxDevtools.send(action, nextState)
      }

      if (typeof actionOrAsyncAction === 'function') {
        const asyncAction = actionOrAsyncAction
        reduxDevtools.send(asyncAction, reducerStateRef.current)
        return asyncAction((action) => {
          _getNextStateAndSendToDevtools(action)
          return (reducerDispatch as any)(action)
        }, () => reducerStateRef.current)
      }

      const action = actionOrAsyncAction

      _getNextStateAndSendToDevtools(action)
      return (reducerDispatch as any)(action)

    }, [reduxDevtools])

    useEffect(() => {
      if (init) init(DispatchWrapper)
    }, [DispatchWrapper, init])

    return (
      <StateContext.Provider value={reducerState}>
        <DispatchContext.Provider value={DispatchWrapper}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    )
  }

  const GetState = ({ children }: { children: (state: TState) => JSX.Element }) => {
    const s = useState()
    return children(s)
  }

  const useState = () => useContext<typeof initialState>(StateContext)
  const useDispatch = () => useContext<TDispatch & TAsyncDispatch>(DispatchContext)
  const actions = _createActionsFromActionMap(actionsMap)
  const useSelector = (selector) => {
    const state = useState()
    return selector(state)
  }

  return {
    useState,
    useDispatch,
    useSelector,
    Provider,
    GetState,
    thunks: asyncActionsMap as any,
    actions: actions,
  }
}

function _createActionsFromActionMap (actionsMap) {
  const actions: any = {}
  Object.keys(actionsMap).forEach(k => {
    actions[k] = (payload) => ({ type: k, payload })
  })
  return actions
}

function _saveCache ({ location, key, state }) {
  if (location === 'LOCALSTORAGE') {
    localStorage.setItem(key, JSON.stringify(state))
  } else if (location === 'SESSIONSTORAGE') {
    sessionStorage.setItem(key, JSON.stringify(state))
  }
}

function _getInitialState ({ initialState, cache }) {
  if (cache?.key && cache?.location === 'LOCALSTORAGE') {
    const state = localStorage.getItem(cache.key)
    if (state && state !== 'undefined') return JSON.parse(state)
  }
  if (cache?.key && cache?.location === 'SESSIONSTORAGE') {
    const state = sessionStorage.getItem(cache.key)
    if (state && state !== 'undefined') return JSON.parse(state)
  }
  return initialState
}


export { createSimpleStore }
