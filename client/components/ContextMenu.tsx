import React, { createContext, type FC } from "react";
import { className } from "../util.ts";

const {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} = React;

export type ContextMenuProps = {
  items: string[];
  anchor: HTMLElement | { x: number; y: number };
  onSelect: (item: string) => void;
  onClose?: () => void;
};

const defaultPos = { x: 0, y: 0 };

const ContextMenu: FC<ContextMenuProps> = (props) => {
  const { items, anchor, onSelect, onClose } = props;
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState(defaultPos);
  const ref = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setVisible(false);
    onClose?.();
  };

  // if the anchor changes, hide and reposition the menu
  useEffect(() => {
    setVisible(false);
    setPos(defaultPos);
  }, [anchor]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const clickListener = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        closeMenu();

        // make the menu act a bit like a modal; any clicks that aren't in the
        // menu will cause the menu to close and will then be silently discarded
        event.stopPropagation();
      }
    };
    document.body.addEventListener("click", clickListener, { capture: true });

    const escListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.body.addEventListener("keydown", escListener);

    if (!visible) {
      let x: number;
      let y: number;

      if (anchor instanceof HTMLElement) {
        const anchorRect = anchor.getBoundingClientRect();
        x = anchorRect.x;
        y = anchorRect.y;
      } else {
        x = anchor.x;
        y = anchor.y;
      }

      const rect = ref.current.getBoundingClientRect();
      const viewPortWidth = document.documentElement.clientWidth;
      const viewPortHeight = document.documentElement.clientHeight;

      if (x + rect.width > viewPortWidth) {
        x -= rect.width;
      }
      if (y + rect.height > viewPortHeight) {
        y -= rect.height;
      }

      setPos({ x, y });
      setVisible(true);
    }

    return () => {
      document.body.removeEventListener("click", clickListener, {
        capture: true,
      });
      document.body.removeEventListener("keydown", escListener);
    };
  }, [pos, visible]);

  return (
    <div
      ref={ref}
      className={className("ContextMenu", {
        "ContextMenu-visible": visible,
      })}
      style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
    >
      <ul>
        {items.map((item) => (
          <li
            key={item}
            onClick={() => {
              closeMenu();
              onSelect(item);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;

const ContextMenuContext = createContext<{
  showContextMenu: (props: ContextMenuProps) => void;
  hideContextMenu: () => void;
  contextMenuVisible: boolean;
}>({
  showContextMenu: () => undefined,
  hideContextMenu: () => undefined,
  contextMenuVisible: false,
});

export const ContextMenuProvider: FC = (props) => {
  const [cmProps, setCmProps] = useState<ContextMenuProps | undefined>();

  const value = useMemo(() => ({
    showContextMenu: (newCmProps: ContextMenuProps) => {
      cmProps?.onClose?.();
      setCmProps(newCmProps);
    },
    hideContextMenu: () => setCmProps(undefined),
    contextMenuVisible: cmProps !== undefined,
  }), [cmProps]);

  return (
    <ContextMenuContext.Provider value={value}>
      {props.children}
      {cmProps && (
        <ContextMenu
          {...cmProps}
          onClose={() => {
            cmProps?.onClose?.();
            setCmProps(undefined);
          }}
        />
      )}
    </ContextMenuContext.Provider>
  );
};

export function useContextMenu() {
  return useContext(ContextMenuContext);
}
