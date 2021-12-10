import { React } from "../deps.ts";
import { className } from "../util.ts";

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  size?: "small" | "normal" | "large";
}

const Button: React.FC<ButtonProps> = (props) => {
  const { label, onClick, disabled, size } = props;
  return (
    <button
      className={className("Button", {
        "Button-large": size === "large",
        "Button-small": size === "small",
      })}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default Button;
