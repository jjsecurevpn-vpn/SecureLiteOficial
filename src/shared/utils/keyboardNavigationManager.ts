type EnableOptions = {
  includeFormControls?: boolean;
};

type Manager = {
  enable: (rootSelector: string, options?: EnableOptions) => boolean;
  disable: () => void;
  enabled: boolean;
};

const baseSelector = '[data-nav], button, [role="button"], a, [tabindex]:not([tabindex="-1"])';

const manager: Manager = {
  enabled: false,
  enable(rootSelector: string, options?: EnableOptions) {
    let root = document.querySelector(rootSelector) as HTMLElement | null;
    if (!root) {
      // fallback to document body so manager still works in different render states
      // eslint-disable-next-line no-console
      console.warn('[keyboardNavigationManager] root not found, falling back to document');
      root = document.body;
    }

    // Priorizar elementos interactivos (botones, data-nav) y añadir formularios opcionalmente
    const selector = options && options.includeFormControls
      ? `${baseSelector}, input, textarea, select`
      : baseSelector;

    const getItems = () => Array.from(root!.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      if (el.hasAttribute('disabled')) return false;
      try {
        return el.offsetParent !== null || el.getClientRects().length > 0;
      } catch (err) {
        return true;
      }
    });

    const getCenter = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

    const buildGrid = (items: HTMLElement[]) => {
      const nodes = items.map((el, i) => {
        const rect = el.getBoundingClientRect();
        const c = getCenter(rect);
        return { el, rect, c, i };
      });

      // sort by Y then X
      nodes.sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);

      const rows: Array<typeof nodes> = [];
      for (const node of nodes) {
        const last = rows[rows.length - 1];
        if (!last) {
          rows.push([node]);
          continue;
        }
        // row tolerance: half of average height or 24px
        const avgHeight = last.reduce((s, n) => s + n.rect.height, 0) / last.length || node.rect.height;
        const tol = Math.max(16, avgHeight * 0.6);
        const lastY = last.reduce((s, n) => s + n.c.y, 0) / last.length;
        if (Math.abs(node.c.y - lastY) <= tol) {
          last.push(node);
        } else {
          rows.push([node]);
        }
      }

      // sort each row by X
      const grid = rows.map((r) => r.sort((a, b) => a.c.x - b.c.x));
      // map indices
      const indexMap = new Map<number, { row: number; col: number }>();
      grid.forEach((row, ri) => row.forEach((n, ci) => indexMap.set(n.i, { row: ri, col: ci })));
      return { grid, indexMap };
    };

    const findNearestInRowByX = (row: Array<{ c: { x: number } }>, x: number) => {
      let best = 0;
      let bestDist = Infinity;
      row.forEach((n, i) => {
        const d = Math.abs(n.c.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    };

    const onKey = (ev: KeyboardEvent) => {
      const items = getItems();
      if (!items.length) return;
      const key = ev.key;
      // Handle vertical and horizontal movement; left may map to header/back in some pages
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(key)) return;
      if (key.startsWith('Arrow')) ev.preventDefault();

      // Debug: list items with bounding centers
      try {
        const listDebug = items.map((el, i) => {
          const r = el.getBoundingClientRect();
          const c = getCenter(r);
          return { i, tag: el.tagName, txt: (el.innerText || (el as HTMLInputElement).value || '').toString().slice(0, 60), x: Math.round(c.x), y: Math.round(c.y) };
        });
        // eslint-disable-next-line no-console
        console.debug('[keyboardNavigationManager] onKey items', key, listDebug);
      } catch (err) {
        // ignore
      }

      // Normalize active element: if a child is focused, climb to nearest ancestor that is in our items list
      let active = document.activeElement as HTMLElement | null;
      let activeIdx = -1;
      if (active) {
        let node: HTMLElement | null = active;
        while (node && !items.includes(node)) {
          node = node.parentElement as HTMLElement | null;
        }
        if (node && items.includes(node)) {
          active = node;
          activeIdx = items.indexOf(node);
        } else {
          activeIdx = items.indexOf(active);
        }
      }
      // eslint-disable-next-line no-console
      console.debug('[keyboardNavigationManager] active element', activeIdx, active && active.tagName, active && (active.innerText || (active as HTMLInputElement).value));

      if (key === 'Enter' || key === ' ') {
        if (active && items.includes(active)) {
          if (active.tagName === 'INPUT' && active.getAttribute('type') !== 'button' && active.getAttribute('type') !== 'submit') {
            if ((active as HTMLInputElement).type === 'checkbox' || (active as HTMLInputElement).type === 'radio') {
              (active as HTMLInputElement).click();
            }
          } else {
            (active as HTMLElement).click();
            ev.preventDefault();
          }
        }
        return;
      }

      // Build grid once per keypress
      const { grid, indexMap } = buildGrid(items);

      // Special-case: if active or its ancestor is a category card, navigate among .category-card elements vertically
      try {
        const activeEl = document.activeElement as HTMLElement | null;
        let catNode: HTMLElement | null = activeEl;
        while (catNode && !catNode.classList?.contains('category-card')) {
          catNode = catNode.parentElement as HTMLElement | null;
        }
        if (catNode) {
          const cats = Array.from(root.querySelectorAll<HTMLElement>('.category-card')).filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
          if (cats.length > 1) {
            const cur = cats.indexOf(catNode);
            if (cur >= 0) {
              if (key === 'ArrowDown') {
                const next = cats[Math.min(cats.length - 1, cur + 1)];
                if (next) { next.focus(); return; }
              }
              if (key === 'ArrowUp') {
                const prev = cats[Math.max(0, cur - 1)];
                if (prev) { prev.focus(); return; }
              }
              if (key === 'ArrowLeft') {
                // Delegate: focus header/back if available
                const sel = ['header.topbar [data-nav]', 'header.topbar button.btn.hotzone', 'header.topbar .btn.hotzone', 'header.topbar .hotzone'].join(',');
                const back = document.querySelector<HTMLElement>(sel);
                if (back) {
                  try { back.setAttribute('tabindex', '0'); back.setAttribute('data-nav', '1'); } catch {}
                  setTimeout(() => { try { back.focus(); } catch {} }, 0);
                  return;
                }
              }
            }
          }
        }
      } catch (err) {
        // ignore special-case errors
      }
      // Debug: show grid rows and centers for diagnosis
      try {
        const gridDebug = grid.map((row, ri) => ({ row: ri, len: row.length, cols: row.map(n => ({ i: n.i, x: Math.round(n.c.x), y: Math.round(n.c.y) })) }));
        // eslint-disable-next-line no-console
        console.debug('[keyboardNavigationManager] grid', gridDebug);
      } catch (err) {
        // ignore
      }

      // If nothing active, focus first
      if (activeIdx < 0) {
        const first = grid[0]?.[0]?.el;
        if (first) first.focus();
        return;
      }

      const pos = indexMap.get(activeIdx);
      // If we couldn't map the active element in the spatial grid, fallback to linear DOM navigation
      if (!pos) {
        // Linear fallback: move by index in items array
        if (key === 'ArrowRight') {
          const ni = Math.min(items.length - 1, activeIdx + 1);
          const el = items[ni];
          if (el) el.focus();
          return;
        }
        if (key === 'ArrowLeft') {
          const ni = Math.max(0, activeIdx - 1);
          const el = items[ni];
          if (el) el.focus();
          return;
        }
        if (key === 'ArrowDown') {
          const ni = Math.min(items.length - 1, activeIdx + 1);
          const el = items[ni];
          if (el) el.focus();
          return;
        }
        if (key === 'ArrowUp') {
          const ni = Math.max(0, activeIdx - 1);
          const el = items[ni];
          if (el) el.focus();
          return;
        }
        return;
      }
      const { row: r, col: c } = pos;

      let target: { row: number; col: number } | null = null;
      if (key === 'ArrowDown') {
        const nextRow = Math.min(grid.length - 1, r + 1);
        if (nextRow === r) target = null;
        else {
          const desiredX = grid[r][c].c.x;
          const colInNext = findNearestInRowByX(grid[nextRow], desiredX);
          target = { row: nextRow, col: colInNext };
        }
      } else if (key === 'ArrowUp') {
        const prevRow = Math.max(0, r - 1);
        if (prevRow === r) target = null;
        else {
          const desiredX = grid[r][c].c.x;
          const colInPrev = findNearestInRowByX(grid[prevRow], desiredX);
          target = { row: prevRow, col: colInPrev };
        }
      } else if (key === 'ArrowLeft') {
        // move left in the same row
        target = { row: r, col: Math.max(0, c - 1) };
      } else if (key === 'ArrowRight') {
        // move right in the same row
        target = { row: r, col: Math.min((grid[r].length - 1), c + 1) };
      }

      if (target) {
        const el = grid[target.row]?.[target.col]?.el;
        if (el) {
          el.focus();
          // eslint-disable-next-line no-console
          console.debug('[keyboardNavigationManager] grid focus', target.row, target.col, el);
        }
      }
    };

    // Log initial items for debugging
    try {
      const initial = getItems().map((el, i) => ({ i, tag: el.tagName, txt: (el.innerText || (el as HTMLInputElement).value || '').toString().slice(0, 60) }));
      // eslint-disable-next-line no-console
      console.info('[keyboardNavigationManager] initial items', initial.length, initial);
    } catch (err) {
      // ignore
    }

    // attach
    window.addEventListener('keydown', onKey);
    // store handler so we can remove later
    (manager as any).__onKey = onKey;
    manager.enabled = true;
    // eslint-disable-next-line no-console
    console.info('[keyboardNavigationManager] enabled on', rootSelector, 'options', options);
    return true;
  },
  disable() {
    const fn = (manager as any).__onKey as ((e: KeyboardEvent) => void) | undefined;
    if (fn) window.removeEventListener('keydown', fn);
    manager.enabled = false;
    // eslint-disable-next-line no-console
    console.info('[keyboardNavigationManager] disabled');
  }
};

export default manager;
