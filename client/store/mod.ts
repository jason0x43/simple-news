import { combineReducers, configureStore, Middleware } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import ui, { saveUiState } from "./ui.ts";
import articles from "./articles.ts";
import user from "./user.ts";

export const rootReducer = combineReducers({
  ui,
  articles,
  user,
});

export type AppState = ReturnType<typeof rootReducer>;

const errorLogoutMiddlware: Middleware<void, AppState> = () =>
  (next) =>
    (action) => {
      console.log("handling", action);
      next(action);
    };

const persistMiddleware: Middleware<void, AppState> = ({ getState }) =>
  (next) =>
    (action) => {
      const oldState = getState();
      next(action);
      const newState = getState();
      saveUiState(oldState, newState);
    };

export function createStore(preloadedState?: Partial<AppState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(errorLogoutMiddlware)
        .concat(persistMiddleware),
    preloadedState,
  });
}

type StoreType = ReturnType<typeof createStore>;
export type AppDispatch = StoreType["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

declare global {
  // deno-lint-ignore no-var
  var __PRELOADED_STATE__: AppState | undefined;
  // deno-lint-ignore no-var
  var __DEV__: boolean | undefined;
}
