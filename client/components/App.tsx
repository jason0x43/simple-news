import { React, useCallback, useState } from "../deps.ts";
import { ContextContainer, ContextProps } from "../contexts/mod.tsx";
import Feeds from "../components/Feeds.tsx";
import Articles from "../components/Articles.tsx";
import Header from "../components/Header.tsx";
import { useUser, useArticles } from "../contexts/mod.tsx";

export type AppProps = ContextProps;

const AppContent: React.FC<AppProps> = (props) => {
  const { fetchUser } = useUser();
  const { fetchArticles } = useArticles();
  const [feeds, setFeeds] = useState<number[] | undefined>(props.selectedFeeds);
  const [sidebarActive, setSidebarActive] = useState(false);

  React.useEffect(() => {
    if (!props.user) {
      fetchUser();
    }
  }, []);

  const handleSelectFeeds = useCallback((feeds: number[]) => {
    fetchArticles(feeds);
    setFeeds(feeds);
    setSidebarActive(false);
  }, []);

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
          <Feeds selectedFeeds={feeds} onSelectFeeds={handleSelectFeeds} />
        </div>
        <div className="App-center">
          <Articles />
        </div>
      </div>
    </div>
  );
};

const App: React.FC<AppProps> = (props) => {
  return (
    <ContextContainer {...props}>
      <AppContent {...props} />
    </ContextContainer>
  );
};

export default App;
