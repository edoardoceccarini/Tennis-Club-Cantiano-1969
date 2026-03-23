import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toSlotStart, toSlotEnd, parseBooking } from '../lib/helpers';

/**
 * Hook per la gestione delle prenotazioni.
 *
 * Carica tutte le prenotazioni future e si sottoscrive ai
 * cambiamenti real-time. Espone metodi per creare e cancellare
 * prenotazioni (le RLS policies fanno il resto).
 */
export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        court_id,
        user_id,
        start_time,
        end_time,
        booking_type,
        created_at,
        profiles ( display_name )
      `)
      .gte('start_time', today.toISOString())
      .order('start_time');

    if (!error && data) {
      // Normalizza: aggiungi user_name dal join e campi derivati
      const parsed = data.map((b) => ({
        ...parseBooking(b),
        user_name: b.booked_by || b.profiles?.display_name || 'Utente rimosso',
      }));
      setBookings(parsed);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Real-time
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  /**
   * Crea una o più prenotazioni.
   * slots: [{ date: Date, hour: number }]
   * bookingType: 'normal' | 'tournament' | 'school' | 'maintenance'
   * courtId: number (per ogni slot, oppure un courtId per slot se diversi)
   */
  const createBookings = useCallback(async (slots, bookingType = 'normal') => {
    const rows = slots.map((s) => ({
      court_id: s.courtId,
      user_id: (supabase.auth.getUser()).data?.user?.id,
      start_time: toSlotStart(s.date, s.hour),
      end_time: toSlotEnd(s.date, s.hour),
      booking_type: bookingType,
    }));

    // Recupera lo user id in modo asincrono
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non autenticato');

   // Recupera il nome dal profilo per il campo booked_by
const { data: profile } = await supabase
  .from('profiles')
  .select('display_name')
  .eq('id', user.id)
  .single();

const displayName = profile?.display_name || 'Utente';

const rowsWithUser = rows.map((r) => ({
  ...r,
  user_id: user.id,
  booked_by: displayName,
}));

    const { data, error } = await supabase
      .from('bookings')
      .insert(rowsWithUser)
      .select();

    if (error) throw error;
    await load(); // Aggiorna la UI subito
    return data;
  }, [load]);

  /**
   * Cancella una prenotazione.
   * L'RLS controlla che l'utente sia il proprietario o admin.
   */
  const cancelBooking = useCallback(async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;
    await load(); // Aggiorna la UI subito
  }, [load]);

  /**
   * Cancella tutte le prenotazioni future su un campo.
   * Solo admin (enforced da RLS).
   */
  const cancelAllForCourt = useCallback(async (courtId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('court_id', courtId)
      .gte('start_time', today.toISOString())
      .select();

    if (error) throw error;
    await load(); // Aggiorna la UI subito
    return data; // Per contare quante ne ha cancellate
  }, [load]);

  return {
    bookings,
    loading,
    createBookings,
    cancelBooking,
    cancelAllForCourt,
    reload: load,
  };
}
