import { React } from "../deps.ts";
import { User } from "../../types.ts";

export interface HeaderProps {
  user: User;
  onShowSidebar: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { user, onShowSidebar, title } = props;

  return (
    <header className="Header">
      <div className="Header-left" onClick={onShowSidebar}>
        <svg width="22" height="22" version="2.0">
          <use href="#sn-logo" />
        </svg>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2>{title}</h2>
      </div>
      <div className="Header-right">{user.name}</div>
    </header>
  );
};

export default Header;
