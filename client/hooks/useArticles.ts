import { useContext } from "../deps.ts";
import ArticlesContext from "../contexts/ArticlesContext.tsx";

export default function useArticles() {
  return useContext(ArticlesContext);
}
