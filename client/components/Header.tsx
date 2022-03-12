import React, { type VFC } from "react";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { toggleSidebarActive } from "../store/ui.ts";
import { selectFeedsTitle } from "../store/uiSelectors.ts";
import { selectUser } from "../store/userSelectors.ts";
import { signout } from "../store/user.ts";

type HeaderProps = {
  onTitlePress?: () => void;
};

const Header: VFC<HeaderProps> = ({ onTitlePress }) => {
  const title = useAppSelector(selectFeedsTitle);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  return (
    <header className="Header">
      <div
        className="Header-left"
        onClick={() => {
          dispatch(toggleSidebarActive());
        }}
      >
        <svg width="22" height="22" version="2.0">
          <use href="#sn-logo" />
        </svg>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2 onClick={onTitlePress}>{title}</h2>
      </div>
      <div className="Header-right">
        <span className="Header-user" onClick={() => dispatch(signout())}>
          {user?.username}
        </span>
      </div>
    </header>
  );
};

export default Header;
