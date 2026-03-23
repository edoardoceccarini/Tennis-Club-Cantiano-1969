const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatDate(d) {
  return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getBookingWindowEnd(isAdmin) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + (isAdmin ? 14 : 6));
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Genera un array di date a partire da oggi.
 */
export function generateDays(count) {
  const result = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    result.push(d);
  }
  return result;
}

/**
 * Converte un Date in inizio slot ISO per Supabase.
 * es. (date, 14) → "2025-03-21T14:00:00+01:00"
 */
export function toSlotStart(date, hour) {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Converte un Date in fine slot ISO per Supabase.
 */
export function toSlotEnd(date, hour) {
  const d = new Date(date);
  d.setHours(hour + 1, 0, 0, 0);
  return d.toISOString();
}

/**
 * Estrai data e ora dallo start_time di una prenotazione Supabase.
 */
export function parseBooking(booking) {
  const start = new Date(booking.start_time);
  return {
    ...booking,
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    start_hour: start.getHours(),
  };
}

/* ── Validazione ── */

/**
 * Valida un indirizzo email.
 * Restituisce null se valido, altrimenti il messaggio d'errore.
 */
export function validateEmail(email) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Inserisci un indirizzo email';
  if (trimmed.length > 254) return 'Email troppo lunga';

  // RFC 5322 semplificato ma solido
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!re.test(trimmed)) return 'Indirizzo email non valido';

  // Deve avere almeno un punto dopo la @
  const domain = trimmed.split('@')[1];
  if (!domain || !domain.includes('.')) return 'Dominio email non valido';

  // TLD minimo 2 caratteri
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return 'Dominio email non valido';

  return null;
}

/**
 * Valida un display name per le prenotazioni.
 * Restituisce null se valido, altrimenti il messaggio d'errore.
 * Vincolo DB: char_length between 2 and 40.
 */
export function validateDisplayName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Inserisci un nome';
  if (trimmed.length < 2) return 'Minimo 2 caratteri';
  if (trimmed.length > 40) return 'Massimo 40 caratteri';

  // Solo lettere (unicode), spazi, punti, apostrofi, trattini
  const re = /^[\p{L}\s.'\-]+$/u;
  if (!re.test(trimmed)) return 'Usa solo lettere, spazi e punti';

  // Non solo spazi/punti
  if (!/\p{L}/u.test(trimmed)) return 'Inserisci almeno una lettera';

  return null;
}

/**
 * Controlla se uno slot è prenotabile in base al ruolo.
 * - isStarted: lo slot è già iniziato (nessuno può prenotare)
 * - isLocked: il cutoff è passato per questo ruolo
 */
export function slotAvailability(slotDate, hour, isAdmin) {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = sameDay(slotDate, today);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const slotMins = hour * 60;

  const isStarted = isToday && nowMins >= slotMins;
  let isLocked = false;

  if (isToday) {
    if (isAdmin) {
      isLocked = nowMins >= slotMins;
    } else {
      isLocked = nowMins >= slotMins - 60;
    }
  }

  return { isStarted, isLocked };
}
