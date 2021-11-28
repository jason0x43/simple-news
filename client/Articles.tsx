import { React, useCallback, useState } from "./deps.ts";
import useArticles from "./hooks/useArticles.ts";
import { Article as ArticleType } from "../types.ts";
import Article from "./Article.tsx";

export interface ArticlesProps {
  selectedFeeds?: number[];
}

const Articles: React.FC<ArticlesProps> = (props) => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const { articles } = useArticles();
  const { selectedFeeds } = props;

  const toShow = (selectedFeeds ?? []).reduce((allArticles, feed) => {
    const feedArticles = articles?.[feed] ?? [];
    return [...allArticles, ...feedArticles];
  }, [] as ArticleType[]);

  const handleSelect = useCallback((selected: number) => {
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  return (
    <ul className="Articles">
      {toShow.map((article) => (
        <li className="Articles-article" key={article.id}>
          <Article
            article={article}
            selectArticle={handleSelect}
            selectedArticle={selectedArticle}
          />
        </li>
      ))}
    </ul>
  );
};

export default Articles;
