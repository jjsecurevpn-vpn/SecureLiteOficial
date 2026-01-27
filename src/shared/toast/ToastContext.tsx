import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { TOAST_DURATION_MS } from '../../constants';

interface ToastState {
  message: string;
  visible: boolean;
  // optional anchor coordinates where the toast should appear (center of anchor)
  anchor?: { x: number; y: number } | null;
}

interface ToastContextType {
  toast: ToastState;
  // optional second param: HTMLElement or selector string to anchor toast
  showToast: (message: string, anchor?: HTMLElement | string | null) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false, anchor: null });

  const showToast = useCallback((message: string, anchor?: HTMLElement | string | null) => {
    let anchorPos: { x: number; y: number } | null = null;
    try {
      let el: HTMLElement | null = null;
      if (anchor instanceof HTMLElement) el = anchor;
      else if (typeof anchor === 'string') el = document.querySelector<HTMLElement>(anchor);
      else el = null;
      if (el) {
        const r = el.getBoundingClientRect();
        // place toast centered under the element (bottom center)
        const offsetY = 8; // px gap between card and toast
        anchorPos = { x: r.left + r.width / 2, y: r.bottom + offsetY };
      }
    } catch (err) {
      anchorPos = null;
    }

    setToast({ message, visible: true, anchor: anchorPos });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}
