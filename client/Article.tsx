import { datetime, React, useCallback, useMemo, useState } from "./deps.ts";
import { Article as ArticleType } from "../types.ts";

function pluralize(str: string, val: number): string {
  return `${str}${val === 1 ? "" : "s"}`;
}

function getAge(timestamp: number | undefined): string {
  if (timestamp === undefined) {
    return "?";
  }

  const date0 = new Date();
  const date1 = new Date(timestamp);
  const diff = datetime.difference(date0, date1, {
    units: ["hours", "days", "weeks"],
  });
  if (diff.weeks) {
    return `${diff.weeks} ${pluralize("week", diff.weeks)}`;
  }
  if (diff.days) {
    return `${diff.days} ${pluralize("day", diff.days)}`;
  }
  return `${diff.hours} ${pluralize("hour", diff.hours ?? 0)}`;
}

export interface ArticleProps {
  article: ArticleType;
  selectedArticle: number | undefined;
  selectArticle: (id: number) => void;
}

const Article: React.FC<ArticleProps> = (props) => {
  const { article, selectArticle, selectedArticle } = props;

  const content = useMemo(() => {
    let text = article.content ?? article.summary;
    if (text) {
      text = text.replace(/&lt;/g, "<");
      text = text.replace(/&gt;/g, ">");
      text = text.replace(/&amp;/g, "&");
    }

    const link = article.link;
    if (link) {
      // @ts-ignore: no document in Deno
      const div = document.createElement("div");
      div.innerHTML = text;
      const imgs = div.querySelectorAll("img");
      imgs.forEach(
        (
          img: {
            src: string;
            getAttribute: (name: string) => string;
            setAttribute: (name: string, value: string) => void;
          },
        ) => {
          const src = img.getAttribute("src");
          const newSrc = `${new URL(src, link)}`;
          img.src = newSrc;
        },
      );
      return div.innerHTML;
    }

    return text;
  }, [article]);

  const handleSelect = useCallback(() => {
    selectArticle(article.id);
  }, [article, selectedArticle]);

  return (
    <div className="Article">
      <div className="Article-heading" onClick={handleSelect}>
        <div className="Article-title">{article.title}</div>
        <div className="Article-age">{getAge(article.published)}</div>
      </div>
      {selectedArticle === article.id && (
        <div
          className="Article-content"
          dangerouslySetInnerHTML={{ __html: content ?? "" }}
        />
      )}
    </div>
  );
};

export default Article;
