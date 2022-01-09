import { React, useCallback, useEffect, useReducer, useState } from "./deps.ts";
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
import { className, toObject } from "./util.ts";

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
  if (!selectedFeeds || selectedFeeds.length === 0) {
    return undefined;
  }

  if (!feeds || !user?.config?.feedGroups) {
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

interface AppState {
  settings: Settings;
  feeds: Feed[] | undefined;
  sidebarActive: boolean;
  updating: boolean;
  articles: ArticleHeading[];
  feedStats: FeedStats | undefined;
  userArticles: { [articleId: number]: UserArticle };
  selectedFeeds: number[];
  selectedArticle: ArticleRecord | undefined;
  user: User;
}

function initState(props: LoggedInProps): AppState {
  return {
    settings: { articleFilter: "unread" },
    feeds: props.feeds,
    sidebarActive: false,
    updating: false,
    articles: props.articles ?? [],
    feedStats: props.feedStats,
    userArticles: props.userArticles
      ? toObject(props.userArticles, "articleId")
      : {},
    selectedFeeds: props.selectedFeeds ?? [],
    selectedArticle: undefined,
    user: props.user,
  };
}

type AppStateAction =
  | { type: "setSettings"; payload: Partial<Settings> }
  | { type: "setArticles"; payload: ArticleHeading[] }
  | { type: "setSelectedArticle"; payload: ArticleRecord | undefined }
  | { type: "setUserArticles"; payload: UserArticle[] }
  | { type: "setUserArticlesRead"; payload: { ids: number[]; read: boolean } }
  | { type: "setFeeds"; payload: Feed[] }
  | { type: "setFeedStats"; payload: FeedStats }
  | { type: "setSelectedFeeds"; payload: number[] | undefined }
  | { type: "setSidebarActive"; payload: boolean }
  | { type: "toggleSidebarActive" }
  | { type: "setUpdating"; payload: boolean };

function updateState(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "setSettings":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case "setFeeds":
      return {
        ...state,
        feeds: action.payload,
      };
    case "setSidebarActive":
      return {
        ...state,
        sidebarActive: action.payload,
      };
    case "toggleSidebarActive":
      return {
        ...state,
        sidebarActive: !state.sidebarActive,
      };
    case "setArticles":
      return {
        ...state,
        articles: action.payload,
      };
    case "setSelectedArticle":
      return {
        ...state,
        selectedArticle: action.payload,
      };
    case "setFeedStats":
      return {
        ...state,
        feedStats: action.payload,
      };
    case "setSelectedFeeds":
      return {
        ...state,
        selectedFeeds: action.payload ?? [],
      };
    case "setUpdating":
      return {
        ...state,
        updating: action.payload,
      };
    case "setUserArticles":
      return {
        ...state,
        userArticles: toObject(action.payload, "articleId"),
      };
    case "setUserArticlesRead": {
      const newUserArticles = { ...state.userArticles };
      for (const id of action.payload.ids) {
        newUserArticles[id] = {
          ...newUserArticles[id],
          read: action.payload.read,
        };
      }
      return { ...state, userArticles: newUserArticles };
    }
  }
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
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn("Error while selecting feeds:", error);
      }
    }
  };

  // Fetch articles for selected feeds every few minutes
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      if (!selectedFeeds) {
        return;
      }

      try {
        const [feedStats, articles, userArticles] = await Promise.all([
          getFeedStats(),
          getArticleHeadings(selectedFeeds),
          getUserArticles(selectedFeeds),
        ]);

        if (!cancelled) {
          dispatch({ type: "setArticles", payload: articles });
          dispatch({ type: "setUserArticles", payload: userArticles });
          dispatch({ type: "setFeedStats", payload: feedStats });
        }
      } catch (error) {
        if (shouldLogout(error)) {
          logout();
        } else {
          console.warn("Error during periodic update:", error);
        }
      }
    }, 600000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedFeeds]);

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

  const setArticlesRead = useCallback(
    async (articleIds: number[], read: boolean) => {
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
    },
    [],
  );

  const selectArticle = useCallback(async (articleId: number | undefined) => {
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
  }, []);

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

  const logout = useCallback(() => {
    location.href = "/login";
  }, []);

  return (
    <div className="App">
      {user
        ? (
          <ContextMenuProvider>
            <LoggedIn
              {...props}
              user={user}
              logout={logout}
            />
          </ContextMenuProvider>
        )
        : <Login setUser={() => location.href = "/"} />}
    </div>
  );
};

export default App;
