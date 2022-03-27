import { ScrollData } from "../../types.ts";
import { createCookieContextValue } from "./util.tsx";

const context = createCookieContextValue<
  | ScrollData
  | undefined
>("scrollData", undefined);
export const ScrollDataProvider = context.Provider;
export const useScrollData = context.useValue;
export const useScrollDataSetter = context.useSetter;
