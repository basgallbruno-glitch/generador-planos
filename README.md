# Generador de planos — Roque Mocciola

Generador paramétrico de planos de fabricación (puertas metálicas doble faz, marcos de puerta, y en crecimiento). Página web estática, sin backend.

**En vivo:** https://basgallbruno-glitch.github.io/generador-planos/

**Criterios de fabricación (instructivo):** https://basgallbruno-glitch.github.io/generador-planos/criterios.html

## Cómo se usa
Se elige el tipo de plano, se cargan los parámetros (medidas, muro, mano, herrajes, etc.) y se descarga el PDF A4 listo para taller. El rótulo y los herrajes son editables.

## Estructura
- `index.html` — la página publicada (generada, no editar a mano).
- `src/bundle.js` — motor de cálculo (despiece, desarrollos de plegado).
- `src/draw.js` — capa de dibujo (SVG A4) y registro de tipos de plano.
- `src/logo.jpg` — logo de la empresa (embebido en el build).
- `src/build.cjs` — build reproducible.

## Build
```
node src/build.cjs
```
Regenera `index.html` a partir de `src/`. Commit + push → GitHub Pages republica solo.

## Agregar un tipo de plano nuevo
Se agrega un módulo al registro `TIPOS` en `src/draw.js` (id, nombre, campos, calcular, generar). No hay que tocar los tipos existentes.
