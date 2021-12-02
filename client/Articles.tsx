import { React, useEffect, useCallback, useRef, useState } from "./deps.ts";
import useArticles from "./hooks/useArticles.ts";
import Article from "./Article.tsx";

const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const { articles } = useArticles();
  const selectedRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((selected: number) => {
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  useEffect(() => {
    if (selectedRef.current && selectedArticle !== undefined) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedArticle, selectedRef.current]);

  return (
    <ul className="Articles">
      {articles?.map((article) => (
        <li className="Articles-article" key={article.id}>
          <Article
            ref={selectedArticle === article.id ? selectedRef : undefined}
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
