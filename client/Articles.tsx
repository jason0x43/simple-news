/// <reference lib="dom" />

import { React, useCallback, useEffect, useRef, useState } from "./deps.ts";
import useArticles from "./hooks/useArticles.ts";
import Article from "./Article.tsx";
import useContextMenu from "./hooks/useContextMenu.ts";

const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const [contextPos, setContextPos] = useState<
    { x: number; y: number } | undefined
  >();
  const { articles } = useArticles();
  const selectedRef = useRef<HTMLDivElement>(null);
  const { showContextMenu, hideContextMenu } = useContextMenu();

  const handleSelect = useCallback((selected: number) => {
    hideContextMenu();
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  const handleContextSelect = useCallback((item: string) => {
    console.log("selected", item);
    hideContextMenu();
  }, []);

  const handleRightClick = useCallback((event: React.MouseEvent) => {
    showContextMenu({
      items: ["One", "Two"],
      position: { x: event.pageX, y: event.pageY },
      onSelect: handleContextSelect,
    });
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (selectedRef.current && selectedArticle !== undefined) {
      selectedRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedArticle, selectedRef.current]);

  return (
    <ul className="Articles">
      {articles?.map((article) => (
        <li
          className="Articles-article"
          key={article.id}
          onContextMenu={handleRightClick}
        >
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
