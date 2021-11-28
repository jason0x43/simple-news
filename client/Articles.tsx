import { React, useState } from "./deps.ts";
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

  return (
    <ul className="Articles">
      {toShow.map((article) => (
        <li className="Articles-article" key={article.id}>
          <Article
            article={article}
            selectArticle={setSelectedArticle}
            selectedArticle={selectedArticle}
          />
        </li>
      ))}
    </ul>
  );
};

export default Articles;
