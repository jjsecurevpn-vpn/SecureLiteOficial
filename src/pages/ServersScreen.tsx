import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useVpn } from '../features/vpn/model/VpnContext';
import { useToastContext } from '../shared/toast/ToastContext';
import { useSectionStyle } from '../shared/hooks/useSectionStyle';
import { Button } from '../shared/ui/Button';
import { formatProtocol, extractDomain, removeDomainFromDescription } from '../utils/formatUtils';
import { UI_MESSAGES } from '../constants';
import { dt } from '../features/vpn/api/vpnBridge';
import { appLogger } from '../features/logs/model/useAppLogs';
import { useServerStats } from '../shared/hooks/useServerStats';
import { useKeyboardNavigation } from '../shared/hooks/useKeyboardNavigation';
import keyboardNavigationManager from '../shared/utils/keyboardNavigationManager';
import type { Category, ServerConfig } from '../shared/types';

const SUBCATEGORY_KEYWORDS = [
  { key: 'PRINCIPAL', label: 'Principal' },
  { key: 'JUEGOS', label: 'Juegos' },
  { key: 'STREAM', label: 'Streaming' },
  { key: 'SOCIAL', label: 'Social' },
];
const DEFAULT_SUBCATEGORY = 'Otros';
const ALL_SUBCATEGORIES = 'Todos';

const resolveSubcategory = (name?: string | null): string => {
  if (!name) return DEFAULT_SUBCATEGORY;
  const upper = name.toUpperCase();
  const match = SUBCATEGORY_KEYWORDS.find(({ key }) => upper.includes(key));
  return match ? match.label : DEFAULT_SUBCATEGORY;
};

const orderSubcategories = (labels: string[]): string[] => {
  const order = SUBCATEGORY_KEYWORDS.map(({ label }) => label);
  return labels.sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    const rankA = idxA === -1 ? order.length : idxA;
    const rankB = idxB === -1 ? order.length : idxB;
    if (rankA === rankB) return a.localeCompare(b);
    return rankA - rankB;
  });
};

export function ServersScreen() {
  const {
    status,
    categorias,
    config: currentConfig,
    setConfig,
    setScreen,
    startAutoConnect,
    disconnect,
    cancelConnecting,
    creds,
    loadCategorias,
    autoMode,
    selectedCategory,
    setSelectedCategory,
  } = useVpn();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(ALL_SUBCATEGORIES);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const sectionStyle = useSectionStyle();

  const { serversByName } = useServerStats({ pollMs: 3_000, enabled: true });

  const toggleExpand = useCallback((catName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(catName)) {
        newSet.delete(catName);
      } else {
        newSet.add(catName);
      }
      return newSet;
    });
  }, []);

  const serversContentRef = useRef<HTMLDivElement | null>(null);
  useKeyboardNavigation(serversContentRef);
  

  // Al abrir una categoría, enfocar el primer elemento interactivo dentro del área
  useEffect(() => {
    if (!selectedCategory) return;
    const root = serversContentRef.current;
    if (!root) return;
    const selector = 'button, [role="button"], a, [tabindex]:not([tabindex="-1"])';
    // Pequeño delay para asegurar que el DOM esté renderizado
    const t = window.setTimeout(() => {
      const items = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (items.length) items[0].focus();
    }, 40);
    return () => window.clearTimeout(t);
  }, [selectedCategory]);

  // Focus search input only when user explicitly presses Enter while on category list
  useEffect(() => {
    if (selectedCategory) return;
    const root = serversContentRef.current;
    if (!root) return;


    // When we focus the search input via Enter, mark it as exitable so navigation keys can move out
    const onEnterWithExitable = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const input = root.querySelector<HTMLInputElement>('.search-field input[data-nav]');
      if (!input) return;
      input.focus();
      input.setAttribute('data-exitable', '1');
      const onBlur = () => {
        input.removeAttribute('data-exitable');
        input.removeEventListener('blur', onBlur);
      };
      input.addEventListener('blur', onBlur);
    };

    window.addEventListener('keydown', onEnterWithExitable);
    return () => window.removeEventListener('keydown', onEnterWithExitable);
  }, [selectedCategory]);

  useEffect(() => {
    setSubcategoryFilter(ALL_SUBCATEGORIES);
    setSearchTerm('');
  }, [selectedCategory]);

  // Activar navigation manager automáticamente al primer evento de teclado/remote
  useEffect(() => {
    const onFirstKey = (e: KeyboardEvent) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '];
      if (keys.includes(e.key)) {
        if (!keyboardNavigationManager.enabled) {
          keyboardNavigationManager.enable('.servers-content', { includeFormControls: true });
        }
      }
    };
    window.addEventListener('keydown', onFirstKey);
    return () => window.removeEventListener('keydown', onFirstKey);
  }, []);

  // Simple local handler to navigate vertically between category cards when viewing categories list
  useEffect(() => {
    if (selectedCategory) return;
    const root = serversContentRef.current;
    if (!root) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft') return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;

      // Find ancestor category-card of active (or if active is category-card__main)
      let node: HTMLElement | null = active;
      while (node && !node.classList?.contains('category-card')) {
        node = node.parentElement as HTMLElement | null;
      }
      if (!node) return;

      const cats = Array.from(root.querySelectorAll<HTMLElement>('.category-card')).filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
      if (!cats.length) return;
      const idx = cats.indexOf(node);
      if (idx === -1) return;

      if (e.key === 'ArrowDown') {
        const next = cats[Math.min(cats.length - 1, idx + 1)];
        if (next) {
          next.focus();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowUp') {
        const prev = cats[Math.max(0, idx - 1)];
        if (prev) {
          prev.focus();
          e.preventDefault();
        }
      } else if (e.key === 'ArrowLeft') {
        // focus header/back on left arrow
        const sel = ['header.topbar [data-nav]', 'header.topbar button.btn.hotzone', 'header.topbar .btn.hotzone', 'header.topbar .hotzone'].join(',');
        const back = document.querySelector<HTMLElement>(sel);
        if (back) {
          try { back.setAttribute('tabindex', '0'); back.setAttribute('data-nav', '1'); } catch {}
          setTimeout(() => { try { back.focus(); } catch {} }, 0);
          e.preventDefault();
        }
      }
    };

    root.addEventListener('keydown', onKey);
    window.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onKey);
    };
  }, [selectedCategory]);

  // Local grid navigation for server items when a category is open
  useEffect(() => {
    if (!selectedCategory) return;
    const root = serversContentRef.current;
    if (!root) return;

    const selector = '.server-grid .server-item';

    const getItems = () => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(el => !el.hasAttribute('disabled') && (el.offsetParent !== null || el.getClientRects().length > 0));

    const getCenter = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

    const buildGrid = (items: HTMLElement[]) => {
      const nodes = items.map((el, i) => {
        const rect = el.getBoundingClientRect();
        const c = getCenter(rect);
        return { el, rect, c, i };
      });
      nodes.sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);
      const rows: Array<typeof nodes> = [];
      for (const node of nodes) {
        const last = rows[rows.length - 1];
        if (!last) { rows.push([node]); continue; }
        const avgHeight = last.reduce((s, n) => s + n.rect.height, 0) / last.length || node.rect.height;
        const tol = Math.max(12, avgHeight * 0.5);
        const lastY = last.reduce((s, n) => s + n.c.y, 0) / last.length;
        if (Math.abs(node.c.y - lastY) <= tol) last.push(node); else rows.push([node]);
      }
      const grid = rows.map(r => r.sort((a, b) => a.c.x - b.c.x));
      const indexMap = new Map<number, { row: number; col: number }>();
      grid.forEach((row, ri) => row.forEach((n, ci) => indexMap.set(n.i, { row: ri, col: ci })));
      return { grid, indexMap };
    };

    const findNearestInRowByX = (row: Array<{ c: { x: number } }>, x: number) => {
      let best = 0; let bestDist = Infinity;
      row.forEach((n, i) => { const d = Math.abs(n.c.x - x); if (d < bestDist) { bestDist = d; best = i; } });
      return best;
    };

    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const items = getItems(); if (!items.length) return;
      const active = document.activeElement as HTMLElement | null;
      const activeIdx = active ? items.indexOf(active) : -1;
      // Build grid
      const { grid, indexMap } = buildGrid(items);
      if (activeIdx < 0) { const first = grid[0]?.[0]?.el; if (first) { first.focus(); e.preventDefault(); } return; }
      const pos = indexMap.get(activeIdx);
      if (!pos) return;
      const { row: r, col: c } = pos;
      let target: { row: number; col: number } | null = null;
      if (e.key === 'ArrowDown') {
        const nextRow = Math.min(grid.length - 1, r + 1);
        if (nextRow !== r) { const desiredX = grid[r][c].c.x; const colInNext = findNearestInRowByX(grid[nextRow], desiredX); target = { row: nextRow, col: colInNext }; }
      } else if (e.key === 'ArrowUp') {
        const prevRow = Math.max(0, r - 1);
        if (prevRow !== r) { const desiredX = grid[r][c].c.x; const colInPrev = findNearestInRowByX(grid[prevRow], desiredX); target = { row: prevRow, col: colInPrev }; }
      } else if (e.key === 'ArrowLeft') {
        // Focus header/back from within grid
        const sel = ['header.topbar [data-nav]', 'header.topbar button.btn.hotzone', 'header.topbar .btn.hotzone', 'header.topbar .hotzone'].join(',');
        const back = document.querySelector<HTMLElement>(sel);
        if (back) {
          try { back.setAttribute('tabindex', '0'); back.setAttribute('data-nav', '1'); } catch {}
          setTimeout(() => { try { back.focus(); } catch {} }, 0);
          return;
        }
      }
      if (target) {
        const el = grid[target.row]?.[target.col]?.el;
        if (el) { el.focus(); e.preventDefault(); }
      }
    };

    window.addEventListener('keydown', onKey);
    root.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); root.removeEventListener('keydown', onKey); };
  }, [selectedCategory]);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return [...categorias]
      .filter((cat) => (cat.items?.length || 0) > 0)
      .filter((cat) => !query || cat.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const sorterDiff = (a.sorter ?? Number.MAX_SAFE_INTEGER) - (b.sorter ?? Number.MAX_SAFE_INTEGER);
        if (sorterDiff !== 0) return sorterDiff;
        const countDiff = (b.items?.length || 0) - (a.items?.length || 0);
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name);
      });
  }, [categorias, searchTerm]);

  const groupedServers = useMemo(() => {
    if (!selectedCategory?.items?.length) return [];
    const map = new Map<string, ServerConfig[]>();
    selectedCategory.items.forEach((srv) => {
      const label = resolveSubcategory(srv.name);
      const list = map.get(label) || [];
      list.push(srv);
      map.set(label, list);
    });
    return orderSubcategories(Array.from(map.keys())).map((label) => ({
      label,
      servers: (map.get(label) || []).sort((a, b) => {
        const sorterDiff = (a.sorter ?? Number.MAX_SAFE_INTEGER) - (b.sorter ?? Number.MAX_SAFE_INTEGER);
        if (sorterDiff !== 0) return sorterDiff;
        return a.name.localeCompare(b.name);
      }),
    }));
  }, [selectedCategory]);

  const visibleGroups = useMemo(() => {
    if (subcategoryFilter === ALL_SUBCATEGORIES) return groupedServers;
    return groupedServers.filter(({ label }) => label === subcategoryFilter);
  }, [groupedServers, subcategoryFilter]);

  const handleCategoryClick = useCallback((cat: Category) => {
    setSelectedCategory(cat);
  }, [setSelectedCategory]);

  const handleServerClick = useCallback((srv: ServerConfig, cat: Category) => {
    if (autoMode) {
      startAutoConnect(cat);
      showToast(UI_MESSAGES.auto.testing(cat.name || UI_MESSAGES.auto.categoryFallback), document.activeElement as HTMLElement);
      return;
    }

    // Switch manual: permitir cambiar de servidor aunque esté conectado
    if (status === 'CONNECTED' || status === 'CONNECTING') {
      // Asegurar que el bridge tenga las credenciales actuales
      dt.set('DtUsername', creds.user);
      dt.set('DtPassword', creds.pass);
      dt.set('DtUuid', creds.uuid);

      if (status === 'CONNECTING') {
        cancelConnecting();
      } else {
        disconnect();
      }

      setConfig(srv);
      setScreen('home');
      showToast(UI_MESSAGES.status.connectingTo(srv.name || UI_MESSAGES.servers.inUse), document.activeElement as HTMLElement);

      // Esperar un poco para que el stop se procese en DTunnel
      window.setTimeout(() => {
        dt.call('DtExecuteVpnStart');
      }, 250);
      return;
    }

    setConfig(srv);
    setScreen('home');
    showToast(UI_MESSAGES.connection.serverSelected, document.activeElement as HTMLElement);
  }, [autoMode, startAutoConnect, showToast, status, creds.user, creds.pass, creds.uuid, cancelConnecting, disconnect, setConfig, setScreen]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleOpenNativeDialog = useCallback(() => {
    appLogger.add('info', '🔧 Abriendo diálogo de configuración nativa de DTunnel');
    dt.call('DtExecuteDialogConfig');
    
    // Polling para detectar cambios en el servidor seleccionado
    let lastConfigId: string | null = null;
    const currentConfig = dt.jsonConfigAtual as ServerConfig | null;
    if (currentConfig?.id) {
      lastConfigId = String(currentConfig.id);
    }
    
    const checkInterval = setInterval(() => {
      const newConfig = dt.jsonConfigAtual as ServerConfig | null;
      const newConfigId = newConfig?.id ? String(newConfig.id) : null;
      
      // Si el ID del servidor cambió
      if (newConfigId && newConfigId !== lastConfigId) {
        appLogger.add('info', `🔄 Cambio detectado: ${lastConfigId} → ${newConfigId}`);
        
        // Actualizar el servidor seleccionado inmediatamente
        if (newConfig && newConfig.id) {
          setConfig(newConfig);
          appLogger.add('info', `✅ Servidor actualizado: ${newConfig.name}`);
        }
        
        // Luego recargar categorías en background para sincronizar
        loadCategorias();
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      }
    }, 300); // Más frecuente para mejor respuesta
    
    // Detener el polling después de 10 segundos
    const timeoutId = setTimeout(() => {
      appLogger.add('debug', 'Timeout de polling alcanzado');
      clearInterval(checkInterval);
    }, 10000);
  }, [loadCategorias, setConfig]);

  return (
    <section className="screen servers-screen" style={sectionStyle}>
      <div className={`section-header ${selectedCategory ? 'section-header--detail' : ''}`}>
        {selectedCategory ? (
          <>
            <div className="section-title-group">
              <span className="section-eyebrow">{UI_MESSAGES.servers.selectedEyebrow}</span>
              <div className="section-title-line">
                <div className="divider-title" aria-label={`Categoría ${selectedCategory.name}`}>
                  <span className="divider-line" aria-hidden="true" />
                  <div className="panel-title panel-title--divider">{selectedCategory.name}</div>
                  <span className="divider-line" aria-hidden="true" />
                </div>
              </div>
              <small className="section-subtitle">{UI_MESSAGES.servers.selectedSubtitle}</small>
            </div>
            {groupedServers.length > 0 && (
              <div className="subcategory-chips subcategory-chips--header" role="tablist">
                {[ALL_SUBCATEGORIES, ...groupedServers.map(({ label }) => label)].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`chip ${label === subcategoryFilter ? 'chip-active' : ''}`}
                    onClick={() => setSubcategoryFilter(label)}
                    role="tab"
                    aria-selected={label === subcategoryFilter}
                  >
                    {label === ALL_SUBCATEGORIES ? ALL_SUBCATEGORIES : label}
                    <span className="chip-count">
                      {label === ALL_SUBCATEGORIES
                        ? selectedCategory.items?.length || 0
                        : groupedServers.find((group) => group.label === label)?.servers.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="panel-title">{UI_MESSAGES.servers.title}</div>
            <p className="section-subtitle">{UI_MESSAGES.servers.subtitle}</p>
          </>
        )}

      </div>

      <div className="servers-content" ref={serversContentRef}>
        {!selectedCategory && (
          <div className="category-toolbar">
            <div className="search-field">
              <i className="fas fa-search" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={UI_MESSAGES.servers.searchPlaceholder}
                data-nav
              />
              {searchTerm && (
                <button type="button" className="clear-btn" onClick={handleClearSearch} aria-label={UI_MESSAGES.servers.clearSearchAria}>
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              )}
            </div>
            {categorias.length > 0 && (
              <button 
                type="button" 
                className="config-btn" 
                data-nav
                onClick={handleOpenNativeDialog}
                title={UI_MESSAGES.servers.openConfiguratorTitle}
              >
                <i className="fas fa-cog" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {!selectedCategory ? (
          // Lista de categorías
          categorias.length === 0 ? (
            <div className="empty-result">
              <i className="fas fa-wifi" aria-hidden="true" />
              <p>{UI_MESSAGES.servers.noServers}</p>
              <small className="muted">{UI_MESSAGES.servers.checkConfigs}</small>
              <Button onClick={handleOpenNativeDialog} className="empty-result-btn">
                <i className="fas fa-cog" aria-hidden="true" style={{ marginRight: '8px' }} />
                {UI_MESSAGES.servers.openConfigurator}
              </Button>
            </div>
          ) : (
            <div className="category-grid">
              {filteredCategories.length === 0 ? (
                <div className="empty-result">
                  <i className="fas fa-map-marker-alt" aria-hidden="true" />
                  <p>{UI_MESSAGES.servers.noSearchResults(searchTerm)}</p>
                  <small className="muted">{UI_MESSAGES.servers.noSearchHint}</small>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button variant="soft" onClick={handleClearSearch}>
                      <i className="fas fa-redo" aria-hidden="true" style={{ marginRight: '8px' }} />
                      {UI_MESSAGES.servers.clearSearch}
                    </Button>
                    <Button onClick={handleOpenNativeDialog}>
                      <i className="fas fa-cog" aria-hidden="true" style={{ marginRight: '8px' }} />
                      {UI_MESSAGES.servers.configurator}
                    </Button>
                  </div>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const hasSelectedServer = currentConfig && cat.items?.some(srv => srv.id === currentConfig.id);
                  const first = cat.items?.[0];
                  const live = serversByName.getBestMatch(
                    `${cat.name || ''} ${first?.name || ''} ${first?.description || ''}`.trim()
                  );
                  return (
                  <div className={`category-card ${hasSelectedServer ? 'selected' : ''}`}>
                    <button
                      type="button"
                      className="category-card__main"
                      data-nav
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <div className="category-card__header">
                        <div>
                          <p className="category-card__title">{cat.name}</p>
                          <small className="muted">{UI_MESSAGES.servers.serverCount(cat.items.length)}</small>
                        </div>
                        <span className="badge-count" title="Usuarios conectados">
                            <i className="fas fa-users" aria-hidden="true" />
                            {live?.connectedUsers ?? '-'}
                            <span className="badge-count-label" aria-hidden="true">ONLINE</span>
                          </span>
                      </div>
                      <div className="category-card__body">
                        <span className="category-card__label">{UI_MESSAGES.servers.subcategories}</span>
                        <div className="category-pills">
                          {Array.from(new Set(cat.items.map((srv) => resolveSubcategory(srv.name)))).slice(0, 4).map((label) => (
                            <span key={label} className="pill">{label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="category-card__footer">
                        <span>{autoMode ? UI_MESSAGES.servers.autoTest : UI_MESSAGES.servers.manualSelect}</span>
                        <button
                          type="button"
                          className="expand-btn"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(cat.name); }}
                          aria-label={expandedCategories.has(cat.name) ? 'Contraer detalles' : 'Expandir detalles'}
                        >
                          <i className={`fas fa-chevron-${expandedCategories.has(cat.name) ? 'up' : 'down'}`} aria-hidden="true" />
                        </button>
                      </div>
                    </button>
                    {expandedCategories.has(cat.name) && live && (
                      <div className="category-card__expanded">
                        <div className="stats-grid">
                          <div className="stat-item">
                            <i className="fas fa-microchip" aria-hidden="true" />
                            <span>CPU: {live.cpuUsage !== undefined ? `${live.cpuUsage.toFixed(1)}%` : '-'}</span>
                          </div>
                          <div className="stat-item">
                            <i className="fas fa-memory" aria-hidden="true" />
                            <span>RAM: {live.memoryUsage !== undefined ? `${live.memoryUsage.toFixed(1)}%` : '-'}</span>
                          </div>
                          {live.cpuCores && (
                            <div className="stat-item">
                              <i className="fas fa-server" aria-hidden="true" />
                              <span>Cores: {live.cpuCores}</span>
                            </div>
                          )}
                          {live.totalMemoryGb && (
                            <div className="stat-item">
                              <i className="fas fa-database" aria-hidden="true" />
                              <span>RAM Total: {live.totalMemoryGb} GB</span>
                            </div>
                          )}
                          {live.netRecvMbps !== undefined && (
                            <div className="stat-item">
                              <i className="fas fa-download" aria-hidden="true" />
                              <span>↓ {live.netRecvMbps.toFixed(1)} Mbps</span>
                            </div>
                          )}
                          {live.netSentMbps !== undefined && (
                            <div className="stat-item">
                              <i className="fas fa-upload" aria-hidden="true" />
                              <span>↑ {live.netSentMbps.toFixed(1)} Mbps</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
                })
              )}
            </div>
          )
        ) : (
          // Lista de servidores de la categoría
          <>
            {visibleGroups.length === 0 ? (
              <div className="empty-result">
                <i className="fas fa-info-circle" aria-hidden="true" />
                <p>{UI_MESSAGES.servers.noServersInSubcategory}</p>
              </div>
            ) : (
              visibleGroups.map(({ label, servers }) => (
                <div key={label} className="subcategory-block">
                  <div className="subcategory-title">--- {label} ---</div>
                  <div className="server-grid">
                    {servers.map((srv) => {
                      const isActive = currentConfig?.id === srv.id;
                      const protocolLabel = formatProtocol(srv.mode) || srv.mode;
                      const actionLabel = autoMode ? UI_MESSAGES.servers.autoModeActive : UI_MESSAGES.servers.tapToConnect;
                      const domain = extractDomain(srv.description);
                      const cleanDescription = removeDomainFromDescription(srv.description);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          className={`server-item ${isActive ? 'selected' : ''}`}
                          onClick={() => handleServerClick(srv, selectedCategory)}
                          // data-nav attribute allows the navigation hook to find items
                          data-nav
                        >
                          <div className="server-item__header">
                            <div>
                              <p className="server-item__title">{srv.name}</p>
                              {srv.ip && <small className="server-item__ip">{srv.ip}</small>}
                            </div>
                            <div className="server-item__badges">
                              <span className="pill pill-soft">{protocolLabel}</span>
                              {domain && <span className="badge badge-domain">{domain}</span>}
                              {isActive && <span className="badge badge-active">{UI_MESSAGES.servers.inUse}</span>}
                            </div>
                          </div>
                          {cleanDescription && (
                            <p className="server-item__description">{cleanDescription}</p>
                          )}
                          <div className="server-item__footer">
                            <span>{actionLabel}</span>
                            <i className="fas fa-chevron-right" aria-hidden="true" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </section>
  );
}
