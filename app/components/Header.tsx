import type { Feed } from '@prisma/client';
import { Link } from '@remix-run/react';
import { getFeedsFromUser, useUser } from '~/lib/util';
import type { FeedGroupWithFeeds } from '~/models/feedGroup.server';

type HeaderProps = {
  selectedFeedIds: string[] | undefined;
  onTitlePress: () => void;
  toggleSidebar: () => void;
};

const getFeedsTitle = (
  feedGroups: FeedGroupWithFeeds[] | undefined,
  feeds: Feed[] | undefined,
  selectedFeedIds: string[] | undefined
) => {
  if (
    !selectedFeedIds ||
    selectedFeedIds.length === 0 ||
    !feeds ||
    !feedGroups
  ) {
    return undefined;
  }

  if (selectedFeedIds.length === 1) {
    for (const feed of feeds) {
      if (feed.id === selectedFeedIds[0]) {
        return feed.title;
      }
    }
  } else if (selectedFeedIds.length > 1) {
    for (const group of feedGroups) {
      for (const groupFeed of group.feeds) {
        if (groupFeed.feed.id === selectedFeedIds[0]) {
          return group.name;
        }
      }
    }
  }

  return undefined;
};

export default function Header(props: HeaderProps) {
  const user = useUser();
  const feeds = getFeedsFromUser(user);
  const { onTitlePress, toggleSidebar, selectedFeedIds } = props;
  const title = getFeedsTitle(user.feedGroups, feeds, selectedFeedIds);

  return (
    <header className="Header">
      <div className="Header-left" onClick={toggleSidebar}>
        <svg width="22" height="22" version="2.0">
          <use href="#sn-logo" />
        </svg>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2 onClick={onTitlePress}>{title}</h2>
      </div>
      <div className="Header-right">
        <Link className="Header-user" to="/login">
          {user?.username}
        </Link>
      </div>
    </header>
  );
}
