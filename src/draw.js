/* ===========================================================================
   CAPA DE DIBUJO — páginas A4 (viewBox en 0,1 mm: 2100×2970 = 210×297 mm)
   Depende de calcularDespiece/turtlePts del núcleo (mismo bundle).
   =========================================================================== */
var PG = { w: 2100, h: 2970, m: 70 };
var F = { h1: 40, h2: 30, lbl: 24, dim: 26, num: 22, sm: 22, ty: 19 };
var SW = { thick: 6, thin: 2.6, dim: 2.2, arrow: 22 };

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function line(x1, y1, x2, y2, w, P, dash, color) {
  return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
    '" stroke="' + (color || P.line) + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linecap="round"/>';
}
function rect(x, y, w, h, sw, P, fill) {
  return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) +
    '" fill="' + (fill || 'none') + '" stroke="' + P.line + '" stroke-width="' + sw + '"/>';
}
function triH(x, y, a, dir, P) {
  return '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x + dir * a).toFixed(1) + ' ' + (y - a * 0.32).toFixed(1) +
    ' L' + (x + dir * a).toFixed(1) + ' ' + (y + a * 0.32).toFixed(1) + ' Z" fill="' + P.line + '"/>';
}
function triV(x, y, a, dir, P) {
  return '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x - a * 0.32).toFixed(1) + ' ' + (y + dir * a).toFixed(1) +
    ' L' + (x + a * 0.32).toFixed(1) + ' ' + (y + dir * a).toFixed(1) + ' Z" fill="' + P.line + '"/>';
}
function txt(x, y, s, size, anchor, P, mid, weight, color) {
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-family="\'IBM Plex Mono\',monospace" font-size="' + size +
    '" fill="' + (color || P.text) + '" text-anchor="' + (anchor || 'start') + '"' + (mid ? ' dominant-baseline="middle"' : '') +
    (weight ? ' font-weight="' + weight + '"' : '') + '>' + esc(s) + '</text>';
}
function tsans(x, y, s, size, anchor, P, weight, color) {
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-family="\'IBM Plex Sans\',sans-serif" font-size="' + size +
    '" fill="' + (color || P.text) + '" text-anchor="' + (anchor || 'start') + '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + esc(s) + '</text>';
}
/* Título con número en círculo DIBUJADO (no glifo ①, que no renderiza en PDF).
   (x,y) = baseline/arranque del texto original. */
var CIRCLED = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5 };
function tituloNum(x, y, titulo, P) {
  var n = CIRCLED[titulo.charAt(0)];
  if (!n) return tsans(x, y, titulo, F.h2, 'start', P, 700, P.accent);
  var resto = titulo.slice(1).replace(/^\s+/, '');
  var cxB = x + 15, cyB = y - 9;
  return '<circle cx="' + cxB.toFixed(1) + '" cy="' + cyB.toFixed(1) + '" r="16" fill="none" stroke="' + P.accent + '" stroke-width="2.4"/>' +
    tsans(cxB, cyB + 8, String(n), 23, 'middle', P, 700, P.accent) +
    tsans(x + 40, y, resto, F.h2, 'start', P, 700, P.accent);
}

/* --- Cotas: línea de cota con flechas hacia adentro que la cierran, + testigos --- */
function dimH(x1, x2, yDim, label, P, yObj) {
  var g = '';
  if (yObj != null) { g += line(x1, yObj, x1, yDim, SW.dim, P, '0', P.dim || P.line); g += line(x2, yObj, x2, yDim, SW.dim, P, '0', P.dim || P.line); }
  g += line(x1, yDim, x2, yDim, SW.dim, P, 0, P.dim || P.line);
  g += triH(x1, yDim, SW.arrow, 1, P) + triH(x2, yDim, SW.arrow, -1, P);
  g += txt((x1 + x2) / 2, yDim - 14, label, F.dim, 'middle', P, false, '600');
  return g;
}
function dimV(y1, y2, xDim, label, P, xObj) {
  var g = '';
  if (xObj != null) { g += line(xObj, y1, xDim, y1, SW.dim, P, 0, P.dim || P.line); g += line(xObj, y2, xDim, y2, SW.dim, P, 0, P.dim || P.line); }
  g += line(xDim, y1, xDim, y2, SW.dim, P, 0, P.dim || P.line);
  g += triV(xDim, y1, SW.arrow, 1, P) + triV(xDim, y2, SW.arrow, -1, P);
  var my = (y1 + y2) / 2;
  g += '<g transform="rotate(-90 ' + (xDim - 16).toFixed(1) + ' ' + my.toFixed(1) + ')">' + txt(xDim - 16, my, label, F.dim, 'middle', P, false, '600') + '</g>';
  return g;
}

/* --- Tabla simple --- */
function tabla(ox, oy, colW, filas, P, headers, opt) {
  opt = opt || {};
  var g = '', rh = opt.rh || 56, fs = opt.fs || 21, w = colW.reduce(function (a, b) { return a + b; }, 0), y = oy, i, x;
  if (headers) {
    g += rect(ox, y, w, rh, SW.thin, P, P.head || 'none');
    x = ox; for (i = 0; i < headers.length; i++) { g += tsans(x + 14, y + rh - 20, headers[i], fs, 'start', P, 700, P.accent); x += colW[i]; }
    y += rh;
  }
  for (var r = 0; r < filas.length; r++) {
    var bold = filas[r].bold;
    g += rect(ox, y, w, rh, SW.thin, P);
    x = ox;
    for (i = 0; i < filas[r].c.length; i++) {
      g += txt(x + 14, y + rh - 20, filas[r].c[i], fs, 'start', P, false, bold ? '700' : '400');
      x += colW[i];
    }
    y += rh;
  }
  // divisorias verticales
  x = ox; for (i = 0; i < colW.length - 1; i++) { x += colW[i]; g += line(x, oy, x, y, SW.thin, P); }
  return { svg: g, h: y - oy };
}

/* --- Sección plegada (forma, fuera de escala). Cada medida sale con línea guía
       perpendicular al tramo, hacia afuera, para no pisar ninguna línea. --- */
function seccion(segs, turns, h0, cx, cy, box, P) {
  // Fuera de escala: achica los tramos chicos (el escalón) y deja que los largos manden,
  // así el codo queda compacto y las cotas no se amontonan.
  var vis = segs.map(function (s) { return 22 + Math.min(s, 230) * 0.92; });
  var pts = turtlePts(vis, turns, h0);
  var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
  var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
  var bw = Math.max.apply(null, xs) - minX || 1, bh = Math.max.apply(null, ys) - minY || 1;
  // margen para los números (afuera del perfil) — pero el perfil se dibuja grande
  var MARG = 78;
  var k = Math.min((box.w - 2 * MARG) / bw, (box.h - 2 * MARG) / bh);
  var bx = cx - (bw * k) / 2 - minX * k, by = cy - (bh * k) / 2 - minY * k;
  var S = pts.map(function (p) { return { x: p.x * k + bx, y: p.y * k + by }; });
  var g = '<path d="' + S.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ') +
    '" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thick + '" stroke-linejoin="round" stroke-linecap="round"/>';
  // bounding box del perfil escalado
  var pMinX = 1e9, pMaxX = -1e9, pMinY = 1e9, pMaxY = -1e9;
  S.forEach(function (p) { pMinX = Math.min(pMinX, p.x); pMaxX = Math.max(pMaxX, p.x); pMinY = Math.min(pMinY, p.y); pMaxY = Math.max(pMaxY, p.y); });
  var gx = 0, gy = 0; S.forEach(function (p) { gx += p.x; gy += p.y; }); gx /= S.length; gy /= S.length;
  // apertura: distancia del midpoint al primer cruce con OTRO tramo, en la dirección (dirx,diry)
  function apertura(mx, my, dirx, diry, self) {
    var best = 1e9;
    for (var j = 0; j < S.length - 1; j++) {
      if (j === self) continue;
      var x1 = S[j].x, y1 = S[j].y, ex = S[j + 1].x - x1, ey = S[j + 1].y - y1;
      var den = dirx * ey - diry * ex;
      if (Math.abs(den) < 1e-6) continue;
      var t = ((x1 - mx) * ey - (y1 - my) * ex) / den;
      var s = ((x1 - mx) * diry - (y1 - my) * dirx) / den;
      if (t > 0.5 && s >= -0.02 && s <= 1.02) best = Math.min(best, t);
    }
    return best;
  }
  // Colocación: cota CENTRADA en su tramo (lado con más espacio libre). Solo si chocaría con
  // otra cota se la corre hacia el extremo libre del tramo; si aún así toca, se la empuja afuera.
  var placed = [];
  function choca(tx, ty) {
    for (var j = 0; j < placed.length; j++) { if (Math.hypot(tx - placed[j].x, ty - placed[j].y) < 42) return true; }
    return false;
  }
  for (var i = 0; i < segs.length; i++) {
    var a = S[i], b = S[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dxs = b.x - a.x, dys = b.y - a.y, dl = Math.hypot(dxs, dys) || 1;
    var ux = dxs / dl, uy = dys / dl;                        // tangente (a lo largo del tramo)
    var nx = -dys / dl, ny = dxs / dl;                       // normal
    var o1 = apertura(mx, my, nx, ny, i), o2 = apertura(mx, my, -nx, -ny, i);
    var usarPos;
    if (Math.abs(o1 - o2) < 25) usarPos = (nx * (mx - gx) + ny * (my - gy) >= 0);  // empate -> centroide
    else usarPos = o1 > o2;                                  // lado más abierto
    if (!usarPos) { nx = -nx; ny = -ny; }
    var da = Math.hypot(a.x - gx, a.y - gy), db = Math.hypot(b.x - gx, b.y - gy);
    var sgn = db > da ? 1 : -1;                              // hacia el extremo más lejano del centroide
    var off = 32, slide = 0, tx = mx + nx * off, ty = my + ny * off;   // 1) intento CENTRADO
    if (choca(tx, ty)) { slide = sgn * dl * 0.35; tx = mx + nx * off + ux * slide; ty = my + ny * off + uy * slide; }  // 2) corre al extremo libre
    var safe = 0;
    while (choca(tx, ty) && safe < 4) { off += 20; tx = mx + nx * off + ux * slide; ty = my + ny * off + uy * slide; safe++; }  // 3) empuja afuera
    placed.push({ x: tx, y: ty });
    g += txt(tx, ty + 8, String(segs[i]), F.num, 'middle', P, false, '600');
  }
  return g;
}

/* --- Bloque perfil: título + caption + sección con longitudes (sin tabla) --- */
function bloquePerfil(ox, oy, w, h, titulo, caption, segs, turns, h0, P) {
  var g = rect(ox, oy, w, h, SW.thin, P, P.card || 'none');
  g += tituloNum(ox + 24, oy + 42, titulo, P);
  if (caption) g += tsans(ox + 24, oy + 76, caption, F.ty, 'start', P, 500, P.muted || P.text);
  g += seccion(segs, turns, h0, ox + w / 2, oy + 115 + (h - 115) / 2, { w: w - 130, h: h - 150 }, P);
  return g;
}

/* --- Gancho a 180° (hem) con punta redondeada: cara termina en P, d=hacia la cara, n=lado --- */
function hook180(px, py, dx, dy, nx, ny, hl, gap, P, label) {
  var c1x = px + nx * gap, c1y = py + ny * gap;          // inicio del retorno (offset)
  var ex = c1x + dx * hl, ey = c1y + dy * hl;            // fin del retorno
  var k = gap * 1.35;
  var g = '<path d="M' + px.toFixed(1) + ' ' + py.toFixed(1) +
    ' C' + (px - dx * k).toFixed(1) + ' ' + (py - dy * k).toFixed(1) + ' ' + (c1x - dx * k).toFixed(1) + ' ' + (c1y - dy * k).toFixed(1) + ' ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) +
    ' L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thick + '" stroke-linecap="round"/>';
  if (label) g += txt(px - dx * 20 + nx * 18, py - dy * 20 + ny * 18 + (ny > 0 ? 30 : ny < 0 ? -12 : 8), label, F.num, 'middle', P, false, '600');
  return g;
}

/* --- ② Hoja exterior: cruz; pestañas 1,3,4 = ganchos a 180° (15 mm, punta redondeada) --- */
function cruzExt(r, ox, oy, w, h, P) {
  var g = rect(ox, oy, w, h, SW.thin, P, P.card || 'none');
  g += tituloNum(ox + 24, oy + 42, '② Tapa (panel)', P);
  g += tsans(ox + 24, oy + 76, 'plana ' + r.despiece[2].ancho + ' × ' + r.despiece[2].largo + ' mm', F.ty, 'start', P, 500, P.muted || P.text);
  // intersección = centro del recuadro de dibujo
  var cx = ox + w * 0.50, cyBar = oy + 100 + (h - 100) / 2;
  var hw = w * 0.34, vUp = (h - 100) * 0.40, vDn = (h - 100) * 0.40, hl = 92, gap = 24;
  g += line(cx - hw, cyBar, cx + hw, cyBar, SW.thick, P);            // cara 2 (horizontal, centrada en cx)
  g += line(cx, cyBar - vUp, cx, cyBar + vDn, SW.thick, P);          // cara 5 (vertical)
  g += hook180(cx - hw, cyBar, 1, 0, 0, 1, hl, gap, P, null);        // gancho 1 (izq)
  g += hook180(cx + hw, cyBar, -1, 0, 0, 1, hl, gap, P, null);       // gancho 3 (der)
  g += hook180(cx, cyBar - vUp, 0, 1, 1, 0, hl, gap, P, null);       // gancho 4 (arriba)
  // "15" junto al tramo plegado (el retorno del gancho), no antes del gancho
  g += txt(cx - hw + hl / 2, cyBar + gap + 42, '15', F.sm, 'middle', P, false, '600');           // gancho 1: retorno horizontal
  g += txt(cx + hw - hl / 2, cyBar + gap + 42, '15', F.sm, 'middle', P, false, '600');           // gancho 3: retorno horizontal
  g += txt(cx + gap + 30, cyBar - vUp + hl / 2 + 8, '15', F.sm, 'start', P, false, '600');       // gancho 4: retorno vertical
  g += txt(cx - hw * 0.5, cyBar - 54, String(r.caraExt), F.num, 'middle', P, false, '600');      // cara 2
  g += txt(cx - 60, cyBar + vDn * 0.5, String(r.caraAltoExt), F.num, 'end', P, false, '600');    // cara 5
  return g;
}

/* --- ③ Hoja interior: cruz con rebajes (90°), longitudes fuera de las líneas --- */
function cruzInt(r, ox, oy, w, h, P) {
  var g = rect(ox, oy, w, h, SW.thin, P, P.card || 'none');
  g += tituloNum(ox + 24, oy + 42, '③ Bandeja (panel)', P);
  g += tsans(ox + 24, oy + 76, 'plana ' + r.despiece[3].ancho + ' × ' + r.despiece[3].largo + ' mm', F.ty, 'start', P, 500, P.muted || P.text);
  // intersección = centro del recuadro
  var cx = ox + w * 0.50, cyBar = oy + 100 + (h - 100) / 2;
  var st = 62, pe = 62, hw = w * 0.32, vUp = (h - 100) * 0.40, vDn = (h - 100) * 0.40;
  // horizontal: cara3 (centrada) con rebaje+pestaña a 90° en ambos extremos (suben)
  g += line(cx - hw, cyBar, cx + hw, cyBar, SW.thick, P);
  g += line(cx - hw, cyBar, cx - hw, cyBar - st, SW.thick, P);
  g += line(cx - hw, cyBar - st, cx - hw - pe, cyBar - st, SW.thick, P);
  g += line(cx + hw, cyBar, cx + hw, cyBar - st, SW.thick, P);
  g += line(cx + hw, cyBar - st, cx + hw + pe, cyBar - st, SW.thick, P);
  // vertical: cara6 de arriba (rebaje7+pestaña8) a abajo (abierta), cruza en el centro
  g += line(cx, cyBar - vUp, cx, cyBar + vDn, SW.thick, P);
  g += line(cx, cyBar - vUp, cx + st, cyBar - vUp, SW.thick, P);            // rebaje 7
  g += line(cx + st, cyBar - vUp, cx + st, cyBar - vUp - pe, SW.thick, P);  // pestaña 8 (sube)
  var reb = String(r.rebajeHoja + 1), F2 = F.sm;
  g += txt(cx - hw - pe / 2, cyBar - st - 16, '10', F2, 'middle', P, false, '600');       // pestaña 1
  g += txt(cx - hw - 18, cyBar - st / 2 + 8, reb, F2, 'end', P, false, '600');            // rebaje 2
  g += txt(cx - hw * 0.5, cyBar + 44, String(r.caraIntAncho), F.num, 'middle', P, false, '600'); // cara 3
  g += txt(cx + hw + 18, cyBar - st / 2 + 8, reb, F2, 'start', P, false, '600');          // rebaje 4
  g += txt(cx + hw + pe / 2, cyBar - st - 16, '10', F2, 'middle', P, false, '600');       // pestaña 5
  g += txt(cx - 60, cyBar + vDn * 0.5, String(r.caraIntAlto), F.num, 'end', P, false, '600'); // cara 6
  g += txt(cx + st * 0.5, cyBar - vUp - 16, reb, F2, 'middle', P, false, '600');          // rebaje 7
  g += txt(cx + st + 16, cyBar - vUp - pe / 2, '10', F2, 'start', P, false, '600');       // pestaña 8
  return g;
}

/* --- Frente (factor k = unidades por mm), vano acotado --- */
function frente(r, ox, oy, P, mano, k) {
  var W = r.W * k, H = r.H * k, g = '';
  g += tsans(ox, oy - 18, 'FRENTE — mano ' + (mano === 'izq' ? 'izq' : 'der'), F.h2, 'start', P, 700, P.accent);
  var x0 = ox, y0 = oy;
  g += rect(x0, y0, W, H, SW.thick, P);
  g += rect(x0 + 30 * k, y0 + 30 * k, W - 60 * k, H - 30 * k, SW.thin, P);
  var hx = x0 + (30 - 11) * k, hy = y0 + (30 - 15 + 4) * k, hw = (r.W - 60 + 22) * k, hh = (r.H - 30 - 4 - 7 + 15) * k;
  g += '<rect x="' + hx.toFixed(1) + '" y="' + hy.toFixed(1) + '" width="' + hw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + P.hatch + '" stroke="' + P.line + '" stroke-width="' + SW.thick + '"/>';
  var top = hy, bot = hy + hh, lft = hx, rgt = hx + hw, mid = (top + bot) / 2;
  if (mano === 'izq') { g += line(lft, top, rgt, mid, SW.dim, P, '18 12', P.accent) + line(lft, bot, rgt, mid, SW.dim, P, '18 12', P.accent); }
  else { g += line(rgt, top, lft, mid, SW.dim, P, '18 12', P.accent) + line(rgt, bot, lft, mid, SW.dim, P, '18 12', P.accent); }
  var floorY = y0 + H, cerrY = floorY - r.picaporte * k;
  var cerrX = mano === 'izq' ? rgt - 20 : lft + 20;
  g += '<circle cx="' + cerrX.toFixed(1) + '" cy="' + cerrY.toFixed(1) + '" r="9" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cerrX - 16, cerrY, cerrX + 16, cerrY, SW.thin, P) + line(cerrX, cerrY - 16, cerrX, cerrY + 16, SW.thin, P);
  g += dimH(x0, x0 + W, floorY + 60, String(r.W), P, floorY);
  g += dimV(y0, floorY, x0 - 60, String(r.H), P, x0);
  g += dimV(cerrY, floorY, x0 + W + 60, String(r.picaporte), P, x0 + W);   // altura del picaporte (variable)
  return g;
}

/* --- Lateral del marco (factor k) --- */
function lateral(r, ox, oy, P, k) {
  var w = r.marco.espesor * k, h = r.H * k, g = '';
  g += tsans(ox, oy - 18, 'LATERAL', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, w, h, SW.thick, P);
  var bot = oy + h, cy = bot - r.picaporte * k, cx = ox + w * 0.5;
  // agujero de cerradura (en la jamba, a la altura de cerradero)
  g += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cx - 18, cy, cx + 18, cy, SW.thin, P) + line(cx, cy - 18, cx, cy + 18, SW.thin, P);
  g += dimV(cy, bot, ox + w + 55, String(r.picaporte), P, ox + w);
  return g;
}

/* --- Cajetín editable --- */
function cajetin(r, ox, oy, w, h, P, logo) {
  var g = rect(ox, oy, w, h, SW.thick, P), col1 = w * 0.44, col2 = w * 0.32, rh = h / 3;
  g += line(ox + col1, oy, ox + col1, oy + h, SW.thin, P);
  g += line(ox + col1 + col2, oy, ox + col1 + col2, oy + h, SW.thin, P);
  g += line(ox, oy + rh, ox + col1 + col2, oy + rh, SW.thin, P);
  g += line(ox, oy + 2 * rh, ox + col1 + col2, oy + 2 * rh, SW.thin, P);
  var rt = r.rotulo || {};
  function cell(cx, ry, label, value) {
    return tsans(cx + 14, ry + 24, label, F.ty, 'start', P, 600, P.accent) + tsans(cx + 14, ry + rh - 14, value, F.h2, 'start', P, 500);
  }
  g += cell(ox, oy + 0 * rh, 'Plano', rt.plano || '—');
  g += cell(ox, oy + 1 * rh, 'Obra', rt.obra || '—');
  g += cell(ox, oy + 2 * rh, 'OT', rt.ot || '—');
  g += cell(ox + col1, oy + 0 * rh, 'Fecha', rt.fecha || '—');
  g += cell(ox + col1, oy + 1 * rh, 'Cantidad', r.cantidadTexto || (r.total + ' (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)'));
  g += cell(ox + col1, oy + 2 * rh, 'Tipo', r.tipoTexto || ('Doble faz · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica')));
  var lx = ox + col1 + col2, lw = w - col1 - col2;
  if (logo) { var iw = lw - 40, ih = iw * 344 / 1229, iy = oy + (h - ih) / 2 - 14; g += '<image x="' + (lx + 20).toFixed(1) + '" y="' + iy.toFixed(1) + '" width="' + iw.toFixed(1) + '" height="' + ih.toFixed(1) + '" href="' + logo + '"/>'; }
  return g;
}

/* --- Despiece (tabla) con material --- */
function despieceTabla(r, ox, oy, P, tw) {
  var matDef = 'Chapa N°' + (r.chapa || 18);
  var headers = ['Pieza', 'Descripción', 'Cant', 'Material', 'Ancho×Largo'];
  var filas = r.despiece.map(function (d) {
    var med = (d.ancho == null) ? String(d.largo) : (d.ancho + '×' + d.largo);
    return { c: [d.pieza, d.desc, String(d.cant), d.mat || matDef, med] };
  });
  // ancho de cada columna según el texto más largo (mono ≈ 0.6·fs por carácter + padding)
  var fs = 27, colW = headers.map(function (h, i) {
    var mx = h.length;
    filas.forEach(function (f) { mx = Math.max(mx, String(f.c[i]).length); });
    return Math.ceil(mx * fs * 0.6) + 40;
  });
  // estira para ocupar el ancho disponible: el sobrante va a Descripción
  if (tw) { var s = colW.reduce(function (a, b) { return a + b; }, 0); if (s < tw) colW[1] += tw - s; }
  return tabla(ox, oy, colW, filas, P, headers, { fs: fs, rh: 68 });
}

/* --- Planilla de herrajes (lo que el usuario carga en el artefacto) --- */
function herrajesTabla(r, ox, oy, P, tw) {
  var items = (r.herrajes || []).filter(function (s) { return s && s.trim(); });
  var filas;
  if (!items.length) {
    filas = [{ c: ['—', '(cargá los accesorios en el panel)'] }];
  } else {
    filas = items.map(function (it) {
      var m = /^(\d+)\s*[x×]?\s+(.*)$/.exec(it.trim());
      return { c: m ? [m[1], m[2]] : ['—', it.trim()] };
    });
  }
  var w = tw || 890, c0 = 150;
  return tabla(ox, oy, [c0, w - c0], filas, P, ['Cant', 'Accesorio'], { fs: 27, rh: 68 });
}

/* --- Bloque ACCESORIOS: título + tabla, solo si hay items cargados --- */
function bloqueAccesorios(r, dx, hy, P, TW) {
  var items = (r.herrajes || []).filter(function (s) { return s && s.trim(); });
  if (!items.length) return '';
  return tsans(dx, hy - 12, 'ACCESORIOS', F.h2, 'start', P, 700, P.accent) + herrajesTabla(r, dx, hy, P, TW).svg;
}

/* --- Envoltura de página A4 --- */
function pagina(inner, P, nota) {
  return '<svg width="210mm" height="297mm" viewBox="0 0 ' + PG.w + ' ' + PG.h + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="' + PG.w + '" height="' + PG.h + '" fill="' + P.paper + '"/>' +
    rect(PG.m * 0.5, PG.m * 0.5, PG.w - PG.m, PG.h - PG.m, SW.thin, P) + inner +
    (nota ? tsans(PG.m, PG.h - PG.m * 0.5 - 10, nota, F.ty, 'start', P, 500, P.muted || P.text) : '') + '</svg>';
}

/* --- UNA sola hoja A4 con todo --- */
function generarPaginas(params, P, logo) {
  var r = calcularDespiece(params);
  r.rotulo = params.rotulo;
  r.herrajes = params.herrajes || [];
  var mano = params.drawMano || 'izq';
  var M = PG.m, full = PG.w - 2 * M, g = '';

  // Cajetín slim
  g += cajetin(r, M, M, full, 185, P, logo);

  // Fila A: frente (con cota de picaporte) + despiece
  var kf = Math.min(420 / r.W, 820 / r.H);
  g += frente(r, M + 90, 330, P, mano, kf);
  var dx = 760;
  g += tsans(dx, 300, 'DESPIECE — ' + r.total + ' puertas (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)', F.h2, 'start', P, 700, P.accent);
  var TW = 2030 - dx;
  var dt = despieceTabla(r, dx, 320, P, TW);
  g += dt.svg;
  // Planilla de herrajes, debajo del despiece
  var hy = 320 + dt.h + 54;
  g += bloqueAccesorios(r, dx, hy, P, TW);

  // Fila B: ① GRANDE a la izquierda (escala alta -> cotas centradas y sin amontonarse).
  // ② ③ arriba a la derecha; ④ ⑤ abajo a la derecha.
  var reb = r.rebajeHoja, by = 1300;
  g += bloquePerfil(M, by, 560, 1500, '① Marco',
    'muro ' + r.muro + ' = esp. ' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  g += cruzExt(r, M + 580, by, 650, 1090, P);
  g += cruzInt(r, M + 1250, by, 660, 1090, P);
  g += bloquePerfil(M + 580, by + 1110, 640, 390, '④ Refuerzo (U)',
    r.nRef + '/hoja · largo ' + r.despiece[4].largo + ' · desarr. ' + r.refAncho,
    [reb, 25, reb], ['L', 'L'], [0, -1], P);
  g += bloquePerfil(M + 1250, by + 1110, 660, 390, '⑤ Perfil inferior (U)',
    'largo ' + r.p5Largo + ' (int−4) · desarr. ' + r.p5Ancho,
    [20, reb, 20], ['L', 'L'], [0, -1], P);

  return [pagina(g, P, 'Perfiles fuera de escala: las medidas son las longitudes de cada tramo (mm). Plana/desarrollo = medida de la chapa a cortar. Imprimir en A4.')];
}

/* --- Frente del marco (sin hoja): vano + apertura --- */
function frenteMarco(r, ox, oy, P, k) {
  var W = r.W * k, H = r.H * k, g = '';
  g += tsans(ox, oy - 18, 'FRENTE (marco)', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, W, H, SW.thick, P);
  g += rect(ox + 30 * k, oy + 30 * k, W - 60 * k, H - 30 * k, SW.thick, P);  // apertura (luz)
  var floorY = oy + H;
  g += dimH(ox, ox + W, floorY + 60, String(r.W), P, floorY);
  g += dimV(oy, floorY, ox - 60, String(r.H), P, ox);
  return g;
}

/* --- Hoja A4: SOLO MARCO --- */
function generarMarco(params, P, logo) {
  var r = calcularMarco(params);
  r.rotulo = params.rotulo;
  r.herrajes = params.herrajes || [];
  r.tipoTexto = 'Marco · hoja ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica');
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  // frente del vano + lateral del marco (con altura de cerradura)
  var kf = Math.min(360 / r.W, 940 / r.H);
  var fx = M + 90;
  g += frenteMarco(r, fx, 330, P, kf);
  g += lateral(r, fx + r.W * kf + 70, 330, P, kf);
  var dx = 760;
  g += tsans(dx, 300, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var TW = 2030 - dx;
  var dt = despieceTabla(r, dx, 320, P, TW);
  g += dt.svg;
  var hy = 320 + dt.h + 54;
  g += bloqueAccesorios(r, dx, hy, P, TW);
  // ① Marco: perfil grande y legible (hay lugar de sobra)
  var bw = 880, bx = M + (full - bw) / 2;
  g += bloquePerfil(bx, 1300, bw, 1420, '① Marco',
    'muro ' + r.muro + ' = esp. ' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  return [pagina(g, P, 'Perfil fuera de escala: las medidas son las longitudes de cada tramo (mm). Desarrollo = medida de la chapa a cortar. Imprimir en A4.')];
}

/* ===========================================================================
   GABINETE CON TABLILLAS — dibujo
   =========================================================================== */
function gabBox(ox, oy, w, h, titulo, caption, P) {
  return rect(ox, oy, w, h, SW.thin, P, P.card || 'none') +
    tituloNum(ox + 24, oy + 42, titulo, P) +
    (caption ? tsans(ox + 24, oy + 76, caption, F.ty, 'start', P, 500, P.muted || P.text) : '');
}

/* ② Marco de la hoja (P1): canal con 2 ganchos a 180° */
function secGabP1(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '② Marco hoja (P1)', 'canal c/ ganchos · tramos 15·30·32·30·15', P);
  var web = 32, fl = 30, gh = 15;
  var k = Math.min((w - 260) / fl, (h - 260) / web); k = Math.min(k, 9);
  var x0 = ox + w * 0.44 - (fl * k) / 2, y0 = oy + 130 + (h - 180 - web * k) / 2;
  g += line(x0, y0, x0, y0 + web * k, SW.thick, P);                                   // web
  g += line(x0, y0, x0 + fl * k, y0, SW.thick, P);                                     // flange sup
  g += hook180(x0 + fl * k, y0, -1, 0, 0, 1, gh * k, 11, P, null);                     // gancho sup (hacia adentro)
  g += line(x0, y0 + web * k, x0 + fl * k, y0 + web * k, SW.thick, P);                 // flange inf
  g += hook180(x0 + fl * k, y0 + web * k, -1, 0, 0, -1, gh * k, 11, P, null);          // gancho inf
  g += txt(x0 - 22, y0 + web * k / 2 + 8, '32', F.num, 'end', P, false, '600');
  g += txt(x0 + fl * k / 2, y0 - 16, '30', F.num, 'middle', P, false, '600');
  g += txt(x0 + fl * k / 2, y0 + web * k + 36, '30', F.num, 'middle', P, false, '600');
  g += txt(x0 + fl * k - gh * k / 2, y0 + 11 + 30, '15', F.sm, 'middle', P, false, '600');            // gancho sup: adentro, centrado
  g += txt(x0 + fl * k - gh * k / 2, y0 + web * k - 11 - 16, '15', F.sm, 'middle', P, false, '600');  // gancho inf: adentro, centrado
  g += tsans(ox + w - 30, oy + h - 22, 'desarrollo ' + r.desP1, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* ③ Tablilla (P2): 20 vertical · 50 diagonal · 15 vertical · 10 pie (28/42 = guía de dibujo) */
function secGabP2(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '③ Tablilla (P2)', 'tramos 20·50·15·10', P);
  var bw = 28 + 10, bh = 20 + 42 + 15;
  var k = Math.min((w - 260) / bw, (h - 260) / bh); k = Math.min(k, 7);
  var x0 = ox + w * 0.44 - (bw * k) / 2, y0 = oy + 130 + (h - 180 - bh * k) / 2;
  var A = { x: x0 + 28 * k, y: y0 };                 // arriba
  var B = { x: A.x, y: A.y + 20 * k };               // baja 20
  var Cc = { x: x0, y: B.y + 42 * k };               // diagonal 50
  var D = { x: x0, y: Cc.y + 15 * k };               // baja 15
  var E = { x: x0 + 10 * k, y: D.y };                // pie 10
  g += '<path d="M' + A.x.toFixed(1) + ' ' + A.y.toFixed(1) + ' L' + B.x.toFixed(1) + ' ' + B.y.toFixed(1) +
    ' L' + Cc.x.toFixed(1) + ' ' + Cc.y.toFixed(1) + ' L' + D.x.toFixed(1) + ' ' + D.y.toFixed(1) +
    ' L' + E.x.toFixed(1) + ' ' + E.y.toFixed(1) + '" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thick + '" stroke-linejoin="round" stroke-linecap="round"/>';
  // guía de dibujo (punteado): proyecciones del diagonal
  g += line(Cc.x, Cc.y, B.x, Cc.y, SW.dim, P, '14 10', P.dim || P.line);   // 28 horizontal
  g += line(B.x, B.y, B.x, Cc.y, SW.dim, P, '14 10', P.dim || P.line);     // 42 vertical
  g += txt(A.x + 16, B.y - 10 * k + 8, '20', F.num, 'start', P, false, '600');
  g += txt((A.x + Cc.x) / 2 - 22, (B.y + Cc.y) / 2, '50', F.num, 'end', P, false, '600');
  g += txt(Cc.x - 16, (Cc.y + D.y) / 2 + 8, '15', F.sm, 'end', P, false, '600');
  g += txt((D.x + E.x) / 2, D.y + 32, '10', F.sm, 'middle', P, false, '600');
  g += txt((Cc.x + B.x) / 2, Cc.y + 30, '28', F.sm, 'middle', P, false, '500', P.muted || P.text);
  g += txt(B.x + 14, (B.y + Cc.y) / 2, '42', F.sm, 'start', P, false, '500', P.muted || P.text);
  g += tsans(ox + w - 30, oy + h - 22, 'desarrollo ' + r.desP2, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* Frente del gabinete: estructural + hoja + tablillas + apertura */
function frenteGabinete(r, ox, oy, P, k, mano) {
  var mw = r.anchoMarco * k, mh = r.altoMarco * k, g = '';
  var titulo = r.nHojas === 2 ? 'FRENTE — doble hoja' : 'FRENTE — mano ' + (mano === 'izq' ? 'izquierda' : 'derecha');
  g += tsans(ox, oy - 18, titulo, F.h2, 'start', P, 700, P.accent);
  var floorY = oy + mh, hojaW = r.hojaAncho * k;
  var cantoK = r.estrB * k, luzK = C.gabJuegoLat * k, centK = C.gabLuzCentral * k, p1K = Math.max(3, 30 * k);
  // marco estructural: banda (contorno + abertura interior = ancho del caño)
  g += rect(ox, oy, mw, mh, SW.thick, P);
  g += rect(ox + cantoK, oy + cantoK, mw - 2 * cantoK, mh - 2 * cantoK, SW.thin, P);
  var opL = ox + cantoK;
  var hojas = [];
  if (r.nHojas === 2) {
    var xL = opL + luzK;
    hojas.push({ x: xL, m: 'izq' });                      // abre a la izquierda (bisagra izq)
    hojas.push({ x: xL + hojaW + centK, m: 'der' });      // abre a la derecha (bisagra der)
  } else {
    hojas.push({ x: opL + luzK, m: mano });
  }
  hojas.forEach(function (hj) {
    var hx = hj.x, mid = oy + mh / 2;
    g += rect(hx, oy, hojaW, mh, SW.thin, P);                             // marco hoja: contorno (alto completo)
    g += rect(hx + p1K, oy + p1K, hojaW - 2 * p1K, mh - 2 * p1K, SW.thin, P); // marco hoja: cara interior
    var innTop = oy + p1K + 6, innBot = floorY - p1K - 6, step = (innBot - innTop) / r.nTab, i;
    for (i = 1; i < r.nTab; i++) { var yy = innTop + i * step; g += line(hx + p1K, yy, hx + hojaW - p1K, yy, SW.dim, P, 0, P.dim || P.line); }
    if (hj.m === 'der') { g += line(hx + hojaW, oy, hx, mid, SW.dim, P, '18 12', P.accent) + line(hx + hojaW, floorY, hx, mid, SW.dim, P, '18 12', P.accent); }
    else { g += line(hx, oy, hx + hojaW, mid, SW.dim, P, '18 12', P.accent) + line(hx, floorY, hx + hojaW, mid, SW.dim, P, '18 12', P.accent); }
    var lcx = hj.m === 'der' ? hx + p1K + 10 : hx + hojaW - p1K - 10;
    g += '<circle cx="' + lcx.toFixed(1) + '" cy="' + mid.toFixed(1) + '" r="9" fill="' + P.paper + '" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  });
  g += dimH(ox, ox + mw, floorY + 60, String(r.anchoMarco), P, floorY);   // ancho del estructural
  g += dimV(oy, floorY, ox - 70, String(r.altoMarco), P, ox);             // alto del estructural
  return g;
}

/* Hoja A4: GABINETE con tablillas */
function generarGabinete(params, P, logo) {
  var r = calcularGabinete(params);
  r.rotulo = params.rotulo;
  r.herrajes = params.herrajes || [];
  var mano = params.drawMano || 'izq';
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  var kf = Math.min(520 / r.anchoMarco, 1000 / r.altoMarco);
  g += frenteGabinete(r, M + 120, 330, P, kf, mano);
  var dx = 760;
  g += tsans(dx, 300, (r.nHojas === 2 ? 'DESPIECE — ' + r.total + ' gabinetes (doble hoja)' : 'DESPIECE — ' + r.total + ' gabinetes (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)'), F.h2, 'start', P, 700, P.accent);
  var TW = 2030 - dx;
  var dt = despieceTabla(r, dx, 320, P, TW);
  g += dt.svg;
  var hy = 320 + dt.h + 54;
  g += bloqueAccesorios(r, dx, hy, P, TW);
  // Perfiles: ② P1 y ③ P2 (el marco estructural es caño comprado, no se grafica)
  var by = 1500, bw = 760, gap = 60, x0 = M + (full - (bw * 2 + gap)) / 2;
  g += secGabP1(r, x0, by, bw, 900, P);
  g += secGabP2(r, x0 + bw + gap, by, bw, 900, P);
  return [pagina(g, P, 'Perfiles fuera de escala (cotas en mm). Plana = ancho de la chapa a cortar. El marco estructural es caño comprado (unión a 45°). Imprimir en A4.')];
}

/* ===========================================================================
   CÁMARA CLOACAL — dibujo
   =========================================================================== */
/* Planta: marco ext + hueco int + tapa, cotas ext/int apiladas */
function plantaCamara(r, ox, oy, P, k) {
  var eA = r.extA * k, eB = r.extB * k, lw = r.leg * k, g = '';
  g += tsans(ox, oy - 18, 'PLANTA', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, eA, eB, SW.thick, P);                                 // marco (exterior)
  var ix = ox + lw, iy = oy + lw, iw = r.intA * k, ih = r.intB * k;
  g += rect(ix, iy, iw, ih, SW.thin, P);                                  // hueco (interior)
  // tapa (bandeja) centrada, punteada
  var bA = r.bandA * k, bB = r.bandB * k, tx = ox + (eA - bA) / 2, ty = oy + (eB - bB) / 2;
  g += '<rect x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + bA.toFixed(1) + '" height="' + bB.toFixed(1) + '" fill="none" stroke="' + P.accent + '" stroke-width="' + SW.dim + '" stroke-dasharray="16 10"/>';
  // malla electrosoldada sobre toda el área de la bandeja (grilla)
  var cxm = ox + eA / 2, cym = oy + eB / 2, mstep = Math.max(26, 110 * k), xx, yy;
  for (xx = tx + mstep; xx < tx + bA - 2; xx += mstep) g += line(xx, ty, xx, ty + bB, SW.dim, P, 0, P.muted || P.line);
  for (yy = ty + mstep; yy < ty + bB - 2; yy += mstep) g += line(tx, yy, tx + bA, yy, SW.dim, P, 0, P.muted || P.line);
  // tiradores (bulón para izar): 1 centrado, o 2 en los tercios del lado largo (marco > 1,2 m)
  var tir = [];
  if (r.nTir >= 2) {
    if (r.extA >= r.extB) { tir.push([ox + eA / 3, cym]); tir.push([ox + 2 * eA / 3, cym]); }
    else { tir.push([cxm, oy + eB / 3]); tir.push([cxm, oy + 2 * eB / 3]); }
  } else { tir.push([cxm, cym]); }
  tir.forEach(function (c) {
    g += '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="12" fill="' + P.paper + '" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
    g += line(c[0] - 19, c[1], c[0] + 19, c[1], SW.thin, P) + line(c[0], c[1] - 19, c[0], c[1] + 19, SW.thin, P);
  });
  g += tsans(tir[0][0] + 22, tir[0][1] - 20, 'tirador', 17, 'start', P, 600, P.accent);
  // cota del modo ingresado: exterior si el dato es exterior, interior si es interior
  var floorY = oy + eB;
  if (r.modo === 'int') {
    g += dimH(ix, ix + iw, floorY + 70, String(Math.round(r.intA)), P, iy + ih);
    g += dimV(iy, iy + ih, ox - 70, String(Math.round(r.intB)), P, ix);
    g += tsans(ox - 70, oy - 14, 'int', 17, 'middle', P, 600, P.accent);
  } else {
    g += dimH(ox, ox + eA, floorY + 70, String(Math.round(r.extA)), P, floorY);
    g += dimV(oy, oy + eB, ox - 70, String(Math.round(r.extB)), P, ox);
    g += tsans(ox - 70, oy - 14, 'ext', 17, 'middle', P, 600, P.accent);
  }
  return g;
}

/* ① Corte de armado: ángulo (L) a cada lado + bandeja apoyada, luz y alto 46 (fuera de escala) */
function corteCamara(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '① Corte de armado', 'ángulo 2"×3/16" + tapa (malla + hormigón) · fuera de escala', P);
  var cx = ox + w * 0.5, AW = w * 0.64, xL = cx - AW / 2, xR = cx + AW / 2;
  var t2 = 16, legH = 135, ledge = 95, luz = 16, bandH = 118;
  var cyBot = oy + h * 0.74, cyTop = cyBot - legH, seat = cyBot - t2;   // ala vertical arriba, horizontal abajo
  function angL(x0, dir) {   // ala vertical hacia arriba (borde) + ala horizontal hacia adentro (abajo)
    var xi = x0 + dir * t2, xt = x0 + dir * ledge;
    return '<path d="M' + x0.toFixed(1) + ' ' + cyTop.toFixed(1) + ' L' + xi.toFixed(1) + ' ' + cyTop.toFixed(1) +
      ' L' + xi.toFixed(1) + ' ' + seat.toFixed(1) + ' L' + xt.toFixed(1) + ' ' + seat.toFixed(1) +
      ' L' + xt.toFixed(1) + ' ' + cyBot.toFixed(1) + ' L' + x0.toFixed(1) + ' ' + cyBot.toFixed(1) +
      ' Z" fill="' + (P.hatch || 'none') + '" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  }
  g += angL(xL, 1) + angL(xR, -1);
  // tapa (bandeja abierta arriba) apoyada en el asiento; paredes hacia arriba
  var bXL = xL + t2 + luz, bXR = xR - t2 - luz, bTop = seat - bandH;
  g += '<rect x="' + bXL.toFixed(1) + '" y="' + bTop.toFixed(1) + '" width="' + (bXR - bXL).toFixed(1) + '" height="' + bandH.toFixed(1) + '" fill="' + (P.hatch || 'none') + '" stroke="none"/>';
  var my = seat - bandH * 0.20, dd;                                 // malla: baja, cerca del fondo
  for (dd = bXL + 24; dd < bXR - 10; dd += 44) g += '<circle cx="' + dd.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="5" fill="' + P.line + '"/>';
  g += line(bXL + 14, my, bXR - 14, my, SW.dim, P, 0, P.dim || P.line);
  g += '<path d="M' + bXL.toFixed(1) + ' ' + bTop.toFixed(1) + ' L' + bXL.toFixed(1) + ' ' + seat.toFixed(1) + ' L' + bXR.toFixed(1) + ' ' + seat.toFixed(1) + ' L' + bXR.toFixed(1) + ' ' + bTop.toFixed(1) + '" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thick + '"/>';
  g += txt(xL - 12, (cyTop + cyBot) / 2, '50,8', F.sm, 'end', P, true, '600');
  g += txt(xR + 16, (bTop + seat) / 2, '46', F.num, 'start', P, true, '600');
  g += line(xL + t2, cyTop - 12, bXL, cyTop - 12, SW.dim, P, '8 6', P.dim || P.line);
  g += txt((xL + t2 + bXL) / 2, cyTop - 20, 'luz', F.sm, 'middle', P, false, '500', P.muted || P.text);
  g += txt(cx, cyBot + 34, 'malla + hormigón (en obra)', F.sm, 'middle', P, false, '500', P.muted || P.text);
  // tirador(es) (bulón): 1 centrado o 2 en los tercios, igual que en planta
  var hY = bTop - 30, nY = seat + 24, sp = bXR - bXL, tcs = r.nTir >= 2 ? [bXL + sp / 3, bXL + 2 * sp / 3] : [cx];
  tcs.forEach(function (tcx) {
    g += line(tcx, nY, tcx, hY, SW.thick, P);
    g += '<rect x="' + (tcx - 18).toFixed(1) + '" y="' + (hY - 13).toFixed(1) + '" width="36" height="13" fill="' + P.line + '"/>';
    g += '<rect x="' + (tcx - 13).toFixed(1) + '" y="' + seat.toFixed(1) + '" width="26" height="14" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  });
  g += txt(tcs[0] + 30, hY - 2, 'tirador', F.sm, 'start', P, false, '600');
  g += tsans(ox + 24, oy + h - 22, 'luz = 3 mm fija (bandeja ↔ marco)', F.ty, 'start', P, 500, P.muted || P.text);
  return g;
}

/* ② Bandeja (tapa): sección en U (pared 46 · base · pared 46) + plana */
function secBandeja(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '② Bandeja (tapa) — panel', 'chapa N°' + r.chapa + ' · paredes 46 · plana ' + r.devA + '×' + r.devB, P);
  var cx = ox + w * 0.47, cyBar = oy + 140 + (h - 170) / 2;
  var hw = w * 0.30, vUp = (h - 170) * 0.30, vDn = (h - 170) * 0.30, wall = 66;
  // sección a lo ANCHO (barra horizontal; paredes hacia arriba)
  g += line(cx - hw, cyBar, cx + hw, cyBar, SW.thick, P);
  g += line(cx - hw, cyBar, cx - hw, cyBar - wall, SW.thick, P);
  g += line(cx + hw, cyBar, cx + hw, cyBar - wall, SW.thick, P);
  // sección a lo ALTO (barra vertical; paredes hacia la izquierda)
  g += line(cx, cyBar - vUp, cx, cyBar + vDn, SW.thick, P);
  g += line(cx, cyBar - vUp, cx - wall, cyBar - vUp, SW.thick, P);
  g += line(cx, cyBar + vDn, cx - wall, cyBar + vDn, SW.thick, P);
  // cotas
  g += txt(cx + hw * 0.5, cyBar + 30, String(r.bandA), F.num, 'middle', P, false, '600');           // base ancho
  g += txt(cx + 18, cyBar + vDn * 0.5, String(r.bandB), F.num, 'start', P, false, '600');           // base alto
  // 46 en las cuatro paredes
  g += txt(cx - hw - 14, cyBar - wall * 0.5, '46', F.sm, 'end', P, true, '600');                    // pared ancho izq
  g += txt(cx + hw + 14, cyBar - wall * 0.5, '46', F.sm, 'start', P, true, '600');                  // pared ancho der
  g += txt(cx - wall * 0.5, cyBar - vUp - 12, '46', F.sm, 'middle', P, false, '600');               // pared alto sup
  g += txt(cx - wall * 0.5, cyBar + vDn + 28, '46', F.sm, 'middle', P, false, '600');               // pared alto inf
  g += tsans(ox + w - 30, oy + h - 22, 'plana ' + r.devA + ' × ' + r.devB, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* Hoja A4: CÁMARA CLOACAL */
function generarCamara(params, P, logo) {
  var r = calcularCamara(params);
  r.rotulo = params.rotulo;
  r.herrajes = params.herrajes || [];
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  var kf = Math.min(470 / r.extA, 900 / r.extB);
  g += plantaCamara(r, M + 180, 360, P, kf);
  var dx = 760;
  g += tsans(dx, 300, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var TW = 2030 - dx;
  var dt = despieceTabla(r, dx, 320, P, TW);
  g += dt.svg;
  var ny = 320 + dt.h + 40;
  g += tsans(dx, ny, '+ Malla electrosoldada y relleno de hormigón en obra.', F.ty, 'start', P, 500, P.muted || P.text);
  var hy = ny + 56;
  g += bloqueAccesorios(r, dx, hy, P, TW);
  var by = 1120, bw = 760, gap = 60, x0 = M + (full - (bw * 2 + gap)) / 2;
  g += corteCamara(r, x0, by, bw, 820, P);
  g += secBandeja(r, x0 + bw + gap, by, bw, 820, P);
  return [pagina(g, P, 'Plano preliminar. Cotas en mm. Ángulo comprado. Desarrollo = chapa a cortar (deducción = espesor redondeado al entero menor, por doblez). Imprimir en A4.')];
}

/* ===========================================================================
   CÁMARA PLUVIAL — dibujo
   =========================================================================== */
/* Planta: marco L (ext + hueco) + rejilla con planchuelas y refuerzos */
function plantaPluvial(r, ox, oy, P, k) {
  var eA = r.extA * k, eB = r.extB * k, g = '';
  g += tsans(ox, oy - 18, 'PLANTA', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, eA, eB, SW.thick, P);                                 // borde ext del plegado
  var jk = r.esp * k, rx = ox + jk, ry = oy + jk, rw = r.rejA * k, rh = r.rejB * k;
  g += rect(rx, ry, rw, rh, SW.thin, P);                                  // rejilla (apoyada sobre el ala)
  var band = r.leg * k, ix = ox + band, iy = oy + band, iw = r.intA * k, ih = r.intB * k;
  var dc = P.muted || P.dim || P.text;                                    // hueco libre por debajo (punteado)
  g += line(ix, iy, ix + iw, iy, SW.dim, P, '10 8', dc) + line(ix, iy + ih, ix + iw, iy + ih, SW.dim, P, '10 8', dc)
     + line(ix, iy, ix, iy + ih, SW.dim, P, '10 8', dc) + line(ix + iw, iy, ix + iw, iy + ih, SW.dim, P, '10 8', dc);
  var horizLong = r.rejA >= r.rejB, n = r.nBarras, i;                     // barras ⊥ a la dimensión mayor
  if (horizLong) { var st = rw / (n + 1); for (i = 1; i <= n; i++) { var xx = rx + i * st; g += line(xx, ry, xx, ry + rh, SW.dim, P); } }
  else { var sv = rh / (n + 1); for (i = 1; i <= n; i++) { var yy = ry + i * sv; g += line(rx, yy, rx + rw, yy, SW.dim, P); } }
  if (r.nRef) {                                                           // refuerzos ⊥ a las barras (punteados)
    var pos = r.nRef === 1 ? [0.5] : [1 / 3, 2 / 3];
    pos.forEach(function (f) {
      if (horizLong) { var yy = ry + rh * f; g += line(rx, yy, rx + rw, yy, SW.thick, P, '22 10', P.accent); }
      else { var xx = rx + rw * f; g += line(xx, ry, xx, ry + rh, SW.thick, P, '22 10', P.accent); }
    });
  }
  var floorY = oy + eB;
  if (r.modo === 'int') {
    g += dimH(ix, ix + iw, floorY + 70, String(Math.round(r.intA)), P, iy + ih);
    g += dimV(iy, iy + ih, ox - 70, String(Math.round(r.intB)), P, ix);
    g += tsans(ox - 70, oy - 14, 'int', 17, 'middle', P, 600, P.accent);
  } else {
    g += dimH(ox, ox + eA, floorY + 70, String(Math.round(r.extA)), P, floorY);
    g += dimV(oy, oy + eB, ox - 70, String(Math.round(r.extB)), P, ox);
    g += tsans(ox - 70, oy - 14, 'ext', 17, 'middle', P, 600, P.accent);
  }
  return g;
}

/* ① Marco: plegado en L 42×42 */
function secPluvMarco(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '① Marco (plegado L)', 'chapa 1/8" · L 42×42 · plana 78', P);
  var legH = 330, legV = 330, t = 24, x0 = ox + (w - legH) / 2 - 10, y0 = oy + 180;
  g += '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + t) + ' ' + y0 + ' L' + (x0 + t) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV) + ' L' + x0 + ' ' + (y0 + legV) + ' Z" fill="' + (P.hatch || 'none') + '" stroke="' + P.line + '" stroke-width="' + SW.thick + '"/>';
  g += txt(x0 - 16, y0 + legV / 2, '42', F.num, 'end', P, true, '600');
  g += txt(x0 + legH * 0.6, y0 + legV + 22, '42', F.num, 'middle', P, false, '600');
  g += tsans(ox + w - 30, oy + h - 22, 'desarrollo 39 + 39 = 78', F.ty, 'end', P, 700, P.accent);
  return g;
}

/* ② Rejilla: planchuelas de canto cada 25 (+ refuerzo si corresponde) */
function secPluvReja(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '② Rejilla', 'planchuela 1/2"×3/16" de canto · cada 25' + (r.refuerzo ? ' · con refuerzo' : ''), P);
  var s = 4.6, barW = Math.max(10, 4.76 * s), barH = 12.7 * s, gapu = 25 * s, cy = oy + h * 0.46, x0 = ox + 150, x = x0;
  for (var i = 0; i < 4; i++) { g += rect(x, cy - barH, barW, barH, SW.thick, P, P.hatch); if (i < 3) g += txt(x + barW + gapu / 2, cy + 38, '25', F.sm, 'middle', P, false, '600'); x += barW + gapu; }
  var xEnd = x - gapu;
  g += txt(x0 - 18, cy - barH / 2, '12,7', F.sm, 'end', P, true, '600');
  if (r.refuerzo) {
    var ryy = cy + 70, rhh = 3.18 * s * 1.3;
    g += rect(x0, ryy, xEnd - x0, rhh, SW.thin, P, P.hatch);
    g += txt(x0, ryy + rhh + 34, 'refuerzo 1/2"×1/8" por debajo (⊥)', F.sm, 'start', P, false, '500', P.muted || P.text);
  }
  g += tsans(ox + 24, oy + h - 22, r.nBarras + ' planchuelas de ' + r.largoBarra + ' mm' + (r.nRef ? ' · ' + r.nRef + ' refuerzo' + (r.nRef > 1 ? 's' : '') + ' de ' + r.largoRef : ''), F.ty, 'start', P, 500, P.muted || P.text);
  return g;
}

/* Hoja A4: CÁMARA PLUVIAL */
function generarPluvial(params, P, logo) {
  var r = calcularPluvial(params);
  r.rotulo = params.rotulo; r.herrajes = params.herrajes || [];
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  var kf = Math.min(470 / r.extA, 900 / r.extB);
  g += plantaPluvial(r, M + 180, 360, P, kf);
  var dx = 760, TW = 2030 - dx;
  g += tsans(dx, 300, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, dx, 320, P, TW); g += dt.svg;
  var hy = 320 + dt.h + 54; g += bloqueAccesorios(r, dx, hy, P, TW);
  var by = 1120, bw = 760, gap = 60, x0 = M + (full - (bw * 2 + gap)) / 2;
  g += secPluvMarco(r, x0, by, bw, 820, P);
  g += secPluvReja(r, x0 + bw + gap, by, bw, 820, P);
  return [pagina(g, P, 'Plano preliminar. Cotas en mm. Marco plegado en chapa 1/8" (unión a 45°). Rejilla de planchuelas. Imprimir en A4.')];
}

/* --- REGISTRO DE TIPOS DE PLANO (cada uno: campos + motor + dibujo) --- */
var TIPOS = [
  {
    id: 'puerta-doble-faz', nombre: 'Puerta metálica doble faz',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: '', step: 10, min: 400, max: 2000 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: '', step: 10, min: 1500, max: 2800 },
      { id: 'cantIzq', label: 'Cant. mano izq', type: 'number', value: '', step: 1, min: 0, max: 99 },
      { id: 'cantDer', label: 'Cant. mano der', type: 'number', value: '', step: 1, min: 0, max: 99 },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'tipoHoja', label: 'Tipo de hoja (marco)', type: 'select', value: 'metalica', options: [['metalica', 'Metálica (t3=35)'], ['madera', 'Madera / placa (t3=31)']] },
      { id: 'muro', label: 'Espesor de muro terminado (mm)', type: 'number', value: '', step: 5, min: 60, max: 400 },
      { id: 'picaporte', label: 'Altura de picaporte (mm)', type: 'number', value: '', step: 10, min: 600, max: 1400 },
      { id: 'mano', label: 'Mano a dibujar', type: 'seg', value: 'izq', options: [['izq', 'Izquierda'], ['der', 'Derecha']] },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']] }
    ],
    calcular: function (p) { return calcularDespiece(p); },
    generar: function (p, P, logo) { return generarPaginas(p, P, logo); }
  },
  {
    id: 'marco', nombre: 'Marco de puerta (solo marco)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: '', step: 10, min: 400, max: 2000 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: '', step: 10, min: 1500, max: 2800 },
      { id: 'cantidad', label: 'Cantidad de marcos', type: 'number', value: '', step: 1, min: 1, max: 99 },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'tipoHoja', label: 'Para hoja', type: 'select', value: 'madera', options: [['madera', 'Madera / placa (t3=31)'], ['metalica', 'Metálica (t3=35)']] },
      { id: 'muro', label: 'Espesor de muro terminado (mm)', type: 'number', value: '', step: 5, min: 60, max: 400 },
      { id: 'picaporte', label: 'Altura de cerradero (mm)', type: 'number', value: '', step: 10, min: 600, max: 1400 },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']] }
    ],
    calcular: function (p) { return calcularMarco(p); },
    generar: function (p, P, logo) { return generarMarco(p, P, logo); }
  },
  {
    id: 'gabinete', nombre: 'Gabinete con tablillas (una hoja)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: '', step: 10, min: 200, max: 2500 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: '', step: 10, min: 300, max: 3000 },
      { id: 'cantIzq', label: 'Cant. mano izq', type: 'number', value: '', step: 1, min: 0, max: 999 },
      { id: 'cantDer', label: 'Cant. mano der', type: 'number', value: '', step: 1, min: 0, max: 999 },
      { id: 'estrA', label: 'Caño — profundidad (mm)', type: 'number', value: 50, step: 5, min: 20, max: 200 },
      { id: 'estrB', label: 'Caño — canto al frente (mm)', type: 'number', value: 20, step: 5, min: 10, max: 100 },
      { id: 'estrEsp', label: 'Caño — espesor (mm)', type: 'number', value: 1.6, step: 0.1, min: 0.8, max: 6 },
      { id: 'chapa', label: 'Chapa plegados (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'mano', label: 'Mano a dibujar', type: 'seg', value: 'izq', options: [['izq', 'Izquierda'], ['der', 'Derecha']] }
    ],
    calcular: function (p) { return calcularGabinete(p); },
    generar: function (p, P, logo) { return generarGabinete(p, P, logo); }
  },
  {
    id: 'gabinete-doble', nombre: 'Gabinete con tablillas (doble hoja)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: '', step: 10, min: 400, max: 3000 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: '', step: 10, min: 300, max: 3000 },
      { id: 'cantidad', label: 'Cantidad de gabinetes', type: 'number', value: '', step: 1, min: 1, max: 999 },
      { id: 'estrA', label: 'Caño — profundidad (mm)', type: 'number', value: 50, step: 5, min: 20, max: 200 },
      { id: 'estrB', label: 'Caño — canto al frente (mm)', type: 'number', value: 20, step: 5, min: 10, max: 100 },
      { id: 'estrEsp', label: 'Caño — espesor (mm)', type: 'number', value: 1.6, step: 0.1, min: 0.8, max: 6 },
      { id: 'chapa', label: 'Chapa plegados (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] }
    ],
    calcular: function (p) { p.nHojas = 2; return calcularGabinete(p); },
    generar: function (p, P, logo) { p.nHojas = 2; return generarGabinete(p, P, logo); }
  },
  {
    id: 'camara', nombre: 'Cámara cloacal (marco + tapa)',
    campos: [
      { id: 'modo', label: 'Medida dada', type: 'seg', value: 'ext', options: [['ext', 'Exterior'], ['int', 'Interior']] },
      { id: 'W', label: 'Lado A (mm)', type: 'number', value: '', step: 10, min: 100, max: 2500 },
      { id: 'H', label: 'Lado B (mm)', type: 'number', value: '', step: 10, min: 100, max: 2500 },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: '', step: 1, min: 1, max: 999 }
    ],
    calcular: function (p) { return calcularCamara(p); },
    generar: function (p, P, logo) { return generarCamara(p, P, logo); }
  },
  {
    id: 'pluvial', nombre: 'Cámara pluvial (marco + rejilla)',
    campos: [
      { id: 'modo', label: 'Medida dada', type: 'seg', value: 'ext', options: [['ext', 'Exterior'], ['int', 'Interior']] },
      { id: 'W', label: 'Lado A (mm)', type: 'number', value: '', step: 10, min: 100, max: 3000 },
      { id: 'H', label: 'Lado B (mm)', type: 'number', value: '', step: 10, min: 100, max: 3000 },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: '', step: 1, min: 1, max: 999 },
      { id: 'refuerzo', label: 'Rejilla con refuerzo (zona transitable)', type: 'check', value: false }
    ],
    calcular: function (p) { return calcularPluvial(p); },
    generar: function (p, P, logo) { return generarPluvial(p, P, logo); }
  }
];

if (typeof module !== 'undefined') module.exports = { generarPaginas: generarPaginas, generarMarco: generarMarco, generarGabinete: generarGabinete, generarCamara: generarCamara, generarPluvial: generarPluvial, TIPOS: TIPOS, PG: PG };
