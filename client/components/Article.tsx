import React, { useEffect, useRef, useState } from "react";
import { Article } from "../../types.ts";
import { unescapeHtml } from "../../util.ts";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { setSelectedArticle } from "../store/ui.ts";
import { selectSelectedArticle } from "../store/uiSelectors.ts";

const target = "SimpleNews_ArticleView";

const Article: React.FC = () => {
  const article = useAppSelector(selectSelectedArticle);
  const dispatch = useAppDispatch();
  const articleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [className, setClassName] = useState("Article");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    if (article) {
      setClassName('Article Article-visible');
    }
  }, [article]);

  useEffect(() => {
    const articleNode = articleRef.current;
    if (!articleNode) {
      return;
    }

    const handleEnd = () => {
      if (className === 'Article') {
        dispatch(setSelectedArticle(undefined));
      }
    };

    articleNode.addEventListener('transitionend', handleEnd);

    return () => {
      articleNode.removeEventListener('transitionend', handleEnd);
    };
  }, [className]);

  return (
    <div className={className} ref={articleRef}>
      <div className="Article-header-wrapper">
        <div className="Article-header">
          <a href={article?.link} target={target}>
            <h2>{article?.title}</h2>
          </a>
          <div
            className="Article-close"
            onClick={() => setClassName('Article')}
          >
            ×
          </div>
        </div>
      </div>
      <div className="Article-scroller" ref={scrollRef}>
        <div
          className="Article-content"
          onClick={(event) => {
            event.preventDefault();
            const elem = event.target as HTMLElement;
            const href = elem.getAttribute("href") ?? undefined;
            if (href) {
              globalThis.open(href, target);
            }
          }}
          dangerouslySetInnerHTML={{
            __html: unescapeHtml(article?.content ?? ""),
          }}
        />
      </div>
    </div>
  );
};

export default Article;
