import { React, useCallback, useEffect, useState } from "../deps.ts";
import { ContextContainer, ContextProps } from "../contexts/mod.tsx";
import Feeds from "./Feeds.tsx";
import Articles from "./Articles.tsx";
import Header from "./Header.tsx";
import Button from "./Button.tsx";
import ButtonSelector from "./ButtonSelector.tsx";
import Input from "./Input.tsx";
import {
  Settings,
  useArticles,
  useFeeds,
  useSettings,
  useUser,
} from "../contexts/mod.tsx";
import { refreshFeeds } from "../api.ts";

const LoggedIn: React.FC = () => {
  const { fetchUser, user } = useUser();
  const [sidebarActive, setSidebarActive] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { selectedFeeds, fetchFeedStats } = useFeeds();
  const [updating, setUpdating] = useState(false);
  const { fetchArticles } = useArticles();

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    setSidebarActive(false);
  }, [selectedFeeds]);

  const handleShowSidebar = useCallback(() => {
    setSidebarActive(!sidebarActive);
  }, [sidebarActive]);

  const handleUpdateFeeds = useCallback(async () => {
    try {
      setUpdating(true);
      await refreshFeeds();
      fetchArticles();
      fetchFeedStats();
    } catch (error) {
      console.warn(`Error updating feeds: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }, [fetchArticles, fetchFeedStats, refreshFeeds, selectedFeeds]);

  return (
    <>
      <div className="App-header">
        <Header onShowSidebar={handleShowSidebar} />
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
                updateSettings({ articleFilter });
              }}
            />
          </div>
        </div>
        <div className="App-center">
          <Articles />
        </div>
      </div>
    </>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUser();

  return (
    <form className="Login">
      <Input placeholder="Email" value={email} onChange={setEmail} />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <Button label="Login" onClick={() => login(email, password)} />
    </form>
  );
};

const AppContent: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="App">
      {user ? <LoggedIn /> : <Login />}
    </div>
  );
};

export type AppProps = ContextProps;

const App: React.FC<AppProps> = (props) => (
  <ContextContainer {...props}>
    <AppContent />
  </ContextContainer>
);

export default App;
