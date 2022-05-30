import {
  json,
  type ActionFunction,
  type LoaderFunction,
} from '@remix-run/node';
import { Outlet, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback, useState } from 'react';
import Button from '~/components/Button';
import ButtonSelector from '~/components/ButtonSelector';
import { ContextMenuProvider } from '~/components/ContextMenu';
import FeedsList from '~/components/FeedsList';
import Header from '~/components/Header';
import { getFeedsFromUser, useSelectedFeedIds } from '~/lib/util';
import { getFeedStats } from '~/models/feed.server';
import { commitSession, getSession, getUser } from '~/session.server';

export type ArticleFilter = 'all' | 'unread' | 'saved';

export type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  feeds: Awaited<ReturnType<typeof getFeedsFromUser>>;
  feedStats: Awaited<ReturnType<typeof getFeedStats>>;
  articleFilter: ArticleFilter | undefined;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  const feeds = getFeedsFromUser(user);
  const feedStats = await getFeedStats(feeds);
  const session = await getSession(request);
  return json<LoaderData>({
    user,
    feeds,
    feedStats,
    articleFilter: session.data.articleFilter,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const articleFilter = formData.get('articleFilter');
  if (articleFilter) {
    const session = await getSession(request);
    session.set('articleFilter', articleFilter);
    commitSession(session);
  }
  return null;
};

export default function Reader() {
  const { user, feedStats, articleFilter } = useLoaderData<LoaderData>();
  const selectedFeedIds = useSelectedFeedIds();
  const [sidebarVisible, setSidebarVisible] = useState(
    selectedFeedIds.length === 0
  );
  const fetcher = useFetcher();

  const handleTitlePress = useCallback(() => {}, []);

  return (
    <ContextMenuProvider>
      <div className="App-header">
        <Header
          selectedFeedIds={selectedFeedIds}
          onTitlePress={handleTitlePress}
          toggleSidebar={() => {
            setSidebarVisible(!sidebarVisible);
          }}
        />
      </div>
      <div className="App-content">
        <div className="App-sidebar" data-visible={sidebarVisible}>
          <div className="App-sidebar-feeds">
            <FeedsList
              user={user}
              feedStats={feedStats}
              articleFilter={articleFilter ?? 'all'}
              onSelect={() => {
                setSidebarVisible(false);
                // setSelectedArticle(undefined);
              }}
            />
          </div>
          <div className="App-sidebar-controls">
            <Button size="small" label="Update feeds" />
          </div>
          <div className="App-sidebar-settings">
            <ButtonSelector
              options={[
                { value: 'unread', label: 'Unread' },
                { value: 'all', label: 'All' },
                { value: 'saved', label: 'Saved' },
              ]}
              size="small"
              selected={articleFilter ?? 'all'}
              onSelect={(value) => {
                const articleFilter = value as ArticleFilter;
                fetcher.submit({ articleFilter }, { method: 'post' });
              }}
            />
          </div>
        </div>
        <div className="App-articles">
          <Outlet />
        </div>
      </div>
    </ContextMenuProvider>
  );
}
