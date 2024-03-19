import React from 'react';
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__: any;
    }
}
type ActionMap<S> = {
    [action: string]: (state: S, payload?: any) => void | S;
};
type GetFnWithParamType<O, S> = ((S: any, payload: any) => any) extends O ? O extends (...args: [S, infer P]) => any ? (payload: P) => any : never : () => any;
type GetTypeSecondParam<O, S> = ((S: any, payload: any) => any) extends O ? O extends (...args: [S, infer P]) => any ? P : never : never;
type GetActionTypes<AM, S> = {
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
    Provider: ({ children, init, }: {
        children: React.ReactNode;
        init?: (dispatch: TDispatch & TAsyncDispatch) => any;
    }) => JSX.Element;
    GetState: ({ children }: {
        children: (state: TState) => JSX.Element;
    }) => JSX.Element;
    thunks: TAscynActionMap;
    actions: TActions;
    useSelector: <TSelector extends (...args: any[]) => any>(selector: TSelector) => ReturnType<TSelector>;
    createInitializer: (element: () => JSX.Element) => (props: {
        initialValues: Partial<TState>;
    }) => any;
};
export { createSimpleStore };
