import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { unescapeHtml } from "../../util.ts";
import { useArticle } from "../queries/mod.ts";

const target = "SimpleNews_ArticleView";

export type ArticleRef = {
  resetScroll: () => void;
};

type ArticleProps = {
  articleId: number | undefined;
  onClose: () => void;
}

const Article = forwardRef<ArticleRef, ArticleProps>((props, ref) => {
  const { articleId: selectedArticle, onClose } = props;
  const { data: article } = useArticle(selectedArticle);
  const articleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [className, setClassName] = useState("Article");

  useImperativeHandle(ref, () => ({
    resetScroll: () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
  }));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    if (article) {
      // Add the visible class when an article is being displayed. On mobile
      // this will cause the article to transition in from the right.
      setClassName("Article Article-visible");
    } else {
      setClassName("Article");
    }
  }, [article]);

  const handleTransitionEnd = () => {
    if (className === "Article") {
      // If the className is Article at the end of a transition, it means
      // Article-visible was removed, so the article should be deselected.
      onClose();
    }
  };

  return (
    <div
      className={className}
      ref={articleRef}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="Article-scroller" ref={scrollRef}>
        <div className="Article-header">
          <a href={article?.link} target={target}>
            <h2>{article?.title}</h2>
          </a>
        </div>
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
      <div
        className="Article-close"
        onClick={() => setClassName("Article")}
      >
        ×
      </div>
    </div>
  );
});

export default Article;
