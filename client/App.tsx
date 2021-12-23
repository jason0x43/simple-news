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
import { cancellableEffect, className, Signal, toObject } from "./util.ts";

interface LoggedInProps {
  user: User;
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
  userArticles: { [prop: string]: UserArticle };
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
    case "setUserArticlesRead":
      return {
        ...state,
        userArticles: Object.keys(state.userArticles).reduce(
          (articles, idStr) => {
            const id = Number(idStr);
            if (action.payload.ids.includes(id)) {
              articles[id] = {
                ...state.userArticles[id],
                read: action.payload.read,
              };
            } else {
              articles[id] = state.userArticles[id];
            }
            return articles;
          },
          {} as typeof state.userArticles,
        ),
      };
  }
}

const LoggedIn: React.FC<LoggedInProps> = (props) => {
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

  const fetchFeedStats = async (signal?: { cancelled: boolean }) => {
    try {
      const stats = await getFeedStats();
      if (!signal?.cancelled) {
        dispatch({ type: "setFeedStats", payload: stats });
      }
    } catch (error) {
      console.error(`Error loading feed stats: ${error.message}`);
    }
  };

  const fetchArticles = async (options?: {
    feedIds?: number[];
    signal?: Signal;
  }) => {
    try {
      const { feedIds = selectedFeeds, signal } = options ?? {};
      const articles = await getArticleHeadings(feedIds);
      if (!signal?.cancelled) {
        dispatch({ type: "setArticles", payload: articles });
      }
    } catch (error) {
      console.error(`Error loading feed stats: ${error.message}`);
    }
  };

  const fetchFeeds = async (options?: {
    feedIds?: number[];
    signal?: Signal;
  }) => {
    try {
      const { feedIds = selectedFeeds, signal } = options ?? {};
      const feeds = await getFeeds(feedIds);
      if (!signal?.cancelled) {
        dispatch({ type: "setFeeds", payload: feeds });
      }
    } catch (error) {
      console.error(`Error loading feeds: ${error.message}`);
    }
  };

  const fetchUserArticles = async (options?: {
    feedIds?: number[];
    signal?: Signal;
  }) => {
    try {
      const { feedIds = selectedFeeds, signal } = options ?? {};
      const userArticles = await getUserArticles(feedIds);
      if (!signal?.cancelled) {
        dispatch({ type: "setUserArticles", payload: userArticles });
      }
    } catch (error) {
      console.error(`Error loading user articles: ${error.message}`);
    }
  };

  const selectFeeds = useCallback(async (feedIds: number[]) => {
    dispatch({ type: "setSidebarActive", payload: false });

    await Promise.all([
      fetchArticles({ feedIds }),
      fetchUserArticles({ feedIds }),
      fetchFeeds({ feedIds }),
    ]);

    dispatch({ type: "setSelectedFeeds", payload: feedIds });
    dispatch({ type: "setSelectedArticle", payload: undefined });
  }, []);

  // Fetch articles for selected feeds every few minutes
  useEffect(() =>
    cancellableEffect((signal) => {
      const interval = setInterval(() => {
        if (!selectedFeeds) {
          return;
        }

        fetchFeedStats(signal);
        fetchArticles({ signal });
      }, 600000);

      return () => {
        clearInterval(interval);
      };
    }), [fetchFeedStats, fetchArticles, selectedFeeds]);

  const handleShowSidebar = useCallback(() => {
    dispatch({ type: "toggleSidebarActive" });
  }, [sidebarActive]);

  const handleUpdateFeeds = useCallback(async () => {
    try {
      dispatch({ type: "setUpdating", payload: true });
      await refreshFeeds();
      await fetchFeedStats();
      if (selectedFeeds) {
        await fetchArticles();
      }
    } catch (error) {
      console.warn(`Error updating feeds: ${error.message}`);
    } finally {
      dispatch({ type: "setUpdating", payload: false });
    }
  }, [fetchArticles, fetchFeedStats, refreshFeeds, selectedFeeds]);

  const setArticlesRead = useCallback(
    async (articleIds: number[], read: boolean) => {
      await setRead(articleIds, read);

      const updatedUserArticles = { ...userArticles };
      for (const id of articleIds) {
        updatedUserArticles[id] = {
          ...userArticles[id],
          read,
        };
      }

      dispatch({
        type: "setUserArticlesRead",
        payload: { ids: articleIds, read },
      });
      fetchFeedStats();
    },
    [userArticles, setRead, fetchFeedStats],
  );

  const selectArticle = useCallback(async (articleId: number | undefined) => {
    if (articleId) {
      try {
        const article = await getArticle(articleId);
        dispatch({ type: "setSelectedArticle", payload: article });
      } catch (error) {
        console.error(error);
      }
    } else {
      dispatch({ type: "setSelectedArticle", payload: undefined });
    }
  }, []);

  const feedsTitle = getFeedsTitle(user, feeds, selectedFeeds);

  return (
    <>
      <div className="App-header">
        <Header
          user={user}
          onShowSidebar={handleShowSidebar}
          title={feedsTitle}
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
            <LoggedIn {...props} user={user} />
          </ContextMenuProvider>
        )
        : <Login setUser={() => location.href = "/"} />}
    </div>
  );
};

export default App;
