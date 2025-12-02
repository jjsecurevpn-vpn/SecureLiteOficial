import { memo } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast = memo(function Toast({ message, visible }: ToastProps) {
  return (
    <div className="toast-wrap">
      <div className={`toast ${visible ? 'show' : ''}`}>
        {message}
      </div>
    </div>
  );
});
