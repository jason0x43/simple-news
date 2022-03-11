import {
  combineReducers,
  configureStore,
  type Middleware,
} from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import ui, { saveUiState } from "./ui.ts";
import articles from "./articles.ts";
import user from "./user.ts";

export const rootReducer = combineReducers({
  ui,
  articles,
  user,
});

export type AppState = ReturnType<typeof rootReducer>;

const errorLogoutMiddlware: Middleware<unknown, AppState> = () =>
  (next) =>
    (action) => {
      // TODO: logout on auth error
      next(action);
    };

const persistMiddleware: Middleware<unknown, AppState> = ({ getState }) =>
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

export type AppDispatch = ReturnType<typeof createStore>["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
