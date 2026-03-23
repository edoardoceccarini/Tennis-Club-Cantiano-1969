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

export function AllBookingsView({ bookings, courts, onCancel }) {
  if (bookings.length === 0) {
    return <Empty emoji="📅" text="Nessuna prenotazione" />;
  }
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>Tutte le prenotazioni</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {bookings.map((b) => (
          <div key={b.id} style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%' }}>
            <BookingCard booking={b} courts={courts} onCancel={onCancel} canCancel showUser />
          </div>
        ))}
      </div>
    </div>
  );
}
