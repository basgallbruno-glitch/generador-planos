/* ===========================================================================
   NÚCLEO + GENERADOR SVG  —  Puerta metálica doble faz (tipo plano OT P.08)
   Un solo archivo: corre en Node (test/preview) y en el navegador (artifact).
   Coordenadas del dibujo en MILÍMETROS reales.
   =========================================================================== */

/* ---- Tabla de deducción por plegado (editable) ---- */
var TABLA_DEDUCCION = { 18: { 90: 1 } };   // mm/pliegue hojas (chapa N° : ángulo)

function desarrollar(tramos, nPliegues, chapa, ang) {
  var BD = TABLA_DEDUCCION[chapa][ang || 90];
  return tramos.reduce(function (a, b) { return a + b; }, 0) - nPliegues * BD;
}
function suma(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
function restarDed(lens, ded) { return lens.map(function (l, i) { return l - ded[i]; }); }

/* ---- Constantes de taller (chapa 18), extraídas del plano ---- */
var C = {
  alaMarco: 30, solapeHoja: 12, pestanaExtHoja: 14,
  pestanaIntHoja: 10, juegoIntLat: 4, juegoIntInf: 8,   // perfil ③ (hoja interior, panel)
  luzSuperior: 4, luzInferior: 7, solapeVertHoja: 15, pestanaHoja: 15,
  baseRefuerzo: 25, maxSepRefuerzo: 160,   // ④ refuerzo (U): paredes = rebaje; cada ≤160 mm
  paredPerfil5: 20, juegoPerfil5: 4,        // ⑤ perfil interior (U): base = rebaje; largo = ancho int − 4
  revealDintel: 30,   // = 'espesor del marco' que reduce el vano (cara/ala del marco)
  luzRefuerzoInf: 10,  // ④ refuerzo: luz libre respecto al perfil inferior ⑤
  distCerraduraFilo: 50,      // distancia del filo del marco al agujero de cerradura
  alturaCerradura: 1020,      // del plano
  // --- Perfil ① marco (muro de mampostería) ---
  margenMuro: 0,              // (provisorio) espesor marco = muro terminado; margen corte/pintura pendiente de afinar
  t3Metalica: 35, t3Madera: 31,  // tramo 3 según tipo de hoja
  marcoTurns: ['L', 'L', 'R', 'L', 'L', 'R', 'L', 'L'],
};

/* ---- Perfil ① marco (muro de mampostería): longitudes desde muro + tipo de hoja ---- */
// pesos de distribución de la deducción por tramo (de la columna del plano): los 3
// conectores de U (t2, t5, t8) llevan el doble. Suma 12 => con chapa 13 da [1,2,1,...]
// Regla de deducción (Bruno): un tramo descuenta 2 mm si sus dos pliegues "cierran"
// (vecinos del mismo lado de la recta del tramo → forma U), 1 mm si uno abre y otro
// cierra (forma Z). Extremos (un solo pliegue): endVal (pestaña), a confirmar por perfil.
// endVal: número (ambas pestañas igual) o [inicio, fin] (1 = cierra, 0 = pata abierta)
function deduccionPliegues(lens, turns, h0, endVal) {
  var ev = Array.isArray(endVal) ? endVal : [endVal, endVal];
  var p = turtlePts(lens.slice(), turns, h0), n = lens.length, d = [];
  for (var i = 0; i < n; i++) {
    if (i === 0) { d.push(ev[0]); continue; }
    if (i === n - 1) { d.push(ev[1]); continue; }
    var ax = p[i + 1].x - p[i].x, ay = p[i + 1].y - p[i].y;
    var pvx = p[i - 1].x - p[i].x, pvy = p[i - 1].y - p[i].y;
    var nvx = p[i + 2].x - p[i + 1].x, nvy = p[i + 2].y - p[i + 1].y;
    var sPrev = Math.sign(ax * pvy - ay * pvx), sNext = Math.sign(ax * nvy - ay * nvx);
    d.push(sPrev === sNext ? 2 : 1);
  }
  return d;
}
function perfilMarco(muro, tipoHoja) {
  var t3 = tipoHoja === 'madera' ? C.t3Madera : C.t3Metalica;
  var espesor = muro + C.margenMuro;        // = muro terminado (margenMuro provisorio = 0)
  var t7 = espesor - t3 - 15;               // espesor = t3 + 15 + t7
  var segs = [15, 30, t3, 15, 15, 15, t7, 30, 15];
  var ded = deduccionPliegues(segs, C.marcoTurns, [0, -1], 1);  // pestañas del marco descuentan 1
  var dev = segs.map(function (s, i) { return s - ded[i]; });
  var desarrollo = dev.reduce(function (a, b) { return a + b; }, 0);
  return {
    segs: segs, turns: C.marcoTurns, h0: [0, -1], faceIdx: 6,
    t3: t3, t7: t7, espesor: espesor, dev: dev, desarrollo: desarrollo,
  };
}

/* ---- Motor de despiece: W×H×chapa -> piezas + cotas derivadas ---- */
function calcularDespiece(p) {
  var W = p.W, H = p.H, chapa = p.chapa || 18;
  var muro = p.espesorMuro == null ? 150 : p.espesorMuro;
  var tipoHoja = p.tipoHoja || 'metalica';
  var marco = perfilMarco(muro, tipoHoja);
  var pisoTerminado = p.pisoTerminado == null ? true : p.pisoTerminado;
  var enterrar = pisoTerminado ? 0 : 30;   // +30 en jambas para enterrar si el piso no está terminado
  var cantIzq = Math.max(0, p.cantIzq == null ? 1 : p.cantIzq);
  var cantDer = Math.max(0, p.cantDer == null ? 0 : p.cantDer);
  var total = Math.max(1, cantIzq + cantDer);
  var luz = W - 2 * C.alaMarco;                 // 790
  var caraExt = luz + 2 * C.solapeHoja;         // 812
  var hojaExtAncho = desarrollar([C.pestanaExtHoja, caraExt, C.pestanaExtHoja], 2, chapa); // 838
  // ③ hoja interior (panel): rebaje = cara del marco (t3); tramos 2,4,7 = rebaje+1
  var rebajeHoja = tipoHoja === 'madera' ? C.t3Madera : C.t3Metalica;  // 31/35
  var pe = C.pestanaIntHoja, re = rebajeHoja + 1;
  var caraIntAncho = W - 2 * C.alaMarco - 2 * C.juegoIntLat;   // vano - 2·30 - 2·4
  var caraIntAlto = H - C.revealDintel - C.juegoIntInf;        // alto - 30 - 8
  var segIntAncho = [pe, re, caraIntAncho, re, pe];
  var segIntAlto = [pe, re, caraIntAlto];
  var devIntAncho = restarDed(segIntAncho, deduccionPliegues(segIntAncho, ['L', 'R', 'R', 'L'], [1, 0], 0));
  var devIntAlto = restarDed(segIntAlto, deduccionPliegues(segIntAlto, ['L', 'R'], [0, -1], [0, 1]));
  var hojaIntAncho = suma(devIntAncho);  // 880 (San Martin)
  var hojaIntLargo = suma(devIntAlto);   // 2056
  var caraInt = caraIntAncho;
  // ④ refuerzo (U simple): paredes = rebaje, base 25; paredes abiertas (−0), base U (−2)
  var seg4 = [rebajeHoja, C.baseRefuerzo, rebajeHoja];
  var refAncho = suma(seg4) - 2;                               // 93
  var nRef = Math.max(1, Math.ceil(caraIntAncho / C.maxSepRefuerzo) - 1);  // cada ≤160, por hoja
  // ⑤ perfil interior (U): paredes 20, base = rebaje
  var seg5 = [C.paredPerfil5, rebajeHoja, C.paredPerfil5];
  var p5Ancho = suma(seg5) - 2;                               // 73
  var p5Largo = caraIntAncho - C.juegoPerfil5;               // 788

  var caraAltoExt = H - C.revealDintel - C.luzSuperior - C.luzInferior + C.solapeVertHoja; // 2050-30-4-7+15=2024
  var hojaExtLargo = desarrollar([caraAltoExt, C.pestanaExtHoja], 1, chapa); // 2037
  var refLargo = caraIntAlto - C.paredPerfil5 - C.luzRefuerzoInf;  // cara H (③) − pared ⑤ − 10 luz

  var base = [
    { pieza: 'P.1', desc: 'Marco — dintel', cant: 1, ancho: marco.desarrollo, largo: luz },
    { pieza: 'P.1', desc: 'Marco — jambas' + (enterrar ? ' (Para enterrar)' : ''), cant: 2, ancho: marco.desarrollo, largo: H + enterrar },
    { pieza: 'P.2', desc: 'Tapa', cant: 1, ancho: hojaExtAncho, largo: hojaExtLargo },
    { pieza: 'P.3', desc: 'Bandeja', cant: 1, ancho: hojaIntAncho, largo: hojaIntLargo },
    { pieza: 'P.4', desc: 'Refuerzo vertical', cant: nRef, ancho: refAncho, largo: refLargo },
    { pieza: 'P.5', desc: 'Perfil interior', cant: 1, ancho: p5Ancho, largo: p5Largo },
  ];
  var despiece = base.map(function (d) {
    return { pieza: d.pieza, desc: d.desc, cantUno: d.cant, cant: d.cant * total, ancho: d.ancho, largo: d.largo };
  });
  return {
    W: W, H: H, chapa: chapa, cantIzq: cantIzq, cantDer: cantDer, total: total,
    picaporte: p.picaporte == null ? 1020 : p.picaporte,
    muro: muro, tipoHoja: tipoHoja, marco: marco, pisoTerminado: pisoTerminado, enterrar: enterrar,
    luz: luz, caraExt: caraExt, caraInt: caraInt, caraAltoExt: caraAltoExt,
    rebajeHoja: rebajeHoja, caraIntAncho: caraIntAncho, caraIntAlto: caraIntAlto,
    nRef: nRef, p5Largo: p5Largo, refAncho: refAncho, p5Ancho: p5Ancho,
    segIntAncho: segIntAncho, segIntAlto: segIntAlto,
    hojaExtAncho: hojaExtAncho, hojaExtLargo: hojaExtLargo, despiece: despiece,
  };
}

/* ---- Motor SOLO MARCO (para puerta de madera u otra hoja): marco + despiece ---- */
function calcularMarco(p) {
  var W = p.W, H = p.H, chapa = p.chapa || 18;
  var muro = p.espesorMuro == null ? 150 : p.espesorMuro;
  var tipoHoja = p.tipoHoja || 'madera';
  var marco = perfilMarco(muro, tipoHoja);
  var pisoTerminado = p.pisoTerminado == null ? true : p.pisoTerminado;
  var enterrar = pisoTerminado ? 0 : 30;
  var cantidad = Math.max(1, p.cantidad == null ? 1 : p.cantidad);
  var luz = W - 2 * C.alaMarco;
  var base = [
    { pieza: 'P.1', desc: 'Marco — dintel', cantUno: 1, ancho: marco.desarrollo, largo: luz },
    { pieza: 'P.1', desc: 'Marco — jambas' + (enterrar ? ' (Para enterrar)' : ''), cantUno: 2, ancho: marco.desarrollo, largo: H + enterrar },
  ];
  var despiece = base.map(function (d) {
    return { pieza: d.pieza, desc: d.desc, cantUno: d.cantUno, cant: d.cantUno * cantidad, ancho: d.ancho, largo: d.largo };
  });
  return {
    tipoPlano: 'marco', W: W, H: H, chapa: chapa, cantidad: cantidad, total: cantidad,
    picaporte: p.picaporte == null ? 1020 : p.picaporte,
    cantidadTexto: cantidad + ' marco' + (cantidad === 1 ? '' : 's'),
    muro: muro, tipoHoja: tipoHoja, marco: marco, pisoTerminado: pisoTerminado, enterrar: enterrar,
    luz: luz, despiece: despiece,
  };
}

/* ===========================================================================
   GENERADOR SVG
   =========================================================================== */
var SHEET = { w: 1500, h: 4520 };           // "hoja" en mm (frente + perfiles)
var ESCALA = 10;                            // frente/lateral a 1:ESCALA en el PDF
var ST = { stroke: 7, thin: 3.5, arrow: 26, text: 48, small: 36, extGap: 18, extOver: 18 };

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* Cota horizontal: mide de x1→x2, línea de cota en dimY */
function cotaH(x1, x2, yObj, dimY, label, P) {
  var up = dimY < yObj ? -1 : 1;
  var e1 = yObj + up * ST.extGap, e2 = dimY + up * ST.extOver;
  var a = ST.arrow;
  return (
    line(x1, e1, x1, e2, P.thin, P) + line(x2, e1, x2, e2, P.thin, P) +
    line(x1, dimY, x2, dimY, P.line, P) +
    tri(x1, dimY, a, 1, P) + tri(x2, dimY, a, -1, P) +
    txt((x1 + x2) / 2, dimY - 10, label, ST.text, 'middle', P, 'baseline')
  );
}
/* Cota vertical: mide de y1→y2, línea de cota en dimX */
function cotaV(y1, y2, xObj, dimX, label, P) {
  var left = dimX < xObj ? -1 : 1;
  var e1 = xObj + left * ST.extGap, e2 = dimX + left * ST.extOver;
  var a = ST.arrow;
  return (
    line(e1, y1, e2, y1, P.thin, P) + line(e1, y2, e2, y2, P.thin, P) +
    line(dimX, y1, dimX, y2, P.line, P) +
    triV(dimX, y1, a, 1, P) + triV(dimX, y2, a, -1, P) +
    '<g transform="rotate(-90 ' + (dimX - 12) + ' ' + ((y1 + y2) / 2) + ')">' +
    txt(dimX - 12, (y1 + y2) / 2, label, ST.text, 'middle', P, 'baseline') + '</g>'
  );
}
function line(x1, y1, x2, y2, w, P, dash, color) {
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
    '" stroke="' + (color || P.line) + '" stroke-width="' + w + '"' +
    (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linecap="round"/>';
}
function rect(x, y, w, h, sw, P, fill) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
    '" fill="' + (fill || 'none') + '" stroke="' + P.line + '" stroke-width="' + sw + '"/>';
}
function tri(x, y, a, dir, P) { // horizontal arrowhead pointing in +x*dir
  return '<path d="M' + x + ' ' + y + ' L' + (x + dir * a) + ' ' + (y - a * 0.33) +
    ' L' + (x + dir * a) + ' ' + (y + a * 0.33) + ' Z" fill="' + P.line + '"/>';
}
function triV(x, y, a, dir, P) { // vertical arrowhead pointing in +y*dir
  return '<path d="M' + x + ' ' + y + ' L' + (x - a * 0.33) + ' ' + (y + dir * a) +
    ' L' + (x + a * 0.33) + ' ' + (y + dir * a) + ' Z" fill="' + P.line + '"/>';
}
function txt(x, y, s, size, anchor, P, baseline, weight) {
  return '<text x="' + x + '" y="' + y + '" font-family="\'IBM Plex Mono\',monospace" font-size="' +
    size + '" fill="' + P.text + '" text-anchor="' + (anchor || 'start') + '"' +
    (baseline === 'middle' ? ' dominant-baseline="middle"' : '') +
    (weight ? ' font-weight="' + weight + '"' : '') + '>' + esc(s) + '</text>';
}
function txtSans(x, y, s, size, anchor, P, weight, color) {
  return '<text x="' + x + '" y="' + y + '" font-family="\'IBM Plex Sans\',sans-serif" font-size="' +
    size + '" fill="' + (color || P.text) + '" text-anchor="' + (anchor || 'start') +
    '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + esc(s) + '</text>';
}

/* ---- Vista de FRENTE ---- */
function vistaFrente(r, ox, oy, P, mano) {
  var W = r.W, H = r.H, g = '';
  // marco exterior
  g += rect(ox, oy, W, H, ST.stroke, P);
  // luz del marco (abertura; sin umbral -> llega al piso)
  g += rect(ox + C.alaMarco, oy + C.revealDintel, r.luz, H - C.revealDintel, ST.thin, P);
  // hoja exterior (monta 11 sobre el marco; luz inferior abajo)
  var hx = ox + C.alaMarco - C.solapeHoja;
  var hy = oy + C.revealDintel - C.solapeVertHoja + C.luzSuperior;
  g += '<rect x="' + hx + '" y="' + hy + '" width="' + r.caraExt + '" height="' + r.caraAltoExt +
    '" fill="' + P.hatch + '" stroke="' + P.line + '" stroke-width="' + ST.stroke + '"/>';
  // símbolo de MANO (bisagras / apertura) — triángulo punteado, vértice al lado del picaporte
  var top = hy, bot = hy + r.caraAltoExt, lft = hx, rgt = hx + r.caraExt, mid = (top + bot) / 2;
  if (mano === 'izq') { // bisagras a la izquierda, vértice a la derecha
    g += line(lft, top, rgt, mid, 4.5, P, '34 22', P.accent) + line(lft, bot, rgt, mid, 4.5, P, '34 22', P.accent);
  } else {               // bisagras a la derecha, vértice a la izquierda
    g += line(rgt, top, lft, mid, 4.5, P, '34 22', P.accent) + line(rgt, bot, lft, mid, 4.5, P, '34 22', P.accent);
  }
  // cerradura (lado opuesto a bisagras) a la altura del plano
  var cerrX = mano === 'izq' ? rgt - 40 : lft + 40;
  var cerrY = bot - C.alturaCerradura;
  g += '<circle cx="' + cerrX + '" cy="' + cerrY + '" r="14" fill="none" stroke="' + P.line + '" stroke-width="' + ST.thin + '"/>';
  // cotas
  g += cotaH(ox, ox + W, oy + H, oy + H + 110, String(W), P);
  g += cotaV(oy, oy + H, ox, ox - 110, String(H), P);
  // rótulo
  g += txtSans(ox, oy - 40, 'FRENTE  —  mano ' + (mano === 'izq' ? 'izquierda' : 'derecha'), 42, 'start', P, 600, P.accent);
  return g;
}

/* ---- Vista LATERAL del marco ---- */
function vistaLateralMarco(r, ox, oy, P) {
  var w = r.marco.espesor, h = r.H, g = '';
  g += rect(ox, oy, w, h, ST.stroke, P);
  var bot = oy + h, cy = bot - C.alturaCerradura, cx = ox + C.distCerraduraFilo;
  // agujero de cerradura (a distCerraduraFilo del filo, a alturaCerradura del piso)
  g += '<circle cx="' + cx + '" cy="' + cy + '" r="17" fill="none" stroke="' + P.line + '" stroke-width="' + ST.thin + '"/>';
  g += line(cx - 28, cy, cx + 28, cy, ST.thin, P) + line(cx, cy - 28, cx, cy + 28, ST.thin, P);
  // cotas: distancia al filo (arriba) y altura de cerradura (desde el piso)
  g += cotaH(ox, cx, oy, oy - 110, String(C.distCerraduraFilo), P);
  g += cotaV(cy, bot, ox + w, ox + w + 100, String(C.alturaCerradura), P);
  g += txtSans(ox - 70, oy - 200, 'LATERAL', 40, 'start', P, 600, P.accent);
  return g;
}

/* ---- CAJETÍN (replica el del plano) ---- */
function cajetin(r, ox, oy, w, h, P, logo) {
  var g = '', col1 = w * 0.46, col2 = w * 0.30, rh = h / 3;
  g += rect(ox, oy, w, h, ST.stroke, P);
  // divisorias
  g += line(ox + col1, oy, ox + col1, oy + h, P.line, P);
  g += line(ox + col1 + col2, oy, ox + col1 + col2, oy + h, P.line, P);
  g += line(ox, oy + rh, ox + col1 + col2, oy + rh, P.line, P);
  g += line(ox, oy + 2 * rh, ox + col1 + col2, oy + 2 * rh, P.line, P);
  function cell(cx, ry, label, value) {
    var s = txtSans(cx + 18, ry + 40, label, 30, 'start', P, 600, P.accent);
    s += txtSans(cx + 18, ry + 82, value, 44, 'start', P, 500);
    return s;
  }
  var rt = r.rotulo || {};
  g += cell(ox, oy + 0 * rh, 'Plano', rt.plano || '—');
  g += cell(ox, oy + 1 * rh, 'Obra', rt.obra || '—');
  g += cell(ox, oy + 2 * rh, 'OT', rt.ot || '—');
  g += cell(ox + col1, oy + 0 * rh, 'Fecha', rt.fecha || '—');
  g += cell(ox + col1, oy + 1 * rh, 'Cantidad', r.total + '  (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)');
  g += cell(ox + col1, oy + 2 * rh, 'Tipo', 'Doble faz · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica'));
  // bloque logo
  var lx = ox + col1 + col2, lw = w - col1 - col2;
  if (logo) {
    var iw = lw - 60, ih = iw * 344 / 1229, iy = oy + (h - ih) / 2;
    g += '<image x="' + (lx + 30) + '" y="' + iy + '" width="' + iw + '" height="' + ih + '" href="' + logo + '"/>';
  } else {
    g += txtSans(lx + lw / 2, oy + h / 2, 'ROQUE MOCCIOLA', 48, 'middle', P, 700, P.accent);
  }
  g += txtSans(lx + lw / 2, oy + h - 22, 'Resp.: Ing. Basgall Bruno', 28, 'middle', P, 500);
  return g;
}

/* ---- Barra de escala (0–500 mm) ---- */
function barraEscala(ox, oy, P) {
  var L = 500, n = 5, step = L / n, g = '', h = 26;
  for (var i = 0; i < n; i++) {
    g += '<rect x="' + (ox + i * step) + '" y="' + oy + '" width="' + step + '" height="' + h +
      '" fill="' + (i % 2 ? P.paper : P.line) + '" stroke="' + P.line + '" stroke-width="2"/>';
  }
  g += txt(ox, oy - 14, '0', 30, 'middle', P) + txt(ox + L, oy - 14, '500 mm', 30, 'middle', P);
  g += txtSans(ox, oy + h + 42, 'Frente y lateral a ESCALA 1:' + ESCALA + ' · imprimir al 100% (no ajustar)', 28, 'start', P, 600, P.accent);
  g += txtSans(ox + 640, oy + 6, 'Perfiles: fuera de escala', 26, 'start', P, 500, P.muted || P.text);
  return g;
}

/* ===========================================================================
   PERFILES PLEGADOS  —  sección + columna de desarrollo
   Regla del plano: cada pliegue de 90° descuenta 1 mm, cargado a la cara interior.
   =========================================================================== */

/* desarrollo por tramo (regla de carga hacia la cara) */
function desarrolloColumna(lens, faceIdx) {
  var red = lens.map(function () { return 0; });
  for (var k = 0; k < lens.length - 1; k++) { if (k < faceIdx) red[k + 1]++; else red[k]++; }
  return lens.map(function (l, i) { return l - red[i]; });
}

/* turtle: longitudes (ya escaladas) + giros -> puntos */
function turtlePts(lensK, turns, h0) {
  var x = 0, y = 0, hx = h0 ? h0[0] : 1, hy = h0 ? h0[1] : 0, pts = [{ x: x, y: y }];
  for (var i = 0; i < lensK.length; i++) {
    x += hx * lensK[i]; y += hy * lensK[i]; pts.push({ x: x, y: y });
    if (i < turns.length) { var t = turns[i]; if (t === 'R') { var a = hx; hx = -hy; hy = a; } else { var b = hx; hx = hy; hy = -b; } }
  }
  return pts;
}

/* resuelve las longitudes (número directo, {l:n}, o {l:'clave'} que lee r) */
function resolverLens(segs, r) {
  return segs.map(function (s) {
    if (typeof s === 'number') return s;
    return typeof s.l === 'number' ? s.l : r[s.l];
  });
}

function dibujarPerfil(spec, r, ox, oy, cellW, cellH, P) {
  var lens = resolverLens(spec.segs, r);
  var dev = spec.devFija ? spec.devFija : desarrolloColumna(lens, spec.faceIdx);
  var total = spec.totalFijo != null ? spec.totalFijo : dev.reduce(function (a, b) { return a + b; }, 0);
  var g = '';
  // encabezado
  g += '<circle cx="' + (ox + 26) + '" cy="' + (oy + 30) + '" r="22" fill="none" stroke="' + P.accent + '" stroke-width="3"/>';
  g += txtSans(ox + 26, oy + 30, spec.n, 30, 'middle', P, 700, P.accent);
  g += txtSans(ox + 60, oy + 40, spec.desc, 30, 'start', P, 600);
  // sección: turtle en mm, cara horizontal, autoescala a la sub-caja
  var raw = turtlePts(lens.slice(), spec.turns, spec.h0);
  var ang = 0;
  if (!spec.noRotate) {
    var fv = { x: raw[spec.faceIdx + 1].x - raw[spec.faceIdx].x, y: raw[spec.faceIdx + 1].y - raw[spec.faceIdx].y };
    ang = Math.atan2(fv.y, fv.x);
  }
  var ca = Math.cos(-ang), sa = Math.sin(-ang);
  var pts = raw.map(function (p) { return { x: p.x * ca - p.y * sa, y: p.x * sa + p.y * ca }; });
  var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
  var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
  var bw = Math.max.apply(null, xs) - minX || 1, bh = Math.max.apply(null, ys) - minY || 1;
  var availW = cellW * (spec.drawFrac || 0.52), availH = cellH - 130;
  var k = Math.min(availW / bw, availH / bh);
  var drawW = bw * k, drawH = bh * k;
  var bx = ox + 60 + (availW - drawW) / 2 - minX * k, by = oy + 80 + (availH - drawH) / 2 - minY * k;
  var S = pts.map(function (p) { return { x: p.x * k + bx, y: p.y * k + by }; });
  var d = S.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
  g += '<path d="' + d + '" fill="none" stroke="' + P.line + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>';
  for (var i = 0; i < lens.length; i++) {
    var a = S[i], b = S[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, off = 24;
    g += txt(mx - dy / L * off, my + dx / L * off + 10, String(lens[i]), 28, 'middle', P);
  }
  // columna de desarrollo
  var colX = ox + cellW - 40, colY = oy + 78, sp = 34;
  g += txtSans(colX - 86, colY - 26, 'desarrollo', 24, 'start', P, 500, P.accent);
  for (var j = 0; j < dev.length; j++) g += txt(colX, colY + j * sp, String(dev[j]), 30, 'end', P);
  var ty = colY + dev.length * sp;
  g += line(colX - 92, ty - 20, colX + 4, ty - 20, P.line, P);
  g += txt(colX, ty + 12, String(total), 34, 'end', P, 'baseline', '600');
  if (spec.flag) {
    var fx = spec.flagMid ? ox + cellW * 0.40 : ox + 60;
    var fy = spec.flagMid ? oy + cellH * 0.5 : oy + cellH - 14;
    g += txtSans(fx, fy, spec.flag, 23, 'start', P, 500, '#c2710c');
  }
  return g;
}

/* ② Hoja exterior = PANEL: cruz con las dos secciones (ancho 1-2-3, alto 4-5) */
function dibujarHojaExtCruz(spec, r, ox, oy, cellW, cellH, P) {
  var g = '';
  g += '<circle cx="' + (ox + 26) + '" cy="' + (oy + 30) + '" r="22" fill="none" stroke="' + P.accent + '" stroke-width="3"/>';
  g += txtSans(ox + 26, oy + 30, '②', 30, 'middle', P, 700, P.accent);
  g += txtSans(ox + 60, oy + 40, 'Hoja exterior (panel)', 30, 'start', P, 600);
  // cruz esquemática
  var cx = ox + cellW * 0.33, cyTop = oy + 90, cyBot = oy + cellH - 70;
  var cyCruce = cyTop + (cyBot - cyTop) * 0.30;          // horizontal cruza en el tercio superior
  var hw = cellW * 0.22, hk = 16;                        // medio ancho visual, tamaño de hook
  // vertical (cara 5), abierta abajo, hook arriba (pestaña 4)
  g += line(cx, cyTop, cx, cyBot, ST.stroke, P);
  g += line(cx, cyTop, cx + hk, cyTop + hk, ST.thin, P); // pestaña 4 (hook)
  // horizontal (cara 2), hooks arriba en ambos extremos (pestañas 1 y 3)
  g += line(cx - hw, cyCruce, cx + hw, cyCruce, ST.stroke, P);
  g += line(cx - hw, cyCruce, cx - hw + hk, cyCruce - hk, ST.thin, P); // pestaña 1
  g += line(cx + hw, cyCruce, cx + hw - hk, cyCruce - hk, ST.thin, P); // pestaña 3
  // números de tramo + cotas
  g += txt(cx - hw - 20, cyCruce - 14, '1', 26, 'middle', P, 'baseline', '600');
  g += txt(cx + hw + 20, cyCruce - 14, '3', 26, 'middle', P, 'baseline', '600');
  g += txt(cx + 26, cyTop + 4, '4', 26, 'start', P, 'baseline', '600');
  g += txt(cx - hw * 0.5, cyCruce - 22, '2 = ' + r.caraExt, 28, 'middle', P);
  g += txt(cx + 18, (cyCruce + cyBot) / 2, '5 = ' + r.caraAltoExt, 28, 'start', P);
  g += txtSans(cx - hw, cyBot + 36, 'pestañas 1·3·4 = 15 (cierran) · fondo abierto', 23, 'start', P, 500, P.muted || P.text);
  // desarrollos (ancho × alto de la chapa plana)
  var ax = ox + cellW - 40, ay = oy + 110;
  g += txtSans(ax - 200, ay - 30, 'chapa plana', 24, 'start', P, 500, P.accent);
  g += txt(ax, ay, 'ancho', 28, 'end', P); g += txt(ax, ay + 36, '' + r.despiece[2].ancho, 40, 'end', P, 'baseline', '600');
  g += txt(ax, ay + 100, 'alto', 28, 'end', P); g += txt(ax, ay + 136, '' + r.despiece[2].largo, 40, 'end', P, 'baseline', '600');
  return g;
}

/* ③ Hoja interior = PANEL con rebaje: cruz con rebaje+pestaña en cada borde */
function dibujarHojaIntCruz(spec, r, ox, oy, cellW, cellH, P) {
  var g = '';
  g += '<circle cx="' + (ox + 26) + '" cy="' + (oy + 30) + '" r="22" fill="none" stroke="' + P.accent + '" stroke-width="3"/>';
  g += txtSans(ox + 26, oy + 30, '③', 30, 'middle', P, 700, P.accent);
  g += txtSans(ox + 60, oy + 40, 'Hoja interior (panel)', 30, 'start', P, 600);
  var cx = ox + cellW * 0.33, cyTop = oy + 90, cyBot = oy + cellH - 70;
  var cyCruce = cyTop + (cyBot - cyTop) * 0.30;
  var hw = cellW * 0.22, st = 18;   // st = tamaño del escalón rebaje+pestaña
  // vertical (cara 6), abierta abajo; arriba rebaje7 (al costado) + pestaña8 (sube 10)
  g += line(cx, cyTop + st, cx, cyBot, ST.stroke, P);
  g += line(cx, cyTop + st, cx + st, cyTop + st, ST.thin, P);  // rebaje 7 (horizontal)
  g += line(cx + st, cyTop + st, cx + st, cyTop, ST.thin, P);  // pestaña 8 (sube 10)
  // horizontal (cara 3); extremos con rebaje (vertical) + pestaña (horizontal)
  g += line(cx - hw, cyCruce, cx + hw, cyCruce, ST.stroke, P);
  g += line(cx - hw, cyCruce, cx - hw, cyCruce - st, ST.thin, P); // rebaje 2
  g += line(cx - hw, cyCruce - st, cx - hw - st, cyCruce - st, ST.thin, P); // pestaña 1
  g += line(cx + hw, cyCruce, cx + hw, cyCruce - st, ST.thin, P); // rebaje 4
  g += line(cx + hw, cyCruce - st, cx + hw + st, cyCruce - st, ST.thin, P); // pestaña 5
  // cotas
  g += txt(cx - hw * 0.5, cyCruce + 34, '3 = ' + r.caraIntAncho, 28, 'middle', P);
  g += txt(cx + 18, (cyCruce + cyBot) / 2, '6 = ' + r.caraIntAlto, 28, 'start', P);
  g += txtSans(cx - hw - st, cyBot + 34, 'rebajes 2·4·7 = ' + (r.rebajeHoja + 1) + ' · pestañas 1·5·8 = 10', 22, 'start', P, 500, P.muted || P.text);
  // desarrollos
  var ax = ox + cellW - 40, ay = oy + 110;
  g += txtSans(ax - 200, ay - 30, 'chapa plana', 24, 'start', P, 500, P.accent);
  g += txt(ax, ay, 'ancho', 28, 'end', P); g += txt(ax, ay + 36, '' + r.despiece[3].ancho, 40, 'end', P, 'baseline', '600');
  g += txt(ax, ay + 100, 'alto', 28, 'end', P); g += txt(ax, ay + 136, '' + r.despiece[3].largo, 40, 'end', P, 'baseline', '600');
  return g;
}

/* specs de los perfiles (② ③ paneles; ④ ⑤ perfiles U simples) */
function specsPerfiles(r) {
  var reb = r.rebajeHoja;
  return [
    { n: '②', desc: 'Hoja exterior', render: dibujarHojaExtCruz },
    { n: '③', desc: 'Hoja interior', render: dibujarHojaIntCruz },
    { n: '④', desc: 'Refuerzo', segs: [reb, 25, reb], turns: ['L', 'L'], faceIdx: 1,
      flag: 'paredes ' + reb + ' · base 25 · ' + r.nRef + ' por hoja (cada ≤160)' },
    { n: '⑤', desc: 'Perfil interior', segs: [20, reb, 20], turns: ['L', 'L'], faceIdx: 1,
      flag: 'largo ' + r.p5Largo + ' (ancho int − 4)' },
  ];
}

function vistaPerfiles(r, ox, oy, P) {
  var g = txtSans(ox, oy, 'PERFILES Y DESARROLLOS  (fuera de escala · cotas en mm)', 42, 'start', P, 600, P.accent);
  var marcoSpec = {
    n: '①', desc: 'Marco (mampostería)', segs: r.marco.segs, turns: r.marco.turns, h0: r.marco.h0,
    faceIdx: r.marco.faceIdx, noRotate: true, drawFrac: 0.30, flagMid: true,
    devFija: r.marco.dev, totalFijo: r.marco.desarrollo,
    flag: 'muro ' + r.muro + ' + 3 = espesor ' + r.marco.espesor + '  ·  hoja ' + (r.tipoHoja === 'madera' ? 'madera (t3=31)' : 'metálica (t3=35)') + '  ·  t7 = ' + r.marco.t7,
  };
  var gap = 40, cols = 2, cellW = 640, cellH = 320, gy = oy + 50, fullW = cellW * 2 + gap;
  // ① marco: fila propia a lo ancho y alta
  var h1 = 460;
  g += '<rect x="' + ox + '" y="' + gy + '" width="' + fullW + '" height="' + h1 + '" fill="none" stroke="' + P.line + '" stroke-width="1.6" rx="10"/>';
  g += dibujarPerfil(marcoSpec, r, ox, gy, fullW, h1, P);
  // ② ③ ④ ⑤ en grilla 2×2 debajo
  var specs = specsPerfiles(r), gy2 = gy + h1 + 24;
  for (var i = 0; i < specs.length; i++) {
    var cx = ox + (i % cols) * (cellW + gap), cy = gy2 + Math.floor(i / cols) * (cellH + 20);
    g += '<rect x="' + cx + '" y="' + cy + '" width="' + cellW + '" height="' + cellH + '" fill="none" stroke="' + P.line + '" stroke-width="1.6" rx="10"/>';
    g += (specs[i].render ? specs[i].render : dibujarPerfil)(specs[i], r, cx, cy, cellW, cellH, P);
  }
  return g;
}

/* ---- Nota de armado (replica la del plano) ---- */
function notaArmado(r, mano, ox, oy, P) {
  var md = mano === 'der' ? 'derecha' : 'izquierda';
  var piso = r.enterrar ? 'piso sin terminar (jambas +30)' : 'piso terminado (jambas exactas)';
  var t = 'Armar completa · mano ' + md + ' (otras en espejo) · ' + piso;
  return txtSans(ox, oy, t, 32, 'start', P, 500);
}

/* ---- Composición completa ---- */
function generarSVG(params, P, logo) {
  var r = calcularDespiece(params);
  r.rotulo = params.rotulo;
  var mano = params.drawMano || 'izq';
  var body = '';
  body += cajetin(r, 60, 70, SHEET.w - 120, 300, P, logo);
  body += notaArmado(r, mano, 80, 430, P);
  body += vistaFrente(r, 250, 760, P, mano);
  body += vistaLateralMarco(r, 1180, 760, P);
  body += barraEscala(250, 3000, P);
  body += line(60, 3120, SHEET.w - 60, 3120, P.line, P, '6 10');
  body += vistaPerfiles(r, 90, 3190, P);
  // marco de hoja
  var border = '<rect x="40" y="40" width="' + (SHEET.w - 80) + '" height="' + (SHEET.h - 80) +
    '" fill="none" stroke="' + P.line + '" stroke-width="' + ST.thin + '"/>';
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + SHEET.w + ' ' + SHEET.h +
    '" preserveAspectRatio="xMidYMid meet" font-family="\'IBM Plex Mono\',monospace">' +
    '<rect x="0" y="0" width="' + SHEET.w + '" height="' + SHEET.h + '" fill="' + P.paper + '"/>' +
    border + body + '</svg>';
  return { svg: svg, r: r };
}

if (typeof module !== 'undefined') module.exports = { calcularDespiece: calcularDespiece, generarSVG: generarSVG, C: C, SHEET: SHEET, ESCALA: ESCALA };
