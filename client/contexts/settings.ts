import { Settings } from "../types.ts";
import { createLocalStorageContextValue } from "./util.tsx";

const context = createLocalStorageContextValue<Settings>("settings", {
  articleFilter: "unread",
});
export const SettingsProvider = context.Provider;
export const useSettings = context.useValue;
export const useSettingsSetter = context.useSetter;
