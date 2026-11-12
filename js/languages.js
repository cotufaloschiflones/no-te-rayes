// Cada idioma muestra la frase "Don't worry, world" traducida.
// - lang:     código BCP-47 para el reconocimiento de voz y la síntesis.
// - tier:     1 = fácil, 2 = medio, 3 = difícil (decide el orden de la partida).
// - phrase:   lo que se muestra en pantalla.
// - hint:     pronunciación aproximada para hispanohablantes (sílaba fuerte en MAYÚSCULAS).
// - variants: otras formas correctas de decirlo que también se aceptan.
// - flag / badge: emoji de bandera, o una etiqueta corta si no existe emoji.

export const LANGUAGES = [
  // --- Nivel 1 ---
  {
    id: 'en', name: 'Inglés', flag: '🇬🇧', lang: 'en-GB', tier: 1,
    phrase: "Don't worry, world",
    hint: 'dóunt UÓ-ri, uérld',
    variants: ['do not worry world', 'dont worry world'],
  },
  {
    id: 'it', name: 'Italiano', flag: '🇮🇹', lang: 'it-IT', tier: 1,
    phrase: 'Non preoccuparti, mondo',
    hint: 'non pre-oc-cu-PÁR-ti, MÓN-do',
    variants: ['non ti preoccupare mondo'],
  },
  {
    id: 'pt', name: 'Portugués', flag: '🇧🇷', lang: 'pt-BR', tier: 1,
    phrase: 'Não se preocupe, mundo',
    hint: 'nãu si pre-o-CÚ-pi, MÚN-du (la «ão» por la nariz)',
    variants: ['não se preocupa mundo', 'não te preocupes mundo'],
  },
  {
    id: 'ca', name: 'Catalán', badge: 'CAT', lang: 'ca-ES', tier: 1,
    phrase: 'No et preocupis, món',
    hint: 'no et pre-u-CÚ-pis, mon',
    variants: ['no te preocupis món'],
  },
  {
    id: 'fr', name: 'Francés', flag: '🇫🇷', lang: 'fr-FR', tier: 1,
    phrase: "Ne t'inquiète pas, monde",
    hint: 'ne tan-KIÉT pa, mond (la «on» por la nariz)',
    variants: ["t'inquiète pas monde", "ne t'inquiète pas le monde", "t'inquiète pas le monde"],
  },

  // --- Nivel 2 ---
  {
    id: 'de', name: 'Alemán', flag: '🇩🇪', lang: 'de-DE', tier: 2,
    phrase: 'Mach dir keine Sorgen, Welt',
    hint: 'maj dir KÁI-ne SÓR-guen, velt',
    variants: ['mach dir keine sorge welt'],
  },
  {
    id: 'nl', name: 'Neerlandés', flag: '🇳🇱', lang: 'nl-NL', tier: 2,
    phrase: 'Maak je geen zorgen, wereld',
    hint: 'mak ye jéin SÓR-jen, UÉ-relt (la «g» como una «j» suave)',
    variants: [],
  },
  {
    id: 'ro', name: 'Rumano', flag: '🇷🇴', lang: 'ro-RO', tier: 2,
    phrase: 'Nu-ți face griji, lume',
    hint: 'nuts FÁ-che grizh, LÚ-me (la «j» como en francés)',
    variants: ['nu îți face griji lume', 'nu te îngrijora lume'],
  },
  {
    id: 'sv', name: 'Sueco', flag: '🇸🇪', lang: 'sv-SE', tier: 2,
    phrase: 'Oroa dig inte, världen',
    hint: 'Ú-ru-a dei ÍN-te, VÉR-den',
    variants: ['oroa dig inte värld', 'oroa er inte världen'],
  },
  {
    id: 'id', name: 'Indonesio', flag: '🇮🇩', lang: 'id-ID', tier: 2,
    phrase: 'Jangan khawatir, dunia',
    hint: 'DYÁ-ngan ja-UÁ-tir, DÚ-nia',
    variants: ['jangan kuatir dunia'],
  },
  {
    id: 'eu', name: 'Euskera', badge: 'EUS', lang: 'eu-ES', tier: 2,
    phrase: 'Ez kezkatu, mundua',
    hint: 'es kes-KÁ-tu, MÚN-dua',
    variants: ['ez arduratu mundua'],
  },
  {
    id: 'tr', name: 'Turco', flag: '🇹🇷', lang: 'tr-TR', tier: 2,
    phrase: 'Endişelenme, dünya',
    hint: 'en-di-she-LÉN-me, DÜN-ia (ü: di «i» con labios de «u»)',
    variants: ['endişe etme dünya'],
  },

  // --- Nivel 3 ---
  {
    id: 'pl', name: 'Polaco', flag: '🇵🇱', lang: 'pl-PL', tier: 3,
    phrase: 'Nie martw się, świecie',
    hint: 'ñe MARTF shie, SHFIÉ-che',
    variants: ['nie martwcie się świecie'],
  },
  {
    id: 'fi', name: 'Finés', flag: '🇫🇮', lang: 'fi-FI', tier: 3,
    phrase: 'Älä huoli, maailma',
    hint: 'Ä-lä JÚO-li, MÁA-il-ma (ä: una «e» muy abierta)',
    variants: ['älä huolehdi maailma', 'älä murehdi maailma'],
  },
  {
    id: 'hu', name: 'Húngaro', flag: '🇭🇺', lang: 'hu-HU', tier: 3,
    phrase: 'Ne aggódj, világ',
    hint: 'ne ÓG-gódi, VÍ-laag (la «a» suena casi a «o»)',
    variants: [],
  },
  {
    id: 'da', name: 'Danés', flag: '🇩🇰', lang: 'da-DK', tier: 3,
    phrase: 'Bare rolig, verden',
    hint: 'BÁA-a RÓO-li, VÉR-n (la «d» casi no suena)',
    variants: [],
  },
  {
    id: 'cs', name: 'Checo', flag: '🇨🇿', lang: 'cs-CZ', tier: 3,
    phrase: 'Neboj se, světe',
    hint: 'NÉ-boi se, SVIÉ-te',
    variants: ['nebojte se světe'],
  },
  {
    id: 'is', name: 'Islandés', flag: '🇮🇸', lang: 'is-IS', tier: 3,
    phrase: 'Ekki hafa áhyggjur, heimur',
    hint: 'ÉJ-ki JÁ-va ÁU-jig-yur, JÉI-mur',
    variants: [],
  },
  {
    id: 'vi', name: 'Vietnamita', flag: '🇻🇳', lang: 'vi-VN', tier: 3,
    phrase: 'Đừng lo, thế giới',
    hint: 'dung lo, té SÓI (la «ư» es una «u» sonriendo; ¡ojo a los tonos!)',
    variants: ['đừng lo lắng thế giới'],
  },
];

/** Todas las formas aceptadas para un idioma (la frase principal primero). */
export function acceptedPhrases(language) {
  return [language.phrase, ...language.variants];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Elige los idiomas de una partida: de más fácil a más difícil,
 * aleatorios dentro de cada nivel. `count` = número de rondas, o 0 para todos.
 */
export function pickRounds(count, pool = LANGUAGES) {
  const tiers = [1, 2, 3].map((t) => shuffle(pool.filter((l) => l.tier === t)));
  if (!count || count >= pool.length) return tiers.flat();

  const easy = Math.round(count * 0.3);
  const hard = Math.round(count * 0.3);
  const wanted = [easy, count - easy - hard, hard];

  const picked = tiers.map((tier, i) => tier.slice(0, wanted[i]));
  // Si un nivel se queda corto, se rellena con los sobrantes de los demás.
  let missing = count - picked.flat().length;
  for (let i = 0; missing > 0 && i < tiers.length; i++) {
    const extra = tiers[i].slice(picked[i].length, picked[i].length + missing);
    picked[i].push(...extra);
    missing -= extra.length;
  }
  return picked.flat();
}
