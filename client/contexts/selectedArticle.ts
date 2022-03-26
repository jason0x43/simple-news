import { createPersistedContextValue } from "./util.tsx";

const context = createPersistedContextValue<
  | number
  | undefined
>("selectedArticle", undefined, { storageType: 'cookie' });
export const SelectedArticleProvider = context.Provider;
export const useSelectedArticle = context.useValue;
export const useSelectedArticleSetter = context.useSetter;
