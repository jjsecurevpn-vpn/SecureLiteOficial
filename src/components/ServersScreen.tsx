import { useState, useCallback, useMemo, useEffect } from 'react';
import { useVpn } from '../context/VpnContext';
import { useToastContext } from '../context/ToastContext';
import { useSectionStyle } from '../hooks';
import { formatProtocol } from '../utils/formatUtils';
import { UI_MESSAGES } from '../constants';
import type { Category, ServerConfig } from '../types';

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
    categorias,
    config: currentConfig,
    setConfig,
    setScreen,
    startAutoConnect,
    loadCategorias,
    autoMode,
    selectedCategory,
    setSelectedCategory,
  } = useVpn();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(ALL_SUBCATEGORIES);
  const sectionStyle = useSectionStyle();

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    setSubcategoryFilter(ALL_SUBCATEGORIES);
    setSearchTerm('');
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
      showToast(UI_MESSAGES.auto.testing(cat.name || 'categoría'));
      return;
    }
    setConfig(srv);
    setScreen('home');
    showToast(UI_MESSAGES.connection.serverSelected);
  }, [autoMode, startAutoConnect, showToast, setConfig, setScreen]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <section className="screen" style={sectionStyle}>
      <div className={`section-header ${selectedCategory ? 'section-header--detail' : ''}`}>
        {selectedCategory ? (
          <>
            <div className="section-title-group">
              <span className="section-eyebrow">Categoría seleccionada</span>
              <div className="section-title-line">
                <div className="divider-title" aria-label={`Categoría ${selectedCategory.name}`}>
                  <span className="divider-line" aria-hidden="true" />
                  <div className="panel-title panel-title--divider">{selectedCategory.name}</div>
                  <span className="divider-line" aria-hidden="true" />
                </div>
              </div>
              <small className="section-subtitle">Elige el servidor que mejor se adapte a tu conexión.</small>
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
                    {label === ALL_SUBCATEGORIES ? 'Todos' : label}
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
            <p className="section-subtitle">Explora y elige la mejor ubicación para tu conexión.</p>
          </>
        )}
      </div>

      <div className="servers-content">
        {!selectedCategory && (
          <div className="category-toolbar">
            <div className="search-field">
              <i className="fas fa-search" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar país o categoría"
              />
              {searchTerm && (
                <button type="button" className="clear-btn" onClick={handleClearSearch} aria-label="Limpiar búsqueda">
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {!selectedCategory ? (
          // Lista de categorías
          categorias.length === 0 ? (
            <div className="pad">
              {UI_MESSAGES.servers.noServers}
              <br />
              <small className="muted">{UI_MESSAGES.servers.checkConfigs}</small>
            </div>
          ) : (
            <div className="category-grid">
              {filteredCategories.length === 0 ? (
                <div className="empty-result">
                  <i className="fas fa-map-marker-alt" aria-hidden="true" />
                  <p>No encontramos servidores para "{searchTerm}"</p>
                  <small className="muted">Revisa la ortografía o intenta con otro término.</small>
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    className="category-card"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <div className="category-card__header">
                      <div>
                        <p className="category-card__title">{cat.name}</p>
                        <small className="muted">{UI_MESSAGES.servers.serverCount(cat.items.length)}</small>
                      </div>
                      <span className="badge badge-count">
                        <i className="fas fa-server" aria-hidden="true" />
                        {cat.items.length}
                      </span>
                    </div>
                    <div className="category-card__body">
                      <span className="category-card__label">Subcategorías</span>
                      <div className="category-pills">
                        {Array.from(new Set(cat.items.map((srv) => resolveSubcategory(srv.name)))).slice(0, 4).map((label) => (
                          <span key={label} className="pill">{label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="category-card__footer">
                      <span>{autoMode ? 'Prueba automática' : 'Seleccionar manual'}</span>
                      <i className="fas fa-chevron-right" aria-hidden="true" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )
        ) : (
          // Lista de servidores de la categoría
          <>
            {visibleGroups.length === 0 ? (
              <div className="empty-result">
                <i className="fas fa-info-circle" aria-hidden="true" />
                <p>No hay servidores en esta subcategoría.</p>
              </div>
            ) : (
              visibleGroups.map(({ label, servers }) => (
                <div key={label} className="subcategory-block">
                  <div className="subcategory-title">--- {label} ---</div>
                  <div className="server-grid">
                    {servers.map((srv) => {
                      const isActive = currentConfig?.id === srv.id;
                      const protocolLabel = formatProtocol(srv.mode) || srv.mode;
                      const actionLabel = autoMode ? 'Modo automático activo' : 'Toca para conectar';
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          className={`server-item ${isActive ? 'selected' : ''}`}
                          onClick={() => handleServerClick(srv, selectedCategory)}
                        >
                          <div className="server-item__header">
                            <div>
                              <p className="server-item__title">{srv.name}</p>
                              {srv.ip && <small className="server-item__ip">{srv.ip}</small>}
                            </div>
                            <div className="server-item__badges">
                              <span className="pill pill-soft">{protocolLabel}</span>
                              {isActive && <span className="badge badge-active">En uso</span>}
                            </div>
                          </div>
                          {srv.description && (
                            <p className="server-item__description">{srv.description}</p>
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
