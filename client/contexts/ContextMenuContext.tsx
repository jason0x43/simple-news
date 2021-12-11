/// <reference lib="dom" />

import { React, useCallback, useContext, useMemo, useState } from "../deps.ts";
import ContextMenu, { ContextMenuProps } from "../components/ContextMenu.tsx";

const ContextMenuContext = React.createContext<{
  showContextMenu: (props: ContextMenuProps) => void;
  hideContextMenu: () => void;
}>({
  showContextMenu: () => undefined,
  hideContextMenu: () => undefined,
});

export default ContextMenuContext;

export const ContextMenuProvider: React.FC = (props) => {
  const [cmProps, setCmProps] = useState<ContextMenuProps | undefined>();

  const updateCmProps = (newProps?: ContextMenuProps) => {
    cmProps?.onClose();
    setCmProps(newProps);
  };

  const value = useMemo(() => ({
    showContextMenu: (newProps: ContextMenuProps) => updateCmProps(newProps),
    hideContextMenu: () => updateCmProps(),
  }), [cmProps]);

  const handleClose = useCallback(() => updateCmProps(), [cmProps]);

  return (
    <ContextMenuContext.Provider value={value}>
      {props.children}
      {cmProps && <ContextMenu {...cmProps} onClose={handleClose} />}
    </ContextMenuContext.Provider>
  );
};

export function useContextMenu() {
  return useContext(ContextMenuContext);
}
