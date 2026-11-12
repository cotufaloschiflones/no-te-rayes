import { LANGUAGES, acceptedPhrases, pickRounds } from './languages.js';
import { bestMatch } from './scoring.js';
import { Listener, speechSupported } from './recognizer.js';
import { speak, findVoice, onVoicesChanged, stopSpeaking } from './tts.js';

// Precisión mínima para pasar de país.
const DIFFICULTY = {
  easy: 0.65,
  normal: 0.78,
  hard: 0.9,
};

const params = new URLSearchParams(location.search);
// ?debug muestra un campo de texto para simular lo que dices (útil para probar sin micro).
const TYPED_MODE = !speechSupported || params.has('debug');

const $ = (id) => document.getElementById(id);
const el = {
  cam: $('cam'),
  screens: {
    start: $('screen-start'),
    countdown: $('screen-countdown'),
    play: $('screen-play'),
    end: $('screen-end'),
  },
  btnStart: $('btn-start'),
  lengthAll: $('length-all'),
  supportWarning: $('support-warning'),
  countdown: $('countdown'),
  progress: $('progress'),
  dots: $('dots'),
  timer: $('timer'),
  card: $('card'),
  flag: $('flag'),
  langName: $('lang-name'),
  phrase: $('phrase'),
  hint: $('hint'),
  meterFill: $('meter-fill'),
  meterGoal: $('meter-goal'),
  score: $('score'),
  status: $('status'),
  statusText: $('status-text'),
  heard: $('heard'),
  error: $('error'),
  typedForm: $('typed-form'),
  typedInput: $('typed-input'),
  btnListen: $('btn-listen'),
  btnHint: $('btn-hint'),
  btnSkip: $('btn-skip'),
  btnRetry: $('btn-retry'),
  burst: $('burst'),
  rank: $('rank'),
  statPassed: $('stat-passed'),
  statTime: $('stat-time'),
  statTries: $('stat-tries'),
  results: $('results'),
  btnAgain: $('btn-again'),
  btnHome: $('btn-home'),
};

const state = {
  rounds: [], // { language, status: 'pending'|'passed'|'skipped', attempts, best, usedHint }
  index: 0,
  threshold: DIFFICULTY.normal,
  startedAt: 0,
  elapsed: 0,
  timerId: null,
  locked: false,
  ignoreUntil: 0,
  camPromise: null,
};

const listener = new Listener({
  onResult: handleResult,
  onState: renderMicState,
  onError: showError,
});

const current = () => state.rounds[state.index];

// ---------------------------------------------------------------- utilidades

function show(name) {
  for (const [key, section] of Object.entries(el.screens)) section.hidden = key !== name;
}

function restartAnimation(node, className) {
  node.classList.remove('enter', 'shake', 'win');
  void node.offsetWidth; // fuerza un reflow para poder repetir la animación
  node.classList.add(className);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function percent(score) {
  return Math.round(score * 100);
}

function renderFlag(node, language) {
  node.replaceChildren();
  if (language.flag) {
    node.textContent = language.flag;
  } else {
    const badge = document.createElement('span');
    badge.className = 'flag-badge';
    badge.textContent = language.badge;
    node.append(badge);
  }
}

function getChoice(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function loadPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem('ntr-prefs') || '{}');
    for (const [name, value] of Object.entries(prefs)) {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    }
  } catch { /* sin almacenamiento: valores por defecto */ }
}

function savePrefs() {
  try {
    localStorage.setItem('ntr-prefs', JSON.stringify({
      difficulty: getChoice('difficulty'),
      length: getChoice('length'),
    }));
  } catch { /* da igual */ }
}

// ---------------------------------------------------------------- cámara

// Espera a la cámara como mucho `ms`: si el aviso de permisos se queda colgado,
// el juego arranca igual y la cámara aparecerá cuando llegue.
function ensureCamera(ms = 10000) {
  state.camPromise ??= openCamera();
  return Promise.race([state.camPromise, new Promise((resolve) => setTimeout(resolve, ms))]);
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const video = { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
  let stream = null;
  try {
    // Cámara y micro a la vez para que salga un solo aviso de permisos.
    // El micro se suelta enseguida: lo usará el reconocedor de voz.
    stream = await navigator.mediaDevices.getUserMedia({ video, audio: speechSupported });
    for (const track of stream.getAudioTracks()) {
      track.stop();
      stream.removeTrack(track);
    }
  } catch {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video });
    } catch {
      stream = null; // sin cámara: se juega con el fondo de color
    }
  }
  if (!stream) return;
  el.cam.addEventListener('playing', () => el.cam.classList.add('on'), { once: true });
  el.cam.srcObject = stream;
  el.cam.play().catch(() => {});
}

// ---------------------------------------------------------------- partida

async function startGame() {
  savePrefs();
  el.btnStart.disabled = true;
  el.btnStart.textContent = 'Esperando permisos…';
  await ensureCamera();
  el.btnStart.disabled = false;
  el.btnStart.textContent = '¡Empezar!';

  state.threshold = DIFFICULTY[getChoice('difficulty')] ?? DIFFICULTY.normal;
  state.rounds = pickRounds(Number(getChoice('length'))).map((language) => ({
    language,
    status: 'pending',
    attempts: 0,
    best: 0,
    usedHint: false,
  }));
  state.index = 0;
  state.elapsed = 0;
  el.meterGoal.style.left = `calc(${state.threshold * 100}% - 1px)`;
  el.timer.textContent = '0:00';
  buildDots();

  show('countdown');
  await countdown(3);
  show('play');
  startTimer();
  loadRound();
}

function countdown(from) {
  return new Promise((resolve) => {
    let n = from;
    const tick = () => {
      if (n === 0) return resolve();
      el.countdown.textContent = n;
      el.countdown.classList.remove('tick');
      void el.countdown.offsetWidth;
      el.countdown.classList.add('tick');
      n -= 1;
      setTimeout(tick, 850);
    };
    tick();
  });
}

function startTimer() {
  clearInterval(state.timerId);
  state.startedAt = performance.now();
  state.timerId = setInterval(() => {
    el.timer.textContent = formatTime(performance.now() - state.startedAt);
  }, 250);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.elapsed = performance.now() - state.startedAt;
}

function buildDots() {
  el.dots.replaceChildren(...state.rounds.map(() => document.createElement('li')));
}

function updateDots() {
  [...el.dots.children].forEach((dot, i) => {
    const round = state.rounds[i];
    dot.className = i === state.index && round.status === 'pending' ? 'current' : round.status;
  });
}

function loadRound() {
  const { language } = current();
  state.locked = false;

  renderFlag(el.flag, language);
  el.langName.textContent = language.name;
  el.phrase.textContent = language.phrase;
  el.phrase.lang = language.lang;
  el.hint.textContent = language.hint;
  el.hint.hidden = true;
  el.progress.textContent = `${state.index + 1} / ${state.rounds.length}`;
  el.typedInput.value = '';
  el.btnRetry.hidden = true;
  clearError();
  setScore(null);
  el.heard.textContent = speechSupported
    ? 'Di la frase en voz alta…'
    : 'Tu navegador no reconoce la voz: escribe la frase y pulsa «Probar».';

  updateDots();
  updateListenButton();
  restartAnimation(el.card, 'enter');

  if (speechSupported) listener.start(language.lang);
  else renderMicState('typed');
}

function handleResult({ alternatives, isFinal }) {
  if (state.locked || performance.now() < state.ignoreUntil) return;
  const round = current();
  const { score, heard } = bestMatch(alternatives, acceptedPhrases(round.language));
  if (!heard.trim()) return;

  clearError();
  round.best = Math.max(round.best, score);
  setScore(score);

  if (score >= state.threshold) {
    renderHeard(heard);
    pass(score);
    return;
  }

  if (isFinal) {
    round.attempts += 1;
    renderHeard(heard, missMessage(score));
    restartAnimation(el.card, 'shake');
  } else {
    renderHeard(heard);
  }
}

function missMessage(score) {
  if (score >= state.threshold - 0.1) return '¡Casi! Una vez más.';
  if (score >= 0.5) return 'Vas bien, repítelo más claro.';
  return 'No se parece mucho… prueba con 🔊 o 💡.';
}

function pass(score) {
  state.locked = true;
  const round = current();
  round.attempts += 1;
  round.status = 'passed';
  listener.stop();
  stopSpeaking();
  updateDots();
  restartAnimation(el.card, 'win');
  celebrate(score, round.language);
  setTimeout(nextRound, 1500);
}

function skip() {
  if (state.locked) return;
  state.locked = true;
  current().status = 'skipped';
  listener.stop();
  stopSpeaking();
  updateDots();
  nextRound();
}

function nextRound() {
  state.index += 1;
  if (state.index >= state.rounds.length) endGame();
  else loadRound();
}

// ---------------------------------------------------------------- render del juego

function setScore(score) {
  const has = typeof score === 'number';
  const good = has && score >= state.threshold;
  el.score.textContent = has ? `${percent(score)}%` : '—';
  el.score.className = `score ${has ? (good ? 'good' : 'bad') : ''}`;
  el.meterFill.style.width = has ? `${percent(score)}%` : '0%';
  el.meterFill.classList.toggle('good', good);
}

function renderHeard(heard, message = '') {
  const quote = document.createElement('q');
  quote.textContent = heard.trim();
  el.heard.replaceChildren('Te he oído: ', quote, message ? ` — ${message}` : '');
}

function renderMicState(mic) {
  const labels = {
    listening: 'Escuchando…',
    starting: 'Preparando micro…',
    paused: 'Reproduciendo…',
    idle: 'Micro en pausa',
    typed: 'Modo teclado',
  };
  el.status.classList.toggle('listening', mic === 'listening');
  el.statusText.textContent = labels[mic] ?? '';
}

function showError(message, fatal, code) {
  el.error.textContent = message;
  el.error.hidden = false;
  if (fatal && code !== 'language-not-supported') el.btnRetry.hidden = false;
}

function clearError() {
  el.error.hidden = true;
  el.error.textContent = '';
}

function updateListenButton() {
  const round = current();
  if (!round) return;
  const voice = findVoice(round.language.lang);
  el.btnListen.disabled = !voice;
  el.btnListen.title = voice ? 'Escucha cómo se dice' : 'Tu navegador no tiene voz para este idioma';
}

async function playExample() {
  const round = current();
  if (!round || state.locked) return;
  const roundIndex = state.index;
  listener.pause();
  el.btnListen.disabled = true;
  await speak(round.language.phrase, round.language.lang);
  if (state.index !== roundIndex || state.locked) return;
  el.btnListen.disabled = false;
  // Que el final de la voz de ejemplo no cuente como si lo hubieras dicho tú.
  state.ignoreUntil = performance.now() + 500;
  listener.resume();
}

function showHint() {
  const round = current();
  if (!round) return;
  el.hint.hidden = !el.hint.hidden;
  if (!el.hint.hidden) round.usedHint = true;
}

function celebrate(score, language) {
  const words = score >= 0.97 ? '¡NATIVO!' : score >= 0.9 ? '¡PERFECTO!' : score >= 0.82 ? '¡GENIAL!' : '¡CONSEGUIDO!';
  const stamp = document.createElement('div');
  stamp.className = 'stamp';
  stamp.textContent = words;
  const small = document.createElement('small');
  small.textContent = `${percent(score)}% de precisión`;
  stamp.append(small);

  const emojis = [language.flag, '🎉', '✨', '⭐', '💬'].filter(Boolean);
  const particles = Array.from({ length: 16 }, (_, i) => {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = emojis[i % emojis.length];
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 120 + Math.random() * 120;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    p.style.setProperty('--rot', `${Math.round(Math.random() * 360 - 180)}deg`);
    return p;
  });

  el.burst.replaceChildren(stamp, ...particles);
  setTimeout(() => el.burst.replaceChildren(), 1500);
}

// ---------------------------------------------------------------- final

function rankFor(passed, total, avg) {
  const ratio = total ? passed / total : 0;
  if (ratio === 1 && avg >= 0.9) return 'Ciudadano del mundo 🌍';
  if (ratio === 1) return 'Políglota 🧠';
  if (ratio >= 0.7) return 'Trotamundos ✈️';
  if (ratio >= 0.4) return 'Mochilero 🎒';
  return 'Turista perdido 🧳';
}

function endGame() {
  listener.stop();
  stopTimer();

  const passed = state.rounds.filter((r) => r.status === 'passed');
  const tries = state.rounds.reduce((sum, r) => sum + r.attempts, 0);
  const avg = passed.length ? passed.reduce((s, r) => s + r.best, 0) / passed.length : 0;

  el.rank.textContent = rankFor(passed.length, state.rounds.length, avg);
  el.statPassed.textContent = `${passed.length}/${state.rounds.length}`;
  el.statTime.textContent = formatTime(state.elapsed);
  el.statTries.textContent = String(tries);

  el.results.replaceChildren(
    ...state.rounds.map((round) => {
      const li = document.createElement('li');
      li.className = round.status;

      const flag = document.createElement('span');
      flag.className = 'r-flag';
      renderFlag(flag, round.language);

      const name = document.createElement('span');
      name.className = 'r-name';
      name.textContent = round.language.name;
      const detail = document.createElement('small');
      const tries = round.attempts === 1 ? '1 intento' : `${round.attempts} intentos`;
      detail.textContent = `${round.language.phrase} · ${tries}${round.usedHint ? ' · 💡' : ''}`;
      name.append(detail);

      const score = document.createElement('span');
      score.className = 'r-score';
      score.textContent = round.status === 'passed' ? `${percent(round.best)}%` : 'saltado';

      li.append(flag, name, score);
      return li;
    }),
  );

  show('end');
}

// ---------------------------------------------------------------- arranque

function checkSupport() {
  const problems = [];
  if (location.protocol === 'file:') {
    problems.push('Ábrelo desde un servidor local (npm start) y no como archivo: así el micro no funciona.');
  } else if (!window.isSecureContext) {
    problems.push('Necesita HTTPS (o localhost) para usar la cámara y el micro.');
  }
  if (!speechSupported) {
    problems.push('Este navegador no reconoce la voz (Firefox no lo soporta). Podrás jugar escribiendo, pero la gracia es hablar: ábrelo en Chrome o Edge.');
  }
  if (problems.length) {
    el.supportWarning.textContent = problems.join(' ');
    el.supportWarning.hidden = false;
  }
}

el.lengthAll.textContent = `Todos (${LANGUAGES.length})`;
el.typedForm.hidden = !TYPED_MODE;
loadPrefs();
checkSupport();

el.btnStart.addEventListener('click', startGame);
el.btnAgain.addEventListener('click', startGame);
el.btnHome.addEventListener('click', () => show('start'));
el.btnSkip.addEventListener('click', skip);
el.btnHint.addEventListener('click', showHint);
el.btnListen.addEventListener('click', playExample);
el.btnRetry.addEventListener('click', () => {
  clearError();
  el.btnRetry.hidden = true;
  listener.start(current().language.lang);
});
el.typedForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = el.typedInput.value;
  el.typedInput.value = '';
  handleResult({ alternatives: [text], isFinal: true });
});
onVoicesChanged(updateListenButton);
