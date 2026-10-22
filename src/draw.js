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
function tabla(ox, oy, colW, filas, P, headers) {
  var g = '', rh = 56, fs = 21, w = colW.reduce(function (a, b) { return a + b; }, 0), y = oy, i, x;
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
  // Colocación DETERMINÍSTICA: la cota va al lado con MÁS espacio libre (test de rayos),
  // y se corre hacia el extremo libre del tramo. Sin líneas guía ni slides reactivos.
  var placed = [];
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
    var slide = sgn * dl * 0.35;                             // corrimiento hacia el extremo libre
    var off = 32, tx = mx + nx * off + ux * slide, ty = my + ny * off + uy * slide;
    // red de seguridad: si aún así tocara otra cota, la empuja un poco más afuera (no hacia el perfil)
    var safe = 0;
    while (safe < 4) {
      var hit = false;
      for (var j = 0; j < placed.length; j++) { if (Math.hypot(tx - placed[j].x, ty - placed[j].y) < 42) { hit = true; break; } }
      if (!hit) break;
      off += 20; tx = mx + nx * off + ux * slide; ty = my + ny * off + uy * slide; safe++;
    }
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
  g += tituloNum(ox + 24, oy + 42, '② Hoja exterior (panel)', P);
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
  g += tituloNum(ox + 24, oy + 42, '③ Hoja interior (panel)', P);
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
  var bot = oy + h, cy = bot - 1020 * k, cx = ox + 50 * k;
  g += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cx - 18, cy, cx + 18, cy, SW.thin, P) + line(cx, cy - 18, cx, cy + 18, SW.thin, P);
  g += dimV(cy, bot, ox + w + 55, '1020', P, ox + w);
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
  g += tsans(lx + lw / 2, oy + h - 12, 'Resp.: Ing. Basgall Bruno', F.ty, 'middle', P, 500);
  return g;
}

/* --- Despiece (tabla) con material --- */
function despieceTabla(r, ox, oy, P) {
  var mat = 'Chapa N°' + (r.chapa || 18);
  var filas = r.despiece.map(function (d) { return { c: [d.pieza, d.desc, String(d.cant), mat, d.ancho + '×' + d.largo] }; });
  return tabla(ox, oy, [110, 380, 100, 220, 310], filas, P, ['Pieza', 'Descripción', 'Cant', 'Material', 'Ancho×Largo']);
}

/* --- Planilla de herrajes (lo que el usuario carga en el artefacto) --- */
function herrajesTabla(r, ox, oy, P) {
  var items = (r.herrajes || []).filter(function (s) { return s && s.trim(); });
  var filas;
  if (!items.length) {
    filas = [{ c: ['—', '(cargá los herrajes en el panel)'] }];
  } else {
    filas = items.map(function (it) {
      var m = /^(\d+)\s*[x×]?\s+(.*)$/.exec(it.trim());
      return { c: m ? [m[1], m[2]] : ['', it.trim()] };
    });
  }
  return tabla(ox, oy, [120, 770], filas, P, ['Cant', 'Herraje']);
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
  var dt = despieceTabla(r, dx, 320, P);
  g += dt.svg;
  // Planilla de herrajes, debajo del despiece
  var hy = 320 + dt.h + 54;
  g += tsans(dx, hy - 12, 'HERRAJES', F.h2, 'start', P, 700, P.accent);
  g += herrajesTabla(r, dx, hy, P).svg;

  // Fila B: prioridad a los difíciles. ② y ③ grandes (columnas); ① ④ ⑤ apilados a la izq.
  var reb = r.rebajeHoja, by = 1300, bandH = 1460;
  // Col izquierda: ① (más largo) + ④ + ⑤ (más abajo)
  g += bloquePerfil(M, by, 450, 760, '① Marco',
    'muro ' + r.muro + '+3=' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  g += bloquePerfil(M, by + 800, 450, 350, '④ Refuerzo (U)',
    r.nRef + '/hoja · largo ' + r.despiece[4].largo + ' · desarr. ' + r.refAncho,
    [reb, 25, reb], ['L', 'L'], [0, -1], P);
  g += bloquePerfil(M, by + 1190, 450, 350, '⑤ Perfil inferior (U)',
    'largo ' + r.p5Largo + ' (int−4) · desarr. ' + r.p5Ancho,
    [20, reb, 20], ['L', 'L'], [0, -1], P);
  // Col centro/derecha: ② y ③ grandes
  g += cruzExt(r, M + 470, by, 700, bandH, P);
  g += cruzInt(r, M + 1190, by, 770, bandH, P);

  return [pagina(g, P, 'Perfiles fuera de escala: las medidas son las longitudes de cada tramo (mm). Plana/desarrollo = medida de la chapa a cortar. Imprimir en A4.')];
}

/* --- Frente del marco (sin hoja): vano + apertura --- */
function frenteMarco(r, ox, oy, P, k) {
  var W = r.W * k, H = r.H * k, g = '';
  g += tsans(ox, oy - 18, 'FRENTE (marco)', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, W, H, SW.thick, P);
  g += rect(ox + 30 * k, oy + 30 * k, W - 60 * k, H - 30 * k, SW.thick, P);  // apertura (luz)
  var floorY = oy + H, cerrY = floorY - r.picaporte * k, cerrX = ox + W - 30 * k - 12;
  g += '<circle cx="' + cerrX.toFixed(1) + '" cy="' + cerrY.toFixed(1) + '" r="9" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cerrX - 16, cerrY, cerrX + 16, cerrY, SW.thin, P) + line(cerrX, cerrY - 16, cerrX, cerrY + 16, SW.thin, P);
  g += dimH(ox, ox + W, floorY + 60, String(r.W), P, floorY);
  g += dimV(oy, floorY, ox - 60, String(r.H), P, ox);
  g += dimV(cerrY, floorY, ox + W + 60, String(r.picaporte), P, ox + W);   // altura del cerradero (variable)
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
  // frente del vano más grande (es lo que interesa de este plano)
  var kf = Math.min(430 / r.W, 940 / r.H);
  g += frenteMarco(r, M + 90, 330, P, kf);
  var dx = 760;
  g += tsans(dx, 300, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, dx, 320, P);
  g += dt.svg;
  var hy = 320 + dt.h + 54;
  g += tsans(dx, hy - 12, 'HERRAJES', F.h2, 'start', P, 700, P.accent);
  g += herrajesTabla(r, dx, hy, P).svg;
  // ① Marco: perfil grande y legible (hay lugar de sobra)
  var bw = 880, bx = M + (full - bw) / 2;
  g += bloquePerfil(bx, 1300, bw, 1420, '① Marco',
    'muro ' + r.muro + '+3=' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  return [pagina(g, P, 'Perfil fuera de escala: las medidas son las longitudes de cada tramo (mm). Desarrollo = medida de la chapa a cortar. Imprimir en A4.')];
}

/* --- REGISTRO DE TIPOS DE PLANO (cada uno: campos + motor + dibujo) --- */
var TIPOS = [
  {
    id: 'puerta-doble-faz', nombre: 'Puerta metálica doble faz',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 850, step: 10, min: 400, max: 2000 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 2050, step: 10, min: 1500, max: 2800 },
      { id: 'cantIzq', label: 'Cant. mano izq', type: 'number', value: 1, step: 1, min: 0, max: 99 },
      { id: 'cantDer', label: 'Cant. mano der', type: 'number', value: 0, step: 1, min: 0, max: 99 },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'tipoHoja', label: 'Tipo de hoja (marco)', type: 'select', value: 'metalica', options: [['metalica', 'Metálica (t3=35)'], ['madera', 'Madera / placa (t3=31)']] },
      { id: 'muro', label: 'Espesor de muro (mm)', type: 'number', value: 150, step: 5, min: 60, max: 400 },
      { id: 'picaporte', label: 'Altura de picaporte (mm)', type: 'number', value: 1020, step: 10, min: 600, max: 1400 },
      { id: 'mano', label: 'Mano a dibujar', type: 'seg', value: 'izq', options: [['izq', 'Izquierda'], ['der', 'Derecha']] },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Sin term. +30']] }
    ],
    calcular: function (p) { return calcularDespiece(p); },
    generar: function (p, P, logo) { return generarPaginas(p, P, logo); }
  },
  {
    id: 'marco', nombre: 'Marco de puerta (solo marco)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 850, step: 10, min: 400, max: 2000 },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 2050, step: 10, min: 1500, max: 2800 },
      { id: 'cantidad', label: 'Cantidad de marcos', type: 'number', value: 1, step: 1, min: 1, max: 99 },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'tipoHoja', label: 'Para hoja', type: 'select', value: 'madera', options: [['madera', 'Madera / placa (t3=31)'], ['metalica', 'Metálica (t3=35)']] },
      { id: 'muro', label: 'Espesor de muro (mm)', type: 'number', value: 150, step: 5, min: 60, max: 400 },
      { id: 'picaporte', label: 'Altura de cerradero (mm)', type: 'number', value: 1020, step: 10, min: 600, max: 1400 },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Sin term. +30']] }
    ],
    calcular: function (p) { return calcularMarco(p); },
    generar: function (p, P, logo) { return generarMarco(p, P, logo); }
  }
];

if (typeof module !== 'undefined') module.exports = { generarPaginas: generarPaginas, generarMarco: generarMarco, TIPOS: TIPOS, PG: PG };
