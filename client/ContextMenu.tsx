import { forwardRef, React, useCallback, useState } from "./deps.ts";

export interface ContextMenuProps {
  items: string[];
  position: { x: number; y: number };
  onSelect: (item: string) => void;
}

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  (props, ref) => {
    const { items, position, onSelect } = props;

    return (
      <div
        ref={ref}
        className="ContextMenu"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
      >
        <ul>
          {items.map((item) => (
            <li
              key={item}
              onClick={() => onSelect(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

export default ContextMenu;
