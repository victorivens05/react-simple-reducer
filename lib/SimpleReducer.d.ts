/// <reference types="react" />
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__: any;
    }
}
declare type ActionMap<S> = {
    [action: string]: (state: S, payload?: any) => void | S;
};
declare type GetFnWithParamType<O, S> = ((S: any, payload: any) => any) extends O ? O extends (...args: [S, infer P]) => any ? (payload: P) => any : never : () => any;
declare type GetTypeSecondParam<O, S> = ((S: any, payload: any) => any) extends O ? O extends (...args: [S, infer P]) => any ? P : never : never;
declare type GetActionTypes<AM, S> = {
    [K in keyof AM]: ((S: any, payload: any) => any) extends AM[K] ? {
        type: K;
        payload: GetTypeSecondParam<AM[K], S>;
    } : {
        type: K;
    };
};
declare function createSimpleStore<TState extends Object, TActionMap extends ActionMap<TState>, TActionTypes extends GetActionTypes<TActionMap, TState>, TDispatch extends (action: TActionTypes[keyof TActionTypes]) => void, TAsyncDispatch extends (p: (dispatch: TDispatch, getState: () => TState) => Promise<any> | any) => void, TActions extends {
    [K in keyof TActionMap]: GetFnWithParamType<TActionMap[K], TState>;
}, TAscynActionMap extends {
    [asyncAction: string]: (...payload: any[]) => (dispatch: TDispatch, getState: () => TState) => void;
}, TOptions extends {
    cache?: {
        location?: 'LOCALSTORAGE' | 'SESSIONSTORAGE';
        key: string;
    };
}>(initialState: TState, actionsMap: TActionMap, additionalProps?: {
    thunks?: TAscynActionMap;
    options?: TOptions;
}): {
    useState: () => TState;
    useDispatch: () => TDispatch & TAsyncDispatch;
    Provider: ({ children, init }: {
        children: any;
        init?: (dispatch: TDispatch & TAsyncDispatch) => any;
    }) => JSX.Element;
    GetState: ({ children }: {
        children: (state: TState) => JSX.Element;
    }) => JSX.Element;
    thunks: TAscynActionMap;
    actions: TActions;
    useSelector: any;
};
export { createSimpleStore };
