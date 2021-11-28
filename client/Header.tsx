import { React, useCallback, useState } from "./deps.ts";
import { updateFeeds } from "./api.ts";
import useUser from "./hooks/useUser.ts";

const Header: React.FC = () => {
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
      <h1>Simple News</h1>
      <button onClick={update} disabled={updating}>Refresh</button>
      <div>{user?.name}</div>
    </header>
  );
};

export default Header;
