import { memo } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Toggle = memo(function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <>
      {label && <span className="auto-switch-label">{label}</span>}
      <label className="toggle" aria-label={label || 'Toggle'}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="thumb" />
      </label>
    </>
  );
});
