import { React, useEffect, useMemo, useRef, useState } from "../deps.ts";
import { className } from "../util.ts";

export interface ContextMenuProps {
  items: string[];
  anchor: HTMLElement;
  onSelect: (item: string) => void;
  onClose: () => void;
}

const defaultPos = { x: 0, y: 0 };

const ContextMenu: React.FC<ContextMenuProps> = (props) => {
  const { items, anchor, onSelect, onClose } = props;
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState(defaultPos);
  const ref = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setVisible(false);
    onClose();
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
      }
    };
    document.body.addEventListener("click", clickListener);

    const escListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.body.addEventListener("keydown", escListener);

    if (!visible) {
      const anchorRect = anchor.getBoundingClientRect();
      const rect = ref.current.getBoundingClientRect();
      const viewPortWidth = document.documentElement.clientWidth;
      const viewPortHeight = document.documentElement.clientHeight;

      let { x, y } = anchorRect;
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
      document.body.removeEventListener("click", clickListener);
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
              onSelect(item)
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
