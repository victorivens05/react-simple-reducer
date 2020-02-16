import React from 'react'
import { createSimpleStore } from './SimpleReducer'

const initialState = {
  loading: false,
  user: {
    name: 'Victor' as string | null,
    email: null,
  }
}
const AuthStore = createSimpleStore(initialState, {
  clear () {
    return {
      ...initialState,
      loading: false
    }
  },
  loginStarted (state) {
    state.loading = true
  },
  logginSuccess: (state, payload: { userName, userEmail }) => {
    state.user.name = payload.userName
    state.user.email = payload.userEmail
    state.loading = false
  },
  loggout: (state, notify: boolean) => {
    state.user.name = null
    state.user.email = null
    state.loading = false
  },
  something (state) {
    state.loading = false
  },
  other (state) {
  }
}, {
  login (usuario: string, senha: number) {
    return async (actions, getState) => {
      const userName = usuario
      const userEmail = senha
      actions.loginStarted()
      console.log('getState 1', getState())
      setTimeout(() => {
        console.log('getState 2', getState())
        actions.logginSuccess({ userName, userEmail })
        console.log('getState 3', getState())
      }, 2000)
    }
  }
})

const Child = () => {
  const state = AuthStore.useState()
  const actions = AuthStore.useActions()
  const asyncActions = AuthStore.useAsyncActions()
  console.log({ state: state })
  return (
    <>
      {state.user.name}
      <button onClick={() => actions.loggout(false)} >logout</button>
      <button onClick={() => actions.logginSuccess({ userName: Math.random(), userEmail: 'vito@ivens' })} >change login info</button>
      <button onClick={() => asyncActions.login('login', Math.random())} >login async</button>
      <button onClick={() => actions.clear()} >CLEAR</button>
    </>
  )
}

const SimpleReducerTest = () => {
  return (
    <>
      <AuthStore.Provider>
        <AuthStore.GetState>
          {state => (
            <div>{state.user.email}</div>
          )}
        </AuthStore.GetState>
        <Child />
      </AuthStore.Provider>
    </>
  )
}

export { SimpleReducerTest }
