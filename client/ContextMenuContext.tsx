import { React, useMemo, useEffect, useRef } from "./deps.ts";
import ContextMenu, { ContextMenuProps } from "./ContextMenu.tsx";

const ContextMenuContext = React.createContext<{
  showContextMenu: (props: ContextMenuProps) => void;
  hideContextMenu: () => void;
}>({
  showContextMenu: () => undefined,
  hideContextMenu: () => undefined,
});

export default ContextMenuContext;

export const ContextMenuProvider: React.FC = (props) => {
  const [cmProps, setCmProps] = React.useState<ContextMenuProps | undefined>();
  const cmRef = useRef<HTMLDivElement>(null);

  const providerProps = useMemo(() => ({
    showContextMenu: setCmProps,
    hideContextMenu: () => setCmProps(undefined),
  }), []);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!cmRef.current?.contains(event.target as Node)) {
        setCmProps(undefined);
      }
    };

    document.body.addEventListener('click', listener);

    return () => {
      document.body.removeEventListener('click', listener);
    };
  }, [cmRef.current]);

  return (
    <ContextMenuContext.Provider value={providerProps}>
      {props.children}
      {cmProps && <ContextMenu ref={cmRef} {...cmProps} />}
    </ContextMenuContext.Provider>
  );
};
