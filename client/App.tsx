import { React, useCallback, useState } from "./deps.ts";
import { UserProvider } from "./UserContext.tsx";
import { ArticlesProvider } from "./ArticlesContext.tsx";
import Feeds from "./Feeds.tsx";
import Articles from "./Articles.tsx";
import Header from "./Header.tsx";
import { User } from "../types.ts";
import useUser from "./hooks/useUser.ts";
import useArticles from "./hooks/useArticles.ts";

export interface AppProps {
  user?: User;
}

const AppContent: React.FC<AppProps> = (props) => {
  const { fetchUser } = useUser();
  const { fetchArticles } = useArticles();
  const [feeds, setFeeds] = useState<number[]>();
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
          <Articles selectedFeeds={feeds} />
        </div>
      </div>
    </div>
  );
};

const App: React.FC<AppProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <ArticlesProvider>
        <AppContent {...props} />
      </ArticlesProvider>
    </UserProvider>
  );
};

export default App;
