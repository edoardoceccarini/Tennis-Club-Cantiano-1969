import { THEME, FONT, MONO, TYPE_COLORS, SLOT_HOURS, BOOKING_TYPES, btnBase } from '../lib/theme';
import { pad, formatDate, sameDay, slotAvailability } from '../lib/helpers';
import { IcoChev, IcoLock, CourtBadge, Empty } from '../components/ui';

export function CalendarView({
  days, selDay, setSelDay, courts, dayBookings,
  selSlots, tapSlot, isAdmin, isGuest,
  bkType, setBkType, onConfirm, submitting,
}) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentIndex = days.findIndex((d) => sameDay(d, selDay));

  function scrollDay(dir) {
    const ni = Math.max(0, Math.min(days.length - 1, currentIndex + dir));
    setSelDay(days[ni]);
  }

  return (
    <div>
      {/* Guest banner */}
      {isGuest && (
        <div style={{
          margin: '12px 16px 0', padding: '10px 14px',
          background: '#2D6A4F08', border: '1px solid ' + THEME.acL,
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <IcoLock />
          <span style={{ fontSize: 12, color: THEME.t2, lineHeight: 1.4 }}>
            Stai consultando la disponibilità. <strong style={{ color: THEME.ac }}>Accedi</strong> per prenotare.
          </span>
        </div>
      )}

      {/* Day strip */}
      <div style={{
        background: THEME.sf, borderBottom: '1px solid ' + THEME.bd, padding: '12px 0 8px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', marginBottom: 10,
        }}>
          <button onClick={() => scrollDay(-1)} disabled={currentIndex <= 0}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: currentIndex <= 0 ? 0.3 : 1 }}>
            <IcoChev dir="left" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {formatDate(selDay)}
            {sameDay(selDay, now) && (
              <span style={{ color: THEME.ac, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>oggi</span>
            )}
          </span>
          <button onClick={() => scrollDay(1)} disabled={currentIndex >= days.length - 1}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: currentIndex >= days.length - 1 ? 0.3 : 1 }}>
            <IcoChev dir="right" />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '0 16px' }}>
          {days.map((day, i) => {
            const isSelected = sameDay(day, selDay);
            const isToday = sameDay(day, now);
            return (
              <button key={i} onClick={() => setSelDay(day)} style={{
                flex: '0 0 auto', width: 44, padding: '6px 0', borderRadius: '8px',
                border: 'none', background: isSelected ? THEME.ac : 'transparent',
                color: isSelected ? '#fff' : isToday ? THEME.ac : THEME.tx,
                cursor: 'pointer', fontFamily: FONT,
              }}>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>
                  {['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'][day.getDay()]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{day.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Court grid */}
      <div style={{ padding: '16px 10px' }}>
        {courts.length === 0 ? (
          <Empty emoji="🏗️" text="Nessun campo disponibile" />
        ) : (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {/* Time column */}
            <div style={{ flex: '0 0 36px', paddingTop: 56 }}>
              {SLOT_HOURS.map((h) => (
                <div key={h} style={{
                  height: 50, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-end', paddingRight: 4,
                  fontSize: 10, color: THEME.t3, fontFamily: MONO, fontWeight: 500,
                }}>
                  {pad(h)}
                </div>
              ))}
            </div>

            {/* Court columns */}
            {courts.map((court) => (
              <div key={court.id} style={{ flex: '1 0 0', minWidth: 80 }}>
                <div style={{
                  textAlign: 'center', marginBottom: 4, padding: '6px 2px',
                  background: THEME.sfA, borderRadius: '8px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{court.name}</div>
                  <CourtBadge court={court} />
                </div>

                {SLOT_HOURS.map((h) => {
                  const booking = dayBookings.find(
                    (b) => b.court_id === court.id && b.start_hour === h
                  );
                  const isSelected = selSlots.some(
                    (s) => s.courtId === court.id && s.hour === h
                  );
                  const { isStarted, isLocked } = slotAvailability(selDay, h, isAdmin);

                  if (booking) {
                    const colors = TYPE_COLORS[booking.booking_type] || TYPE_COLORS.normal;
                    const displayName = booking.user_name.length > 10
                      ? booking.user_name.slice(0, 9) + '…'
                      : booking.user_name;

                    return (
                      <div key={h} style={{
                        height: 50, marginBottom: 2, borderRadius: '6px',
                        background: colors.bg, border: '1.5px solid ' + colors.text + '18',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', fontSize: 9, color: colors.text,
                        fontWeight: 500, opacity: isStarted ? 0.4 : 1,
                      }}>
                        <span style={{ fontSize: 8, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {colors.label}
                          </span>
                          {booking.booking_type === 'normal' && (
                            <span style={{ marginTop: 1, fontWeight: 600, fontSize: 10 }}>
                              {displayName}
                            </span>
                          )}
                      </div>
                    );
                  }

                  return (
                    <button key={h}
                      onClick={() => { if (!isLocked) tapSlot(court.id, h); }}
                      style={{
                        width: '100%', height: 50, marginBottom: 2, borderRadius: '6px',
                        border: isSelected ? '2px solid ' + THEME.ac : '1.5px dashed ' + THEME.bd,
                        background: isSelected ? '#2D6A4F10' : 'transparent',
                        cursor: isLocked ? 'default' : 'pointer',
                        opacity: isLocked ? 0.25 : 1,
                        fontFamily: FONT, fontSize: 11,
                        color: isSelected ? THEME.ac : THEME.t3,
                        fontWeight: isSelected ? 600 : 400,
                      }}>
                      {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking bar */}
      {selSlots.length > 0 && !isGuest && (
        <div style={{
          position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 928,
          background: THEME.sf, borderRadius: '12px', padding: '14px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)', zIndex: 80,
          border: '1px solid ' + THEME.bd, animation: 'slideUp 0.2s ease',
        }}>
          <div style={{ fontSize: 11, color: THEME.t2, marginBottom: isAdmin ? 8 : 10 }}>
            {selSlots.map((s, i) => {
              const c = courts.find((x) => x.id === s.courtId);
              return (
                <span key={s.key}>
                  {i > 0 && <span style={{ margin: '0 4px', color: THEME.t3 }}>·</span>}
                  <strong>{c ? c.name : ''}</strong> {pad(s.hour)}:00
                </span>
              );
            })}
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
              {BOOKING_TYPES.map((t) => {
                const active = bkType === t.value;
                return (
                  <button key={t.value} onClick={() => setBkType(t.value)} style={{
                    padding: '4px 10px', borderRadius: 99,
                    border: '1.5px solid ' + (active ? THEME.ac : THEME.bd),
                    background: active ? THEME.acL : 'transparent',
                    color: active ? THEME.ac : THEME.t2,
                    fontSize: 11, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
                  }}>
                    {t.icon} {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {selSlots.length} slot
              {!isAdmin && (
                <span style={{ fontSize: 11, color: THEME.t3, fontWeight: 400, marginLeft: 4 }}>/ max 2</span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelDay(selDay)} disabled={submitting} style={{
                ...btnBase, padding: '8px 14px', fontSize: 13, background: THEME.sfA, color: THEME.t2,
                opacity: submitting ? 0.5 : 1,
              }}>
                Annulla
              </button>
              <button onClick={onConfirm} disabled={submitting} style={{
                ...btnBase, padding: '8px 18px', fontSize: 13,
                background: submitting ? THEME.t3 : THEME.ac, color: '#fff',
              }}>
                {submitting ? 'Invio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
