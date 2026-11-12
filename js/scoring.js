// Compara lo que ha oído el reconocedor de voz con la frase objetivo.
// Devuelve una precisión entre 0 y 1 basada en la distancia de edición
// (Levenshtein) sobre texto normalizado.

// Letras que no se descomponen con NFD y conviene simplificar.
const LETTER_MAP = { đ: 'd', ß: 'ss', ø: 'o', æ: 'ae', ł: 'l', ı: 'i', œ: 'oe' };

/** Minúsculas, sin tildes, sin signos de puntuación ni apóstrofos, espacios simples. */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đßøæłıœ]/g, (c) => LETTER_MAP[c])
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function levenshtein(a, b) {
  const s = [...a];
  const t = [...b];
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  let curr = new Array(t.length + 1);
  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[t.length];
}

function ratio(a, b) {
  const longest = Math.max([...a].length, [...b].length);
  if (!longest) return 0;
  return 1 - levenshtein(a, b) / longest;
}

/**
 * Precisión de una frase oída frente a una frase objetivo.
 * Prueba también ventanas de palabras para que muletillas como
 * "eh, vale..." alrededor de la frase no bajen la nota.
 */
export function similarity(heard, target) {
  const h = normalize(heard);
  const t = normalize(target);
  if (!h || !t) return 0;

  const tCompact = t.replaceAll(' ', '');
  const compare = (text) => Math.max(ratio(text, t), ratio(text.replaceAll(' ', ''), tCompact));

  let best = compare(h);
  const words = h.split(' ');
  const targetWords = t.split(' ').length;
  for (let size = Math.max(1, targetWords - 1); size <= targetWords + 1; size++) {
    for (let i = 0; i + size <= words.length; i++) {
      best = Math.max(best, compare(words.slice(i, i + size).join(' ')));
    }
  }
  return best;
}

/**
 * Mejor puntuación entre todas las alternativas del reconocedor
 * y todas las formas aceptadas de la frase.
 * @returns {{ score: number, heard: string }}
 */
export function bestMatch(alternatives, accepted) {
  let result = { score: 0, heard: alternatives.find((a) => a && a.trim()) ?? '' };
  for (const heard of alternatives) {
    for (const target of accepted) {
      const score = similarity(heard, target);
      if (score > result.score) result = { score, heard };
    }
  }
  return result;
}
