import Button from './Button';

export type ButtonSelectorProps = {
  options: { label: string; value: string }[];
  selected: string;
  size?: 'small' | 'normal' | 'large';
  onSelect: (value: string) => void;
};

export default function ButtonSelector(props: ButtonSelectorProps) {
  const { options, size, selected, onSelect } = props;

  return (
    <div className="ButtonSelector">
      {options.map((opt) => (
        <Button
          key={opt.value}
          className={
            selected === opt.value ? 'ButtonSelector-selected' : undefined
          }
          label={opt.label}
          size={size}
          onClick={() => onSelect(opt.value)}
        />
      ))}
    </div>
  );
}
