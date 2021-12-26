/// <reference lib="dom" />

import { React, useEffect, useRef } from "../deps.ts";
import { Article } from "../../types.ts";
import { unescapeHtml } from "../../util.ts";

export interface ArticleProps {
  article: Article;
  onClose: () => void;
}

const target = "SimpleNews_ArticleView";

const Article: React.FC<ArticleProps> = (props) => {
  const { article, onClose } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0;
    }
  }, [article]);

  return (
    <div className="Article">
      <div className="Article-header-wrapper">
        <div className="Article-header">
          <a href={article.link} target={target}>
            <h2>{article.title}</h2>
          </a>
          <div className="Article-close" onClick={onClose}>
            ×
          </div>
        </div>
      </div>
      <div className="Article-scroller" ref={ref}>
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
            __html: unescapeHtml(article.content ?? ""),
          }}
        />
      </div>
    </div>
  );
};

export default Article;
