// Genera ../criterios.html (informe de criterios) con esquemas lettered por plegado.
// Reutiliza las constantes y turtlePts del motor (src/bundle.js).
//   uso:  node tools/build-criterios.cjs
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let full = fs.readFileSync(path.join(ROOT, 'src/bundle.js'), 'utf8');
let eng = full.slice(0, full.indexOf('function generarSVG'));
eval(eng.replace(/var C =/, 'global.C =').replace(/function turtlePts/, 'global.turtlePts=function').replace(/function perfilMarco/, 'global.perfilMarco=function').replace(/function deduccionPliegues/, 'global.deduccionPliegues=function').replace(/function restarDed/, 'global.restarDed=function').replace(/function suma/, 'global.suma=function').replace(/function desarrollar/, 'global.desarrollar=function'));

const COL = { line: '#13213a', red: '#b4232a' };
function perfilLetras(lens, turns, h0, letras, W, H) {
  const pts = turtlePts(lens, turns, h0);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const bw = Math.max(...xs) - minX || 1, bh = Math.max(...ys) - minY || 1;
  const M = 46, k = Math.min((W - 2 * M) / bw, (H - 2 * M) / bh);
  const bx = W / 2 - bw * k / 2 - minX * k, by = H / 2 - bh * k / 2 - minY * k;
  const S = pts.map(p => ({ x: p.x * k + bx, y: p.y * k + by }));
  let gx = 0, gy = 0; S.forEach(p => { gx += p.x; gy += p.y; }); gx /= S.length; gy /= S.length;
  let g = '<path d="' + S.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ') + '" fill="none" stroke="' + COL.line + '" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>';
  for (let i = 0; i < lens.length; i++) {
    const a = S[i], b = S[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    let dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
    if (nx * (mx - gx) + ny * (my - gy) < 0) { nx = -nx; ny = -ny; }
    g += '<text x="' + (mx + nx * 20).toFixed(1) + '" y="' + (my + ny * 20 + 6).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="19" font-weight="700" fill="' + COL.red + '" text-anchor="middle">' + letras[i] + '</text>';
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + W + 'px;height:auto"><rect width="' + W + '" height="' + H + '" fill="#f7f9fc" stroke="#d6deea" rx="8"/>' + g + '</svg>';
}
function cruz(h, v, W, H) {
  return '<div class="secs"><div class="sec"><div class="seclbl">Sección a lo ANCHO</div>' + perfilLetras(h.lens, h.turns, h.h0, h.letras, W, H) + '</div><div class="sec"><div class="seclbl">Sección a lo ALTO</div>' + perfilLetras(v.lens, v.turns, v.h0, v.letras, W, H) + '</div></div>';
}
const m = perfilMarco(150, 'metalica');
const cap = (v, c) => Math.min(v, c);
const S = {
  MARCO: perfilLetras(m.segs.map(s => cap(s, 60) * 2.2 + 20), m.turns, m.h0, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], 300, 380),
  TAPA: cruz({ lens: [55, 150, 55], turns: ['L', 'L'], h0: [0, -1], letras: ['A', 'B', 'C'] }, { lens: [150, 55], turns: ['L'], h0: [1, 0], letras: ['D', 'E'] }, 300, 150),
  BANDEJA: cruz({ lens: [38, 55, 150, 55, 38], turns: ['L', 'R', 'R', 'L'], h0: [0, -1], letras: ['A', 'B', 'C', 'D', 'E'] }, { lens: [38, 55, 150], turns: ['L', 'R'], h0: [0, -1], letras: ['F', 'G', 'H'] }, 320, 150),
  REF: perfilLetras([70, 55, 70], ['L', 'L'], [0, -1], ['A', 'B', 'C'], 260, 180),
  P5: perfilLetras([50, 70, 50], ['L', 'L'], [0, -1], ['A', 'B', 'C'], 260, 180),
};

function row(l, tr, cr) { return '<tr><td class="l">' + l + '</td><td class="t">' + tr + '</td><td>' + cr + '</td></tr>'; }
function tabla(rows) { return '<table class="cr"><thead><tr><th>Tramo</th><th>Qué es</th><th>Criterio</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>'; }
function plegado(num, titulo, svg, rows, nota) {
  return '<h3><span class="n">' + num + '</span>' + titulo + '</h3><div class="card"><div class="pl"><div class="dia">' + svg + '</div><div>' + tabla(rows) + (nota ? '<p style="font-size:13px;color:#5b6b82;margin:10px 0 0">' + nota + '</p>' : '') + '</div></div></div>';
}
const HEAD = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Criterios de fabricación — planos</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"><style>:root{--navy:#0a3f85;--ink:#13213a;--muted:#5b6b82;--line:#d6deea;--red:#b4232a;--bg:#f3f5f8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.5}.wrap{max-width:900px;margin:0 auto;padding:28px 20px 80px}h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}.sub{color:var(--muted);margin:0 0 6px}.tag{display:inline-block;font-size:12px;font-weight:600;color:var(--navy);background:#e7eefb;border:1px solid #cfe0fb;border-radius:999px;padding:3px 10px;margin-top:6px}h2{font-size:20px;color:var(--navy);margin:34px 0 4px;padding-bottom:6px;border-bottom:2px solid var(--navy)}h3{font-size:17px;margin:22px 0 6px;display:flex;align-items:center;gap:8px}.n{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:2px solid var(--navy);color:var(--navy);border-radius:50%;font-weight:700;font-size:15px}.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;margin-top:10px}.pl{display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start}@media(max-width:680px){.pl{grid-template-columns:1fr}}.dia{background:#f7f9fc;border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center}.dia svg{width:100%;height:auto}.secs{display:flex;flex-direction:column;gap:12px}.sec .seclbl{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}table.cr{width:100%;border-collapse:collapse;font-size:14px}table.cr th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);padding:6px 8px;border-bottom:1px solid var(--line)}table.cr td{padding:7px 8px;border-bottom:1px solid #eef1f6;vertical-align:top}table.cr td.l{font-weight:700;color:var(--red);width:48px}table.cr td.t{font-weight:600;width:170px}ul.g{margin:8px 0 0;padding-left:20px}ul.g li{margin-bottom:6px}.foot{margin-top:40px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);padding-top:14px}@media print{body{background:#fff}.wrap{max-width:none}.card,.dia{break-inside:avoid}h3{break-after:avoid}}</style></head><body><div class="wrap">`;
let html = HEAD;
html += '<h1>Criterios de fabricación de planos</h1><p class="sub">Roque Mocciola — generador paramétrico de planos. Reglas adoptadas para cada tipología y plegado.</p><span class="tag">Chapa N°18 · cotas en mm · esquemas fuera de escala</span>';
html += '<h2>Criterios generales</h2><div class="card"><ul class="g"><li><b>Material:</b> todas las piezas en chapa N°18.</li><li><b>Cotas:</b> cada número es la longitud real del tramo en mm. Los esquemas van fuera de escala (se prioriza la forma y la claridad sobre la proporción).</li><li><b>Desarrollo</b> (medida de la chapa a cortar) = suma de las longitudes de los tramos − (cantidad de pliegues × 1 mm). Para chapa N°18 la deducción es <b>1 mm por pliegue</b>.</li><li><b>Regla de deducción del taller:</b> un tramo descuenta <b>2 mm</b> si sus dos golpes "cierran" el plegado (forma U) y <b>1 mm</b> si uno abre y otro cierra (forma Z). Las pestañas de un solo golpe descuentan 1 mm.</li><li><b>Espesor del marco</b> = espesor del muro + 3 mm (margen de corte y pintura).</li><li><b>Luz del marco</b> (paso libre) = ancho del vano − 2 × 30 mm (ala del marco por cada lado).</li><li><b>Jamba "Para enterrar":</b> suma 30 mm al largo de las jambas (para empotrar bajo el piso sin terminar).</li></ul></div>';
html += '<h2>Tipología 1 — Puerta metálica doble faz</h2><p class="sub">Se compone de: marco (①), tapa y bandeja (las dos caras de la hoja, ② y ③) y los perfiles internos de la hoja (④ refuerzo y ⑤ perfil inferior).</p>';
html += plegado('1', 'Marco', S.MARCO, [row('A, I', 'Pestañas de tope', '15 mm (fijo). Topes donde cierra la hoja.'), row('B, H', 'Alas del marco', '30 mm (fijo). Es lo que el marco "come" del vano por cada cara (y por el dintel).'), row('C', 'Rebaje (apoyo de la hoja)', '<b>35 mm</b> hoja metálica / <b>31 mm</b> hoja de madera. Define dónde apoya la hoja.'), row('D, E, F', 'Escalón de tope', '15 mm cada uno (fijo). Resalto contra el que topa la hoja.'), row('G', 'Fondo (espesor del muro)', '= (espesor de muro + 3) − C − 15. <b>Es el único tramo que varía con el muro.</b>')], 'Largos: dintel = luz del marco; jambas = alto del vano (+30 si es "Para enterrar"). Desarrollo = Σ(A…I) − pliegues × 1 mm.');
html += plegado('2', 'Tapa <span style="color:#5b6b82;font-weight:500;font-size:14px">(cara exterior de la hoja)</span>', S.TAPA, [row('A, C, E', 'Ganchos a 180° (redondeados)', '15 mm. En el desarrollo cuentan 14 (plegado a 180°).'), row('B', 'Cara a lo ancho', '= (ancho del vano − 2 × 30) + 2 × 12 mm de solape = luz + 24. La tapa recubre el marco 12 mm por lado.'), row('D', 'Cara a lo alto', '= alto del vano − 30 (dintel) − 4 (luz superior) − 7 (luz inferior) + 15 (solape con el marco).')], 'Es un panel: se pliega en los 4 bordes. Se muestra como las dos secciones (ancho y alto).');
html += plegado('3', 'Bandeja <span style="color:#5b6b82;font-weight:500;font-size:14px">(cara interior de la hoja)</span>', S.BANDEJA, [row('A, E, F', 'Pestañas', '10 mm (fijo).'), row('B, D, G', 'Rebajes', '1 mm más que el rebaje del marco → <b>36 mm</b> metálica / <b>32 mm</b> madera. Encastran sobre el escalón del marco.'), row('C', 'Cara a lo ancho', '= (ancho del vano − 2 × 30) − 2 × 4 mm de juego = luz − 8.'), row('H', 'Cara a lo alto', '= alto del vano − 30 (marco) − 8 mm de juego inferior.')], 'La bandeja encastra dentro de la tapa; de ahí el rebaje + 1 mm y los juegos de 4 mm por lado.');
html += plegado('4', 'Refuerzo (U)', S.REF, [row('A, C', 'Paredes', '= rebaje del marco = <b>35 / 31</b> (1 mm menos que los rebajes de la bandeja).'), row('B', 'Base', '25 mm (fijo).')], 'Refuerzos verticales de la hoja. Cantidad por hoja: se reparten cada ≤ 160 mm → ceil(cara interior ÷ 160) − 1. Largo = cara H de la bandeja (③, alto interior) − pared del perfil inferior (⑤ = 20 mm) − 10 mm de luz.');
html += plegado('5', 'Perfil inferior (U)', S.P5, [row('A, C', 'Paredes', '20 mm (fijo).'), row('B', 'Base', '= rebaje del marco = <b>35 / 31</b> (igual que las paredes del ④).')], 'Perfil del borde inferior de la hoja (no es un bastidor). Largo = ancho interior de la hoja (cara de la bandeja) − 4 mm de juego.');
html += '<h2>Tipología 2 — Marco de puerta (solo marco)</h2><p class="sub">Para puertas de madera u otra hoja, donde solo se fabrica el marco.</p>';
html += plegado('1', 'Marco', S.MARCO, [row('A, I', 'Pestañas de tope', '15 mm (fijo).'), row('B, H', 'Alas del marco', '30 mm (fijo).'), row('C', 'Rebaje', '<b>31 mm</b> por defecto (hoja de madera) · 35 mm si la hoja es metálica. Configurable.'), row('D, E, F', 'Escalón', '15 mm cada uno (fijo).'), row('G', 'Fondo (espesor del muro)', '= (espesor de muro + 3) − C − 15.')], 'Mismo perfil que el marco de la puerta doble faz. Despiece: 1 dintel (largo = luz) + 2 jambas (largo = alto del vano, +30 si "Para enterrar").');
html += '<div class="foot">Documento generado a partir de los criterios cargados en el motor del generador (src/bundle.js). Si cambia una constante del taller (p. ej. el rebaje o un juego), regenerar con <code>node tools/build-criterios.cjs</code>.</div></div></body></html>';
fs.writeFileSync(path.join(ROOT, 'criterios.html'), html);
console.log('criterios.html', (html.length / 1024).toFixed(0) + 'KB');
