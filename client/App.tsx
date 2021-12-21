import { React, useCallback, useEffect, useState } from "./deps.ts";
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

const LoggedIn: React.FC<LoggedInProps> = (props) => {
  const { user } = props;
  const [settings, setSettings] = useState<Settings>({
    articleFilter: "unread",
  });
  const [feeds, setFeeds] = useState(props.feeds);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [articles, setArticles] = useState(props.articles ?? []);
  const [feedStats, setFeedStats] = useState(props.feedStats);
  const [userArticles, setUserArticles] = useState(() =>
    props.userArticles ? toObject(props.userArticles, "articleId") : {}
  );
  const [selectedFeeds, setSelectedFeeds] = useState(props.selectedFeeds ?? []);
  const [selectedArticle, setSelectedArticle] = useState<
    | ArticleRecord
    | undefined
  >();

  const fetchFeedStats = async (signal?: { cancelled: boolean }) => {
    try {
      const stats = await getFeedStats();
      if (!signal?.cancelled) {
        setFeedStats(stats);
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
        setArticles(articles);
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
        setFeeds(feeds);
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
        setUserArticles(toObject(userArticles, "articleId"));
      }
    } catch (error) {
      console.error(`Error loading user articles: ${error.message}`);
    }
  };

  const selectFeeds = useCallback(async (feedIds: number[]) => {
    setSidebarActive(false);

    await Promise.all([
      fetchArticles({ feedIds }),
      fetchUserArticles({ feedIds }),
      fetchFeeds({ feedIds }),
    ]);

    setSelectedFeeds(feedIds);
    setSelectedArticle(undefined);
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
    setSidebarActive(!sidebarActive);
  }, [sidebarActive]);

  const handleUpdateFeeds = useCallback(async () => {
    try {
      setUpdating(true);
      await refreshFeeds();
      await fetchFeedStats();
      if (selectedFeeds) {
        await fetchArticles();
      }
    } catch (error) {
      console.warn(`Error updating feeds: ${error.message}`);
    } finally {
      setUpdating(false);
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

      setUserArticles(updatedUserArticles);
      fetchFeedStats();
    },
    [userArticles, setRead, fetchFeedStats],
  );

  const selectArticle = useCallback(async (articleId: number | undefined) => {
    if (articleId) {
      try {
        const article = await getArticle(articleId);
        setSelectedArticle(article);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSelectedArticle(undefined);
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
                setSettings({ ...settings, articleFilter });
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
              onClose={() => setSelectedArticle(undefined)}
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
