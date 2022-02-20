import React, { type FC } from "react";
import { className } from "../util.ts";

export interface InputProps {
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "text" | "password";
}

const Input: FC<InputProps> = (props) => {
  const {
    className: extraClass,
    placeholder,
    onChange,
    disabled,
    value,
    type,
  } = props;

  return (
    <input
      className={className("Input", extraClass)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
      placeholder={placeholder}
      type={type ?? "text"}
    />
  );
};

export default Input;
