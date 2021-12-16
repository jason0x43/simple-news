import { React } from "../deps.ts";
import { Article } from "../../types.ts";
import { unescapeHtml } from "../../util.ts";

export interface ArticleProps {
  article: Article;
}

const Article: React.FC<ArticleProps> = (props) => {
  const { article } = props;

  return (
    <div className="Article">
      <div className="Article-inner">
        <a
          className="Article-header"
          href={article.link}
          target={"_blank"}
        >
          {article.title}
        </a>
        <div
          className="Article-content"
          dangerouslySetInnerHTML={{
            __html: unescapeHtml(article.content ?? ""),
          }}
        />
      </div>
    </div>
  );
};

export default Article;
