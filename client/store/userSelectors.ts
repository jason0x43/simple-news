import type { AppState } from './mod.ts';

export const selectUser = (state: AppState) => state.user.user;
