// Technician Search tab — global search across locations, CUs, and water systems
// PRD: ch.01 §10

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import TechTopBar from '../../components/TechTopBar';
import {
  TECH_LOCATIONS, CONTROL_UNITS, WATER_SYSTEMS,
  getLocationBreadcrumb,
} from '../../data/technicianData';

const TSO_COLORS = { pass: '#16A34A', partial: '#F59E0B', fail: '#EF4444', not_tested: '#9CA3AF' };
const TSO_LABELS = { pass: 'Pass', partial: 'Partial', fail: 'Fail', not_tested: 'Not Tested' };

// Flatten all locations for searching
function flattenLocations(nodes, path = []) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, breadcrumb: path.join(' > ') });
    if (node.children) {
      result.push(...flattenLocations(node.children, [...path, node.name]));
    }
  }
  return result;
}

export default function TechSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const q = query.toLowerCase().trim();

  const allLocations = useMemo(() => flattenLocations(TECH_LOCATIONS), []);

  const results = useMemo(() => {
    if (!q) return null;

    const locations = allLocations.filter(loc =>
      loc.name.toLowerCase().includes(q) || loc.breadcrumb.toLowerCase().includes(q)
    );

    const cus = CONTROL_UNITS.filter(cu => {
      const breadcrumb = getLocationBreadcrumb(cu.locationId) || '';
      return cu.name.toLowerCase().includes(q) || breadcrumb.toLowerCase().includes(q);
    });

    const wss = WATER_SYSTEMS.filter(ws => {
      const breadcrumb = getLocationBreadcrumb(ws.locationId) || '';
      return ws.name.toLowerCase().includes(q) || breadcrumb.toLowerCase().includes(q) ||
        ws.deviceType.toLowerCase().includes(q);
    });

    return { locations, cus, wss };
  }, [q]);

  const hasResults = results && (results.locations.length > 0 || results.cus.length > 0 || results.wss.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F3F4F6' }}>
      <TechTopBar />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Search input */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, color: '#9CA3AF',
            }}>search</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locations, systems, CUs..."
              style={{
                width: '100%', padding: '12px 36px 12px 40px',
                borderRadius: 12, border: '1px solid #E5E7EB',
                fontSize: 14, fontFamily: 'inherit', color: '#14151A',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {query && (
              <span onClick={() => setQuery('')} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', fontSize: 16, color: '#9CA3AF', fontWeight: 700,
              }}>&times;</span>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!q && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#D1D5DB' }}>search</span>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>Search across your assigned locations</div>
          </div>
        )}

        {/* No results */}
        {q && !hasResults && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#9CA3AF' }}>No results for "{query}"</div>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div style={{ padding: '0 16px' }}>
            {/* Locations */}
            {results.locations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', margin: '8px 0' }}>
                  Locations ({results.locations.length})
                </div>
                {results.locations.map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => navigate(`/tech/locations`)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                      border: '1px solid #E5E7EB', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9CA3AF' }}>location_on</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{loc.levelType}{loc.breadcrumb ? ` · ${loc.breadcrumb}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
                  </div>
                ))}
              </div>
            )}

            {/* CUs */}
            {results.cus.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', margin: '8px 0' }}>
                  Control Units ({results.cus.length})
                </div>
                {results.cus.map(cu => (
                  <div
                    key={cu.id}
                    onClick={() => navigate(`/tech/cu/${cu.id}`)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                      border: '1px solid #E5E7EB', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: '#F3E8FF', color: '#7C3AED',
                    }}>CU</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{cu.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{getLocationBreadcrumb(cu.locationId)}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: cu.status === 'online' ? '#16A34A' : '#EF4444' }}>
                          &#9679; {cu.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: cu.paired ? '#16A34A' : '#DC2626' }}>
                          {cu.paired ? 'Paired' : 'Unpaired'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
                  </div>
                ))}
              </div>
            )}

            {/* Water Systems */}
            {results.wss.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.5px', margin: '8px 0' }}>
                  Water Systems ({results.wss.length})
                </div>
                {results.wss.map(ws => (
                  <div
                    key={ws.id}
                    onClick={() => navigate(`/tech/ws/${ws.id}`)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                      border: '1px solid #E5E7EB', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: '#DBEAFE', color: '#2563EB',
                    }}>WS</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>
                        {ws.name}
                        <span style={{ color: '#9CA3AF', fontWeight: 400 }}> &middot; {ws.deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{getLocationBreadcrumb(ws.locationId)}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: ws.paired ? '#16A34A' : '#DC2626' }}>
                          {ws.paired ? 'Paired' : 'Unpaired'}
                        </span>
                        {ws.paired && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: TSO_COLORS[ws.tsoStatus] }}>
                            {TSO_LABELS[ws.tsoStatus]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>
      <TabBar activeTab="search" />
    </div>
  );
}
