import { useState, useEffect } from 'react';
import { THEME, FONT, btnBase } from '../lib/theme';
import { BookingCard, Empty } from '../components/ui';

export function MyBookingsView({ bookings, courts, onCancel }) {
  if (bookings.length === 0) {
    return <Empty emoji="📅" text="Nessuna prenotazione attiva" sub="Vai su Campi per prenotare" />;
  }
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>Le mie prenotazioni</h2>
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} courts={courts} onCancel={onCancel} canCancel />
      ))}
    </div>
  );
}

var FILTERS = [
  { id: 'future', label: 'Future' },
  { id: 'today', label: 'Oggi' },
  { id: 'past', label: 'Passate' },
];

export function AllBookingsView({ bookings, courts, onCancel, loadRange }) {
  var [filter, setFilter] = useState('future');
  var [pastBookings, setPastBookings] = useState([]);
  var [pastLoading, setPastLoading] = useState(false);
  var [dateFrom, setDateFrom] = useState('');
  var [dateTo, setDateTo] = useState('');

  // Quando cambia filtro o date, carica i dati appropriati
  useEffect(() => {
    if (filter === 'past') {
      loadPast();
    }
  }, [filter]);

  async function loadPast() {
    setPastLoading(true);
    try {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var from = dateFrom ? new Date(dateFrom) : null;
      var to = dateTo ? new Date(dateTo) : new Date(today.getTime() - 1);
      var data = await loadRange(from, to);
      setPastBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPastLoading(false);
    }
  }

  function handleSearch() {
    loadPast();
  }

  // Filtra le prenotazioni "future" per mostrare solo oggi
  var todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  var tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  var displayBookings;
  if (filter === 'future') {
    displayBookings = bookings;
  } else if (filter === 'today') {
    displayBookings = bookings.filter(function(b) {
      return b.date >= todayDate && b.date < tomorrowDate;
    });
  } else {
    displayBookings = pastBookings;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>Tutte le prenotazioni</h2>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {FILTERS.map(function(f) {
          var active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={function() { setFilter(f.id); }}
              style={{
                padding: '6px 14px', borderRadius: 99,
                border: '1.5px solid ' + (active ? THEME.ac : THEME.bd),
                background: active ? THEME.acL : 'transparent',
                color: active ? THEME.ac : THEME.t2,
                fontSize: 12, fontWeight: 500, fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Date range picker per le passate */}
      {filter === 'past' && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 14,
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          <input
            type="date" value={dateFrom}
            onChange={function(e) { setDateFrom(e.target.value); }}
            style={{
              padding: '8px 10px', borderRadius: '8px',
              border: '1.5px solid ' + THEME.bd, fontSize: 13,
              fontFamily: FONT, outline: 'none', background: THEME.bg,
              flex: '1 1 120px',
            }}
          />
          <span style={{ fontSize: 12, color: THEME.t3 }}>→</span>
          <input
            type="date" value={dateTo}
            onChange={function(e) { setDateTo(e.target.value); }}
            style={{
              padding: '8px 10px', borderRadius: '8px',
              border: '1.5px solid ' + THEME.bd, fontSize: 13,
              fontFamily: FONT, outline: 'none', background: THEME.bg,
              flex: '1 1 120px',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              ...btnBase, padding: '8px 14px', fontSize: 12,
              background: THEME.ac, color: '#fff',
            }}
          >
            Cerca
          </button>
        </div>
      )}

      {/* Loading */}
      {filter === 'past' && pastLoading && (
        <p style={{ fontSize: 13, color: THEME.t2, textAlign: 'center', padding: 20 }}>
          Caricamento...
        </p>
      )}

      {/* Results */}
      {!pastLoading && displayBookings.length === 0 && (
        <Empty
          emoji={filter === 'past' ? '📂' : '📅'}
          text={filter === 'past' ? 'Nessuna prenotazione nel periodo selezionato' : 'Nessuna prenotazione'}
        />
      )}

      {!pastLoading && displayBookings.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {displayBookings.map(function(b) {
            return (
              <div key={b.id} style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%' }}>
                <BookingCard booking={b} courts={courts} onCancel={onCancel} canCancel showUser />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}