import { React, useCallback, useState } from "./deps.ts";
import { updateFeeds } from "./api.ts";
import useUser from "./hooks/useUser.ts";

export interface HeaderProps {
  onShowSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onShowSidebar } = props;
  const { user } = useUser();
  const [updating, setUpdating] = useState(false);

  const update = useCallback(async () => {
    setUpdating(true);
    try {
      await updateFeeds();
    } catch (error) {
      console.warn(error);
    } finally {
      setUpdating(false);
    }
  }, []);

  return (
    <header className="Header">
      <h1 onClick={onShowSidebar}>Simple News</h1>
      <div className="Header-buttons">
        <button onClick={update} disabled={updating}>Refresh</button>
      </div>
      <div className="Header-user">{user?.name}</div>
    </header>
  );
};

export default Header;
