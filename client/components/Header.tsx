import React from "react";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { toggleSidebarActive } from "../store/ui.ts";
import { selectFeedsTitle } from "../store/uiSelectors.ts";
import { selectUser } from "../store/userSelectors.ts";

const Header: React.FC = () => {
  const title = useAppSelector(selectFeedsTitle);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  return (
    <header className="Header">
      <div className="Header-left" onClick={() => {
        dispatch(toggleSidebarActive());
      }}>
        <svg width="22" height="22" version="2.0">
          <use href="#sn-logo" />
        </svg>
        <h1>Simple News</h1>
      </div>
      <div className="Header-center">
        <h2>{title}</h2>
      </div>
      <div className="Header-right">{user?.name}</div>
    </header>
  );
};

export default Header;
