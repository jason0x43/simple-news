import { React, useCallback, useState } from "./deps.ts";
import { refreshFeeds, reprocess } from "./api.ts";
import useUser from "./hooks/useUser.ts";

export interface HeaderProps {
  onShowSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onShowSidebar } = props;
  const { user } = useUser();
  const [busy, setBusy] = useState(false);

  const update = useCallback(async () => {
    setBusy(true);
    try {
      await refreshFeeds();
    } catch (error) {
      console.warn(error);
    } finally {
      setBusy(false);
    }
  }, []);

  const repro = useCallback(async () => {
    setBusy(true);
    try {
      await reprocess();
    } catch (error) {
      console.warn(error);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <header className="Header">
      <h1 onClick={onShowSidebar}>Simple News</h1>
      <div className="Header-buttons">
        <button onClick={update} disabled={busy}>Refresh</button>
        <button onClick={repro} disabled={busy}>Reprocess</button>
      </div>
      <div className="Header-user">{user?.name}</div>
    </header>
  );
};

export default Header;
