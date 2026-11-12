import { test } from 'node:test';
import assert from 'node:assert/strict';

// Reconocedor falso: guarda cada instancia para poder disparar sus eventos a mano.
class FakeRecognition {
  static instances = [];
  constructor() {
    this.started = false;
    this.aborted = false;
    FakeRecognition.instances.push(this);
  }
  start() { this.started = true; }
  abort() { this.aborted = true; }
}
globalThis.window = { webkitSpeechRecognition: FakeRecognition };
const { Listener } = await import('../js/recognizer.js');

const last = () => FakeRecognition.instances.at(-1);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const result = (isFinal, ...texts) => Object.assign(texts.map((transcript) => ({ transcript })), { isFinal });

function makeListener() {
  const log = { results: [], states: [], errors: [] };
  const listener = new Listener({
    onResult: (r) => log.results.push(r),
    onState: (s) => log.states.push(s),
    onError: (message, fatal, code) => log.errors.push({ message, fatal, code }),
  });
  return { listener, log };
}

test('configura el idioma y pasa alternativas + la unión con el trozo anterior', () => {
  const { listener, log } = makeListener();
  listener.start('fi-FI');
  const rec = last();
  assert.equal(rec.lang, 'fi-FI');
  assert.equal(rec.interimResults, true);
  assert.equal(rec.maxAlternatives, 5);
  assert.ok(rec.started);

  rec.onresult({ resultIndex: 1, results: [result(true, 'älä huoli'), result(false, 'maailma', 'mailma')] });
  assert.deepEqual(log.results, [
    { alternatives: ['maailma', 'mailma', 'älä huoli maailma'], isFinal: false },
  ]);
  listener.stop();
});

test('se reinicia solo cuando el navegador corta por silencio', async () => {
  const { listener } = makeListener();
  listener.start('it-IT');
  const first = last();
  first.onerror({ error: 'no-speech' });
  first.onend();
  await wait(700);
  assert.notEqual(last(), first);
  assert.equal(last().lang, 'it-IT');
  assert.ok(last().started);
  listener.stop();
});

test('pause() evita el reinicio y resume() crea una instancia nueva', async () => {
  const { listener, log } = makeListener();
  listener.start('de-DE');
  const first = last();
  listener.pause();
  assert.ok(first.aborted);
  first.onend(); // llega tarde tras el abort: debe ignorarse
  await wait(700);
  assert.equal(last(), first);
  assert.equal(log.states.at(-1), 'paused');

  listener.resume();
  assert.notEqual(last(), first);
  assert.ok(last().started);
  listener.stop();
});

test('ignora resultados de una instancia ya descartada', () => {
  const { listener, log } = makeListener();
  listener.start('fr-FR');
  const old = last();
  listener.start('nl-NL');
  old.onresult({ resultIndex: 0, results: [result(true, "ne t'inquiète pas monde")] });
  assert.equal(log.results.length, 0);
  listener.stop();
});

test('un error grave avisa y no se reinicia', async () => {
  const { listener, log } = makeListener();
  listener.start('pl-PL');
  const rec = last();
  rec.onerror({ error: 'not-allowed' });
  rec.onend();
  await wait(700);
  assert.equal(last(), rec);
  assert.equal(log.errors[0].fatal, true);
  assert.equal(log.errors[0].code, 'not-allowed');
});
