import { React, useMemo, useLayoutEffect, useRef } from "./deps.ts";
import ContextMenu, { ContextMenuProps } from "./ContextMenu.tsx";

const ContextMenuContext = React.createContext<{
  showContextMenu: (props: ContextMenuProps) => void;
  hideContextMenu: () => void;
  contextMenuVisible: boolean;
}>({
  showContextMenu: () => undefined,
  hideContextMenu: () => undefined,
  contextMenuVisible: false,
});

export default ContextMenuContext;

export const ContextMenuProvider: React.FC = (props) => {
  const [cmProps, setCmProps] = React.useState<ContextMenuProps | undefined>();
  const cmRef = useRef<HTMLDivElement>(null);
  const cmPos = useRef<{ x: number, y: number } | undefined>();

  const providerProps = useMemo(() => ({
    showContextMenu: setCmProps,
    hideContextMenu: () => setCmProps(undefined),
    contextMenuVisible: Boolean(cmProps)
  }), [cmProps]);

  useLayoutEffect(() => {
    if (!cmProps || !cmRef.current) {
      return;
    }

    const clickListener = (event: MouseEvent) => {
      if (!cmRef.current?.contains(event.target as Node)) {
        setCmProps(undefined);
      }
    };
    document.body.addEventListener('click', clickListener);

    const escListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCmProps(undefined);
      }
    };
    document.body.addEventListener('keydown', escListener);

    const { position } = cmProps;
    if (position.x !== cmPos.current?.x || position.y !== cmPos.current?.y) {
      const cmRect = cmRef.current.getBoundingClientRect();
      const viewPortWidth = document.documentElement.clientWidth;
      const viewPortHeight = document.documentElement.clientHeight;
      if (cmRect.x + cmRect.width > viewPortWidth) {
        cmRect.x -= cmRect.width;
      }
      if (cmRect.y + cmRect.height > viewPortHeight) {
        cmRect.y -= cmRect.height;
      }
      cmPos.current = { x: cmRect.x, y: cmRect.y };
      setCmProps({
        ...cmProps,
        position: { ...cmPos.current }
      });
    }

    return () => {
      document.body.removeEventListener('click', clickListener);
    };
  }, [cmProps]);

  return (
    <ContextMenuContext.Provider value={providerProps}>
      {props.children}
      {cmProps && <ContextMenu ref={cmRef} {...cmProps} />}
    </ContextMenuContext.Provider>
  );
};
