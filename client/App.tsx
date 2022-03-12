import React, { useCallback, useEffect, useRef, useState } from "react";
import { ContextMenuProvider } from "./components/ContextMenu.tsx";
import Feeds from "./components/Feeds.tsx";
import Articles from "./components/Articles.tsx";
import Header from "./components/Header.tsx";
import Article, { ArticleRef } from "./components/Article.tsx";
import Button from "./components/Button.tsx";
import ButtonSelector from "./components/ButtonSelector.tsx";
import Input from "./components/Input.tsx";
import type { Feed, User } from "../types.ts";
import type { Settings } from "./types.ts";
import { className } from "./util.ts";
import { useAppVisibility } from "./hooks.ts";
import { useAppDispatch, useAppSelector } from "./store/mod.ts";
import {
  selectSelectedArticle,
  selectSettings,
  selectSidebarActive,
  selectUpdating,
} from "./store/uiSelectors.ts";
import { loadArticles, updateFeeds } from "./store/articles.ts";
import { selectUser, selectUserError } from "./store/userSelectors.ts";
import { restoreUiState, setSidebarActive } from "./store/ui.ts";
import { signin } from "./store/user.ts";
import { selectSelectedFeeds } from "./store/articlesSelectors.ts";

export function getFeedsTitle(
  user: User,
  feeds: Feed[] | undefined,
  selectedFeeds: number[] | undefined,
) {
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
}

const LoggedIn: React.FC = () => {
  const sidebarActive = useAppSelector(selectSidebarActive);
  const visibility = useAppVisibility();
  const selectedFeeds = useAppSelector(selectSelectedFeeds);
  const updating = useAppSelector(selectUpdating);
  const settings = useAppSelector(selectSettings);
  const selectedArticle = useAppSelector(selectSelectedArticle);
  const dispatch = useAppDispatch();
  const visibilityRef = useRef(visibility);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<ArticleRef>(null);

  const handleTitlePress = useCallback(() => {
    articleRef.current?.resetScroll();
  }, []);

  useEffect(() => {
    dispatch(restoreUiState());
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        sidebarActive && !sidebarRef.current!.contains(event.target as Node)
      ) {
        dispatch(setSidebarActive(false));
      }
    };

    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, [sidebarActive]);

  // Fetch updated data in the background every few minutes
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(loadArticles());
    }, 600000);

    return () => {
      clearInterval(interval);
    };
  }, [dispatch, selectedFeeds]);

  // Fetch updated data when the app becomes visible
  useEffect(() => {
    if (visibility && !visibilityRef.current) {
      console.log("app became visible");
      dispatch(loadArticles());
    }
    visibilityRef.current = visibility;
  }, [visibility]);

  return (
    <ContextMenuProvider>
      <div className="App-header">
        <Header onTitlePress={handleTitlePress} />
      </div>
      <div className="App-content">
        <div className="App-sidebar" data-active={sidebarActive}>
          <div className="App-sidebar-feeds" ref={sidebarRef}>
            <Feeds />
          </div>
          <div className="App-sidebar-controls">
            <Button
              size="small"
              disabled={updating}
              label="Update feeds"
              onClick={() => updateFeeds()}
            />
          </div>
          <div className="App-sidebar-settings">
            <ButtonSelector
              options={[
                { value: "unread", label: "Unread" },
                { value: "all", label: "All" },
                { value: "saved", label: "Saved" },
              ]}
              size="small"
              selected={settings.articleFilter}
              onSelect={(value) => {
                const articleFilter = value as Settings["articleFilter"];
                dispatch({ type: "setSettings", payload: { articleFilter } });
              }}
            />
          </div>
        </div>
        <div
          className={className("App-articles", {
            "App-articles-viewing": selectedArticle !== undefined,
          })}
        >
          <Articles />
          <Article ref={articleRef} />
        </div>
      </div>
    </ContextMenuProvider>
  );
};

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectUserError);

  const doSignin = () => {
    dispatch(signin({ username, password }));
  };

  const handleKey = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      doSignin();
    }
  };

  return (
    <form className="Login" onKeyDown={handleKey}>
      <Input placeholder="Username" value={username} onChange={setUsername} />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <Button label="Login" onClick={doSignin} />

      {error && <div className="LoginError">{error}</div>}
    </form>
  );
};

const App: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="App">
      {user ? <LoggedIn /> : <Login />}
    </div>
  );
};

export default App;
