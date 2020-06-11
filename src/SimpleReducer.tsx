import React, { useReducer, createContext, useContext, useMemo, useRef, useEffect } from 'react'
import produce from 'immer'

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
  > (initialState: TState, actionsMap: TActionMap, asyncActionsMap?: TAscynActionMap): {
    useState: () => TState,
    useDispatch: () => TDispatch & TAsyncDispatch,
    Provider,
    GetState: ({ children }: {
      children: (state: TState) => JSX.Element
    }) => JSX.Element,
    thunks: TAscynActionMap,
    actions: TActions,
  } {

  const StateContext = createContext(null as any)
  const DispatchContext = createContext(null as any)

  const reducer = (state, action) => {
    const { type, payload } = action
    const nextState = produce(state, draftState => actionsMap[type](draftState, payload))
    return nextState
  }

  const Provider = ({ children }) => {
    const [reducerState, reducerDispatch] = useReducer(reducer as any, initialState)
    const reducerStateRef = useRef(reducerState)

    useEffect(() => {
      reducerStateRef.current = reducerState
    }, [reducerState])

    const DispatchWrapper = (action) => {
      if (typeof action === 'function') return action(reducerDispatch, () => reducerStateRef.current)
      return (reducerDispatch as any)(action)
    }

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

  return {
    useState,
    useDispatch,
    Provider,
    GetState,
    thunks: asyncActionsMap as any,
    actions: actions,
  }
}

function _createActionsFromActionMap (actionsMap) {
  const actions: any = {}
  Object.keys(actionsMap).map(k => {
    actions[k] = (payload) => ({ type: k, payload })
  })
  return actions
}

export { createSimpleStore }
