var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useReducer, createContext, useContext, useRef, useEffect, useCallback, } from 'react';
import produce from 'immer';
function createSimpleStore(initialState, actionsMap, additionalProps) {
    var StateContext = createContext(null);
    var DispatchContext = createContext(null);
    var asyncActionsMap = (additionalProps === null || additionalProps === void 0 ? void 0 : additionalProps.thunks) || [];
    var options = (additionalProps === null || additionalProps === void 0 ? void 0 : additionalProps.options) || { cache: { location: '', key: '' } };
    if (options.cache && !options.cache.location)
        options.cache.location = 'LOCALSTORAGE';
    var reducer = function (state, action) {
        var type = action.type, payload = action.payload;
        if (type === '__REDUX_DEVTOOLS_RELOAD__')
            return payload;
        if (type === '__INITIALIZE_STATE__')
            return payload;
        var nextState = produce(state, function (draftState) { return actionsMap[type](draftState, payload); });
        return nextState;
    };
    var useReduxDevtools = function (name, handleDispatchReduxDevtools) {
        var _a;
        var isBrowser = typeof window !== 'undefined';
        var reduxDevtoolsExtension = React.useRef(isBrowser ? (_a = window === null || window === void 0 ? void 0 : window.__REDUX_DEVTOOLS_EXTENSION__) !== null && _a !== void 0 ? _a : null : null);
        var connection = React.useRef();
        useEffect(function () {
            var _a, _b;
            if (!reduxDevtoolsExtension.current)
                return;
            var reduxDev = reduxDevtoolsExtension.current;
            connection.current = reduxDev.connect({
                name: name,
            });
            (_a = connection.current) === null || _a === void 0 ? void 0 : _a.init(initialState);
            (_b = connection.current) === null || _b === void 0 ? void 0 : _b.subscribe(handleDispatchReduxDevtools);
            return function () {
                if (!reduxDevtoolsExtension.current)
                    return;
                reduxDev(connection.current);
            };
        }, [handleDispatchReduxDevtools, name]);
        var send = React.useCallback(function (action, props) {
            var _a;
            if (!reduxDevtoolsExtension.current)
                return;
            (_a = connection.current) === null || _a === void 0 ? void 0 : _a.send(action, props);
        }, []);
        return React.useMemo(function () { return ({
            send: send,
        }); }, [send]);
    };
    var Provider = function (_a) {
        var children = _a.children, init = _a.init;
        var initialOrCachedState = _getInitialState({ initialState: initialState, cache: options.cache });
        var _b = useReducer(reducer, initialOrCachedState), reducerState = _b[0], reducerDispatch = _b[1];
        var reducerStateRef = useRef(reducerState);
        var handleDispatchReduxDevtools = useCallback(function (_a) {
            var type = _a.type, state = _a.state, payload = _a.payload;
            if (type !== 'DISPATCH')
                return;
            switch (payload.type) {
                case 'COMMIT':
                case 'RESET':
                case 'ROLLBACK':
                case 'JUMP_TO_STATE':
                case 'JUMP_TO_ACTION':
                    var _ = reducerDispatch({
                        type: '__REDUX_DEVTOOLS_RELOAD__',
                        payload: JSON.parse(state),
                    });
            }
        }, []);
        var reduxDevtools = useReduxDevtools('Store', handleDispatchReduxDevtools);
        useEffect(function () {
            var _a;
            reducerStateRef.current = reducerState;
            if ((_a = options.cache) === null || _a === void 0 ? void 0 : _a.key) {
                var _b = options.cache, location_1 = _b.location, key = _b.key;
                _saveCache({ location: location_1, key: key, state: reducerState });
            }
        }, [reducerState]);
        var DispatchWrapper = React.useCallback(function (actionOrAsyncAction) {
            var _getNextStateAndSendToDevtools = function (action) {
                var nextState = reducer(__assign({}, reducerStateRef.current), action);
                reduxDevtools.send(action, nextState);
            };
            if (typeof actionOrAsyncAction === 'function') {
                var asyncAction = actionOrAsyncAction;
                reduxDevtools.send(asyncAction, reducerStateRef.current);
                return asyncAction(function (action) {
                    _getNextStateAndSendToDevtools(action);
                    return reducerDispatch(action);
                }, function () { return reducerStateRef.current; });
            }
            var action = actionOrAsyncAction;
            _getNextStateAndSendToDevtools(action);
            return reducerDispatch(action);
        }, [reduxDevtools]);
        useEffect(function () {
            if (init)
                init(DispatchWrapper);
        }, [DispatchWrapper, init]);
        return (React.createElement(StateContext.Provider, { value: reducerState },
            React.createElement(DispatchContext.Provider, { value: DispatchWrapper }, children)));
    };
    var GetState = function (_a) {
        var children = _a.children;
        var s = useState();
        return children(s);
    };
    var useState = function () { return useContext(StateContext); };
    var useDispatch = function () { return useContext(DispatchContext); };
    var actions = _createActionsFromActionMap(actionsMap);
    var useSelector = function (selector) {
        var state = useState();
        return selector(state);
    };
    function createInitializer(Component) {
        return function initializer(props) {
            initialState = __assign(__assign({}, initialState), props.initialValues);
            return React.createElement(Provider, { children: React.createElement(Component, null) });
        };
    }
    return {
        useState: useState,
        useDispatch: useDispatch,
        useSelector: useSelector,
        Provider: Provider,
        GetState: GetState,
        thunks: asyncActionsMap,
        actions: actions,
        createInitializer: createInitializer,
    };
}
function _createActionsFromActionMap(actionsMap) {
    var actions = {};
    Object.keys(actionsMap).forEach(function (k) {
        actions[k] = function (payload) { return ({ type: k, payload: payload }); };
    });
    return actions;
}
function _saveCache(_a) {
    var location = _a.location, key = _a.key, state = _a.state;
    if (location === 'LOCALSTORAGE') {
        localStorage.setItem(key, JSON.stringify(state));
    }
    else if (location === 'SESSIONSTORAGE') {
        sessionStorage.setItem(key, JSON.stringify(state));
    }
}
function _getInitialState(_a) {
    var initialState = _a.initialState, cache = _a.cache;
    if ((cache === null || cache === void 0 ? void 0 : cache.key) && (cache === null || cache === void 0 ? void 0 : cache.location) === 'LOCALSTORAGE') {
        var state = localStorage.getItem(cache.key);
        if (state && state !== 'undefined')
            return JSON.parse(state);
    }
    if ((cache === null || cache === void 0 ? void 0 : cache.key) && (cache === null || cache === void 0 ? void 0 : cache.location) === 'SESSIONSTORAGE') {
        var state = sessionStorage.getItem(cache.key);
        if (state && state !== 'undefined')
            return JSON.parse(state);
    }
    return initialState;
}
export { createSimpleStore };
