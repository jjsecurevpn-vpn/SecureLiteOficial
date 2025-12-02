import { memo, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  icon?: string;
  onChange?: (value: string) => void;
  /** Si es true, muestra toggle para mostrar/ocultar (para passwords) */
  toggleVisibility?: boolean;
}

/**
 * Componente Input reutilizable con soporte para iconos y toggle de visibilidad
 */
export const Input = memo(function Input({
  icon,
  onChange,
  toggleVisibility = false,
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = toggleVisibility 
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={`field ${className}`}>
      {icon && <i className={`fa fa-${icon}`} />}
      <input
        type={inputType}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      {toggleVisibility && (
        <i
          className={`fa fa-eye${showPassword ? '-slash' : ''} eye-icon`}
          onClick={() => setShowPassword(!showPassword)}
          role="button"
          aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
        />
      )}
    </div>
  );
});
