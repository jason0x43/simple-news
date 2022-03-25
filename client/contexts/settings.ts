import { Settings } from "../types.ts";
import { createPersistedContextValue } from "./util.tsx";

const context = createPersistedContextValue<Settings>("settings", {
  articleFilter: "unread",
});
export const SettingsProvider = context.Provider;
export const useSettings = context.useValue;
export const useSettingsSetter = context.useSetter;
