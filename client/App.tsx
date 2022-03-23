import React, { useCallback, useEffect, useRef, useState } from "react";
import { ContextMenuProvider } from "./components/ContextMenu.tsx";
import Feeds from "./components/Feeds.tsx";
import Articles from "./components/Articles.tsx";
import Header from "./components/Header.tsx";
import Article, { type ArticleRef } from "./components/Article.tsx";
import Button from "./components/Button.tsx";
import ButtonSelector from "./components/ButtonSelector.tsx";
import Input from "./components/Input.tsx";
import type { Settings } from "./types.ts";
import { className } from "./util.ts";
import { useStoredState } from "./hooks.ts";
import {
  useFeeds,
  useRefreshFeeds,
  useSignin,
  useUser,
} from "./queries/mod.ts";
import { useSettings, useSettingsSetter } from "./contexts/settings.ts";
import { useSelectedArticle } from "./contexts/selectedArticle.ts";
import {
  type DehydratedState,
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import AppProvider from "./contexts/mod.tsx";
import { useSelectedFeeds } from "./contexts/selectedFeeds.ts";

const LoggedIn: React.VFC = () => {
  const [sidebarActive, setSidebarActive] = useStoredState(
    "sidebarActive",
    false,
  );
  const { isLoading: feedsLoading } = useFeeds();
  const settings = useSettings();
  const setSettings = useSettingsSetter();
  const selectedArticle = useSelectedArticle();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<ArticleRef>(null);
  const refresher = useRefreshFeeds();
  const selectedFeeds = useSelectedFeeds();
  const selectedFeedsRef = useRef(selectedFeeds);

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

    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, [sidebarActive]);

  useEffect(() => {
    if (selectedFeedsRef.current !== selectedFeeds) {
      setSidebarActive(false);
      selectedFeedsRef.current = selectedFeeds;
    }
  }, [selectedFeeds, sidebarActive]);

  return (
    <ContextMenuProvider>
      <div className="App-header">
        <Header
          onTitlePress={handleTitlePress}
          toggleSidebar={() => {
            setSidebarActive(!sidebarActive);
          }}
        />
      </div>
      <div className="App-content">
        <div className="App-sidebar" data-active={sidebarActive}>
          <div className="App-sidebar-feeds" ref={sidebarRef}>
            <Feeds />
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

const AuthRouter: React.VFC = () => {
  const { data: user } = useUser();

  return (
    <div className="App">
      {user ? <LoggedIn /> : <Login />}
    </div>
  );
};

export type AppProps = {
  dehydratedState?: DehydratedState;
};

const App: React.VFC<AppProps> = ({ dehydratedState }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>
        <AppProvider>
          <AuthRouter />
        </AppProvider>
      </Hydrate>
    </QueryClientProvider>
  );
};

export default App;
