import { THEME, btnBase } from '../lib/theme';
import { Toggle, Tag, IcoIn, IcoOut, IcoSun, IcoMoon } from '../components/ui';

export function AdminView({ courts, onEnable, onDisable, onEdit, onDelete, onAdd }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Gestione campi</h2>
        <button onClick={onAdd} style={{
          ...btnBase, padding: '8px 14px', fontSize: 12, background: THEME.ac, color: '#fff',
        }}>
          + Nuovo
        </button>
      </div>

      {/* Griglia: 1 colonna su mobile, 2 su desktop */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {courts.map((court) => (
          <div key={court.id} style={{
            background: THEME.sf, borderRadius: '12px', padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid ' + THEME.bd,
            opacity: court.is_available ? 1 : 0.5,
            flex: '1 1 280px', minWidth: 0, maxWidth: '100%',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{court.name}</span>
              {!court.is_available && (
                <span style={{
                  fontSize: 9, fontWeight: 600, color: THEME.dg, background: THEME.dgL,
                  padding: '2px 6px', borderRadius: 99,
                }}>
                  NON DISPONIBILE
                </span>
              )}
            </div>
            <Toggle
              checked={court.is_available}
              onChange={() => {
                if (court.is_available) onDisable(court.id);
                else onEnable(court.id);
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Tag icon={court.is_indoor ? <IcoIn /> : <IcoOut />} text={court.is_indoor ? 'Indoor' : 'Outdoor'} />
            <Tag icon={court.has_lighting ? <IcoSun /> : <IcoMoon />} text={court.has_lighting ? 'Luci' : 'No luci'} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(court)} style={{
              ...btnBase, padding: '6px 14px', fontSize: 12, background: THEME.sfA, color: THEME.tx,
            }}>
              Modifica
            </button>
            <button onClick={() => onDelete(court.id)} style={{
              ...btnBase, padding: '6px 14px', fontSize: 12,
              background: 'transparent', color: THEME.dg, border: '1px solid ' + THEME.dgL,
            }}>
              Elimina
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
