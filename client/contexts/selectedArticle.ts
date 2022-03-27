import { createCookieContextValue } from "./util.tsx";

const context = createCookieContextValue<
  | number
  | undefined
>("selectedArticle", undefined);
export const SelectedArticleProvider = context.Provider;
export const useSelectedArticle = context.useValue;
export const useSelectedArticleSetter = context.useSetter;
