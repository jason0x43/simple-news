import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../types.ts";
import { AppState } from "./mod.ts";

export type UserState = {
  user: User | undefined;
};

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
  },
});

export default userSlice.reducer;

export const { setUser } = userSlice.actions;

export const selectUser = (state: AppState) => state.user.user;

