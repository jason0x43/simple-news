import { React, useCallback, useEffect, useState } from "../deps.ts";
import { ContextMenuProvider } from "./ContextMenu.tsx";
import Feeds from "./Feeds.tsx";
import Articles from "./Articles.tsx";
import Header from "./Header.tsx";
import Button from "./Button.tsx";
import ButtonSelector from "./ButtonSelector.tsx";
import Input from "./Input.tsx";
import {
  getArticles,
  getFeedStats,
  login,
  refreshFeeds,
  setRead,
} from "../api.ts";
import { Article, FeedStats, User } from "../../types.ts";
import { Settings } from "../types.ts";

interface LoggedInProps {
  user: User;
  feedStats?: FeedStats;
  articles?: Article[];
  selectedFeeds?: number[];
}

type Signal = { cancelled: boolean };

function cancellableEffect(
  callback: (signal: Signal) => (void | (() => void)),
) {
  const signal = { cancelled: false };
  const cleanup = callback(signal);
  return () => {
    signal.cancelled = true;
    cleanup?.();
  };
}

export function getFeedsTitle(
  user: User | undefined,
  selectedFeeds: number[] | undefined,
) {
  if (!selectedFeeds || selectedFeeds.length === 0) {
    return undefined;
  }
  const feedGroups = user?.config?.feedGroups;

  if (!feedGroups) {
    return undefined;
  }

  if (selectedFeeds.length === 1) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === selectedFeeds[0]) {
          return feed.title;
        }
      }
    }
  } else if (selectedFeeds.length > 1) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === selectedFeeds[0]) {
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
  const [sidebarActive, setSidebarActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [articles, setArticles] = useState<Article[]>(
    props.articles ?? [],
  );
  const [feedStats, setFeedStats] = useState<
    | FeedStats
    | undefined
  >(props.feedStats);
  const [selectedFeeds, setSelectedFeeds] = useState<number[]>(
    props.selectedFeeds ?? [],
  );

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
      const articles = await getArticles(feedIds);
      if (!signal?.cancelled) {
        console.log("setting articles");
        setArticles(articles);
      }
    } catch (error) {
      console.error(`Error loading feed stats: ${error.message}`);
    }
  };

  const selectFeeds = useCallback((feedIds: number[]) => {
    setSidebarActive(false);
    setSelectedFeeds(feedIds);
    fetchArticles({ feedIds });
  }, []);

  useEffect(() => {
    return cancellableEffect((signal) => {
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
    });
  }, [selectedFeeds]);

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

      setArticles(
        articles.map((article) =>
          articleIds.includes(article.id) ? { ...article, read } : article
        ),
      );

      fetchFeedStats();
    },
    [articles, setRead, fetchFeedStats],
  );

  const feedsTitle = getFeedsTitle(user, selectedFeeds);

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
        <div className="App-center">
          <Articles
            articles={articles}
            selectedFeeds={selectedFeeds}
            settings={settings}
            setArticlesRead={setArticlesRead}
            user={user}
          />
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
  const [user, setUser] = useState<User | undefined>(props.user);

  return (
    <ContextMenuProvider>
      <div className="App">
        {user
          ? <LoggedIn {...props} user={user} />
          : <Login setUser={setUser} />}
      </div>
    </ContextMenuProvider>
  );
};

export default App;
