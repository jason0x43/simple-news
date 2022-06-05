import classNames from 'classnames';
import type { DetailedHTMLProps, InputHTMLAttributes } from 'react';

type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

export default function Input(props: InputProps) {
  const { className: extraClass, ...inputProps } = props;
  return <input className={classNames('Input', extraClass)} {...inputProps} />;
}
