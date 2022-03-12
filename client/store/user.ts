import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { User } from "../../types.ts";
import { AppDispatch } from "./mod.ts";
import * as api from '../api.ts';

export type UserState = {
  user: User | undefined;
  error?: string;
};

export const signin = createAsyncThunk<
  void,
  { username: string; password: string },
  { dispatch: AppDispatch }
>(
  "user/signin",
  async ({ username, password }, { dispatch }) => {
    dispatch(setError(undefined));
    try {
      const user = await api.login(username, password);
      dispatch(setUser(user));
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
