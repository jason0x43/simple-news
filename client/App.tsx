import React, { useCallback, useEffect, useRef, useState } from "react";
import { ContextMenuProvider } from "./components/ContextMenu.tsx";
import Feeds from "./components/Feeds.tsx";
import Articles from "./components/Articles.tsx";
import Header from "./components/Header.tsx";
import Article, { type ArticleRef } from "./components/Article.tsx";
import Button from "./components/Button.tsx";
import ButtonSelector from "./components/ButtonSelector.tsx";
import Input from "./components/Input.tsx";
import type { AppState, Settings } from "./types.ts";
import { useCookieState, useLocalStorageState } from "./hooks.ts";
import {
  useFeeds,
  useRefreshFeeds,
  useSignin,
  useUser,
} from "./queries/mod.ts";
import {
  type DehydratedState,
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { preloadFeedIcons } from "./util.ts";

type LoggedInProps = {
  initialState: AppState | undefined;
};

const LoggedIn: React.VFC<LoggedInProps> = ({ initialState }) => {
  const { isLoading: feedsLoading, data: feeds } = useFeeds();
  const [settings, setSettings] = useLocalStorageState<Settings>("settings", {
    articleFilter: "unread",
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<ArticleRef>(null);
  const refresher = useRefreshFeeds();
  const [selectedFeeds, setSelectedFeeds] = useCookieState<
    number[] | undefined
  >(
    "selectedFeeds",
    initialState?.selectedFeeds,
  );
  const [selectedArticle, setSelectedArticle] = useCookieState<
    | number
    | undefined
  >("selectedArticle", initialState?.selectedArticle);
  const [sidebarActive, setSidebarActive] = useState(!selectedFeeds);
  const loadedIcons = useRef(false);

  const handleTitlePress = useCallback(() => {
    articleRef.current?.resetScroll();
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        sidebarActive && !sidebarRef.current!.contains(event.target as Node)
      ) {
        setSidebarActive(false);
      }
    };

    // Add the click handler in a timeout in case the effect run's synchronously
    // with a click event
    const timer = setTimeout(() =>
      document.body.addEventListener("click", handleClick)
    );

    return () => {
      clearTimeout(timer);
      document.body.removeEventListener("click", handleClick);
    };
  }, [sidebarActive]);

  useEffect(() => {
    if (feeds && !loadedIcons.current) {
      preloadFeedIcons(feeds);
      loadedIcons.current = true;
    }
  }, [feeds]);

  return (
    <ContextMenuProvider>
      <div className="App-header">
        <Header
          selectedFeeds={selectedFeeds}
          onTitlePress={handleTitlePress}
          toggleSidebar={() => {
            setSidebarActive(!sidebarActive);
          }}
        />
      </div>
      <div className="App-content">
        <div
          className="App-sidebar"
          data-active={sidebarActive}
          ref={sidebarRef}
        >
          <div className="App-sidebar-feeds">
            <Feeds
              selectedFeeds={selectedFeeds}
              settings={settings}
              onSelect={(feedIds) => {
                setSelectedFeeds(feedIds);
                setSelectedArticle(undefined);
                setSidebarActive(false);
              }}
            />
          </div>
          <div className="App-sidebar-controls">
            <Button
              size="small"
              disabled={feedsLoading}
              label="Update feeds"
              onClick={() => refresher.mutate()}
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
                setSettings({ articleFilter });
              }}
            />
          </div>
        </div>
        <div className="App-articles">
          <Articles
            selectedFeeds={selectedFeeds}
            initialScrollData={initialState?.scrollData}
            selectedArticle={selectedArticle}
            settings={settings}
            onSelect={setSelectedArticle}
          />
          <Article
            ref={articleRef}
            articleId={selectedArticle}
            onClose={() => setSelectedArticle(undefined)}
          />
        </div>
      </div>
    </ContextMenuProvider>
  );
};

const Login: React.VFC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { error } = useUser();
  const signin = useSignin();

  const doSignin = () => {
    signin.mutate({ username, password });
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

      {error && <div className="LoginError">{`${error}`}</div>}
    </form>
  );
};

const AuthRouter: React.VFC<LoggedInProps> = ({ initialState }) => {
  const { data: user } = useUser();

  return (
    <div className="App">
      {user ? <LoggedIn initialState={initialState} /> : <Login />}
    </div>
  );
};

export type AppProps = {
  initialState?: {
    queryState?: DehydratedState;
    appState?: AppState;
  };
};

const App: React.VFC<AppProps> = ({ initialState }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={initialState?.queryState}>
        <AuthRouter initialState={initialState?.appState} />
      </Hydrate>
    </QueryClientProvider>
  );
};

export default App;
