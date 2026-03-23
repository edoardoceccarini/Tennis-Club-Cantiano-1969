import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook per la gestione dei campi.
 *
 * Carica i campi all'avvio e si sottoscrive ai cambiamenti real-time.
 * Le operazioni di scrittura (create, update, delete, toggle)
 * sono disponibili solo per gli admin tramite le RLS policies.
 */
export function useCourts() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('id');

    if (!error && data) setCourts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Real-time: bonus per vedere modifiche di altri admin
    const channel = supabase
      .channel('courts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courts' },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const createCourt = useCallback(async ({ name, has_lighting, is_indoor }) => {
    const { data, error } = await supabase
      .from('courts')
      .insert({ name, has_lighting, is_indoor })
      .select()
      .single();
    if (error) throw error;
    await load();
    return data;
  }, [load]);

  const updateCourt = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('courts')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    await load();
  }, [load]);

  const toggleAvailability = useCallback(async (id, currentlyAvailable) => {
    const { error } = await supabase
      .from('courts')
      .update({ is_available: !currentlyAvailable })
      .eq('id', id);
    if (error) throw error;
    await load();
  }, [load]);

  const deleteCourt = useCallback(async (id) => {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await load();
  }, [load]);

  return {
    courts,
    loading,
    createCourt,
    updateCourt,
    toggleAvailability,
    deleteCourt,
  };
}
