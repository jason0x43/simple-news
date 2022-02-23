import React, { type FC, type MouseEvent } from "react";
import { className } from "../util.ts";

export type ButtonProps = {
  label: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  size?: "small" | "normal" | "large";
  className?: string;
};

const Button: FC<ButtonProps> = (props) => {
  const { className: extraClass, label, onClick, disabled, size } = props;
  return (
    <button
      className={className("Button", {
        "Button-large": size === "large",
        "Button-small": size === "small",
      }, extraClass)}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
};

export default Button;
