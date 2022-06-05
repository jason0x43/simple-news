import type {
    DetailedHTMLProps,
    InputHTMLAttributes
} from 'react';
import { className } from '~/lib/util';

type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

export default function Input(props: InputProps) {
  const { className: extraClass, ...inputProps } = props;
  return <input className={className('Input', extraClass)} {...inputProps} />;
}
