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
  const touchStart = useRef<number>();
  const touchX = useRef<number>();
  const width = useRef<number>();
  const [className, setClassName] = useState("Article");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    if (article) {
      // Add the visible class when an article is being displayed. On mobile
      // this will cause the article to transition in from the right.
      setClassName("Article Article-visible");
    }
  }, [article]);

  const handleTransitionEnd = () => {
    if (className === "Article") {
      // If the className is Article at the end of a transition, it means
      // Article-visible was removed, so the article should be deselected.
      dispatch(setSelectedArticle(undefined));
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const x = event.touches[0].clientX;
    width.current = articleRef.current!.offsetWidth;

    if (x / width.current < 0.30) {
      // The user started a touch at the left side of the article -- assume this
      // might be a drag.
      touchStart.current = x;
      articleRef.current!.style.transitionProperty = 'none';
      scrollRef.current!.style.overflow = 'hidden';
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === undefined) {
      return;
    }

    const newX = event.touches[0].clientX;
    const delta = newX - touchStart.current;

    if (delta / width.current! > 0.75) {
      // The user has dragged the article more than 3/4 of the way across the
      // screen -- assume they want to close it (and do that).
      handleTouchEnd();
      setClassName('Article');
    } else {
      // The user is dragging the article horizontally -- update its position.
      articleRef.current!.style.transform = `translate3d(${delta}px, 0, 0)`;
    }
  };

  const handleTouchEnd = () => {
    if (touchStart.current !== undefined) {
      // If a drag was active, reset all the style properties we might have
      // overridden.
      articleRef.current!.style.transitionProperty = '';
      articleRef.current!.style.transform = '';
      scrollRef.current!.style.overflow = '';
      touchStart.current = undefined;
    }
  };

  return (
    <div
      className={className}
      ref={articleRef}
      onTransitionEnd={handleTransitionEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="Article-header-wrapper">
        <div className="Article-header">
          <a href={article?.link} target={target}>
            <h2>{article?.title}</h2>
          </a>
          <div
            className="Article-close"
            onClick={() => setClassName("Article")}
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
