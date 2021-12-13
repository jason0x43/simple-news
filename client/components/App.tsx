import { React, useCallback, useEffect, useState } from "../deps.ts";
import { ContextContainer, ContextProps } from "../contexts/mod.tsx";
import Feeds from "./Feeds.tsx";
import Articles from "./Articles.tsx";
import Header from "./Header.tsx";
import Button from "./Button.tsx";
import ButtonSelector from "./ButtonSelector.tsx";
import { Settings, useArticles, useFeeds, useFeedStats, useSettings, useUser } from "../contexts/mod.tsx";
import { refreshFeeds } from "../api.ts";

export type AppProps = ContextProps;

const AppContent: React.FC<AppProps> = (props) => {
  const { fetchUser } = useUser();
  const [sidebarActive, setSidebarActive] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { selectedFeeds } = useFeeds();
  const [updating, setUpdating] = useState(false);
  const { fetchArticles } = useArticles();
  const { fetchFeedStats } = useFeedStats();

  useEffect(() => {
    if (!props.user) {
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
      fetchArticles(selectedFeeds);
      fetchFeedStats();
    } catch (error) {
      console.warn(`Error updating feeds: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }, []);

  return (
    <div className="App">
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
    </div>
  );
};

const App: React.FC<AppProps> = (props) => (
  <ContextContainer {...props}>
    <AppContent {...props} />
  </ContextContainer>
);

export default App;
