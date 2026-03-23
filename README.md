# 🎾 Tennis Club — Prenotazioni

App mobile-first per prenotare i campi da tennis di un piccolo club.

## Stack

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Deploy**: Vercel / Netlify (file statici)

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com) (free tier)
2. Vai in **SQL Editor** ed esegui il contenuto di `supabase-schema.sql`
3. In **Authentication > Providers**, abilita **Email** con "Magic Link sign-in"
4. In **Authentication > URL Configuration**, imposta il **Site URL** (es. `http://localhost:3000` per dev)
5. Copia **Project URL** e **anon key** da **Settings > API**

### 2. Frontend

```bash
# Clona il progetto
cp .env.example .env

# Compila .env con URL e key di Supabase
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJxxxxxx

# Installa e avvia
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

### 3. Deploy

```bash
npm run build
```

La cartella `dist/` contiene file statici. Deploy su Vercel o Netlify con un push.

Ricorda di aggiornare il **Site URL** in Supabase con l'URL di produzione.

## Struttura

```
src/
├── lib/
│   ├── supabase.js     # Client Supabase
│   ├── theme.js        # Colori, costanti, stili
│   └── helpers.js      # Funzioni date/orari
├── hooks/
│   ├── useAuth.js      # Autenticazione + profilo
│   ├── useCourts.js    # CRUD campi + realtime
│   └── useBookings.js  # CRUD prenotazioni + realtime
├── components/
│   ├── ui.jsx          # Componenti atomici (Modal, Toggle, Tag...)
│   └── modals.jsx      # Login, NameSetup, CourtForm, ecc.
├── views/
│   ├── CalendarView.jsx
│   ├── BookingsView.jsx
│   └── AdminView.jsx
├── App.jsx             # Orchestrazione
└── main.jsx            # Entry point
```

## Email admin

Per cambiare gli admin, modifica:
- `handle_new_user()` nello schema SQL (per nuovi signup)
- La colonna `is_admin` nella tabella `profiles` (per utenti esistenti)

## Fase 3 — Email di notifica

Da implementare come Supabase Edge Function.
Quando l'admin cancella una prenotazione altrui, una Edge Function
invia l'email all'utente. Richiede un webhook su DELETE della tabella bookings.
