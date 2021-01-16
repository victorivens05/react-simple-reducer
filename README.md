


# React Simple Reducer

Local state manager that enhances react's `useReducer`. Heavily inspired by [Redux Toolkit](https://redux-toolkit.js.org/).\
Leverage Typescript to make **everything** type safe, from the creation of the store to it's usage.\
The same way as redux toolkit, uses immer to reduce the state.

### How to use

Create a store using `createSimpleStore` passing the state and reducers. Optionally you can pass thunks and an options object.

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
  thunks: {
    saveTodos ({ saveAll = true }) {
      return async (dispatch, getState) => {
        const todos = getState().todos
        await api.save(todos)
        dispatch(TodosStore.actions.saveTodosSuccess())
      }
    }
  },
  options: {
    cache: {
      key: 'TODOS_STORE',
      local: 'SESSIONSTORAGE'
    }
  }
})
```

Use the `Provider` to make the store available for every children component.\
In the first component, outside of the Provider, you don't have access the the store and dispatch. That helps you mantain your entry component clean and declarative.

```typescript
const TodoComponent = () => {
  return (
    <TodosStore.Provider init={initFn}>
      <NewTodo />
      <TodoList />
      <SaveTodos />
    </TodosStore.Provider>
  )
}
```

Any child component will have access to the store.\
`useState` and `useDispatch` are custom hooks that internally use `useContext` to provide with the current state and dispatch function respectively.\
You can dispatch an action reducer or a thunk (declared optionally in the options object, passed as  `createSimpleStore`'s third param)\
There is a helper called `actions`, which holds all the reducer function and return the action object and a helper called `thunks`, which hold the thunks themselves. `dispatch` will call the thunk enhancing it with dispatch itself and getState (which will get the current state, even if it changes during an async call).

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
### Aditional functionalities
In the entry component, in which the `Provider` is declared, you don't have access to state or dispatch. If you need access to the state for some reason (show or hide components, for instance), use the high order component `GetState`.
Usually, there is a startup for the store (load initial data through api, set initial parameters as received by props, for instance). `Provider` has the init prop, which expects a function with `dispatch` as first and only param. Through this function, you can initialize the store. A caveat is that this function is observed, and if it changes, it's called again, so if it's called multiple times, it needs to be wrapped on a `React.useCallback`. That behavior is useful for changes in props, to reflect on the store.


```typescript
const TodoComponent = ({todoGroupId}) => {
  const initFn = React.useCallback((dispatch: ReturnType<typeof AuthStore.useDispatch>) => {
	  dispatch(AuthStore.thunks.getTodos(todoGroupId))
  }, [todoGroupId])
  return (
    <TodosStore.Provider init={initFn}>
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
There is built-in caching on `localStorage` and `sessionStorage`, that you can configure in the `options` param of the optional object present in the third param of the function.
### Redux Devtools
A connection to redux devtools is automatically made, you can debug and time travel out of the box. Not all functionalities are implemented at this time. Open an issue or PR if you need something else.

---

### Using Selectors

You can use `createSelector` from [reselect](https://github.com/reduxjs/reselect) and the custom hook `useSelector`.
```typescript
// you can also get the state type, so your selector will be type safe
type IState = ReturnType<typeof TodosStore.useState>
export const selectUnsavedTodos = createSelector(
    (s: IState) => s.todos,
    (todos) => {
      return todos.filter(t => !t.saved)
    }
)
const ChildComponent = () => {
  const unsavedTodos = TodosStore.useSelector(selectUnsavedTodos)
}
```
Remember to return an existing value from the input selectors functions (the first functions of the selector)

```typescript
// WRONG - The object is created at every call, and not memoized.
selectDuplicateTodo: createSelector(
    (s: IState) => ({todos: s.todos, todo: s.todo}),
    ({todos, todo}) => getDuplicates(todos, todo)
)
// CORRECT - Will only evaluate when todos or todo changes
selectDuplicateTodo: createSelector(
    (s: IState) => s.todos,
    (s: IState) => s.todo,
    (todos, todo) => getDuplicates(todos, todo)
)
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
