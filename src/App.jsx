import { useState, useEffect, useMemo, useCallback } from 'react';

import { THEME, FONT, btnBase } from './lib/theme';
import { sameDay, generateDays, getBookingWindowEnd } from './lib/helpers';

import { useAuth } from './hooks/useAuth';
import { useCourts } from './hooks/useCourts';
import { useBookings } from './hooks/useBookings';
import { useResponsive } from './hooks/useResponsive';

import { Pill } from './components/ui';
import { LoginSheet, NameSetup, CourtFormModal, DisableCourtModal, ConfirmCancelModal } from './components/modals';

import { CalendarView } from './views/CalendarView';
import { MyBookingsView, AllBookingsView } from './views/BookingsView';
import { AdminView } from './views/AdminView';
import { PrivacyScreen } from './views/PrivacyScreen';

export default function App() {
  const { user, loading: authLoading, needsName, sendMagicLink, updateDisplayName, logout } = useAuth();
  const { courts, createCourt, updateCourt, toggleAvailability, deleteCourt } = useCourts();
  const { bookings, createBookings, cancelBooking, cancelAllForCourt, loadRange} = useBookings();
  const { isMobile, isDesktop } = useResponsive();

  const isAdmin = user?.isAdmin || false;
  const isGuest = !user;

  // Mobile: 480px. Admin su desktop: più largo per sfruttare lo spazio.
  const maxW = isAdmin && isDesktop ? 960 : isAdmin && !isMobile ? 720 : 480;

  const [screen, setScreen] = useState('calendar');
  const [selDay, setSelDay] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [selSlots, setSelSlots] = useState([]);
  const [bkType, setBkType] = useState('normal');
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [editCourt, setEditCourt] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [disableModal, setDisableModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const flash = useCallback((msg, type) => {
    setToast({ msg, type: type || 'success' });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Traduce gli errori Supabase in messaggi leggibili
  function friendlyError(err) {
    var msg = err?.message || err?.error_description || String(err);
    if (msg.includes('JWT expired') || msg.includes('not authenticated') || err?.code === '401') {
      // Sessione scaduta
      setTimeout(() => { logout(); setShowLogin(true); }, 100);
      return 'Sessione scaduta. Accedi di nuovo.';
    }
    if (msg.includes('no_overlap') || msg.includes('exclusion') || msg.includes('23P01')) {
      return 'Slot già prenotato da un altro utente.';
    }
    if (msg.includes('check') && msg.includes('valid_hours')) {
      return 'Orario non valido.';
    }
    if (msg.includes('violates foreign key')) {
      return 'Campo non più disponibile.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NETWORK')) {
      return 'Connessione assente. Riprova.';
    }
    if (msg.includes('rate') || msg.includes('429')) {
      return 'Troppe richieste. Attendi qualche secondo.';
    }
    return msg;
  }

  /* ── Derived data ── */

  const allDays = useMemo(() => {
    if (isGuest) return generateDays(14);
    const end = getBookingWindowEnd(isAdmin);
    const diff = Math.ceil((end - new Date()) / 86400000) + 1;
    return generateDays(Math.max(diff, 1));
  }, [isGuest, isAdmin]);

  const activeCourts = useMemo(() => courts.filter((c) => c.is_available), [courts]);

  // Pulisci slot selezionati se un campo viene disabilitato mentre lo stai selezionando
  useEffect(() => {
    var activeIds = activeCourts.map((c) => c.id);
    setSelSlots((prev) => {
      var filtered = prev.filter((s) => activeIds.includes(s.courtId));
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [activeCourts]);

  const dayBookings = useMemo(
    () => bookings.filter((b) => sameDay(b.date, selDay)),
    [bookings, selDay]
  );

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Filtra: solo prenotazioni future (esclusi slot di oggi già passati)
  function isFutureBooking(b) {
    if (b.date > today) return true; // giorni futuri: sempre visibili
    if (b.date < today) return false; // giorni passati: mai visibili
    // Oggi: visibile solo se lo slot non è ancora iniziato
    return b.start_hour > new Date().getHours();
  }

  const myBookings = useMemo(
    () => user
      ? bookings
          .filter((b) => b.user_id === user.id && isFutureBooking(b))
          .sort((a, b) => a.date - b.date || a.start_hour - b.start_hour)
      : [],
    [bookings, user, today]
  );

  const allFutureBookings = useMemo(
    () => bookings
      .filter((b) => isFutureBooking(b))
      .sort((a, b) => a.date - b.date || a.start_hour - b.start_hour),
    [bookings, today]
  );

  /* ── Actions ── */

  function tapSlot(courtId, hour) {
    if (isGuest) { setShowLogin(true); return; }
    const key = courtId + '-' + hour;
    if (selSlots.find((s) => s.key === key)) {
      setSelSlots((p) => p.filter((s) => s.key !== key));
      return;
    }
    if (!isAdmin && selSlots.length >= 2) {
      flash('Max 2 slot per prenotazione', 'error');
      return;
    }
    setSelSlots((p) => [...p, { key, courtId, hour, date: selDay }]);
  }

  async function confirmBooking() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createBookings(selSlots, isAdmin ? bkType : 'normal');
      const n = selSlots.length;
      setSelSlots([]);
      setBkType('normal');
      flash(n + ' slot prenotat' + (n > 1 ? 'i' : 'o'));
    } catch (err) {
      flash(friendlyError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking() {
    if (!confirmCancelId || submitting) return;
    setSubmitting(true);
    try {
      const booking = bookings.find((b) => b.id === confirmCancelId);
      await cancelBooking(confirmCancelId);
      setConfirmCancelId(null);
      if (isAdmin && booking && booking.user_id !== user.id) {
        flash('Cancellata · Email inviata');
      } else {
        flash('Prenotazione cancellata');
      }
    } catch (err) {
      flash(friendlyError(err), 'error');
      setConfirmCancelId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveCourt(data) {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (data.id) {
        await updateCourt(data.id, {
          name: data.name,
          has_lighting: data.has_lighting,
          is_indoor: data.is_indoor,
        });
      } else {
        await createCourt(data);
      }
      setShowCourtForm(false);
      setEditCourt(null);
      flash(data.id ? 'Campo aggiornato' : 'Campo creato');
    } catch (err) {
      flash(friendlyError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function startDisableCourt(courtId) {
    var future = bookings.filter(
      (b) => b.court_id === courtId && b.date >= today
    );
    if (future.length === 0) {
      try {
        await toggleAvailability(courtId, true);
        flash('Campo disabilitato');
      } catch (err) { flash(friendlyError(err), 'error'); }
    } else {
      setDisableModal({ courtId, count: future.length });
    }
  }

  async function doDisable(courtId, shouldCancel) {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (shouldCancel) {
        var cancelled = await cancelAllForCourt(courtId);
        await toggleAvailability(courtId, true);
        flash('Disabilitato · ' + (cancelled?.length || 0) + ' prenotazioni cancellate');
      } else {
        await toggleAvailability(courtId, true);
        flash('Disabilitato · prenotazioni mantenute');
      }
    } catch (err) {
      flash(friendlyError(err), 'error');
    } finally {
      setSubmitting(false);
    }
    setDisableModal(null);
  }

  async function handleDeleteCourt(courtId) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteCourt(courtId);
      flash('Campo eliminato');
    } catch {
      flash('Cancella prima le prenotazioni', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Tabs ── */

  const tabs = isAdmin
    ? [{ id: 'calendar', label: 'Campi', icon: '📋' }, { id: 'mybookings', label: 'Prenotazioni', icon: '📅' }, { id: 'admin', label: 'Gestione', icon: '⚙️' }]
    : isGuest
    ? [{ id: 'calendar', label: 'Disponibilità', icon: '📋' }]
    : [{ id: 'calendar', label: 'Campi', icon: '📋' }, { id: 'mybookings', label: 'Le mie', icon: '📅' }];

  /* ── Loading ── */

  if (authLoading) {
    return (
      <div style={{
        fontFamily: FONT, background: THEME.bg, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 14, color: THEME.t2 }}>Caricamento...</span>
      </div>
    );
  }

  /* ── Render ── */

  const cancelTarget = confirmCancelId ? bookings.find((b) => b.id === confirmCancelId) : null;

  return (
    <div style={{
      fontFamily: FONT, background: THEME.bg, color: THEME.tx,
      minHeight: '100vh', maxWidth: maxW, margin: '0 auto',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        padding: '14px 20px 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid ' + THEME.bd,
        background: THEME.sf, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            🎾 Tennis Club Cantiano 1969 🎾 
          </h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, minHeight: 16 }}>
            {isAdmin && <Pill text="Admin" color={THEME.ac} bg={THEME.acL} />}
            {isGuest && <Pill text="Ospite" color={THEME.t2} bg={THEME.sfA} />}
            {user && !isAdmin && <Pill text={user.displayName} color={THEME.ac} bg={THEME.acL} />}
          </div>
        </div>
        {isGuest ? (
          <button onClick={() => setShowLogin(true)} style={{
            ...btnBase, fontSize: 13, padding: '8px 14px', background: THEME.ac, color: '#fff',
          }}>
            Accedi
          </button>
        ) : (
          <button onClick={logout} style={{
            background: 'none', border: 'none', color: THEME.t2,
            fontSize: 13, cursor: 'pointer', fontFamily: FONT, padding: '6px 10px',
          }}>
            Esci
          </button>
        )}
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 80 }}>
        {screen === 'calendar' && (
          <CalendarView
            days={allDays} selDay={selDay}
            setSelDay={(d) => { setSelDay(d); setSelSlots([]); }}
            courts={activeCourts} dayBookings={dayBookings}
            selSlots={selSlots} tapSlot={tapSlot}
            isAdmin={isAdmin} isGuest={isGuest}
            bkType={bkType} setBkType={setBkType}
            onConfirm={confirmBooking} submitting={submitting}
          />
        )}
        {screen === 'mybookings' && !isAdmin && (
          <MyBookingsView bookings={myBookings} courts={courts}
            onCancel={(id) => setConfirmCancelId(id)} />
        )}
        {screen === 'mybookings' && isAdmin && (
          <AllBookingsView bookings={allFutureBookings} courts={courts}
            onCancel={(id) => setConfirmCancelId(id)} loadRange={loadRange} />
        )}
        {screen === 'admin' && (
          <AdminView
            courts={courts}
            onEnable={(id) => { toggleAvailability(id, false); flash('Campo riabilitato'); }}
            onDisable={startDisableCourt}
            onEdit={(c) => { setEditCourt(c); setShowCourtForm(true); }}
            onDelete={handleDeleteCourt}
            onAdd={() => { setEditCourt(null); setShowCourtForm(true); }}
          />
        )}
      </div>

      {/* Tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: maxW, background: THEME.sf,
        borderTop: '1px solid ' + THEME.bd, display: 'flex', zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {tabs.map((tab) => {
          const active = screen === tab.id;
          return (
            <button key={tab.id} onClick={() => { setScreen(tab.id); setSelSlots([]); }} style={{
              flex: 1, padding: '10px 0 8px', background: 'none', border: 'none',
              fontFamily: FONT, fontSize: 11, fontWeight: active ? 600 : 400,
              color: active ? THEME.ac : THEME.t2, cursor: 'pointer',
              borderTop: active ? '2px solid ' + THEME.ac : '2px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
        {isGuest && (
          <button onClick={() => setShowLogin(true)} style={{
            flex: 1, padding: '10px 0 8px', background: 'none', border: 'none',
            fontFamily: FONT, fontSize: 11, color: THEME.ac, cursor: 'pointer',
            borderTop: '2px solid transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 16 }}>🔑</span>
            Accedi
          </button>
        )}
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? THEME.dg : THEME.acH,
          color: '#fff', padding: '10px 20px', borderRadius: 99,
          fontSize: 13, fontWeight: 500, fontFamily: FONT,
          zIndex: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          animation: 'slideDown 0.25s ease', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showLogin && (
        <LoginSheet onSendLink={sendMagicLink} onClose={() => setShowLogin(false)} />
      )}

      {needsName && (
        <NameSetup onDone={updateDisplayName} onClose={() => {}} />
      )}

      {confirmCancelId && cancelTarget && (
        <ConfirmCancelModal
          isAdmin={isAdmin}
          isOtherUser={cancelTarget.user_id !== user?.id}
          onConfirm={handleCancelBooking}
          onClose={() => setConfirmCancelId(null)}
        />
      )}

      {showCourtForm && (
        <CourtFormModal
          court={editCourt}
          onSave={handleSaveCourt}
          onClose={() => { setShowCourtForm(false); setEditCourt(null); }}
        />
      )}

      {disableModal && (
        <DisableCourtModal
          court={courts.find((c) => c.id === disableModal.courtId)}
          count={disableModal.count}
          onKeep={() => doDisable(disableModal.courtId, false)}
          onCancelAll={() => doDisable(disableModal.courtId, true)}
          onClose={() => setDisableModal(null)}
        />
      )}

      {showPrivacy && (
        <PrivacyScreen onClose={() => setShowPrivacy(false)} />
      )}

      {/* Footer — visibile solo nella schermata login (ospiti) */}
      {isGuest && screen === 'calendar' && (
        <div style={{
          position: 'fixed', bottom: 50, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: maxW, textAlign: 'center',
          padding: '6px 0', zIndex: 40,
        }}>
          <button onClick={() => setShowPrivacy(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: 10, color: THEME.t3,
            textDecoration: 'underline', padding: '4px 8px',
          }}>
            Privacy Policy
          </button>
        </div>
      )}
    </div>
  );
}
