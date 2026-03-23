import { THEME, FONT, btnBase } from '../lib/theme';
import { IcoX } from '../components/ui';

/**
 * Schermata Privacy Policy — full screen overlay.
 * Il testo è un template da personalizzare con i dati del club.
 * I placeholder [NOME CLUB], [INDIRIZZO], ecc. vanno sostituiti.
 */
export function PrivacyScreen({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: THEME.bg,
      zIndex: 200, overflow: 'auto',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        maxWidth: 600, margin: '0 auto', padding: '20px 20px 60px',
        fontFamily: FONT, color: THEME.tx,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, position: 'sticky', top: 0,
          background: THEME.bg, padding: '12px 0', zIndex: 10,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
          <button onClick={onClose} style={{
            background: THEME.sfA, border: 'none', cursor: 'pointer',
            padding: '6px 8px', borderRadius: '8px', color: THEME.tx,
          }}>
            <IcoX />
          </button>
        </div>

        {/* Contenuto */}
        <div style={{ fontSize: 13, lineHeight: 1.7, color: THEME.t2 }}>
          <Section title="Titolare del trattamento">
            <p>
              Il titolare del trattamento dei dati è <strong>Tennis Club Cantiano</strong>,
              con sede in Via Concioli, 61044, Cantiano(PU), contattabile all'indirizzo email ctcantiano@hotmail.com.
            </p>
          </Section>

          <Section title="Dati raccolti">
            <p>
              L'applicazione raccoglie e tratta esclusivamente i seguenti dati personali:
            </p>
            <p style={{ paddingLeft: 16 }}>
              <strong>Indirizzo email</strong> — necessario per l'autenticazione
              tramite magic link. Non viene condiviso con terzi.<br />
              <strong>Nome visualizzato</strong> — scelto liberamente dall'utente, visibile
              agli altri utenti nel calendario prenotazioni. Può essere un nome, un
              soprannome o un'abbreviazione.
            </p>
            <p>
              Non vengono raccolti dati di navigazione, dati di geolocalizzazione,
              dati biometrici, né informazioni sul dispositivo utilizzato.
            </p>
          </Section>

          <Section title="Finalità del trattamento">
            <p>
              I dati sono trattati esclusivamente per consentire la prenotazione dei campi
              da gioco e per inviare notifiche relative alle prenotazioni (es. cancellazione
              da parte dell'amministratore). Non vengono effettuate attività di profilazione,
              marketing o analisi comportamentale.
            </p>
          </Section>

          <Section title="Base giuridica">
            <p>
              Il trattamento è basato sull'esecuzione del servizio richiesto dall'utente
              (art. 6, par. 1, lett. b del GDPR) — la prenotazione dei campi da gioco.
            </p>
          </Section>

          <Section title="Conservazione dei dati">
            <p>
              I dati delle prenotazioni vengono conservati per la durata necessaria alla
              gestione del servizio. L'utente può richiedere la cancellazione del proprio
              account e di tutti i dati associati contattando l'amministratore del club.
            </p>
          </Section>

          <Section title="Archiviazione e sicurezza">
            <p>
              I dati sono archiviati su Supabase (infrastruttura cloud), con server
              situati nell'Unione Europea. La comunicazione tra l'applicazione e il
              server avviene esclusivamente tramite protocollo HTTPS. L'autenticazione
              utilizza token crittografici (JWT) con scadenza temporale.
            </p>
          </Section>

          <Section title="Cookie e tracciamento">
            <p>
              L'applicazione <strong>non utilizza cookie</strong>. Il token di sessione
              è salvato nel localStorage del browser ed è strettamente necessario al
              funzionamento dell'autenticazione. Non vengono utilizzati cookie di
              profilazione, analytics o di terze parti.
            </p>
          </Section>

          <Section title="Diritti dell'utente">
            <p>
              Ai sensi del GDPR, l'utente ha diritto di: accedere ai propri dati
              personali; rettificarli; richiederne la cancellazione; limitarne il
              trattamento; opporsi al trattamento; richiedere la portabilità dei dati.
              Per esercitare questi diritti, contattare ctcantiano@hotmail.com.
            </p>
          </Section>

          <Section title="Modifiche">
            <p>
              La presente informativa può essere aggiornata. Eventuali modifiche
              saranno comunicate tramite l'applicazione.
            </p>
          </Section>

          <p style={{ marginTop: 24, fontSize: 11, color: THEME.t3 }}>
            Ultimo aggiornamento: [22/03/2026]
          </p>
        </div>

        {/* Pulsante chiudi in fondo */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={onClose} style={{
            ...btnBase, background: THEME.ac, color: '#fff', fontSize: 13, padding: '10px 24px',
          }}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: THEME.tx, margin: '0 0 6px' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
