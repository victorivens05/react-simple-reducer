# React Simple Reducer

Local state manager that enhances react's `useReducer`. Heavily inspired by [Redux Toolkit](https://redux-toolkit.js.org/).\
Leverage Typescript to make everything type safe, from the creation of the store to it's usage.\
The same way as redux toolkit, uses immer to reduce the state.

### How to use

Create a store using `createSimpleStore` passing the state, reducers and optionally async actions.\

```typescript
const TodosStore = createSimpleStore({
  todo: '',
  todos: [] as TodoType[],
}, {
  updateTodo (state, todo) {
    state.todo = todo
  },
  addTodo (state) {
    state.todos.push({ todo: state.todo, saved: false })
    state.todo = ''
  },
  saveTodosSuccess (state) {
    state.todos.forEach(t => t.saved = true)
  },
}, {
  saveTodos ({ saveAll = true }) {
    return async (dispatch, getState) => {
      const todos = getState().todos
      await api.save(todos)
      dispatch(TodosStore.actions.saveTodosSuccess())
    }
  }
})
```

Use the `Provider` to make the store available for every children component.\
In the first component, outside of the Provider, you don't have access the the store and dispatch. That helps you mantain your entry component clean and declarative. If you need to access the store for some reason (show or hide components, for instance), use the high order component `GetState`.\

```typescript
const TodoComponent = () => {
  return (
    <TodosStore.Provider>
      <NewTodo />
      <TodoList />
      <SaveTodos />
      <TodosStore.GetState>
        {state => (<>Total of Todos: {state.todos.length}</>)}
      </TodosStore.GetState>
    </TodosStore.Provider>
  )
}
```

Any child component will have access to the store.\
`useState` and `useDispatch` are custom hooks that internally use `useContext` to provider with the current state and dispatch function respectively.\
You can dispatch an action reducer or a thunk (declared optionally as `createSimpleStore`'s third param)\
There is a helper called `actions`, which holds all the reducer function and return the action object and a helper called `thunks`, which hold the thunks themselves. `dispatch` will call the thunk enhancing it with dispatch itself and getState (which will get the current state, even if it changes during an async call).\

```typescript
const ChildComponent = () => {
  // get anything from the state using useState()
  const { todo, todos } = TodosStore.useState()

  // get the dispatch function
  const dispatch = TodosStore.useDispatch()

  // dispatch actions using two methods: object and actions
  dispatch({ type: 'updateTodo', payload: 'NEW TODO TEXT' })
  dispatch(TodosStore.actions.updateTodo('NEW TODO TEXT'))

  // dispatch async actions using thunks
  dispatch(TodosStore.thunks.saveTodos({ saveAll: false }))
}

```

---

### Using Selectors

You can use `createSelector` from [reselect](https://github.com/reduxjs/reselect) and pass the whole state to it.

```typescript
// you can also get the state type, so your selector will be type safe
type IState = ReturnType<typeof ConteudoStore.useState>
selectUnsavedTodos: createSelector(
    (s: IState) => s.todos,
    (todos) => {
      return todos.filter(t => !t.saved)
    }
)
```

Remember to never return a new value as the first functions of the selector

```typescript
// WRONG
selectDuplicateTodo: createSelector(
    (s: IState) => ({todos: s.todos, todo: s.todo}),
    ({todos, todo}) => null
)
// CORRECT
selectDuplicateTodo: createSelector(
    (s: IState) => s.todos,
    (s: IState) => s.todo,
    (todos, todo) => null
)
```

To use the selector, simple pass the whole state as a param

```typescript
const ChildComponent = () => {
  const state = TodosStore.useState()
  const unsavedTodos = selectUnsavedTodos(state)
}
```

You can also pass params for the selector by creating a new value and memoizing it using `useMemo`, before passing to the selector.

```typescript
selectSpecificTodo: createSelector(
    (s: IState & {id: number}) => s.todos,
    ({id}) => id,
    (todos, id) => todos.find(t => t.id)
)
const ChildComponent = () => {
  const state = TodosStore.useState()
  const [id, setId] = useState(1)
  const stateWithId = useMemo(() => ({...state, id}), [state, id])
  const pacificTodo = selectSpecificTodo(stateWithId)
}
```
