import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook per l'autenticazione.
 *
 * Stato restituito:
 * - user: null (guest) oppure { id, email, displayName, isAdmin }
 * - loading: true durante il check iniziale della sessione
 * - needsName: true se il profilo esiste ma display_name è il default
 *
 * Metodi:
 * - sendMagicLink(email): invia il magic link
 * - updateDisplayName(name): aggiorna il display_name nel profilo
 * - logout(): termina la sessione
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsName, setNeedsName] = useState(false);

  // Carica il profilo dal DB dato un auth user
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setNeedsName(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('display_name, is_admin')
      .eq('id', authUser.id)
      .single();

    if (error || !profile) {
      // Il trigger potrebbe non aver ancora creato il profilo
      // (race condition rara). Ritenta tra 1s.
      setTimeout(() => loadProfile(authUser), 1000);
      return;
    }

    const isDefaultName = profile.display_name === 'Nuovo utente';

    setUser({
      id: authUser.id,
      email: authUser.email,
      displayName: profile.display_name,
      isAdmin: profile.is_admin,
    });

    setNeedsName(isDefaultName);
  }, []);

  // Check sessione iniziale + listener per cambi di stato auth
  useEffect(() => {
    // Sessione corrente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      }
      setLoading(false);
    });

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setNeedsName(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Invia magic link (con captcha token opzionale)
  const sendMagicLink = useCallback(async (email, captchaToken) => {
    const options = {
      emailRedirectTo: window.location.origin,
    };

    // Se il captcha è abilitato, passa il token
    if (captchaToken) {
      options.captchaToken = captchaToken;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options,
    });
    if (error) throw error;
  }, []);

  // Aggiorna display_name (primo accesso)
  const updateDisplayName = useCallback(async (name) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() })
      .eq('id', user.id);

    if (error) throw error;

    setUser((prev) => ({ ...prev, displayName: name.trim() }));
    setNeedsName(false);
  }, [user]);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNeedsName(false);
  }, []);

  return {
    user,
    loading,
    needsName,
    sendMagicLink,
    updateDisplayName,
    logout,
  };
}
