import { useEffect, useRef } from 'react';

type Options = {
  selector?: string;
  loop?: boolean;
};

/**
 * Hook simple para navegación por teclado / control remoto dentro de un contenedor.
 * - Usa flechas (ArrowRight/ArrowDown = siguiente, ArrowLeft/ArrowUp = anterior)
 * - Enter / Space activa el elemento (click)
 * - Respeta el orden DOM de elementos que matcheen `selector` (por defecto: buttons, links y elementos con tabindex)
 */
export function useKeyboardNavigation(containerRef: React.RefObject<HTMLElement | null>, options?: Options) {
  const opts = { selector: '[data-nav], button, [role="button"], a, [tabindex]:not([tabindex="-1"])', loop: true, ...(options || {}) };
  const focusedIndex = useRef<number | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const getItems = () => Array.from(root.querySelectorAll<HTMLElement>(opts.selector)).filter((el) => {
      if (el.hasAttribute('disabled')) return false;
      try {
        // Consider visible if it has layout rects or an offsetParent
        const visible = el.offsetParent !== null || el.getClientRects().length > 0;
        return visible;
      } catch (err) {
        return true;
      }
    });

    const focusItem = (idx: number) => {
      const items = getItems();
      if (!items.length) return;
      const safeIdx = ((idx % items.length) + items.length) % items.length;
      const el = items[safeIdx];
      if (el) {
        focusedIndex.current = safeIdx;
        el.focus();
      }
    };

    const shouldIgnoreForForm = () => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      const tag = active.tagName;
      // If the active element is a form control but marked as exitable (focused intentionally), allow navigation keys to move out
      const isForm = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || active.isContentEditable;
      const exitable = active.hasAttribute && active.hasAttribute('data-exitable');
      return isForm && !exitable;
    };

    const onKey = (ev: KeyboardEvent) => {
      // If user is typing in an input/textarea, ignore navigation keys
      if (shouldIgnoreForForm()) return;

      const items = getItems();
      if (!items.length) return;

      const key = ev.key;
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(key)) return;

      // Prevent default scrolling for arrow keys when we handle navigation
      if (key.startsWith('Arrow')) ev.preventDefault();

      // Ensure there's a focused element within our list
      const active = document.activeElement as HTMLElement | null;
      const activeIdx = active ? items.indexOf(active) : -1;

      // Debug log when running locally to help diagnose focus issues
      if (typeof process !== 'undefined' && (process as any).env && (process as any).env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[useKeyboardNavigation] key', key, 'items', items.length, 'activeIdx', activeIdx);
      }

      let nextIdx = activeIdx;
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        nextIdx = activeIdx >= 0 ? activeIdx + 1 : 0;
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        nextIdx = activeIdx >= 0 ? activeIdx - 1 : items.length - 1;
      } else if (key === 'Enter' || key === ' ') {
        if (active && items.includes(active)) {
          (active as HTMLElement).click();
          ev.preventDefault();
        }
        return;
      }

      if (nextIdx !== activeIdx) {
        if (!opts.loop) {
          nextIdx = Math.max(0, Math.min(items.length - 1, nextIdx));
        }
        focusItem(nextIdx);
      }
    };

    // Click or focus inside container should update tracked index
    const onFocusIn = (ev: FocusEvent) => {
      const items = getItems();
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const idx = items.indexOf(target);
      focusedIndex.current = idx >= 0 ? idx : null;
    };

    root.addEventListener('keydown', onKey);
    // fallback global listener so desktop keyboards trigger navigation even if container isn't focused
    window.addEventListener('keydown', onKey);
    root.addEventListener('focusin', onFocusIn);

    // Cleanup
    return () => {
      root.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('focusin', onFocusIn);
    };
  }, [containerRef, opts.selector, opts.loop]);
}
