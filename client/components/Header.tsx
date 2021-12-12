import { React } from "../deps.ts";
import { useUser, useFeeds } from "../contexts/mod.tsx";

export interface HeaderProps {
  onShowSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onShowSidebar } = props;
  const { user } = useUser();
  const { feedsTitle } = useFeeds();

  return (
    <header className="Header">
      <div className="Header-left" onClick={onShowSidebar}>
        <img src="favicon-192x192.png"/>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2>{feedsTitle}</h2>
      </div>
      <div className="Header-right">{user?.name}</div>
    </header>
  );
};

export default Header;
