import React, { useMemo, useState } from 'react'
import { createSimpleStore } from './SimpleReducer'
import { createSelector } from 'reselect'

const initialState = {
  loading: false,
  user: {
    name: 'Victor' as string | null,
    email: null,
  },
  random: 0,
}
const AuthStore = createSimpleStore(initialState, {
  randomize (state) {
    state.random = Math.random()
  },
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
  loggout: (state) => {
    state.user.name = null
    state.user.email = null
    state.loading = false
  },
  something (state) {
    state.loading = false
  },
  other (state) {
  },
  toggleLoading (state) {
    state.loading = !state.loading
  }
}, {
  login (usuario: string, senha: number) {
    return async (dispatch, getState) => {
      const userName = usuario
      const userEmail = senha
      dispatch({ type: 'loginStarted' })
      console.log('getState 1', getState())
      setTimeout(() => {
        console.log('getState 2', getState())
        dispatch({ type: 'logginSuccess', payload: { userEmail, userName } })
        console.log('getState 3', getState())
      }, 2000)
    }
  }
})

type IState = ReturnType<typeof AuthStore.useState>
const s1 = createSelector(
  (s: IState) => s.user,
  (s: IState) => s.loading,
  (user, loading) => {
    console.log('s1')
    return { USUARIO: user, LOADING: loading }
  }
)

const s2 = createSelector(
  (s: IState) => s.user,
  (user) => {
    console.log('s2')
    return user
  }
)

const s3 = createSelector(
  (s: IState & { id }) => s.user,
  ({ id }) => id,
  (user, id) => {
    console.log('s3')
    console.log({ id })
    return id
  }
)

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

const Child = () => {
  const state = AuthStore.useState()
  const dispatch = AuthStore.useDispatch()
  const _s1 = s1(state)
  const _s2 = s2(state)
  const [id, setId] = useState('')
  const [codigo, setCodigo] = useState('')
  const stateWithId = useMemo(() => ({ ...state, id }), [id, state])
  const _s3 = s3(stateWithId)

  return (
    <>
      <input value={id} onChange={e => setId(e.target.value)} />
      <input value={codigo} onChange={e => setCodigo(e.target.value)} />
      loading: {'' + state.loading}<br />
      {state.user.name}<br />
      {state.random}<br />
      <button onClick={() => dispatch({ type: 'loggout' })}> logout</button>
      <button onClick={() => dispatch({
        type: 'logginSuccess',
        payload: { userEmail: Math.random(), userName: 'vito@ivens' }
      })}>change login info</button>
      <button onClick={() => dispatch(AuthStore.actions.logginSuccess({
        userEmail: Math.random(),
        userName: 'action',
      }))}>change login info through action</button>
      <button onClick={() => dispatch(AuthStore.thunks.login('login', Math.random()))} >login async</button>
      <button onClick={() => dispatch(AuthStore.actions.clear())} >CLEAR</button>
      <button onClick={() => dispatch(AuthStore.actions.randomize())}>randomize</button>
      <button onClick={() => dispatch(AuthStore.actions.toggleLoading())}>toggle loading</button>
    </>
  )
}

export { SimpleReducerTest }


// const TodosStore = createSimpleStore({
//   todo: '',
//   todos: [] as TodoType[],
// }, {
//   updateTodo (state, todo) {
//     state.todo = todo
//   },
//   addTodo (state) {
//     state.todos.push({ todo: state.todo, saved: false })
//   },
//   saveTodosSuccess (state) {
//     state.todos.forEach(t => t.saved = true)
//   },
// }, {
//   saveTodos ({ saveAll = true }) {
//     return async (dispatch, getState) => {
//       const todos = getState().todos
//       await api.save(todos)
//       dispatch(TodosStore.actions.saveTodosSuccess())
//     }
//   }
// })

// const TodoComponent = () => {
//   return (
//     <TodosStore.Provider>
//       <NewTodo />
//       <TodoList />
//       <SaveTodos />
//       <TodosStore.GetState>
//         {state => (<>Total of Todos: {state.todos.length}</>)}
//       </TodosStore.GetState>
//     </TodosStore.Provider>
//   )
// }

// const ChildComponent = () => {
//   // get anything from the state using useState()
//   const { todo, todos } = TodosStore.useState()

//   // get the dispatch function to use actions and async actions
//   const dispatch = TodosStore.useDispatch()

//   // dispatch actions using two methods: object and actions
//   dispatch({ type: 'updateTodo', payload: 'NEW TODO TEXT' })
//   dispatch(TodosStore.actions.updateTodo('NEW TODO TEXT'))

//   // dispatch async actions using thunks
//   dispatch(TodosStore.thunks.saveTodos({ saveAll: false }))

// }
