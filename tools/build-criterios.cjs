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
/* --- esquemas propios (gabinete y cámara), fuera de escala --- */
const LT = (x, y, l) => '<text x="' + x + '" y="' + y + '" font-family="IBM Plex Sans,sans-serif" font-size="19" font-weight="700" fill="' + COL.red + '" text-anchor="middle">' + l + '</text>';
const LNc = (x1, y1, x2, y2) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + COL.line + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';
const WRAP = (W, H, inner) => '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + W + 'px;height:auto"><rect width="' + W + '" height="' + H + '" fill="#f7f9fc" stroke="#d6deea" rx="8"/>' + inner + '</svg>';
function p1Gab() {   // marco de hoja: canal con 2 ganchos a 180°
  const W = 300, H = 210, x0 = 100, y0 = 48, web = 116, fl = 90;
  let g = LNc(x0, y0, x0, y0 + web) + LNc(x0, y0, x0 + fl, y0) + LNc(x0, y0 + web, x0 + fl, y0 + web);
  g += LNc(x0 + fl, y0, x0 + fl, y0 + 16) + LNc(x0 + fl, y0 + 16, x0 + fl - 26, y0 + 16);
  g += LNc(x0 + fl, y0 + web, x0 + fl, y0 + web - 16) + LNc(x0 + fl, y0 + web - 16, x0 + fl - 26, y0 + web - 16);
  g += LT(x0 + fl - 13, y0 + 36, 'A') + LT(x0 + fl / 2, y0 - 10, 'B') + LT(x0 - 15, y0 + web / 2, 'C') + LT(x0 + fl / 2, y0 + web + 22, 'D') + LT(x0 + fl - 13, y0 + web - 36, 'E');
  return WRAP(W, H, g);
}
function p2Gab() {   // tablilla: 20 vertical · 50 diagonal · 15 vertical · 10 pie
  const W = 300, H = 250, ox = 118, oy = 46;
  const A = [ox + 88, oy], B = [ox + 88, oy + 56], C = [ox, oy + 168], D = [ox, oy + 212], E = [ox + 42, oy + 212];
  let g = '<path d="M' + A[0] + ' ' + A[1] + ' L' + B[0] + ' ' + B[1] + ' L' + C[0] + ' ' + C[1] + ' L' + D[0] + ' ' + D[1] + ' L' + E[0] + ' ' + E[1] + '" fill="none" stroke="' + COL.line + '" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>';
  g += LT(A[0] + 16, oy + 32, 'A') + LT((A[0] + C[0]) / 2 - 16, (B[1] + C[1]) / 2, 'B') + LT(C[0] - 14, (C[1] + D[1]) / 2, 'C') + LT((D[0] + E[0]) / 2, D[1] + 22, 'D');
  return WRAP(W, H, g);
}
function angCam() {   // ángulo 2"×3/16": ala vertical arriba + ala horizontal abajo
  const W = 260, H = 190, x0 = 85, y0 = 36, legV = 118, legH = 110, t = 18;
  let g = '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + t) + ' ' + y0 + ' L' + (x0 + t) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV) + ' L' + x0 + ' ' + (y0 + legV) + ' Z" fill="#e7eefb" stroke="' + COL.line + '" stroke-width="3.2" stroke-linejoin="round"/>';
  g += LT(x0 - 15, y0 + legV / 2, 'A') + LT(x0 + legH * 0.62, y0 + legV + 16, 'B');
  return WRAP(W, H, g);
}
function pluvL() {   // marco plegado en L 42×42 (chapa 1/8")
  const W = 260, H = 190, x0 = 85, y0 = 36, legV = 118, legH = 110, t = 13;
  let g = '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + t) + ' ' + y0 + ' L' + (x0 + t) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV) + ' L' + x0 + ' ' + (y0 + legV) + ' Z" fill="#e7eefb" stroke="' + COL.line + '" stroke-width="3.2" stroke-linejoin="round"/>';
  g += LT(x0 - 15, y0 + legV / 2, 'A') + LT(x0 + legH * 0.62, y0 + legV + 16, 'B');
  return WRAP(W, H, g);
}
function pluvReja() {   // planchuelas de canto + refuerzo por debajo
  const W = 300, H = 170, y = 74, x0 = 74, bw = 12, bh = 46, gap = 44;
  let g = '', x = x0;
  for (let i = 0; i < 4; i++) { g += '<rect x="' + x + '" y="' + (y - bh) + '" width="' + bw + '" height="' + bh + '" fill="#e7eefb" stroke="' + COL.line + '" stroke-width="3.2"/>'; x += bw + gap; }
  const xEnd = x - gap;
  g += '<text x="' + (x0 - 12) + '" y="' + (y - bh / 2 + 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="16" font-weight="700" fill="' + COL.red + '" text-anchor="end">12,7</text>';
  g += '<rect x="' + x0 + '" y="' + (y + 16) + '" width="' + (xEnd - x0) + '" height="8" fill="#eef4fb" stroke="' + COL.line + '" stroke-width="2.4"/>';
  g += '<text x="' + ((x0 + xEnd) / 2) + '" y="' + (y + 50) + '" font-family="IBM Plex Sans,sans-serif" font-size="13" fill="' + COL.muted + '" text-anchor="middle">planchuelas de canto cada 25 · refuerzo ⊥ por debajo</text>';
  return WRAP(W, H, g);
}
const m = perfilMarco(150, 'metalica');
const cap = (v, c) => Math.min(v, c);
const S = {
  MARCO: perfilLetras(m.segs.map(s => cap(s, 60) * 2.2 + 20), m.turns, m.h0, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], 300, 380),
  TAPA: cruz({ lens: [55, 150, 55], turns: ['L', 'L'], h0: [0, -1], letras: ['A', 'B', 'C'] }, { lens: [150, 55], turns: ['L'], h0: [1, 0], letras: ['D', 'E'] }, 300, 150),
  BANDEJA: cruz({ lens: [38, 55, 150, 55, 38], turns: ['L', 'R', 'R', 'L'], h0: [0, -1], letras: ['A', 'B', 'C', 'D', 'E'] }, { lens: [38, 55, 150], turns: ['L', 'R'], h0: [0, -1], letras: ['F', 'G', 'H'] }, 320, 150),
  REF: perfilLetras([70, 55, 70], ['L', 'L'], [0, -1], ['A', 'B', 'C'], 260, 180),
  P5: perfilLetras([50, 70, 50], ['L', 'L'], [0, -1], ['A', 'B', 'C'], 260, 180),
  P1GAB: p1Gab(),
  P2GAB: p2Gab(),
  ANGCAM: angCam(),
  BANDEJACAM: cruz({ lens: [46, 150, 46], turns: ['L', 'L'], h0: [0, -1], letras: ['A', 'B', 'C'] }, { lens: [46, 150, 46], turns: ['L', 'L'], h0: [0, -1], letras: ['D', 'E', 'F'] }, 300, 150),
  PLUVL: pluvL(),
  PLUVREJA: pluvReja(),
};

function row(l, tr, cr) { return '<tr><td class="l">' + l + '</td><td class="t">' + tr + '</td><td>' + cr + '</td></tr>'; }
function tabla(rows) { return '<table class="cr"><thead><tr><th>Tramo</th><th>Qué es</th><th>Criterio</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>'; }
function plegado(num, titulo, svg, rows, nota) {
  return '<h3><span class="n">' + num + '</span>' + titulo + '</h3><div class="card"><div class="pl"><div class="dia">' + svg + '</div><div>' + tabla(rows) + (nota ? '<p style="font-size:13px;color:#5b6b82;margin:10px 0 0">' + nota + '</p>' : '') + '</div></div></div>';
}
const HEAD = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Criterios de fabricación — planos</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"><style>:root{--navy:#0a3f85;--ink:#13213a;--muted:#5b6b82;--line:#d6deea;--red:#b4232a;--bg:#f3f5f8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'IBM Plex Sans',system-ui,sans-serif;line-height:1.5}.wrap{max-width:900px;margin:0 auto;padding:28px 20px 80px}h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}.sub{color:var(--muted);margin:0 0 6px}.tag{display:inline-block;font-size:12px;font-weight:600;color:var(--navy);background:#e7eefb;border:1px solid #cfe0fb;border-radius:999px;padding:3px 10px;margin-top:6px}h2{font-size:20px;color:var(--navy);margin:34px 0 4px;padding-bottom:6px;border-bottom:2px solid var(--navy)}h3{font-size:17px;margin:22px 0 6px;display:flex;align-items:center;gap:8px}.n{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:2px solid var(--navy);color:var(--navy);border-radius:50%;font-weight:700;font-size:15px}.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;margin-top:10px}.pl{display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start}@media(max-width:680px){.pl{grid-template-columns:1fr}}.dia{background:#f7f9fc;border:1px solid var(--line);border-radius:10px;padding:10px;text-align:center}.dia svg{width:100%;height:auto}.secs{display:flex;flex-direction:column;gap:12px}.sec .seclbl{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}table.cr{width:100%;border-collapse:collapse;font-size:14px}table.cr th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);padding:6px 8px;border-bottom:1px solid var(--line)}table.cr td{padding:7px 8px;border-bottom:1px solid #eef1f6;vertical-align:top}table.cr td.l{font-weight:700;color:var(--red);width:48px}table.cr td.t{font-weight:600;width:170px}ul.g{margin:8px 0 0;padding-left:20px}ul.g li{margin-bottom:6px}.foot{margin-top:40px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);padding-top:14px}@media print{body{background:#fff}.wrap{max-width:none}.card,.dia{break-inside:avoid}h3{break-after:avoid}}</style></head><body><div class="wrap">`;
let html = HEAD;
html += '<h1>Criterios de fabricación de planos</h1><p class="sub">Roque Mocciola — generador paramétrico de planos. Reglas adoptadas para cada tipología y plegado.</p><span class="tag">Chapa N°18/16/14 · cotas en mm · esquemas fuera de escala</span>';
html += '<h2>Criterios generales</h2><div class="card"><ul class="g"><li><b>Material:</b> los plegados de puertas y gabinetes van en chapa N°18; en cámaras cloacales la tapa va en N°16 o N°14 según el tamaño; en cámaras pluviales el marco es chapa 1/8" y la rejilla planchuelas. Los caños y ángulos son material comprado.</li><li><b>Cotas:</b> cada número es la longitud real del tramo en mm. Los esquemas van fuera de escala (se prioriza la forma y la claridad sobre la proporción).</li><li><b>Desarrollo</b> (medida de la chapa a cortar) = suma de las longitudes de los tramos − deducción por pliegue. La deducción = <b>espesor de la chapa redondeado al entero menor</b> (N°18→1 · N°16→1 · N°14→2).</li><li><b>Regla de deducción del taller:</b> un tramo descuenta <b>2 mm</b> si sus dos golpes "cierran" el plegado (forma U) y <b>1 mm</b> si uno abre y otro cierra (forma Z). Las pestañas de un solo golpe descuentan 1 mm.</li><li><b>Espesor del marco</b> = espesor del muro terminado (criterio provisorio: sin margen de corte/pintura, pendiente de afinar).</li><li><b>Luz del marco</b> (paso libre) = ancho del vano − 2 × 30 mm (ala del marco por cada lado).</li><li><b>Jamba "Para enterrar":</b> suma 30 mm al largo de las jambas (para empotrar bajo el piso sin terminar).</li></ul></div>';
html += '<h2>Tipología 1 — Puerta metálica doble faz</h2><p class="sub">Se compone de: marco (①), tapa y bandeja (las dos caras de la hoja, ② y ③) y los perfiles internos de la hoja (④ refuerzo y ⑤ perfil inferior).</p>';
html += plegado('1', 'Marco', S.MARCO, [row('A, I', 'Pestañas de tope', '15 mm (fijo). Topes donde cierra la hoja.'), row('B, H', 'Alas del marco', '30 mm (fijo). Es lo que el marco "come" del vano por cada cara (y por el dintel).'), row('C', 'Rebaje (apoyo de la hoja)', '<b>35 mm</b> hoja metálica / <b>31 mm</b> hoja de madera. Define dónde apoya la hoja.'), row('D, E, F', 'Escalón de tope', '15 mm cada uno (fijo). Resalto contra el que topa la hoja.'), row('G', 'Fondo (espesor del muro)', '= espesor de muro − C − 15. <b>Es el único tramo que varía con el muro.</b>')], 'Largos: dintel = luz del marco; jambas = alto del vano (+30 si es "Para enterrar"). Desarrollo = Σ(A…I) − pliegues × 1 mm.');
html += plegado('2', 'Tapa <span style="color:#5b6b82;font-weight:500;font-size:14px">(cara exterior de la hoja)</span>', S.TAPA, [row('A, C, E', 'Ganchos a 180° (redondeados)', '15 mm. En el desarrollo cuentan 14 (plegado a 180°).'), row('B', 'Cara a lo ancho', '= (ancho del vano − 2 × 30) + 2 × 12 mm de solape = luz + 24. La tapa recubre el marco 12 mm por lado.'), row('D', 'Cara a lo alto', '= alto del vano − 30 (dintel) − 4 (luz superior) − 7 (luz inferior) + 15 (solape con el marco).')], 'Es un panel: se pliega en los 4 bordes. Se muestra como las dos secciones (ancho y alto).');
html += plegado('3', 'Bandeja <span style="color:#5b6b82;font-weight:500;font-size:14px">(cara interior de la hoja)</span>', S.BANDEJA, [row('A, E, F', 'Pestañas', '10 mm (fijo).'), row('B, D, G', 'Rebajes', '1 mm más que el rebaje del marco → <b>36 mm</b> metálica / <b>32 mm</b> madera. Encastran sobre el escalón del marco.'), row('C', 'Cara a lo ancho', '= (ancho del vano − 2 × 30) − 2 × 4 mm de juego = luz − 8.'), row('H', 'Cara a lo alto', '= alto del vano − 30 (marco) − 8 mm de juego inferior.')], 'La bandeja encastra dentro de la tapa; de ahí el rebaje + 1 mm y los juegos de 4 mm por lado.');
html += plegado('4', 'Refuerzo (U)', S.REF, [row('A, C', 'Paredes', '= rebaje del marco = <b>35 / 31</b> (1 mm menos que los rebajes de la bandeja).'), row('B', 'Base', '25 mm (fijo).')], 'Refuerzos verticales de la hoja. Cantidad por hoja: se reparten cada ≤ 160 mm → ceil(cara interior ÷ 160) − 1. Largo = cara H de la bandeja (③, alto interior) − pared del perfil inferior (⑤ = 20 mm) − 10 mm de luz.');
html += plegado('5', 'Perfil inferior (U)', S.P5, [row('A, C', 'Paredes', '20 mm (fijo).'), row('B', 'Base', '= rebaje del marco = <b>35 / 31</b> (igual que las paredes del ④).')], 'Perfil del borde inferior de la hoja (no es un bastidor). Largo = ancho interior de la hoja (cara de la bandeja) − 4 mm de juego.');
html += '<h2>Tipología 2 — Marco de puerta (solo marco)</h2><p class="sub">Para puertas de madera u otra hoja, donde solo se fabrica el marco.</p>';
html += plegado('1', 'Marco', S.MARCO, [row('A, I', 'Pestañas de tope', '15 mm (fijo).'), row('B, H', 'Alas del marco', '30 mm (fijo).'), row('C', 'Rebaje', '<b>31 mm</b> por defecto (hoja de madera) · 35 mm si la hoja es metálica. Configurable.'), row('D, E, F', 'Escalón', '15 mm cada uno (fijo).'), row('G', 'Fondo (espesor del muro)', '= espesor de muro − C − 15.')], 'Mismo perfil que el marco de la puerta doble faz. Despiece: 1 dintel (largo = luz) + 2 jambas (largo = alto del vano, +30 si "Para enterrar").');
html += '<h2>Tipología 3 — Gabinete con tablillas (una o dos hojas)</h2><p class="sub">Marco estructural de caño (bastidor comprado), marco de hoja (① plegado) y tablillas (② plegado) que hacen el cierre superficial. No tiene opción de enterrar.</p>';
html += '<div class="card"><ul class="g"><li><b>Marco estructural:</b> horizontales = ancho del vano − 2×5 ; verticales = alto del vano − 5 (el lado inferior no descuenta). Caño rectangular (por defecto 50×20×1,6) con el canto de 20 hacia el frente; material comprado, no se grafica su sección.</li><li><b>Abertura interior del estructural</b> (ancho) = ancho del marco − 2×canto al frente.</li><li><b>Marco de la hoja:</b> el alto no cambia (= alto del estructural); el ancho = abertura interior − 2×5 de luz (marco hoja↔estructural). La luz de 5 mm aplica solo al ancho.</li><li><b>Doble hoja:</b> dos hojas iguales que abren a cada lado, con 8 mm de luz en el centro y sin montante (el montante va con 3 o más hojas). Ancho de cada hoja = (abertura interior − 2×5 − 8) / 2.</li></ul></div>';
html += plegado('1', 'Marco de hoja (canal con ganchos)', S.P1GAB, [row('A, E', 'Ganchos a 180°', '15 mm. Hem de rigidez en la punta de cada ala; en el desarrollo cuentan 14.'), row('B, D', 'Alas', '30 mm (fijo).'), row('C', 'Alma', '32 mm (fijo).')], 'Chapa N°18. Desarrollo (plana) = 114 mm. Cantidad: 2 horizontales + 2 verticales por hoja. Largo horizontal = ancho de la hoja; largo vertical = alto del estructural.');
html += plegado('2', 'Tablilla', S.P2GAB, [row('A', 'Pared', '20 mm (fijo).'), row('B', 'Diagonal', '50 mm (fijo). Tramo inclinado que hace el cierre; se traza con 28 horizontal y 42 vertical como guía para el plegador.'), row('C', 'Pared', '15 mm (fijo).'), row('D', 'Pie', '10 mm (fijo).')], 'Chapa N°18. Desarrollo (plana) = 95 mm. Largo = ancho de la hoja − 2×3 (juego tablilla↔hoja). En una hoja: ancho estructural − 2×canto − 2×5 − 2×3. Cantidad por hoja = piso(alto del estructural ÷ 70). La tablilla queda por dentro del plegado ①.');
html += '<h2>Tipología 4 — Cámara cloacal (marco + tapa)</h2><p class="sub">Marco de ángulo (bastidor comprado) y tapa de chapa plegada en forma de bandeja, que en obra se rellena con malla electrosoldada y hormigón.</p>';
html += '<div class="card"><ul class="g"><li><b>Ángulo:</b> 2"×3/16" (ala 50,8 mm · espesor 4,76 mm), uniones a 45°.</li><li><b>Medidas:</b> se da la exterior (marco terminado) o la interior (hueco libre), independientes por lado. <b>ext = int + 2 × ala.</b> La planta se acota con la medida ingresada.</li><li><b>Chapa de la tapa:</b> N°16 si el marco mide menos de 1 m en ambos lados; N°14 si algún lado llega o supera 1 m.</li><li><b>Tirador</b> (bulón para izar la tapa): 1 centrado; 2 en los tercios del lado largo si el marco supera 1,2 m. Va en la lista de accesorios.</li></ul></div>';
html += plegado('—', 'Marco de ángulo (comprado)', S.ANGCAM, [row('A', 'Ala vertical', '50,8 mm (2"). Al borde, hacia arriba.'), row('B', 'Ala horizontal', '50,8 mm (2"). Hacia adentro y abajo; es el asiento de la tapa.')], 'Espesor 4,76 mm (3/16"). Despiece: 2 lados A + 2 lados B, con largo = medida exterior; uniones a 45°.');
html += plegado('1', 'Bandeja (tapa) — panel', S.BANDEJACAM, [row('A, C, D, F', 'Paredes', '46 mm (= ala del ángulo − espesor, para que la tapa quede al ras).'), row('B, E', 'Base', 'cara de la tapa (ancho y alto).')], 'Panel plegado en los 4 bordes (se muestran las dos secciones). Lado de la bandeja = ext − 2 × (espesor del ángulo + 3 mm de luz) por lado. Alto 46. Desarrollo: deducción = espesor de la chapa redondeado al entero menor, por doblez.');
html += '<h2>Tipología 5 — Cámara pluvial (marco + rejilla)</h2><p class="sub">Marco de chapa plegada en L y rejilla de planchuelas que apoya sobre el ala del marco. A diferencia de la cloacal, la tapa es una rejilla (no se rellena con hormigón).</p>';
html += '<div class="card"><ul class="g"><li><b>Marco:</b> plegado en L de 42×42 mm (desarrollo 39+39 = 78) en chapa 1/8" (3,18 mm), uniones a 45°. El ala horizontal es el asiento de la rejilla.</li><li><b>Medidas:</b> exterior (conjunto terminado) o interior (hueco libre); desde la interior los plegados van hacia afuera. <b>ext = int + 2 × 42.</b> La planta se acota con la medida ingresada.</li><li><b>Rejilla:</b> marco perimetral + planchuelas; apoya sobre el ala del marco, por eso <b>lado de la rejilla = ext − 2 × espesor del plegado (3,18)</b> — abarca casi todo el exterior y deja un juego de un espesor por lado para que no quede en el aire.</li><li><b>Planchuelas:</b> 1/2"×3/16" de canto (inercia fuerte), ⊥ a la dimensión mayor, con luz libre ≈ 25 mm (las de los extremos se ajustan). Cantidad = redondeo(lado mayor ÷ (25 + ancho de planchuela)) − 1. Largo = lado menor de la rejilla.</li><li><b>Refuerzo</b> (opcional, zona transitable): planchuela 1/2"×1/8" soldada por debajo, ⊥ a las principales. 1 al medio si el lado mayor de la rejilla < 1 m; 2 en los tercios si ≥ 1 m.</li></ul></div>';
html += plegado('1', 'Marco (plegado L)', S.PLUVL, [row('A', 'Ala vertical', '42 mm. Pared del hueco.'), row('B', 'Ala horizontal', '42 mm. Asiento de la rejilla.')], 'Chapa 1/8" (3,18 mm). Desarrollo = 39 + 39 = 78. Despiece: 2 lados A + 2 lados B, largo = medida exterior; uniones a 45°.');
html += plegado('2', 'Rejilla (planchuelas de canto)', S.PLUVREJA, [row('M', 'Marco de la rejilla', 'Planchuela 1/2"×3/16". 2 lados largos + 2 lados cortos = lado de la rejilla.'), row('P', 'Planchuelas', '1/2"×3/16" de canto, cada ≈25 mm, ⊥ a la dimensión mayor. Largo = lado menor.'), row('R', 'Refuerzo', '1/2"×1/8" por debajo (sólo si es transitable). Largo = lado mayor.')], 'La rejilla apoya sobre el ala del marco (lado = ext − 2 × 3,18). El refuerzo sólo se agrega en cámaras transitables, con la casilla del generador.');
html += '<div class="foot">Documento generado a partir de los criterios cargados en el motor del generador (src/bundle.js). Si cambia una constante del taller (p. ej. el rebaje o un juego), regenerar con <code>node tools/build-criterios.cjs</code>.</div></div></body></html>';
fs.writeFileSync(path.join(ROOT, 'criterios.html'), html);
console.log('criterios.html', (html.length / 1024).toFixed(0) + 'KB');
