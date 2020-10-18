import React, { useReducer, createContext, useContext, useMemo, useRef, useEffect } from 'react'
import produce from 'immer'

function createSimpleStore (initialState, actionsMap, asyncActionsMap) {

  const StateContext = createContext(null)
  const DispatchContext = createContext(null)

  const reducer = (state, action) => {
    const { type, payload } = action
    const nextState = produce(state, draftState => actionsMap[type](draftState, payload))
    return nextState
  }

  const Provider = ({ children }) => {
    const [reducerState, reducerDispatch] = useReducer(reducer, initialState)
    const reducerStateRef = useRef(reducerState)

    useEffect(() => {
      reducerStateRef.current = reducerState
    }, [reducerState])

    const DispatchWrapper = (action) => {
      if (typeof action === 'function') return action(reducerDispatch, () => reducerStateRef.current)
      return (reducerDispatch)(action)
    }

    return (
      <StateContext.Provider value={reducerState}>
        <DispatchContext.Provider value={DispatchWrapper}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    )
  }

  const GetState = ({ children }) => {
    const s = useState()
    return children(s)
  }

  const useState = () => useContext(StateContext)
  const useDispatch = () => useContext(DispatchContext)
  const actions = _createActionsFromActionMap(actionsMap)

  return {
    useState,
    useDispatch,
    Provider,
    GetState,
    thunks: asyncActionsMap,
    actions: actions,
  }
}

function _createActionsFromActionMap (actionsMap) {
  const actions = {}
  Object.keys(actionsMap).map(k => {
    actions[k] = (payload) => ({ type: k, payload })
  })
  return actions
}

export { createSimpleStore }
