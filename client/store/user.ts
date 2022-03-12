import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { LoginResponse, User } from "../../types.ts";
import { AppDispatch } from "./mod.ts";
import * as api from "../api.ts";
import { removeValue } from "../util.ts";

export type UserState = {
  user: User | undefined;
  error?: string;
};

export const signin = createAsyncThunk<
  LoginResponse,
  { username: string; password: string },
  { dispatch: AppDispatch }
>(
  "user/signin",
  async ({ username, password }, { dispatch }) => {
    dispatch(setError(undefined));
    try {
      const data = await api.login(username, password);
      dispatch(setUser(data.user));
      return data;
    } catch (error) {
      dispatch(setError(`${error}`));
      throw error;
    }
  },
);

export const signout = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>(
  "user/signout",
  async (_, { dispatch }) => {
    dispatch(setError(undefined));
    try {
      await api.logout();
      dispatch(setUser(undefined));
      removeValue('selectedArticle');
      removeValue('sidebarActive');
    } catch (error) {
      dispatch(setError(`${error}`));
      throw error;
    }
  },
);

const initialState: UserState = {
  user: undefined,
};

export const userSlice = createSlice({
  name: "user",

  initialState,

  reducers: {
    setUser: (
      state,
      action: PayloadAction<UserState["user"]>,
    ) => {
      state.user = action.payload;
    },
    setError: (
      state,
      action: PayloadAction<UserState["error"]>,
    ) => {
      state.error = action.payload;
    },
  },
});

export default userSlice.reducer;

const { setError } = userSlice.actions;

export const { setUser } = userSlice.actions;
