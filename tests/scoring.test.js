import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, similarity, bestMatch } from '../js/scoring.js';
import { LANGUAGES, acceptedPhrases, pickRounds } from '../js/languages.js';

const PASS = 0.78; // umbral de la dificultad "Normal"

test('normalize quita tildes, puntuación y apóstrofos', () => {
  assert.equal(normalize("Ne t'inquiète pas, monde!"), 'ne t inquiete pas monde');
  assert.equal(normalize('  Älä   huoli,  MAAILMA '), 'ala huoli maailma');
  assert.equal(normalize('Đừng lo, thế giới'), 'dung lo the gioi');
  assert.equal(normalize('Nu-ți face griji, lume'), 'nu ti face griji lume');
  assert.equal(normalize('İYİ'), 'iyi');
});

test('frase exacta = 100%', () => {
  assert.equal(similarity('Älä huoli, maailma', 'Älä huoli, maailma'), 1);
});

test('sin tildes ni mayúsculas también es 100%', () => {
  assert.equal(similarity('ne t inquiete pas monde', "Ne t'inquiète pas, monde"), 1);
  assert.equal(similarity('nie martw sie swiecie', 'Nie martw się, świecie'), 1);
});

test('palabras de más alrededor no penalizan', () => {
  assert.equal(similarity('eh vale mach dir keine sorgen welt', 'Mach dir keine Sorgen, Welt'), 1);
  assert.equal(similarity('maak je geen zorgen wereld oké', 'Maak je geen zorgen, wereld'), 1);
});

test('casi correcto pasa el umbral', () => {
  assert.ok(similarity('mach dir keine sorge welt', 'Mach dir keine Sorgen, Welt') > 0.9);
  assert.ok(similarity('ala huoli mailma', 'Älä huoli, maailma') >= PASS);
});

test('palabras pegadas o separadas de otra forma no penalizan', () => {
  assert.equal(similarity('non preoccupartimondo', 'Non preoccuparti, mondo'), 1);
});

test('una frase equivocada no pasa', () => {
  assert.ok(similarity('hola qué tal', 'Älä huoli, maailma') < 0.5);
  assert.ok(similarity('bare', 'Bare rolig, verden') < PASS);
  assert.ok(similarity('mach dir keine', 'Mach dir keine Sorgen, Welt') < PASS);
  assert.equal(similarity('', 'Neboj se, světe'), 0);
});

test('bestMatch elige la mejor alternativa y variante', () => {
  const fr = LANGUAGES.find((l) => l.id === 'fr');
  const { score, heard } = bestMatch(['tu inquiètes pas', "t'inquiète pas monde"], acceptedPhrases(fr));
  assert.equal(score, 1);
  assert.equal(heard, "t'inquiète pas monde");
});

test('bestMatch sin texto devuelve 0', () => {
  assert.deepEqual(bestMatch([''], ['Bare rolig, verden']), { score: 0, heard: '' });
});

test('todas las frases se reconocen a sí mismas', () => {
  for (const lang of LANGUAGES) {
    for (const phrase of acceptedPhrases(lang)) {
      assert.equal(similarity(phrase, phrase), 1, `${lang.id}: ${phrase}`);
    }
  }
});

test('pickRounds respeta el número y ordena de fácil a difícil', () => {
  for (const count of [5, 10]) {
    const rounds = pickRounds(count);
    assert.equal(rounds.length, count);
    assert.equal(new Set(rounds.map((l) => l.id)).size, count);
    const tiers = rounds.map((l) => l.tier);
    assert.deepEqual(tiers, [...tiers].sort());
  }
  assert.equal(pickRounds(0).length, LANGUAGES.length);
});
