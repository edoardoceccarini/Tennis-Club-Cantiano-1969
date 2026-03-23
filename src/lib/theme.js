export const THEME = {
  bg: '#FAFAF8',
  sf: '#FFFFFF',
  sfA: '#F3F2EE',
  bd: '#E8E6E1',
  bdF: '#2D6A4F',
  tx: '#1A1A18',
  t2: '#6B6B65',
  t3: '#9E9E96',
  ac: '#2D6A4F',
  acL: '#D8F3DC',
  acH: '#1B4332',
  dg: '#C1292E',
  dgL: '#FFE0E0',
  sc: '#5A67D8',
  scL: '#E8EAFF',
  to: '#D97706',
  toL: '#FEF3C7',
  mt: '#6B7280',
  mtL: '#F3F4F6',
};

export const TYPE_COLORS = {
  normal:      { bg: THEME.acL, text: THEME.ac, label: 'Partita' },
  tournament:  { bg: THEME.toL, text: THEME.to, label: 'Torneo' },
  school:      { bg: THEME.scL, text: THEME.sc, label: 'Scuola' },
  maintenance: { bg: THEME.mtL, text: THEME.mt, label: 'Manutenzione' },
};

export const BOOKING_TYPES = [
  { value: 'normal',      label: 'Partita',       icon: '🎾' },
  { value: 'tournament',  label: 'Torneo',        icon: '🏆' },
  { value: 'school',      label: 'Scuola Tennis',  icon: '🎓' },
  { value: 'maintenance', label: 'Manutenzione',   icon: '🔧' },
];

export const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
export const MONO = "'JetBrains Mono', monospace";

export const btnBase = {
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  padding: '12px 20px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
