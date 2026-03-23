import { useState, useCallback } from 'react';
import { THEME, FONT, btnBase } from '../lib/theme';
import { validateEmail, validateDisplayName } from '../lib/helpers';
import { Modal, Toggle, IcoX, IcoSun, IcoMoon, IcoIn, IcoOut, Tag } from './ui';
import { Turnstile, isCaptchaEnabled } from './Turnstile';

// Stile condiviso per i messaggi di errore inline
var errStyle = { fontSize: 12, color: THEME.dg, margin: '0 0 8px', minHeight: 16 };

/* ── Login Sheet ── */

export function LoginSheet({ onSendLink, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  var validationError = touched ? validateEmail(email) : null;
  var isValid = !validateEmail(email);
  var captchaRequired = isCaptchaEnabled();
  var canSubmit = isValid && (!captchaRequired || captchaToken);

  async function handleSend() {
    setTouched(true);
    var err = validateEmail(email);
    if (err) { setError(err); return; }
    if (captchaRequired && !captchaToken) { setError('Completa la verifica'); return; }
    try {
      setError(null);
      await onSendLink(email.trim().toLowerCase(), captchaToken);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Errore nell\'invio del link');
      setCaptchaToken(null); // Reset captcha per riprovare
    }
  }

  var handleVerify = useCallback((token) => setCaptchaToken(token), []);
  var handleExpire = useCallback(() => setCaptchaToken(null), []);

  return (
    <Modal onClose={onClose}>
      <div style={{ position: 'relative' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: -8, right: -4,
          background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: THEME.t3,
        }}>
          <IcoX />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎾</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Accedi per prenotare
          </h2>
          <p style={{ fontSize: 13, color: THEME.t2, margin: 0 }}>
            Riceverai un link di accesso via email
          </p>
        </div>

        {!sent ? (
          <div>
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (!touched && e.target.value.length > 3) setTouched(true); }}
              onBlur={() => setTouched(true)}
              placeholder="nome@email.it"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1.5px solid ' + ((touched && validationError) ? THEME.dg : THEME.bd),
                fontSize: 15,
                fontFamily: FONT, outline: 'none', marginBottom: 4, background: THEME.bg,
                transition: 'border-color 0.15s',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <p style={errStyle}>
              {error || (touched && validationError) || ''}
            </p>
            <Turnstile onVerify={handleVerify} onExpire={handleExpire} />
            <button
              onClick={handleSend}
              disabled={!canSubmit}
              style={{
                ...btnBase, width: '100%',
                background: canSubmit ? THEME.ac : THEME.bd,
                color: canSubmit ? '#fff' : THEME.t3,
              }}
            >
              Invia link di accesso
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>Controlla la tua email</p>
            <p style={{ fontSize: 12, color: THEME.t2, margin: '0 0 8px' }}>
              Clicca il link che ti abbiamo inviato a <strong>{email}</strong>
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); setTouched(false); setError(null); }}
              style={{ ...btnBase, fontSize: 12, padding: '8px 16px', background: THEME.sfA, color: THEME.t2 }}
            >
              Usa un'altra email
            </button>
          </div>
        )}

        <p style={{ fontSize: 10, color: THEME.t3, textAlign: 'center', margin: '14px 0 0' }}>
          🔒 Nessuna password · salviamo solo la tua email
        </p>
      </div>
    </Modal>
  );
}


/* ── Name Setup (primo accesso) ── */

export function NameSetup({ onDone, onClose }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  var validationError = touched ? validateDisplayName(name) : null;
  var isValid = !validateDisplayName(name);

  async function handleSave() {
    setTouched(true);
    var err = validateDisplayName(name);
    if (err) return;
    setSaving(true);
    try {
      await onDone(name.trim());
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>Benvenuto!</h2>
        <p style={{ fontSize: 13, color: THEME.t2, margin: 0 }}>Come vuoi apparire nelle prenotazioni?</p>
      </div>
      <input
        value={name}
        onChange={(e) => { setName(e.target.value); if (!touched && e.target.value.length > 0) setTouched(true); }}
        onBlur={() => { if (name.length > 0) setTouched(true); }}
        placeholder="es. Marco R."
        autoFocus
        maxLength={40}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '8px',
          border: '1.5px solid ' + ((touched && validationError) ? THEME.dg : THEME.bd),
          fontSize: 15,
          fontFamily: FONT, outline: 'none', marginBottom: 4,
          background: THEME.bg, textAlign: 'center',
          transition: 'border-color 0.15s',
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 20, marginBottom: 4 }}>
        <p style={{ ...errStyle, flex: 1, margin: 0 }}>
          {(touched && validationError) || ''}
        </p>
        <span style={{ fontSize: 10, color: name.trim().length > 35 ? THEME.to : THEME.t3 }}>
          {name.trim().length}/40
        </span>
      </div>
      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        style={{
          ...btnBase, width: '100%',
          background: isValid ? THEME.ac : THEME.bd,
          color: isValid ? '#fff' : THEME.t3,
        }}
      >
        {saving ? 'Salvataggio...' : 'Inizia a prenotare'}
      </button>
      <p style={{ fontSize: 10, color: THEME.t3, textAlign: 'center', margin: '12px 0 0' }}>
        Visibile solo nel calendario prenotazioni
      </p>
    </Modal>
  );
}


/* ── Court Form (crea/modifica campo) ── */

export function CourtFormModal({ court, onSave, onClose }) {
  const [name, setName] = useState(court ? court.name : '');
  const [lit, setLit] = useState(court ? court.has_lighting : false);
  const [ind, setInd] = useState(court ? court.is_indoor : false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: court ? court.id : undefined,
        name: name.trim(),
        has_lighting: lit,
        is_indoor: ind,
      });
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 18px' }}>
        {court ? 'Modifica campo' : 'Nuovo campo'}
      </h3>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: THEME.t2, display: 'block', marginBottom: 4 }}>
          Nome
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Campo 5"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: '1.5px solid ' + THEME.bd, fontSize: 14,
            fontFamily: FONT, outline: 'none', background: THEME.bg,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '6px 0' }}>
        <span style={{ fontSize: 14 }}>Illuminazione</span>
        <Toggle checked={lit} onChange={() => setLit(!lit)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '6px 0' }}>
        <span style={{ fontSize: 14 }}>Indoor</span>
        <Toggle checked={ind} onChange={() => setInd(!ind)} />
      </div>
      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        style={{
          ...btnBase, width: '100%',
          background: name.trim() ? THEME.ac : THEME.bd,
          color: name.trim() ? '#fff' : THEME.t3,
        }}
      >
        {saving ? 'Salvataggio...' : 'Salva'}
      </button>
    </Modal>
  );
}


/* ── Disable Court Modal ── */

export function DisableCourtModal({ court, count, onKeep, onCancelAll, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', padding: 4 }}>
        <div style={{ color: THEME.to, marginBottom: 8, fontSize: 24 }}>⚠️</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
          Disabilita {court ? court.name : 'campo'}
        </h3>
        <p style={{ fontSize: 13, color: THEME.t2, margin: '0 0 20px', lineHeight: 1.5 }}>
          {count === 1 ? "C'è 1 prenotazione futura" : 'Ci sono ' + count + ' prenotazioni future'} su questo campo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onKeep} style={{
            ...btnBase, background: THEME.sfA, color: THEME.tx, fontSize: 13,
            padding: 12, width: '100%', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 600 }}>Mantieni prenotazioni</div>
            <div style={{ fontSize: 11, color: THEME.t2, fontWeight: 400, marginTop: 2 }}>
              Blocca solo le nuove prenotazioni
            </div>
          </button>
          <button onClick={onCancelAll} style={{
            ...btnBase, background: THEME.dgL, color: THEME.dg, fontSize: 13,
            padding: 12, width: '100%', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 600 }}>Cancella tutte le prenotazioni</div>
            <div style={{ fontSize: 11, color: THEME.dg, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
              Gli utenti verranno avvisati via email
            </div>
          </button>
          <button onClick={onClose} style={{
            ...btnBase, background: 'transparent', color: THEME.t2, fontSize: 13, padding: 10,
          }}>
            Annulla
          </button>
        </div>
      </div>
    </Modal>
  );
}


/* ── Confirm Cancel Modal ── */

export function ConfirmCancelModal({ isAdmin, isOtherUser, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', padding: 8 }}>
        {isAdmin && isOtherUser && (
          <p style={{ fontSize: 12, color: THEME.t2, margin: '0 0 8px' }}>
            ⚠️ L'utente riceverà un'email di notifica
          </p>
        )}
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>
          Cancellare questa prenotazione?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...btnBase, flex: 1, background: THEME.sfA, color: THEME.tx }}>
            Annulla
          </button>
          <button onClick={onConfirm} style={{ ...btnBase, flex: 1, background: THEME.dg, color: '#fff' }}>
            Cancella
          </button>
        </div>
      </div>
    </Modal>
  );
}
