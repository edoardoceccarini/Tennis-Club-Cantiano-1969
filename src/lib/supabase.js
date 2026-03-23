import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Mancano le variabili VITE_SUPABASE_URL e/o VITE_SUPABASE_ANON_KEY. ' +
    'Copia .env.example in .env e compila con i valori del tuo progetto Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
