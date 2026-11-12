// Envoltorio sobre la Web Speech API (SpeechRecognition).
// Escucha sin manos: se reinicia solo cuando el navegador corta por silencio.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

export const speechSupported = Boolean(SpeechRecognitionImpl);

// En Android el modo continuo duplica resultados; mejor frases sueltas.
const IS_ANDROID = /android/i.test(navigator.userAgent);

const FATAL_ERRORS = {
  'not-allowed': 'Necesito permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones.',
  'service-not-allowed': 'El navegador no deja usar el reconocimiento de voz. En Safari, activa el Dictado en Ajustes.',
  'audio-capture': 'No encuentro ningún micrófono.',
  'language-not-supported': 'Tu navegador no reconoce este idioma. Sáltalo y sigue.',
};

const NETWORK_MESSAGE = 'El reconocimiento de voz necesita internet. Reintentando…';

export class Listener {
  /**
   * @param {object} handlers
   * @param {(r: {alternatives: string[], isFinal: boolean}) => void} handlers.onResult
   * @param {(state: 'starting'|'listening'|'paused'|'idle') => void} handlers.onState
   * @param {(message: string, fatal: boolean, code: string) => void} handlers.onError
   */
  constructor({ onResult, onState, onError }) {
    this.onResult = onResult;
    this.onState = onState;
    this.onError = onError;
    this.rec = null;
    this.active = false;
    this.paused = false;
    this.lang = 'en-US';
    this.quickFailures = 0;
    this.restartTimer = null;
  }

  /** Empieza a escuchar en un idioma nuevo (descarta lo que se oyó antes). */
  start(lang) {
    this.stop();
    this.lang = lang;
    this.active = true;
    this.paused = false;
    this.quickFailures = 0;
    this.#spawn();
  }

  stop() {
    this.active = false;
    clearTimeout(this.restartTimer);
    this.#kill();
    this.onState('idle');
  }

  /** Deja de escuchar temporalmente (p. ej. mientras suena la voz de ejemplo). */
  pause() {
    if (!this.active) return;
    this.paused = true;
    clearTimeout(this.restartTimer);
    this.#kill();
    this.onState('paused');
  }

  resume() {
    if (!this.active || !this.paused) return;
    this.paused = false;
    this.#spawn();
  }

  #kill() {
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      try { rec.abort(); } catch { /* ya estaba parado */ }
    }
  }

  #spawn() {
    if (!speechSupported || !this.active || this.paused) return;

    const rec = new SpeechRecognitionImpl();
    rec.lang = this.lang;
    rec.continuous = !IS_ANDROID;
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    const startedAt = performance.now();
    let fatal = false;
    const isCurrent = () => rec === this.rec;

    rec.onstart = rec.onaudiostart = () => {
      if (isCurrent()) this.onState('listening');
    };

    rec.onresult = (event) => {
      if (!isCurrent()) return;
      this.quickFailures = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = Array.from(result, (alt) => alt.transcript);
        // Si la frase se partió en dos trozos por una pausa, probamos también la unión.
        const previous = event.results[i - 1];
        if (previous) alternatives.push(`${previous[0].transcript} ${result[0].transcript}`);
        this.onResult({ alternatives, isFinal: result.isFinal });
      }
    };

    rec.onerror = (event) => {
      if (!isCurrent()) return;
      const code = event.error;
      if (code === 'no-speech' || code === 'aborted') return; // normal: se reinicia solo
      if (FATAL_ERRORS[code]) {
        fatal = true;
        this.onError(FATAL_ERRORS[code], true, code);
      } else if (code === 'network') {
        this.onError(NETWORK_MESSAGE, false, code);
      } else {
        this.onError(`Error del reconocimiento de voz (${code}).`, false, code);
      }
    };

    rec.onend = () => {
      if (!isCurrent()) return;
      this.rec = null;
      if (fatal || !this.active || this.paused) {
        if (fatal) this.active = false;
        this.onState('idle');
        return;
      }
      // Evita un bucle infinito si el servicio se cae nada más arrancar.
      const lived = performance.now() - startedAt;
      this.quickFailures = lived < 1000 ? this.quickFailures + 1 : 0;
      if (this.quickFailures >= 6) {
        this.active = false;
        this.onState('idle');
        this.onError('No consigo escuchar. Revisa el micrófono y pulsa «Reintentar».', true, 'loop');
        return;
      }
      const delay = Math.min(250 * 2 ** this.quickFailures, 4000);
      this.onState('starting');
      this.restartTimer = setTimeout(() => this.#spawn(), delay);
    };

    this.rec = rec;
    this.onState('starting');
    try {
      rec.start();
    } catch (err) {
      this.rec = null;
      this.onError(`No se pudo iniciar el micrófono: ${err.message}`, true, 'start');
    }
  }
}
