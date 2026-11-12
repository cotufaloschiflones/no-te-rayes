# No Te Rayes · World Tour 🌍

Juego de pronunciación con la cámara: aparece **«No te preocupes, mundo»** en otro idioma
y tienes que decirlo en voz alta con buena pronunciación para pasar al siguiente país.

## Jugar

**Online (también en el móvil):** <https://cotufaloschiflones.github.io/no-te-rayes/>
— en Android, ábrelo con Chrome.

**En local:**

```bash
npm start
```

Abre <http://localhost:8000> en **Chrome o Edge** y acepta cámara y micrófono.

- El micro escucha solo: no hay que pulsar nada para hablar.
- 🔊 **Escuchar** reproduce la frase con la voz del sistema (si tienes esa voz instalada).
- 💡 **Pista** enseña una pronunciación aproximada para hispanohablantes.
- **Exigencia**: Relajado 65 %, Normal 78 %, Nativo 90 % de precisión mínima.

> Hace falta `localhost` o HTTPS: abriendo `index.html` como archivo el micro no funciona.
> Cada push a `main` actualiza la versión online (GitHub Pages).

## Cómo funciona

| Archivo | Qué hace |
|---|---|
| `js/languages.js` | Idiomas, frases, pistas y variantes aceptadas. **Aquí se añaden idiomas.** |
| `js/scoring.js` | Normaliza el texto y calcula la precisión (distancia de Levenshtein). |
| `js/recognizer.js` | Reconocimiento de voz del navegador (Web Speech API), con reinicio automático. |
| `js/tts.js` | Voz de ejemplo del botón 🔊. |
| `js/main.js` | Flujo de la partida e interfaz. |

El reconocedor se configura en el idioma de cada ronda, transcribe lo que dices y se
compara con la frase (y sus variantes). Se ignoran mayúsculas, tildes y puntuación, y las
muletillas alrededor de la frase no penalizan.

**Navegadores:** Chrome y Edge recomendados (envían el audio a sus servidores, así que
necesitan internet). Safari puede funcionar con el Dictado activado, pero no está probado.
Firefox no tiene reconocimiento de voz: el juego avisa y deja escribir la frase.

Si el micro no responde en macOS, revisa Ajustes del Sistema → Privacidad y seguridad →
Micrófono y deja que el navegador lo use.

## Desarrollo

```bash
npm test
```

Abre `http://localhost:8000/?debug` para tener un campo de texto que simula lo que dices.
