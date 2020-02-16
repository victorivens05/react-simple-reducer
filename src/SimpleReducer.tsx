import React, { useReducer, createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react'
import produce from 'immer'

type ActionMap<S> = {
  [action: string]: (state: S, payload?) => void | S
}

type GetFnWithParamType<O, S> =
  ((S, payload: any) => any) extends O
  ? O extends (...args: [S, infer P]) => any ? (payload: P) => void : never : () => void

function createSimpleStore<
  S extends Object,
  AM extends ActionMap<S>,
  A extends {
    [K in keyof AM]: GetFnWithParamType<AM[K], S>
  },
  AAM extends {
    [asyncAction: string]: (...payload) => (actions: A, getState: () => S) => void
  },
  > (initialState: S, actionsMap: AM, asyncActionsMap?: AAM): {
    useState: () => S,
    useActions: () => A,
    useAsyncActions: () => AAM,
    Provider,
    GetState: ({ children }: {
      children: (state: S) => JSX.Element
    }) => JSX.Element
  } {
  const StateContext = createContext(null as any)
  const ActionsContext = createContext(null as any)
  const AsyncActionsContext = createContext(null as any)
  const reducer = (state, action) => {
    const { type, ...payloads } = action
    const nextState = produce(state, draftState => actionsMap[type](draftState, payloads ? payloads[0] : null))
    return nextState
  }

  const getReducerActions = (reducerDispatch) => {
    const reducerActions: any = {}
    Object.keys(actionsMap).forEach(fnName => {
      reducerActions[fnName] = (payload) => reducerDispatch({ type: fnName, ...payload })
    })
    return reducerActions
  }

  const getReducerAsyncActions = (asyncActionsMap, reducerActions, getState) => {
    const reducerAsyncActions = {}
    if (!asyncActionsMap) return {}
    Object.keys(asyncActionsMap).forEach(fnName => {
      reducerAsyncActions[fnName] = (...payload) => asyncActionsMap[fnName](...payload)(reducerActions, getState)
    })
    return reducerAsyncActions
  }

  const Provider = ({ children }) => {
    const [reducerState, reducerDispatch] = useReducer(reducer as any, initialState)
    const reducerStateRef = useRef(reducerState)

    useEffect(() => {
      reducerStateRef.current = reducerState
    }, [reducerState])

    const reducerActions = useMemo(() => {
      return getReducerActions(reducerDispatch)
    }, [actionsMap, reducerDispatch])

    const reducerAsyncActions = useMemo(() => {
      return getReducerAsyncActions(asyncActionsMap, reducerActions, () => reducerStateRef.current)
    }, [asyncActionsMap, reducerActions])

    return (
      <StateContext.Provider value={reducerState}>
        <ActionsContext.Provider value={reducerActions}>
          <AsyncActionsContext.Provider value={reducerAsyncActions}>
            {children}
          </AsyncActionsContext.Provider>
        </ActionsContext.Provider>
      </StateContext.Provider>
    )
  }
  const GetState = ({ children }: { children: (state: S) => JSX.Element }) => {
    const s = useState()
    return children(s)
  }
  const useState = () => useContext<typeof initialState>(StateContext)
  const useActions = () => useContext<A>(ActionsContext)
  const useAsyncActions = () => useContext(AsyncActionsContext)
  return {
    useState, useActions, useAsyncActions, Provider, GetState
  }
}

export { createSimpleStore }
