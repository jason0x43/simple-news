import { React, useCallback, useEffect, useState } from "../deps.ts";
import { ContextContainer, ContextProps } from "../contexts/mod.tsx";
import Feeds from "./Feeds.tsx";
import Articles from "./Articles.tsx";
import Header from "./Header.tsx";
import ButtonSelector from "./ButtonSelector.tsx";
import { Settings, useFeeds, useSettings, useUser } from "../contexts/mod.tsx";

export type AppProps = ContextProps;

const AppContent: React.FC<AppProps> = (props) => {
  const { fetchUser } = useUser();
  const [sidebarActive, setSidebarActive] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { selectedFeeds } = useFeeds();

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
