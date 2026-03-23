import { THEME, FONT, MONO, TYPE_COLORS, btnBase } from '../lib/theme';
import { pad, formatDate } from '../lib/helpers';

/* ── Icons ── */

export function IcoSun() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
export function IcoMoon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
export function IcoIn() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
export function IcoOut() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
export function IcoX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
export function IcoChev({ dir }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'none' }}><polyline points="9 18 15 12 9 6"/></svg>;
}
export function IcoLock() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

/* ── Modal (bottom sheet) ── */

export function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, animation: 'fadeIn 0.15s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: THEME.sf, borderRadius: '18px 18px 0 0',
        padding: '24px 20px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 8px))',
        width: '100%', maxWidth: 480, animation: 'slideUp 0.2s ease',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Toggle switch ── */

export function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 42, height: 24, borderRadius: 99,
      background: checked ? THEME.ac : THEME.bd,
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s ease', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 99, background: '#fff',
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

/* ── Pill (badge) ── */

export function Pill({ text, color, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, color, background: bg,
      padding: '2px 8px', borderRadius: 99,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {text}
    </span>
  );
}

/* ── Tag (info chip) ── */

export function Tag({ icon, text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, color: THEME.t2, background: THEME.bg,
      padding: '2px 6px', borderRadius: 99, fontWeight: 500,
    }}>
      {icon} {text}
    </span>
  );
}

/* ── Court badge (mini info sotto il nome campo) ── */

export function CourtBadge({ court }) {
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 9, color: THEME.t3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {court.is_indoor ? <IcoIn /> : <IcoOut />}
        <span>{court.is_indoor ? 'In' : 'Out'}</span>
      </span>
      <span style={{ fontSize: 9, color: THEME.t3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {court.has_lighting ? <IcoSun /> : <IcoMoon />}
        <span>{court.has_lighting ? 'Luci' : 'No'}</span>
      </span>
    </div>
  );
}

/* ── Empty state ── */

export function Empty({ emoji, text, sub }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: THEME.t2 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{text}</p>
      {sub && <p style={{ fontSize: 12, color: THEME.t3, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}

/* ── Booking card (usata in "Le mie" e "Tutte le prenotazioni") ── */

export function BookingCard({ booking, courts, onCancel, canCancel, showUser }) {
  const court = courts.find((c) => c.id === booking.court_id);
  const colors = TYPE_COLORS[booking.booking_type] || TYPE_COLORS.normal;

  return (
    <div style={{
      background: THEME.sf, borderRadius: '12px', padding: '12px 14px', marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center',
      gap: 12, border: '1px solid ' + THEME.bd,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '8px', background: colors.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.text, fontFamily: MONO }}>
          {pad(booking.start_hour)}
        </span>
        <span style={{ fontSize: 8, color: colors.text, opacity: 0.6 }}>
          {pad(booking.start_hour + 1)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{court ? court.name : 'Campo'}</div>
        <div style={{ fontSize: 12, color: THEME.t2, marginTop: 1 }}>
          {formatDate(booking.date)}
          {showUser && (
            <span style={{ marginLeft: 6, fontWeight: 500, color: colors.text }}>
              · {booking.user_name}
            </span>
          )}
        </div>
        {booking.booking_type !== 'normal' && (
          <span style={{
            fontSize: 9, fontWeight: 600, color: colors.text, background: colors.bg,
            padding: '1px 6px', borderRadius: 99, display: 'inline-block', marginTop: 3,
          }}>
            {colors.label}
          </span>
        )}
      </div>
      {canCancel && (
        <button onClick={() => onCancel(booking.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 8, color: THEME.t3, borderRadius: 8,
        }}>
          <IcoX />
        </button>
      )}
    </div>
  );
}
