import React, { type VFC } from "react";
import { Feed, User } from "../../types.ts";
import { useFeeds, useSignout, useUser } from "../queries/mod.ts";

type HeaderProps = {
  selectedFeeds: number[] | undefined;
  onTitlePress: () => void;
  toggleSidebar: () => void;
};

const getFeedsTitle = (
  user: User | null | undefined,
  feeds: Feed[] | undefined,
  selectedFeeds: number[] | undefined,
) => {
  if (
    !selectedFeeds || selectedFeeds.length === 0 || !feeds ||
    !user?.config?.feedGroups
  ) {
    return undefined;
  }

  if (selectedFeeds.length === 1) {
    for (const feed of feeds) {
      if (feed.id === selectedFeeds[0]) {
        return feed.title;
      }
    }
  } else if (selectedFeeds.length > 1) {
    for (const group of user?.config?.feedGroups) {
      for (const feed of group.feeds) {
        if (feed === selectedFeeds[0]) {
          return group.title;
        }
      }
    }
  }

  return undefined;
};

const Header: VFC<HeaderProps> = (props) => {
  const { onTitlePress, toggleSidebar, selectedFeeds } = props;
  const { data: user } = useUser();
  const { data: feeds } = useFeeds();
  const title = getFeedsTitle(user, feeds, selectedFeeds);
  const signout = useSignout();

  return (
    <header className="Header">
      <div
        className="Header-left"
        onClick={toggleSidebar}
      >
        <svg width="22" height="22" version="2.0">
          <use href="#sn-logo" />
        </svg>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2 onClick={onTitlePress}>{title}</h2>
      </div>
      <div className="Header-right">
        <span className="Header-user" onClick={() => signout.mutate()}>
          {user?.username}
        </span>
      </div>
    </header>
  );
};

export default Header;
