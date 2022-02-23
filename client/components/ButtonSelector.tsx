import React, { type FC } from "react";
import Button from "./Button.tsx";

export type ButtonSelectorProps = {
  options: { label: string; value: string }[];
  selected: string;
  size?: "small" | "normal" | "large";
  onSelect: (value: string) => void;
};

const ButtonSelector: FC<ButtonSelectorProps> = (props) => {
  const { options, size, selected, onSelect } = props;

  return (
    <div className="ButtonSelector">
      {options.map((opt) => (
        <Button
          key={opt.value}
          className={selected === opt.value
            ? "ButtonSelector-selected"
            : undefined}
          label={opt.label}
          size={size}
          onClick={() => onSelect(opt.value)}
        />
      ))}
    </div>
  );
};

export default ButtonSelector;
