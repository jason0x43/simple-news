import { useEffect, useState } from 'react';
import { MdOutlineClose } from 'react-icons/md';
import { unescapeHtml } from '~/lib/util';
import type { ArticleWithUserData } from '~/models/article.server';

const target = 'SimpleNews_ArticleView';

type ArticleProps = {
  article: ArticleWithUserData | null;
  onClose?: () => void;
};

export default function ArticleView(props: ArticleProps) {
  const { article, onClose } = props;
  const [className, setClassName] = useState('Article');

  useEffect(() => {
    if (article) {
      // Add the visible class when an article is being displayed. On mobile
      // this will cause the article to transition in from the right.
      setClassName('Article Article-visible');
    } else {
      setClassName('Article');
    }
  }, [article]);

  const handleTransitionEnd = () => {
    if (className === 'Article') {
      // If the className is Article at the end of a transition, it means
      // Article-visible was removed, so the article should be deselected.
      onClose?.();
    }
  };

  return (
    <div className={className} onTransitionEnd={handleTransitionEnd}>
      <div className="Article-scroller">
        <div className="Article-header">
          <a href={article?.link ?? undefined} target={target}>
            <h2>{article?.title}</h2>
          </a>
        </div>
        <div
          className="Article-content"
          onClick={(event) => {
            event.preventDefault();
            const elem = event.target as HTMLElement;
            const href = elem.getAttribute('href') ?? undefined;
            if (href) {
              globalThis.open(href, target);
            }
          }}
          dangerouslySetInnerHTML={{
            __html: unescapeHtml(article?.content ?? ''),
          }}
        />
      </div>
      <div className="Article-close" onClick={() => setClassName('Article')}>
        <MdOutlineClose width={22} />
      </div>
    </div>
  );
}
