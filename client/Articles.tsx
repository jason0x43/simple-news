import { React, useCallback, useState } from "./deps.ts";
import useArticles from "./hooks/useArticles.ts";
import Article from "./Article.tsx";

const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const { articles } = useArticles();

  const handleSelect = useCallback((selected: number) => {
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  return (
    <ul className="Articles">
      {articles?.map((article) => (
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
