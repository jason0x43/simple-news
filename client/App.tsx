import React from "react";
import { ContextMenuProvider } from "./components/ContextMenu.tsx";
import Feeds from "./components/Feeds.tsx";
import Articles from "./components/Articles.tsx";
import Header from "./components/Header.tsx";
import Article from "./components/Article.tsx";
import Button from "./components/Button.tsx";
import ButtonSelector from "./components/ButtonSelector.tsx";
import Input from "./components/Input.tsx";
import {
  getArticle,
  getArticleHeadings,
  getFeeds,
  getFeedStats,
  getUserArticles,
  isResponseError,
  login,
  refreshFeeds,
  setRead,
} from "./api.ts";
import {
  Article as ArticleRecord,
  ArticleHeading,
  Feed,
  FeedStats,
  User,
  UserArticle,
} from "../types.ts";
import { Settings } from "./types.ts";
import { className, loadValue, storeValue } from "./util.ts";
import { initState, updateState } from "./appState.ts";
import { useAppVisibility } from "./hooks.ts";

const { useEffect, useReducer, useState } = React;

interface LoggedInProps {
  user: User;
  logout: () => void;
  feeds?: Feed[];
  feedStats?: FeedStats;
  articles?: ArticleHeading[];
  userArticles?: UserArticle[];
  selectedFeeds?: number[];
  selectedArticle?: ArticleRecord;
}

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

function shouldLogout(error: Error) {
  return isResponseError(error) && error.status === 403;
}

const LoggedIn: React.FC<LoggedInProps> = (props) => {
  const { logout } = props;
  const [state, dispatch] = useReducer(updateState, props, initState);
  const {
    articles,
    feedStats,
    settings,
    feeds,
    selectedFeeds,
    selectedArticle,
    sidebarActive,
    updating,
    user,
    userArticles,
  } = state;
  const visibility = useAppVisibility();

  // Restore parts of the app state if the app was refreshed
  useEffect(() => {
    const sbActive = loadValue<boolean>("sidebarActive");
    if (sbActive !== undefined) {
      dispatch({ type: "setSidebarActive", payload: sbActive });
    }

    const selArticle = loadValue<ArticleRecord>("selectedArticle");
    if (selArticle !== undefined) {
      dispatch({ type: "setSelectedArticle", payload: selArticle });
    }
  }, []);

  // Store some parts of the app state when the state updates
  useEffect(() => {
    storeValue("sidebarActive", state.sidebarActive);
    storeValue("selectedArticle", state.selectedArticle);
  }, [state.sidebarActive, state.selectedArticle]);

  // Fetch updated data for the current selected feeds and update the app state
  const fetchData = async (signal?: { cancelled: boolean }) => {
    try {
      const [feedStats, articles, userArticles] = await Promise.all([
        getFeedStats(),
        getArticleHeadings(selectedFeeds),
        getUserArticles(selectedFeeds),
      ]);

      if (!signal?.cancelled) {
        dispatch({ type: "setFeedStats", payload: feedStats });
        dispatch({ type: "setArticles", payload: articles });
        dispatch({ type: "setUserArticles", payload: userArticles });
      }
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn("Error during periodic update:", error);
      }
    }
  };

  // Fetch updated data in the background every few minutes
  useEffect(() => {
    const signal = { cancelled: false };

    const interval = setInterval(() => {
      fetchData(signal);
    }, 600000);

    return () => {
      signal.cancelled = true;
      clearInterval(interval);
    };
  }, [dispatch, logout, selectedFeeds]);

  // Fetch updated data when the app becomes visible
  useEffect(() => {
    if (visibility) {
      console.log("app became visible");
      fetchData();
    }
  }, [visibility]);

  const selectFeeds = async (feedIds: number[]) => {
    dispatch({ type: "setSidebarActive", payload: false });

    try {
      const [articles, userArticles, feeds] = await Promise.all([
        getArticleHeadings(feedIds),
        getUserArticles(feedIds),
        getFeeds(feedIds),
      ]);

      dispatch({ type: "setArticles", payload: articles });
      dispatch({ type: "setUserArticles", payload: userArticles });
      dispatch({ type: "setFeeds", payload: feeds });
      dispatch({ type: "setSelectedFeeds", payload: feedIds });
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn("Error while selecting feeds:", error);
      }
    }
  };

  const handleUpdateFeeds = async () => {
    try {
      dispatch({ type: "setUpdating", payload: true });
      await refreshFeeds();
      if (selectedFeeds) {
        const [feedStats, articles] = await Promise.all([
          getFeedStats(),
          getArticleHeadings(selectedFeeds),
        ]);
        dispatch({ type: "setFeedStats", payload: feedStats });
        dispatch({ type: "setArticles", payload: articles });
      } else {
        const feedStats = await getFeedStats();
        dispatch({ type: "setFeedStats", payload: feedStats });
      }
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn(`Error updating feeds: ${error.message}`);
      }
    } finally {
      dispatch({ type: "setUpdating", payload: false });
    }
  };

  const setArticlesRead = async (articleIds: number[], read: boolean) => {
    try {
      await setRead(articleIds, read);
      dispatch({
        type: "setUserArticlesRead",
        payload: { ids: articleIds, read },
      });
      const feedStats = await getFeedStats();
      dispatch({ type: "setFeedStats", payload: feedStats });
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn(`Error settings articles read: ${error.message}`);
      }
    }
  };

  const selectArticle = async (articleId: number | undefined) => {
    if (articleId) {
      try {
        const article = await getArticle(articleId);
        dispatch({ type: "setSelectedArticle", payload: article });
      } catch (error) {
        if (shouldLogout(error)) {
          logout();
        } else {
          console.warn(`Error getting article: ${error.message}`);
        }
      }
    } else {
      dispatch({ type: "setSelectedArticle", payload: undefined });
    }
  };

  return (
    <>
      <div className="App-header">
        <Header
          user={user}
          onShowSidebar={() => dispatch({ type: "toggleSidebarActive" })}
          title={getFeedsTitle(user, feeds, selectedFeeds)}
        />
      </div>
      <div className="App-content">
        <div className="App-sidebar" data-active={sidebarActive}>
          <div className="App-sidebar-feeds">
            <Feeds
              user={user}
              feeds={feeds}
              feedStats={feedStats}
              selectedFeeds={selectedFeeds}
              onSelectFeeds={selectFeeds}
              settings={settings}
            />
          </div>
          <div className="App-sidebar-controls">
            <Button
              size="small"
              disabled={updating}
              label="Update feeds"
              onClick={handleUpdateFeeds}
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
          <Articles
            articles={articles}
            userArticles={userArticles}
            feeds={feeds}
            selectedFeeds={selectedFeeds}
            settings={settings}
            selectedArticle={selectedArticle}
            setArticlesRead={setArticlesRead}
            onSelectArticle={selectArticle}
          />
          {selectedArticle && (
            <Article
              article={selectedArticle}
              onClose={() =>
                dispatch({ type: "setSelectedArticle", payload: undefined })}
            />
          )}
        </div>
      </div>
    </>
  );
};

interface LoginProps {
  setUser: (user: User) => void;
}

const Login: React.FC<LoginProps> = (props) => {
  const { setUser } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Error>();

  const handleLogin = async () => {
    try {
      const user = await login(email, password);
      setUser(user);
    } catch (error) {
      setError(error);
    }
  };

  return (
    <form className="Login">
      <Input placeholder="Email" value={email} onChange={setEmail} />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <Button label="Login" onClick={handleLogin} />

      {error && <div className="LoginError">{error.message}</div>}
    </form>
  );
};

export type AppProps = Partial<LoggedInProps>;

const App: React.FC<AppProps> = (props) => {
  const { user } = props;

  return (
    <div className="App">
      {user
        ? (
          <ContextMenuProvider>
            <LoggedIn
              {...props}
              user={user}
              logout={() => location.href = "/login"}
            />
          </ContextMenuProvider>
        )
        : <Login setUser={() => location.href = "/"} />}
    </div>
  );
};

export default App;
