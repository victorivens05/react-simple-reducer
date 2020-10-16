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

export function createSimpleStore<
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
  > (initialState: TState, actionsMap: TActionMap, asyncActionsMap?: TAscynActionMap): ({
    useState: () => TState,
    useDispatch: () => TDispatch & TAsyncDispatch,
    Provider,
    GetState: ({ children }: {
      children: (state: TState) => any// anyJSX.Element
    }) => any, //JSX.Element,
    thunks: TAscynActionMap,
    actions: TActions,
  })
