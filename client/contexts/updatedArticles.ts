import { createContextValue } from "./util.tsx";

const context = createContextValue<number[]>([]);
export const UpdatedArticlesProvider = context.Provider;
export const useUpdatedArticles = context.useValue;
export const useUpdatedArticlesSetter = context.useSetter;

