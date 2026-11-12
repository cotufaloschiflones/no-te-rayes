// Síntesis de voz para el botón «Escuchar».

export const ttsSupported = 'speechSynthesis' in window;

let voices = [];
const listeners = new Set();

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  listeners.forEach((fn) => fn());
}

if (ttsSupported) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

/** Avisa cuando el navegador termina de cargar las voces (llega tarde en Chrome). */
export function onVoicesChanged(fn) {
  listeners.add(fn);
}

const tag = (lang) => lang.replace('_', '-').toLowerCase();

/** Mejor voz para un idioma: primero coincidencia exacta (pt-BR), luego solo idioma (pt). */
export function findVoice(lang) {
  const wanted = tag(lang);
  const base = wanted.split('-')[0];
  return (
    voices.find((v) => tag(v.lang) === wanted) ||
    voices.find((v) => tag(v.lang).split('-')[0] === base) ||
    null
  );
}

/** Lee el texto en voz alta. Se resuelve cuando termina (o falla). */
export function speak(text, lang) {
  return new Promise((resolve) => {
    if (!ttsSupported) return resolve(false);
    const voice = findVoice(lang);
    if (!voice) return resolve(false);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.85;

    // Safari a veces no dispara onend: plan B por tiempo.
    const fallback = setTimeout(() => resolve(true), 1500 + text.length * 120);
    const done = (ok) => () => {
      clearTimeout(fallback);
      resolve(ok);
    };
    utterance.onend = done(true);
    utterance.onerror = done(false);
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel();
}
