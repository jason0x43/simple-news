/// <reference lib="dom" />

import { React, useCallback, useEffect, useRef, useState } from "../deps.ts";
import { useArticles, useContextMenu } from "../contexts/mod.tsx";
import Article from "./Article.tsx";
import Button from "./Button.tsx";

const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const { articles } = useArticles();
  const selectedRef = useRef<HTMLDivElement>(null);
  const { hideContextMenu } = useContextMenu();

  const handleSelect = useCallback((selected: number) => {
    hideContextMenu();
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  useEffect(() => {
    if (selectedRef.current && selectedArticle !== undefined) {
      selectedRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedArticle, selectedRef.current]);

  return (
    <div className="Articles">
      {articles?.length ?? 0 > 0
        ? (
          <>
            <ul className="Articles-list">
              {articles?.map((
                article,
              ) => (
                <li
                  className="Articles-article"
                  key={article.id}
                  data-article-id={article.id}
                >
                  <Article
                    ref={selectedArticle === article.id
                      ? selectedRef
                      : undefined}
                    article={article}
                    selectArticle={handleSelect}
                    selectedArticle={selectedArticle}
                  />
                </li>
              ))}
            </ul>
            <div className="Articles-controls">
              <Button label="Mark all read" size="large" />
            </div>
          </>
        )
        : <h3 className="Articles-empty">Nothing to see here</h3>}
    </div>
  );
};

export default Articles;
