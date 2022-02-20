import React, { useEffect, useRef, useState } from "react";
import { ContextMenuProvider } from "./components/ContextMenu.tsx";
import Feeds from "./components/Feeds.tsx";
import Articles from "./components/Articles.tsx";
import Header from "./components/Header.tsx";
import Article from "./components/Article.tsx";
import Button from "./components/Button.tsx";
import ButtonSelector from "./components/ButtonSelector.tsx";
import Input from "./components/Input.tsx";
import { login } from "./api.ts";
import type { Feed, User } from "../types.ts";
import type { Settings } from "./types.ts";
import { className } from "./util.ts";
import { useAppVisibility } from "./hooks.ts";
import { useAppDispatch, useAppSelector } from "./store/mod.ts";
import {
  selectSelectedArticle,
  selectSelectedFeeds,
  selectSettings,
  selectSidebarActive,
  selectUpdating,
} from "./store/uiSelectors.ts";
import { loadArticles, updateFeeds } from "./store/articles.ts";
import { selectUser } from "./store/userSelectors.ts";
import { restoreUiState } from "./store/ui.ts";

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

  useEffect(() => {
    dispatch(restoreUiState());
  }, []);

  // Fetch updated data in the background every few minutes
  useEffect(() => {
    const signal = { cancelled: false };

    const interval = setInterval(() => {
      dispatch(loadArticles());
    }, 600000);

    return () => {
      signal.cancelled = true;
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
        <Header />
      </div>
      <div className="App-content">
        <div className="App-sidebar" data-active={sidebarActive}>
          <div className="App-sidebar-feeds">
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
          <Article />
        </div>
      </div>
    </ContextMenuProvider>
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

const App: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="App">
      {user ? <LoggedIn /> : <Login setUser={() => location.href = "/"} />}
    </div>
  );
};

export default App;
