import { useContext } from "../deps.ts";
import ArticlesContext from "../ArticlesContext.tsx";

export default function useArticles() {
  return useContext(ArticlesContext);
}
