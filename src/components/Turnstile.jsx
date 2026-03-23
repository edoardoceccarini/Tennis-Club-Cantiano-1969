import { useEffect, useRef, useCallback, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/**
 * Componente Cloudflare Turnstile.
 * Renderizza il widget captcha e chiama onVerify(token) al successo.
 * Se la site key non è configurata, non renderizza nulla
 * (permette di usare l'app senza captcha in dev).
 */
export function Turnstile({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Carica lo script Turnstile una sola volta
  useEffect(() => {
    if (!SITE_KEY) return;
    if (document.getElementById('turnstile-script')) {
      setScriptLoaded(true);
      return;
    }

    // Callback globale per quando lo script è pronto
    window.__turnstileReady = () => setScriptLoaded(true);

    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileReady';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      delete window.__turnstileReady;
    };
  }, []);

  // Renderizza il widget quando lo script è pronto
  useEffect(() => {
    if (!SITE_KEY || !scriptLoaded || !containerRef.current) return;
    if (!window.turnstile) return;

    // Pulisci widget precedente
    if (widgetIdRef.current !== null) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => { if (onVerify) onVerify(token); },
      'expired-callback': () => { if (onExpire) onExpire(); },
      theme: 'light',
      size: 'flexible',
    });

    return () => {
      if (widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, onVerify, onExpire]);

  if (!SITE_KEY) return null;

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}
    />
  );
}

/**
 * Restituisce true se il captcha è configurato.
 */
export function isCaptchaEnabled() {
  return !!SITE_KEY;
}
