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
function visSeccion(s, prop) {
  // prop: escala proporcional suave (da idea del tamaño real sin que lo chico desaparezca).
  // sino: comprime los tramos chicos y topa los largos (codo compacto, cotas sueltas).
  return prop ? (12 + Math.pow(s, 0.85) * 0.9) : (22 + Math.min(s, 230) * 0.92);
}
function seccion(segs, turns, h0, cx, cy, box, P, opts) {
  opts = opts || {};
  var vis = segs.map(function (s) { return visSeccion(s, opts.prop); });
  var pts = turtlePts(vis, turns, h0);
  var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
  var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
  var bw = Math.max.apply(null, xs) - minX || 1, bh = Math.max.apply(null, ys) - minY || 1;
  // margen para los números (afuera del perfil) — pero el perfil se dibuja grande
  var MARG = 78;
  var k = opts.k != null ? opts.k : Math.min((box.w - 2 * MARG) / bw, (box.h - 2 * MARG) / bh);
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
  var fsNum = opts.prop ? 30 : F.num;          // cotas más grandes en el conjunto de la bandeja
  var hitR = opts.prop ? 48 : 42;
  var placed = [];
  function choca(tx, ty) {
    for (var j = 0; j < placed.length; j++) { if (Math.hypot(tx - placed[j].x, ty - placed[j].y) < hitR) return true; }
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
    g += txt(tx, ty + (opts.prop ? 11 : 8), String(segs[i]), fsNum, 'middle', P, false, '600');
  }
  return g;
}

/* --- Cajón del paño fijo: superior (U, chico) + inferior (11 tramos, grande y legible) --- */
function cajonPanoFijoBloque(r, ox, oy, full, P, h) {
  h = h || 620;
  var gap = 60, supW = 640, infW = full - supW - gap;
  var g = bloquePerfil(ox, oy, supW, h, '⑥ Cajón sup. (U invertida)',
    'desarr. ' + r.cajonSup.dev + ' · largo ' + r.cajonSup.largo,
    r.cajonSup.segs, r.cajonSup.turns, r.cajonSup.h0, P);
  g += bloquePerfil(ox + supW + gap, oy, infW, h, '⑥ Cajón inf. (encastre)',
    'desarr. ' + r.cajonInf.dev + ' · largo ' + r.cajonInf.largo + ' · verticales ' + r.cajonInf.segs[4] + ' (hoja)',
    r.cajonInf.segs, r.cajonInf.turns, r.cajonInf.h0, P);
  return { svg: g, bottom: oy + h };
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

/* Nivel de piso terminado (NPT): línea + rayado de piso (en los tramos exteriores) + marca */
function nivelPiso(fx0, fx1, y, P, labelSide) {
  var x1 = fx0 - 46, x2 = fx1 + 46, g = line(x1, y, x2, y, SW.thick, P), x;
  for (x = x1 + 6; x < fx0 - 2; x += 15) g += line(x + 11, y, x, y + 13, SW.thin, P, 0, P.muted || P.line);
  for (x = fx1 + 6; x < x2 - 2; x += 15) g += line(x + 11, y, x, y + 13, SW.thin, P, 0, P.muted || P.line);
  if (labelSide === 'none') return g;
  if (labelSide === 'left') return g + tsans(x1 - 6, y + 5, 'N.P.T.', 16, 'end', P, 700, P.accent);
  return g + tsans(x2 + 6, y + 5, 'N.P.T.', 16, 'start', P, 700, P.accent);
}
/* Extensión enterrada de las jambas (bajo el NPT): bandas rayadas + fondo real */
function parteEnterrada(x0, xr, y, ent, bw, P) {
  if (!ent) return '';
  var g = rect(x0, y, bw, ent, SW.thin, P, P.hatch);
  if (xr - bw > x0 + bw) g += rect(xr - bw, y, bw, ent, SW.thin, P, P.hatch);
  return g + line(x0, y + ent, xr, y + ent, SW.thick, P);
}

/* --- Frente (factor k = unidades por mm), vano acotado --- */
function frente(r, ox, oy, P, mano, k) {
  var W = r.W * k, H = r.H * k, pf = (r.altoPanoFijo || 0) * k, g = '';
  var x0 = ox, topY = oy, y0 = oy + pf;   // topY = cara exterior del marco sup · y0 = techo del cajón / dintel de la puerta
  g += tsans(ox, topY - 18, 'FRENTE — mano ' + (mano === 'izq' ? 'izq' : 'der'), F.h2, 'start', P, 700, P.accent);
  if (pf > 0) {
    g += rect(x0, topY, W, pf, SW.thick, P);                               // marco del paño fijo
    var gx = x0 + 30 * k, gy = topY + 30 * k, gw = W - 60 * k, gh = pf - 30 * k;
    g += rect(gx, gy, gw, gh, SW.thin, P, P.hatch);                        // vidrio
    g += line(gx, gy, gx + gw, gy + gh, SW.dim, P, '14 10', P.accent);
    g += line(gx, gy + gh, gx + gw, gy, SW.dim, P, '14 10', P.accent);
    g += tsans(x0 + W / 2, gy + 22, 'VIDRIO', F.ty, 'middle', P, 600, P.muted || P.text);
    g += line(x0 + 30 * k, y0, x0 + W - 30 * k, y0, SW.thick, P);          // cajón (divisor paño/puerta)
    g += dimV(topY, y0, x0 - 60, String(r.altoPanoFijo), P, x0);           // cota del paño fijo (techo cajón → marco sup)
  }
  g += rect(x0, y0, W, H, SW.thick, P);
  g += rect(x0 + 30 * k, y0 + 30 * k, W - 60 * k, H - 30 * k, SW.thin, P);
  var hx = x0 + (30 - 11) * k, hy = y0 + (30 - 15 + 4) * k, hw = (r.W - 60 + 22) * k, hh = (r.H - 30 - 4 - 7 + 15) * k;
  g += '<rect x="' + hx.toFixed(1) + '" y="' + hy.toFixed(1) + '" width="' + hw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + P.hatch + '" stroke="' + P.line + '" stroke-width="' + SW.thick + '"/>';
  var top = hy, bot = hy + hh, lft = hx, rgt = hx + hw, mid = (top + bot) / 2;
  if (mano === 'izq') { g += line(lft, top, rgt, mid, SW.dim, P, '18 12', P.accent) + line(lft, bot, rgt, mid, SW.dim, P, '18 12', P.accent); }
  else { g += line(rgt, top, lft, mid, SW.dim, P, '18 12', P.accent) + line(rgt, bot, lft, mid, SW.dim, P, '18 12', P.accent); }
  var floorY = y0 + H, ent = (r.enterrar || 0) * k, frameBot = floorY + ent;
  var cerrY = floorY - r.picaporte * k;                                     // picaporte a 1020 sobre el NPT
  var cerrX = mano === 'izq' ? rgt - 20 : lft + 20;
  g += '<circle cx="' + cerrX.toFixed(1) + '" cy="' + cerrY.toFixed(1) + '" r="9" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cerrX - 16, cerrY, cerrX + 16, cerrY, SW.thin, P) + line(cerrX, cerrY - 16, cerrX, cerrY + 16, SW.thin, P);
  g += parteEnterrada(x0, x0 + W, floorY, ent, 30 * k, P);                  // jambas bajo el NPT (para enterrar)
  g += nivelPiso(x0, x0 + W, floorY, P);
  g += dimH(x0, x0 + W, frameBot + 64, String(r.W), P, frameBot);
  g += dimV(y0, floorY, x0 - 60, String(r.H), P, x0);
  g += dimV(cerrY, frameBot, x0 + W + 60, String(r.picaporte + (r.enterrar || 0)), P, x0 + W);   // picaporte desde el pie de la jamba (1020 / 1050)
  return g;
}

/* --- Lateral del marco (factor k) --- */
function lateral(r, ox, oy, P, k) {
  var w = r.marco.espesor * k, h = r.H * k, g = '';
  g += tsans(ox, oy - 18, 'LATERAL', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, w, h, SW.thick, P);
  var bot = oy + h, ent = (r.enterrar || 0) * k, frameBot = bot + ent, cy = bot - r.picaporte * k, cx = ox + w * 0.5;
  // agujero de cerradura (en la jamba, a la altura de cerradero)
  g += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';
  g += line(cx - 18, cy, cx + 18, cy, SW.thin, P) + line(cx, cy - 18, cx, cy + 18, SW.thin, P);
  if (ent) { g += rect(ox, bot, w, ent, SW.thin, P, P.hatch) + line(ox, frameBot, ox + w, frameBot, SW.thick, P); }  // tramo de jamba enterrado (el NPT se marca en el frente)
  g += dimV(cy, frameBot, ox + w + 55, String(r.picaporte + (r.enterrar || 0)), P, ox + w);   // cerradero desde el pie (1020 / 1050)
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
/* --- Pesos: chapa por peso superficial [kg/m²] · perfiles por peso lineal de catálogo [kg/m] --- */
var PESO_SUP = { 'Chapa N°18': 9.86, 'Chapa N°16': 12.60, 'Chapa N°14': 15.80, 'Chapa 1/8"': 25.1, 'Chapa 3/16"': 37.8 };
var PESO_LIN = { 'Áng. 2"×3/16"': 3.7, 'Planch. 1½"×3/16"': 1.5, 'Planch. 1/2"×1/8"': 0.32 };
function fmt1(x) { return x.toFixed(1).replace('.', ','); }
function ceil1(x) { return Math.ceil(x * 10) / 10; }
function pesoPieza(d, r) {   // kg de UNA pieza (chapa: desarrollo×largo×sup · perfil: largo×kg/m)
  var mat = d.mat || ('Chapa N°' + (r.chapa || 18));
  if (PESO_SUP[mat] != null) return d.ancho == null ? null : (d.ancho * d.largo / 1e6) * PESO_SUP[mat];
  if (PESO_LIN[mat] != null) return (d.largo / 1000) * PESO_LIN[mat];
  if (/^Caño /.test(mat)) return (d.largo / 1000) * (r.canoKgm || 1.7);
  return null;
}
function pesoResumen(r) {   // por material: peso por unidad (kgU) y total del plano (kgT, dinámico con la cantidad)
  var aU = {}, aT = {}, orden = [];
  r.despiece.forEach(function (d) {
    var pw = pesoPieza(d, r); if (pw == null) return;
    var mat = d.mat || ('Chapa N°' + (r.chapa || 18));
    if (aU[mat] == null) { aU[mat] = 0; aT[mat] = 0; orden.push(mat); }
    aU[mat] += (d.cantUno != null ? d.cantUno : d.cant) * pw;
    aT[mat] += d.cant * pw;
  });
  return orden.map(function (m) { return { mat: m, kgU: ceil1(aU[m]), kgT: ceil1(aT[m]) }; });
}

function despieceTabla(r, ox, oy, P, tw, fsMax) {
  var matDef = 'Chapa N°' + (r.chapa || 18);
  var headers = ['Pieza', 'Descripción', 'Cant', 'Material', 'Ancho×Largo', 'Peso [kg]'];
  var filas = r.despiece.map(function (d) {
    var med = (d.ancho == null) ? String(d.largo) : (d.ancho + '×' + d.largo);
    var pw = pesoPieza(d, r), ps = pw == null ? '—' : fmt1(ceil1(pw * d.cant));
    return { c: [d.pieza, d.desc, String(d.cant), d.mat || matDef, med, ps] };
  });
  // ancho de cada columna según el texto más largo (mono ≈ 0.6·fs por carácter + padding)
  var fs0 = 27, colW = headers.map(function (h, i) {
    var mx = h.length;
    filas.forEach(function (f) { mx = Math.max(mx, String(f.c[i]).length); });
    return Math.ceil(mx * fs0 * 0.6) + 40;
  });
  // ajusta la fuente al ancho disponible: crece para llenarlo (con tope fsMax) o encoge si no entra
  var fs = fs0, rh = 68;
  if (tw) {
    var s = colW.reduce(function (a, b) { return a + b; }, 0);
    var k = tw / s, kMax = (fsMax || 40) / fs0;
    if (k > 1) k = Math.min(k, kMax);                // no agrandar más allá del tope
    fs *= k; rh *= Math.max(0.82, k); colW = colW.map(function (c) { return c * k; });
    var s2 = colW.reduce(function (a, b) { return a + b; }, 0);
    if (s2 < tw) colW[1] += tw - s2;                 // el sobrante (tras el tope) ensancha Descripción
  }
  var t = tabla(ox, oy, colW, filas, P, headers, { fs: fs, rh: rh }), g = t.svg, hy = oy + t.h;
  // resumen de peso por material: por unidad y total del plano (dinámico con la cantidad)
  var pm = pesoResumen(r), nUn = r.total || r.cantidad || 1;
  if (pm.length) {
    var pf = Math.round(fs * 0.8), pl = Math.round(fs * 0.72), ph = Math.round(fs * 1.25);   // escala el resumen con la fuente de la tabla
    var tot = colW.reduce(function (a, b) { return a + b; }, 0), wU = ox + tot * 0.52, wT = ox + tot * 0.76;
    hy += ph;
    g += tsans(ox, hy, nUn > 1 ? ('PESO — por unidad · total (' + nUn + ' u.)') : 'PESO POR UNIDAD', pl, 'start', P, 700, P.accent);
    hy += ph;
    pm.forEach(function (x) {
      g += txt(ox + 6, hy, x.mat, pf, 'start', P, false, '400') + txt(wU, hy, fmt1(x.kgU) + ' kg', pf, 'start', P, false, '700');
      if (nUn > 1) g += txt(wT, hy, fmt1(x.kgT) + ' kg', pf, 'start', P, false, '700');
      hy += ph;
    });
  }
  return { svg: g, h: hy - oy };
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
  r.tipoTexto = 'Doble faz · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') +
    (r.chapaMarco === r.chapaHoja ? ' · N°' + r.chapaHoja : ' · marco N°' + r.chapaMarco + ' / hoja N°' + r.chapaHoja);
  var mano = params.drawMano || 'izq';
  var M = PG.m, full = PG.w - 2 * M;

  // ===================== HOJA 1: dibujos =====================
  var g1 = '';
  g1 += cajetin(r, M, M, full, 185, P, logo);
  var reb = r.rebajeHoja;
  // --- fila superior: frente (izq) + ① Marco (der) ---
  var kf = Math.min(520 / r.W, 880 / (r.H + (r.altoPanoFijo || 0)));
  g1 += frente(r, M + 150, 330, P, mano, kf);
  g1 += bloquePerfil(M + 950, 320, 760, 960, '① Marco',
    'muro ' + r.muro + ' = esp. ' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · N°' + (r.chapaMarco || r.chapa) + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  // --- cuadrícula inferior (② ③ ④ ⑤), centrada, sin agrandar ---
  var by = 1360, gap = 70;
  var wTop = 650 + gap + 660, x2 = M + (full - wTop) / 2;
  g1 += cruzExt(r, x2, by, 650, 1090, P);
  g1 += cruzInt(r, x2 + 650 + gap, by, 660, 1090, P);
  var by2 = by + 1110;
  var wBot = 640 + gap + 660, x4 = M + (full - wBot) / 2;
  g1 += bloquePerfil(x4, by2, 640, 390, '④ Refuerzo (U)',
    r.nRef + '/hoja · largo ' + r.despiece[4].largo + ' · desarr. ' + r.refAncho,
    [reb, 25, reb], ['L', 'L'], [0, -1], P);
  g1 += bloquePerfil(x4 + 640 + gap, by2, 660, 390, '⑤ Perfil inferior (U)',
    'largo ' + r.p5Largo + ' (int−4) · desarr. ' + r.p5Ancho,
    [20, reb, 20], ['L', 'L'], [0, -1], P);

  // ===================== HOJA 2: despiece (letra grande) =====================
  var g2 = '';
  g2 += cajetin(r, M, M, full, 185, P, logo);
  var ty = 345;
  g2 += tsans(M, ty - 24, 'DESPIECE — ' + r.total + ' puertas (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)', F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40);
  g2 += dt.svg;
  var ay = ty + dt.h + 56;
  if (r.altoPanoFijo > 0) { var cjb = cajonPanoFijoBloque(r, M, ay, full, P); g2 += cjb.svg; ay = cjb.bottom + 56; }
  g2 += bloqueAccesorios(r, M, ay, P, full);

  return [
    pagina(g1, P, 'Perfiles fuera de escala: las medidas son las longitudes de cada tramo (mm). Plana/desarrollo = medida de la chapa a cortar. Hoja 1 de 2. Imprimir en A4.'),
    pagina(g2, P, 'Despiece y pesos. Hoja 2 de 2. Imprimir en A4.')
  ];
}

/* --- Frente del marco (sin hoja): vano + apertura --- */
function frenteMarco(r, ox, oy, P, k) {
  var W = r.W * k, H = r.H * k, pf = (r.altoPanoFijo || 0) * k, g = '';
  var topY = oy, y0 = oy + pf;   // topY = marco sup · y0 = techo del cajón
  g += tsans(ox, topY - 18, 'FRENTE (marco)', F.h2, 'start', P, 700, P.accent);
  if (pf > 0) {
    g += rect(ox, topY, W, pf, SW.thick, P);
    var gx = ox + 30 * k, gy = topY + 30 * k, gw = W - 60 * k, gh = pf - 30 * k;
    g += rect(gx, gy, gw, gh, SW.thin, P, P.hatch);
    g += line(gx, gy, gx + gw, gy + gh, SW.dim, P, '14 10', P.accent);
    g += line(gx, gy + gh, gx + gw, gy, SW.dim, P, '14 10', P.accent);
    g += tsans(ox + W / 2, gy + 22, 'VIDRIO', F.ty, 'middle', P, 600, P.muted || P.text);
    g += line(ox + 30 * k, y0, ox + W - 30 * k, y0, SW.thick, P);   // cajón
    g += dimV(topY, y0, ox - 60, String(r.altoPanoFijo), P, ox);
  }
  g += rect(ox, y0, W, H, SW.thick, P);
  g += rect(ox + 30 * k, y0 + 30 * k, W - 60 * k, H - 30 * k, SW.thick, P);  // apertura (luz)
  var floorY = y0 + H, ent = (r.enterrar || 0) * k, frameBot = floorY + ent;
  g += parteEnterrada(ox, ox + W, floorY, ent, 30 * k, P);                   // jambas bajo el NPT (para enterrar)
  g += nivelPiso(ox, ox + W, floorY, P, 'left');                             // etiqueta a la izquierda (el lateral va a la derecha)
  g += dimH(ox, ox + W, frameBot + 64, String(r.W), P, frameBot);
  g += dimV(y0, floorY, ox - 60, String(r.H), P, ox);
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
  // --- 1) despiece a ANCHO COMPLETO arriba (letra grande) ---
  var ty = 345;
  g += tsans(M, ty - 24, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40);
  g += dt.svg;
  var ny = ty + dt.h + 56;
  // --- 2) fila de dibujos: frente del vano + lateral (izq) + ① Marco (der) ---
  var topY = ny, bandH = r.altoPanoFijo > 0 ? 820 : 1000;
  var kf = Math.min(360 / r.W, (bandH - 120) / (r.H + (r.altoPanoFijo || 0)));
  var fx = M + 120;
  g += frenteMarco(r, fx, topY + 50, P, kf);
  g += lateral(r, fx + r.W * kf + 70, topY + 50, P, kf);
  var bw = 880, bx = M + full - bw;
  g += bloquePerfil(bx, topY, bw, bandH, '① Marco',
    'muro ' + r.muro + ' = esp. ' + r.marco.espesor + ' · ' + (r.tipoHoja === 'madera' ? 'madera' : 'metálica') + ' · N°' + (r.chapaMarco || r.chapa) + ' · desarr. ' + r.marco.desarrollo,
    r.marco.segs, r.marco.turns, r.marco.h0, P);
  // --- 3) cajón del paño fijo (si corresponde) + accesorios al final ---
  var ny2 = topY + bandH + 70;
  if (r.altoPanoFijo > 0) { var cjb = cajonPanoFijoBloque(r, M, ny2, full, P, 470); g += cjb.svg; ny2 = cjb.bottom + 56; }
  g += bloqueAccesorios(r, M, ny2, P, full);
  return [pagina(g, P, 'Perfil fuera de escala: las medidas son las longitudes de cada tramo (mm). Desarrollo = medida de la chapa a cortar. Imprimir en A4.')];
}

/* --- Hoja A4: CREADOR DE PLEGADOS (nivel 1) --- */
function generarPlegado(params, P, logo) {
  var r = calcularPlegado(params);
  r.rotulo = params.rotulo; r.herrajes = [];
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  var ty = 345;
  if (r.nTramos >= 2) {
    g += bloquePerfil(M, ty, full, 1000, (r.nombre || 'Plegado'),
      'desarrollo ' + r.dev + ' · largo ' + (r.largoPerfil || '—') + ' · N°' + r.chapa + ' · ' + r.nTramos + ' tramos (dobleces 90°)',
      r.segs, r.turns, r.h0, P);
    ty += 1000 + 56;
  } else {
    g += tsans(M + 10, ty + 30, 'Agregá al menos 2 tramos para ver el plegado.', F.h2, 'start', P, 600, P.muted || P.text);
    ty += 90;
  }
  g += tsans(M, ty - 24, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40);
  g += dt.svg;
  return [pagina(g, P, 'Creador de plegados (nivel 1). Dobleces a 90°; la deducción por ángulo es trabajo aparte. Desarrollo = chapa a cortar. Imprimir en A4.')];
}

/* --- Hoja A4: BANDEJA (tipo del creador): dos secciones --- */
function generarBandeja(params, P, logo) {
  var r = calcularBandeja(params);
  r.rotulo = params.rotulo; r.herrajes = [];
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  function orient(sec, sentido) {
    if (sentido === 'abajo') return { turns: sec.turns.map(function (t) { return t === 'L' ? 'R' : 'L'; }), h0: [0, 1] };
    return { turns: sec.turns, h0: sec.h0 };
  }
  // Despiece anclado al pie; el conjunto se estira para llenar el resto de la hoja.
  var despH = despieceTabla(r, M, 0, P, full, 40).h;
  var tableTop = PG.h - M - 46 - despH, despTitleY = tableTop - 16, boxTop = M + 185 + 24;
  if (r.secAncho.n >= 2 && r.secLargo.n >= 2) {
    var chapaLineY = despTitleY - 54, boxBottom = chapaLineY - 40, bh = boxBottom - boxTop;
    g += rect(M, boxTop, full, bh, SW.thin, P);
    g += tsans(M + 24, boxTop + 42, (r.nombre) + ' — conjunto (ancho + largo cruzados)', F.h2, 'start', P, 700, P.accent);
    g += tsans(M + 24, boxTop + 72, 'ancho desarr. ' + r.secAncho.dev + ' · largo desarr. ' + r.secLargo.dev + ' · se cruzan en el fondo', F.ty, 'start', P, 400, P.muted || P.text);
    var cx = M + full / 2, cy = boxTop + 110 + (bh - 110) / 2;
    var box = { w: full - 140, h: bh - 200 };
    var oA = orient(r.secAncho, params.sentidoAncho), oB = orient(r.secLargo, params.sentidoLargo);
    // escala compartida y proporcional: ambas secciones al mismo k, para que el tamaño dé idea del largo real
    function fitK(segs, turns, h0, bx) {
      var p = turtlePts(segs.map(function (s) { return visSeccion(s, true); }), turns, h0);
      var xs = p.map(function (q) { return q.x; }), ys = p.map(function (q) { return q.y; });
      var w = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) || 1, hh = (Math.max.apply(null, ys) - Math.min.apply(null, ys)) || 1;
      return Math.min((bx.w - 156) / w, (bx.h - 156) / hh);
    }
    var kShared = Math.min(fitK(r.secLargo.segs, oB.turns, oB.h0, box), fitK(r.secAncho.segs, oA.turns, oA.h0, { w: box.h, h: box.w }));
    g += seccion(r.secLargo.segs, oB.turns, oB.h0, cx, cy, box, P, { prop: true, k: kShared });         // largo (vertical)
    g += '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">' +
      seccion(r.secAncho.segs, oA.turns, oA.h0, cx, cy, { w: box.h, h: box.w }, P, { prop: true, k: kShared }) + '</g>';   // ancho girado 90° (horizontal)
    g += tsans(M, chapaLineY, 'Chapa plana a cortar: ' + r.secAncho.dev + ' × ' + r.secLargo.dev + ' mm (ancho × largo, con muescas en las esquinas).', F.h2, 'start', P, 600, P.text);
  } else {
    g += tsans(M + 10, boxTop + 40, 'Cargá al menos 2 tramos en cada sección.', F.h2, 'start', P, 600, P.muted || P.text);
  }
  g += tsans(M, despTitleY, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  g += despieceTabla(r, M, tableTop, P, full, 40).svg;
  return [pagina(g, P, 'Bandeja (creador). Chapa plana = ancho × largo (desarrollos de cada sección). Dobleces a 90°. Imprimir en A4.')];
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
  var ent = (r.enterrar || 0) * k, frameBot = floorY + ent;
  g += parteEnterrada(ox, ox + mw, floorY, ent, cantoK, P);                // jambas bajo el NPT (para enterrar)
  g += nivelPiso(ox, ox + mw, floorY, P);
  g += dimH(ox, ox + mw, frameBot + 64, String(r.anchoMarco), P, frameBot);   // ancho del estructural
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
  // --- 1) despiece a ANCHO COMPLETO arriba (letra grande) ---
  var ty = 345;
  g += tsans(M, ty - 24, (r.nHojas === 2 ? 'DESPIECE — ' + r.total + ' gabinetes (doble hoja)' : 'DESPIECE — ' + r.total + ' gabinetes (' + r.cantIzq + ' izq · ' + r.cantDer + ' der)'), F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40);
  g += dt.svg;
  var ny = ty + dt.h + 56;
  // --- 2) fila de dibujos: frente (izq) + ② P1 + ③ P2 (der) ---
  var topY = ny, bandH = 900;
  var kf = Math.min(460 / r.anchoMarco, (bandH - 100) / r.altoMarco);
  g += frenteGabinete(r, M + 150, topY + 40, P, kf, mano);
  var xE = M + 150 + r.anchoMarco * kf + 90, gap = 40, bw = (M + full - xE - gap) / 2;   // cajas tras el frente (ancho real)
  g += secGabP1(r, xE, topY, bw, bandH, P);
  g += secGabP2(r, xE + bw + gap, topY, bw, bandH, P);
  // --- 3) accesorios al final ---
  g += bloqueAccesorios(r, M, topY + bandH + 80, P, full);
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
  // agarre de la tapa: manija (si se eligió, ≤500) o tirador (default)
  if (r.agarre === 'manija') {
    g += agarrePlantaManija(cxm, cym, r.extA >= r.extB, P);
    g += tsans(cxm + 44, cym - 16, 'manija', 17, 'start', P, 600, P.accent);
  } else {
    // tiradores (bulón para izar): 1 centrado, o 2 en los tercios del lado largo (marco > 1,2 m)
    var tir = [];
    if (r.nTir >= 2) {
      if (r.extA >= r.extB) { tir.push([ox + eA / 3, cym]); tir.push([ox + 2 * eA / 3, cym]); }
      else { tir.push([cxm, oy + eB / 3]); tir.push([cxm, oy + 2 * eB / 3]); }
    } else { tir.push([cxm, cym]); }
    tir.forEach(function (c) { g += agarrePlantaTirador(c[0], c[1], P); });
    g += tsans(tir[0][0] + 22, tir[0][1] - 20, 'tirador', 17, 'start', P, 600, P.accent);
  }
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
  // agarre de la tapa: manija (∩) si se eligió (≤500), o tirador(es) (bulón) por default
  if (r.agarre === 'manija') {
    g += manijaCALF(cx, bTop, seat, P);
    g += txt(cx + 58, bTop - 92, 'manija ⌀16', F.sm, 'start', P, false, '600');
  } else {
    var hY = bTop - 30, sp = bXR - bXL, tcs = r.nTir >= 2 ? [bXL + sp / 3, bXL + 2 * sp / 3] : [cx];
    tcs.forEach(function (tcx) { g += agarreCorteTirador(tcx, hY, seat, P); });
    g += txt(tcs[0] + 30, hY - 2, 'tirador', F.sm, 'start', P, false, '600');
  }
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
  // --- 1) despiece a ANCHO COMPLETO arriba (letra grande) ---
  var ty = 345;
  g += tsans(M, ty - 24, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40);
  g += dt.svg;
  var ny = ty + dt.h + 40;
  g += tsans(M, ny, '+ Malla electrosoldada y relleno de hormigón en obra.', F.ty, 'start', P, 500, P.muted || P.text);
  // --- 2) fila de dibujos: planta (izq) + corte + bandeja (der) ---
  var topY = ny + 56, bandH = 760;
  var kf = Math.min(360 / r.extA, 620 / r.extB), eB = r.extB * kf;
  g += plantaCamara(r, M + 130, topY + (bandH - eB) / 2, P, kf);
  var xE = 620, bw = 685, gap = 40;
  g += corteCamara(r, xE, topY, bw, bandH, P);
  g += secBandeja(r, xE + bw + gap, topY, bw, bandH, P);
  // --- 3) accesorios al final ---
  g += bloqueAccesorios(r, M, topY + bandH + 70, P, full);
  return [pagina(g, P, 'Plano preliminar. Cotas en mm. Ángulo comprado. Desarrollo = chapa a cortar (deducción = espesor redondeado al entero menor, por doblez). Imprimir en A4.')];
}

/* ===========================================================================
   CÁMARA TIPO CALF — dibujo (marco plegado 1 + tapa plegado 2 + chapa encofrado)
   =========================================================================== */
/* Planta: marco (banda ext/int con encuentros a 45°) + hueco interior + chapa con malla + manijas */
function plantaCALF(r, ox, oy, P, k) {
  var proy = r.proy || 60, bw = proy * k, g = '';
  var eA = (r.intA + 2 * proy) * k, eB = (r.intB + 2 * proy) * k;          // exterior del marco
  var ix = ox + bw, iy = oy + bw, iA = r.intA * k, iB = r.intB * k;        // cara interior de la pestaña = hueco
  g += tsans(ox, oy - 18, 'PLANTA', F.h2, 'start', P, 700, P.accent);
  g += rect(ox, oy, eA, eB, SW.thick, P);                                  // marco: cara exterior
  g += rect(ix, iy, iA, iB, SW.thick, P);                                  // marco: cara interior (= medida interior)
  g += line(ox, oy, ix, iy, SW.thin, P) + line(ox + eA, oy, ix + iA, iy, SW.thin, P)
     + line(ox, oy + eB, ix, iy + iB, SW.thin, P) + line(ox + eA, oy + eB, ix + iA, iy + iB, SW.thin, P);  // encuentros a 45°
  var cA = r.chapaA * k, cB = r.chapaB * k, cx0 = ix + (iA - cA) / 2, cy0 = iy + (iB - cB) / 2;
  g += '<rect x="' + cx0.toFixed(1) + '" y="' + cy0.toFixed(1) + '" width="' + cA.toFixed(1) + '" height="' + cB.toFixed(1) + '" fill="none" stroke="' + P.accent + '" stroke-width="' + SW.dim + '" stroke-dasharray="16 10"/>';  // chapa de encofrado
  var mstep = Math.max(26, 110 * k), xx, yy;                               // malla sobre la chapa
  for (xx = cx0 + mstep; xx < cx0 + cA - 2; xx += mstep) g += line(xx, cy0, xx, cy0 + cB, SW.dim, P, 0, P.muted || P.line);
  for (yy = cy0 + mstep; yy < cy0 + cB - 2; yy += mstep) g += line(cx0, yy, cx0 + cA, yy, SW.dim, P, 0, P.muted || P.line);
  var cxm = ix + iA / 2, cym = iy + iB / 2, horizLong = r.intA >= r.intB;
  // agarre de la tapa: tirador (bulón) si se eligió (≤500), o manija (U invertida) por default
  if (r.agarre === 'tirador') {
    g += agarrePlantaTirador(cxm, cym, P);
    g += tsans(cxm + 22, cym - 20, 'tirador', 17, 'start', P, 600, P.accent);
  } else {
    var man = [];
    if (r.nMan >= 2) {
      if (horizLong) { man.push([ix + iA / 3, cym]); man.push([ix + 2 * iA / 3, cym]); }
      else { man.push([cxm, iy + iB / 3]); man.push([cxm, iy + 2 * iB / 3]); }
    } else man.push([cxm, cym]);
    man.forEach(function (c) { g += agarrePlantaManija(c[0], c[1], horizLong, P); });
    g += tsans(man[0][0] + 44, man[0][1] - 16, 'manija', 17, 'start', P, 600, P.accent);
  }
  var floorY = oy + eB;                                                    // cota de la MEDIDA INTERIOR (cara interior)
  g += dimH(ix, ix + iA, floorY + 95, String(Math.round(r.intA)), P, iy + iB);
  g += dimV(iy, iy + iB, ox - 95, String(Math.round(r.intB)), P, ix);
  g += tsans(ox - 95, oy - 14, 'int', 17, 'middle', P, 600, P.accent);
  return g;
}

/* Corte de armado: marco (plegado 1) contra la pared + tapa (plegado 2) + chapa + malla/hormigón + manija */
function corteCALF(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '① Corte de armado', 'marco (plegado 1) + tapa (plegado 2, azul) + chapa de encofrado · malla + hormigón · fuera de escala', P);
  var cx = ox + w / 2, sc = r.usaNuevo ? 1.5 : 2.3, AC = P.accent;
  var esp = Math.max(8, r.esp * sc);
  var vertM = (r.p1Vert || 57) * sc, vertT = (r.p2Vert || 57) * sc;
  var p1 = (r.p1Pest || 54) * sc, p2 = (r.p2Pest || 61) * sc, pie = (r.p2Pie || 30) * sc, pieM = (r.p1Pie || 0) * sc;
  var AW = w * 0.46, xWL = cx - AW / 2, xWR = cx + AW / 2;
  var topY = oy + h * 0.40, botMY = topY + vertM;
  var inc = 10 * Math.PI / 180, cos = Math.cos(inc), sin = Math.sin(inc);
  var wallW = 72;                                                            // muro a cada lado
  g += rect(xWL - wallW, topY, wallW, vertM + 46, SW.thin, P, P.hatch) + rect(xWR, topY, wallW, vertM + 46, SW.thin, P, P.hatch);
  g += txt(xWL - wallW / 2, topY + vertM + 72, 'muro', F.sm, 'middle', P, false, '500', P.muted || P.text);
  g += txt(xWR + wallW / 2, topY + vertM + 72, 'muro', F.sm, 'middle', P, false, '500', P.muted || P.text);
  // marco: vertical + pestaña (arriba, −10°) + pie (abajo, adentro) cuando es reglamentario
  g += line(xWL, topY, xWL, botMY, SW.thick, P) + line(xWL, topY, xWL - p1 * cos, topY + p1 * sin, SW.thick, P);
  g += line(xWR, topY, xWR, botMY, SW.thick, P) + line(xWR, topY, xWR + p1 * cos, topY + p1 * sin, SW.thick, P);
  if (pieM) g += line(xWL, botMY, xWL + pieM, botMY, SW.thick, P) + line(xWR, botMY, xWR - pieM, botMY, SW.thick, P);  // pie del marco (adentro)
  // tapa plegado 2 (azul): pestaña arriba + vertical + pie abajo (adentro), anidada con la luz
  var gap = r.usaNuevo ? r.luz * sc : esp, tL = xWL + gap, tR = xWR - gap, tTop = topY - 6, tBot = tTop + vertT;
  g += line(tL, tTop, tL, tBot, SW.thick, P, 0, AC) + line(tL, tBot, tL + pie, tBot, SW.thick, P, 0, AC) + line(tL, tTop, tL - p2 * cos, tTop + p2 * sin, SW.thick, P, 0, AC);
  g += line(tR, tTop, tR, tBot, SW.thick, P, 0, AC) + line(tR, tBot, tR - pie, tBot, SW.thick, P, 0, AC) + line(tR, tTop, tR + p2 * cos, tTop + p2 * sin, SW.thick, P, 0, AC);
  if (r.usaNuevo) g += txt((xWL + tL) / 2, tTop + 34, 'luz ' + r.luz, 15, 'middle', P, false, '600', AC);
  // chapa de encofrado apoyada sobre el pie de la tapa
  var chL = tL + 6, chR = tR - 6, chY = tBot - esp * 0.6;
  g += line(chL, chY, chR, chY, SW.thick, P);
  // malla + hormigón por encima de la chapa (llega casi al extremo de la tapa)
  var my = chY - vertM * 0.30, dd;
  for (dd = tL + 16; dd < tR - 10; dd += 48) g += '<circle cx="' + dd.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="5" fill="' + P.line + '"/>';
  g += line(tL + 12, my, tR - 12, my, SW.dim, P, 0, P.dim || P.line);
  g += txt(ox + 40, topY - 64, 'malla + hormigón (en obra)', F.sm, 'start', P, false, '500', P.muted || P.text);
  g += txt(cx, chY + 92, 'chapa de encofrado · tuerca de tope', F.sm, 'middle', P, false, '600');
  // agarre de la tapa: tirador (bulón central) si se eligió (≤500), o manija(s) ⌀16 en ∩ por default
  if (r.agarre === 'tirador') {
    g += agarreCorteTirador(cx, topY - 48, chY, P);
    g += txt(cx + 40, topY - 48, 'tirador (bulón)', F.sm, 'start', P, false, '600');
    g += txt(cx + 52, chY + 11, 'juego', 16, 'start', P, false, '500', P.muted || P.text);
  } else {
    var sp = tR - tL, mcs = r.nMan >= 2 ? [tL + sp / 3, tL + 2 * sp / 3] : [cx];
    mcs.forEach(function (m) { g += manijaCALF(m, topY - 4, chY, P); });
    g += txt(mcs[mcs.length - 1] + 52, chY + 11, 'juego', 16, 'start', P, false, '500', P.muted || P.text);
    g += txt(mcs[mcs.length - 1] + 58, topY - 92, 'manija ⌀16', F.sm, 'start', P, false, '600');
    g += txt(mcs[mcs.length - 1] + 58, topY - 66, 'desliza en caño 3/4"', 17, 'start', P, false, '500', P.muted || P.text);
  }
  g += txt(xWL - p1 * cos * 0.5, topY + p1 * sin * 0.5 - 12, String(r.p1Pest || 54), F.sm, 'middle', P, false, '600');
  g += txt(tR + p2 * cos * 0.5 + 6, tTop + p2 * sin * 0.5 - 8, String(r.p2Pest || 61), F.sm, 'start', P, false, '600', AC);
  g += tsans(ox + 24, oy + h - 20, 'plegado 1 = marco · plegado 2 = tapa (azul)', F.ty, 'start', P, 500, P.muted || P.text);
  return g;
}

/* Manija ⌀16 en ∩: desliza en caño 3/4" soldado a la chapa, atraviesa la chapa y topa con una tuerca
   por debajo. El juego entre la tuerca y la chapa es la carrera de levante. */
function manijaCALF(mx, surfY, chY, P) {
  var hw = 30, r = 15, archTop = surfY - 68, sw2 = 7, g = '';
  var nutGap = 22, nutH = 15, nutW = 24, legBot = chY + nutGap + nutH + 10, slTop = chY - 66;
  [mx - hw, mx + hw].forEach(function (lx) {   // caño 3/4" soldado a la chapa (la pata desliza adentro)
    g += line(lx - sw2, slTop, lx - sw2, chY, SW.thin, P) + line(lx + sw2, slTop, lx + sw2, chY, SW.thin, P);
  });
  g += '<path d="M' + (mx - hw) + ' ' + legBot + ' L' + (mx - hw) + ' ' + (archTop + r) + ' Q' + (mx - hw) + ' ' + archTop + ' ' + (mx - hw + r) + ' ' + archTop + ' L' + (mx + hw - r) + ' ' + archTop + ' Q' + (mx + hw) + ' ' + archTop + ' ' + (mx + hw) + ' ' + (archTop + r) + ' L' + (mx + hw) + ' ' + legBot + '" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thick + '" stroke-linecap="round" stroke-linejoin="round"/>';
  [mx - hw, mx + hw].forEach(function (lx) {   // tuerca de tope por debajo de la chapa
    g += rect(lx - nutW / 2, chY + nutGap, nutW, nutH, SW.thin, P, P.line);
    g += line(lx + nutW / 2 + 4, chY, lx + nutW / 2 + 4, chY + nutGap, SW.dim, P, 0, P.dim || P.line);  // marca del juego
  });
  return g;
}

/* ---- Agarre de la tapa: manija (∩) o tirador (bulón central). Cámaras ≤500 ---- */
/* Tirador (bulón central para izar): vástago + cabeza arriba + tuerca en la superficie */
function agarreCorteTirador(cx, headY, surfY, P) {
  var g = line(cx, surfY + 26, cx, headY, SW.thick, P);
  g += '<rect x="' + (cx - 18).toFixed(1) + '" y="' + (headY - 13).toFixed(1) + '" width="36" height="13" fill="' + P.line + '"/>';   // cabeza del bulón
  g += '<rect x="' + (cx - 13).toFixed(1) + '" y="' + surfY.toFixed(1) + '" width="26" height="14" fill="none" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>';  // tuerca de tope
  return g;
}
/* Tirador en planta: círculo con cruz (bulón visto desde arriba) */
function agarrePlantaTirador(cx, cy, P) {
  return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="12" fill="' + P.paper + '" stroke="' + P.line + '" stroke-width="' + SW.thin + '"/>'
    + line(cx - 19, cy, cx + 19, cy, SW.thin, P) + line(cx, cy - 19, cx, cy + 19, SW.thin, P);
}
/* Manija en planta: barra (U invertida vista desde arriba) con patas a los extremos */
function agarrePlantaManija(cx, cy, horizLong, P) {
  var hw2 = 34, ft = 13;
  if (horizLong) return line(cx - hw2, cy, cx + hw2, cy, SW.thick, P) + line(cx - hw2, cy - ft, cx - hw2, cy + ft, SW.thin, P) + line(cx + hw2, cy - ft, cx + hw2, cy + ft, SW.thin, P);
  return line(cx, cy - hw2, cx, cy + hw2, SW.thick, P) + line(cx - ft, cy - hw2, cx + ft, cy - hw2, SW.thin, P) + line(cx - ft, cy + hw2, cx + ft, cy + hw2, SW.thin, P);
}

/* ② Plegado 1 (marco): pestaña 54 (10°) + vertical 57 */
function secCALFp1(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '② Plegado 1 — marco', 'chapa ' + r.espTxt + ' · desarrollo ' + r.p1Des, P);
  var sc = r.usaNuevo ? 1.6 : 2.3, vert = r.p1Vert * sc, pest = r.p1Pest * sc, pie = (r.p1Pie || 0) * sc;
  var cornerX = ox + w * (r.usaNuevo ? 0.46 : 0.58), topY = oy + h * (r.usaNuevo ? 0.26 : 0.34);
  var inc = 10 * Math.PI / 180, cos = Math.cos(inc), sin = Math.sin(inc), by = topY + vert;
  g += line(cornerX, topY, cornerX, by, SW.thick, P);                              // vertical
  g += line(cornerX, topY, cornerX - pest * cos, topY + pest * sin, SW.thick, P);  // pestaña arriba (−10°)
  g += txt(cornerX + 16, topY + vert / 2, String(r.p1Vert), F.num, 'start', P, true, '600');
  g += txt(cornerX - pest * cos * 0.5, topY + pest * sin * 0.5 - 14, String(r.p1Pest), F.num, 'middle', P, false, '600');
  if (pie) {
    g += line(cornerX, by, cornerX + pie, by, SW.thick, P);                        // pie abajo (adentro)
    g += txt(cornerX + pie * 0.5, by + 26, String(r.p1Pie), F.num, 'middle', P, false, '600');
  }
  var cap = r.usaNuevo ? ('pie ' + r.p1Pie + ' · vert. ' + r.p1Vert + ' · pestaña ' + r.p1Pest + ' a 10°') : ('desarrollo ' + r.p1Des + ' · pestaña a 10°');
  g += tsans(ox + w - 26, oy + h - 20, cap, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* ③ Plegado 2 (tapa): pestaña 61 (10°) + vertical 57 + pie 30 */
function secCALFp2(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '③ Plegado 2 — tapa', 'chapa ' + r.espTxt + ' · desarrollo ' + r.p2Des, P);
  var sc = r.usaNuevo ? 1.6 : 2.0, vert = r.p2Vert * sc, pest = r.p2Pest * sc, pie = r.p2Pie * sc;
  var topX = ox + w * (r.usaNuevo ? 0.46 : 0.50), topY = oy + h * (r.usaNuevo ? 0.26 : 0.28);
  var inc = 10 * Math.PI / 180, cos = Math.cos(inc), sin = Math.sin(inc), by = topY + vert;
  g += line(topX, topY, topX, by, SW.thick, P);                                   // vertical
  g += line(topX, topY, topX - pest * cos, topY + pest * sin, SW.thick, P);        // pestaña sup a −10°
  g += line(topX, by, topX + pie, by, SW.thick, P);                               // pie inferior hacia adentro
  g += txt(topX + 16, topY + vert / 2, String(r.p2Vert), F.num, 'start', P, true, '600');
  g += txt(topX - pest * cos * 0.5, topY + pest * sin * 0.5 - 14, String(r.p2Pest), F.num, 'middle', P, false, '600');
  g += txt(topX + pie * 0.5, by + 28, String(r.p2Pie), F.num, 'middle', P, false, '600');
  var cap = r.usaNuevo ? ('pie ' + r.p2Pie + ' · vert. ' + r.p2Vert + ' · pestaña ' + r.p2Pest + ' a 10°') : ('desarrollo ' + r.p2Des + ' · pestaña a 10°');
  g += tsans(ox + w - 26, oy + h - 20, cap, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* Hoja A4: CÁMARA TIPO CALF */
function generarCALF(params, P, logo) {
  var r = calcularCALF(params);
  r.rotulo = params.rotulo; r.herrajes = params.herrajes || [];
  var M = PG.m, full = PG.w - 2 * M, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  // --- 1) despiece a ANCHO COMPLETO arriba (letra grande) ---
  var ty = 345;
  g += tsans(M, ty - 24, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40); g += dt.svg;
  var ny = ty + dt.h + 40;
  g += tsans(M, ny, '+ Malla electrosoldada y hormigón por encima de la chapa, en obra.', F.ty, 'start', P, 500, P.muted || P.text);
  // --- 2) corte de armado a ancho completo ---
  var cy = ny + 56;
  g += corteCALF(r, M, cy, full, 460, P);
  // --- 3) fila: planta (izq) + plegado 1 + plegado 2 ---
  var ry = cy + 460 + 50, rowH = 430;
  var eAx = r.intA + 2 * r.proy, eBx = r.intB + 2 * r.proy;                 // exterior del marco (para escalar la planta)
  var kf = Math.min(340 / eAx, (rowH - 155) / eBx);                         // deja lugar para título (arriba) y cota (abajo)
  g += plantaCALF(r, M + 150, ry + 40, P, kf);
  var xP = 700, bw = 645, gap = 40;
  g += secCALFp1(r, xP, ry, bw, rowH, P);
  g += secCALFp2(r, xP + bw + gap, ry, bw, rowH, P);
  // --- 4) accesorios al final ---
  g += bloqueAccesorios(r, M, ry + rowH + 60, P, full);
  var pie = r.usaNuevo
    ? 'Plano preliminar. Cotas en mm. Plegado grande (mismo plegado que el chico: pestaña + vertical + pie), chapa 3/16", luz marco↔tapa 7 mm y tapa↔chapa 3 mm por lado. Desarrollo con deducción por pliegue. Imprimir en A4.'
    : 'Plano preliminar. Cotas en mm. Plegado estándar en chapa 1/8" (<800). Largo = int + 2·esp + 2·60 + 2·10, a la decena (encuentro a 45°). Chapa de encofrado N°16/N°14 según el lado mayor. Imprimir en A4.';
  return [pagina(g, P, pie)];
}

/* ===========================================================================
   CÁMARA PLUVIAL — dibujo
   =========================================================================== */
/* Anclaje de amure en "Y": tallo desde el borde + horquilla hacia afuera */
function anchorY(px, py, dx, dy, P) {
  var stem = 30, pr = 26, spr = 0.6;
  var bx = px + dx * stem, by = py + dy * stem, perpx = -dy, perpy = dx;
  var a1x = bx + dx * pr + perpx * pr * spr, a1y = by + dy * pr + perpy * pr * spr;
  var a2x = bx + dx * pr - perpx * pr * spr, a2y = by + dy * pr - perpy * pr * spr;
  return line(px, py, bx, by, SW.thin, P) + line(bx, by, a1x, a1y, SW.thin, P) + line(bx, by, a2x, a2y, SW.thin, P);
}

/* Planta: marco L (ext + hueco) + rejilla + anclajes de amure "Y" en el perímetro */
function plantaPluvial(r, ox, oy, P, k) {
  var eA = r.extA * k, eB = r.extB * k, g = '';
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
  [1 / 3, 2 / 3].forEach(function (f) {                                   // anclajes de amure: 2 por lado
    g += anchorY(ox + eA * f, oy, 0, -1, P) + anchorY(ox + eA * f, oy + eB, 0, 1, P);
    g += anchorY(ox, oy + eB * f, -1, 0, P) + anchorY(ox + eA, oy + eB * f, 1, 0, P);
  });
  var floorY = oy + eB, cv = 170;                                         // cotas por fuera de los anclajes
  if (r.modo === 'int') {
    g += dimH(ix, ix + iw, floorY + cv, String(Math.round(r.intA)), P, iy + ih);
    g += dimV(iy, iy + ih, ox - cv, String(Math.round(r.intB)), P, ix);
    g += tsans(ox - cv, oy - 14, 'int', 17, 'middle', P, 600, P.accent);
  } else {
    g += dimH(ox, ox + eA, floorY + cv, String(Math.round(r.extA)), P, floorY);
    g += dimV(oy, oy + eB, ox - cv, String(Math.round(r.extB)), P, ox);
    g += tsans(ox - cv, oy - 14, 'ext', 17, 'middle', P, 600, P.accent);
  }
  return g;
}

/* ① Marco: plegado en L 42×42 */
function secPluvMarco(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '① Marco (plegado L)', 'chapa ' + r.espTxt + ' · L ' + r.leg + '×' + r.leg + ' · plana ' + r.dev, P);
  var legH = 230, legV = 230, t = 18, x0 = ox + (w - legH) / 2 - 10, y0 = oy + 130;
  g += '<path d="M' + x0 + ' ' + y0 + ' L' + (x0 + t) + ' ' + y0 + ' L' + (x0 + t) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV - t) + ' L' + (x0 + legH) + ' ' + (y0 + legV) + ' L' + x0 + ' ' + (y0 + legV) + ' Z" fill="' + (P.hatch || 'none') + '" stroke="' + P.line + '" stroke-width="' + SW.thick + '"/>';
  g += txt(x0 - 16, y0 + legV / 2, String(r.leg), F.num, 'end', P, true, '600');
  g += txt(x0 + legH * 0.6, y0 + legV + 22, String(r.leg), F.num, 'middle', P, false, '600');
  g += tsans(ox + w - 26, oy + h - 20, 'desarrollo ' + r.legFlat + ' + ' + r.legFlat + ' = ' + r.dev, F.ty, 'end', P, 700, P.accent);
  return g;
}

/* ② Corte: rejilla apoyada sobre el marco L (⌞, igual que ①) + anclaje "Y" invertida a 45° */
function cortePluvial(r, ox, oy, w, h, P) {
  var g = gabBox(ox, oy, w, h, '② Corte', 'rejilla apoyada sobre el marco · anclajes de amure', P);
  var cx = ox + w / 2, span = w * 0.56, hw = span / 2, lx = cx - hw, rx = cx + hw;
  var sc = 1.8, alaV = 42 * sc, foot = 42 * sc, planH = 38.1 * sc, barW = 4.76 * sc * 1.6, i;  // 1½"×3/16" de canto
  var topY = oy + h * 0.34, botY = topY + alaV, planBot = topY + planH;     // nivel superior común
  var luz = 26, rLx = lx + luz, rRx = rx - luz, rejSpan = rRx - rLx;        // luz visible rejilla↔marco
  g += line(rLx, topY, rRx, topY, SW.thin, P) + line(rLx, planBot, rRx, planBot, SW.thin, P);  // banda rejilla (1½")
  var nb = 8, stp = rejSpan / (nb - 1);                                   // planchuelas de canto (en corte)
  for (i = 0; i < nb; i++) { var bx = rLx + i * stp; g += rect(bx - barW / 2, topY, barW, planH, SW.thin, P, P.hatch); }
  g += txt(cx, topY - 16, 'rejilla 1½"', F.sm, 'middle', P, false, '600');
  // marco L izquierdo (⌞): ala vertical + pie hacia adentro ; derecho (⌟) espejado — tope superior a nivel
  g += line(lx, topY, lx, botY, SW.thick, P) + line(lx, botY, lx + foot, botY, SW.thick, P);
  g += line(rx, topY, rx, botY, SW.thick, P) + line(rx, botY, rx - foot, botY, SW.thick, P);
  // anclajes "Y invertida" a 45° desde la base del ala vertical, hacia afuera
  g += anchorY(lx, botY, -0.707, 0.707, P) + anchorY(rx, botY, 0.707, 0.707, P);
  g += tsans(ox + w - 26, oy + h - 20, 'anclajes esquemáticos (sin especificación)', F.ty, 'end', P, 500, P.muted || P.text);
  return g;
}

/* Hoja A4: CÁMARA PLUVIAL — planta centrada (grande) · esquemas · despiece centrado */
function generarPluvial(params, P, logo) {
  var r = calcularPluvial(params);
  r.rotulo = params.rotulo; r.herrajes = params.herrajes || [];
  var M = PG.m, full = PG.w - 2 * M, cxp = PG.w / 2, g = '';
  g += cajetin(r, M, M, full, 185, P, logo);
  // --- 1) despiece a ANCHO COMPLETO arriba (letra grande) ---
  var ty = 345;
  g += tsans(M, ty - 24, 'DESPIECE — ' + r.cantidadTexto, F.h2, 'start', P, 700, P.accent);
  var dt = despieceTabla(r, M, ty, P, full, 40); g += dt.svg;
  var ny = ty + dt.h + 56;
  // --- 2) fila de dibujos: planta (izq) + marco + corte (der) ---
  var topY = ny, bandH = 640;
  var kf = Math.min(380 / r.extA, 560 / r.extB), eA = r.extA * kf, eB = r.extB * kf;
  var pox = M + 180, poy = topY + 50 + (bandH - 50 - eB) / 2;
  g += tsans(pox + eA / 2, topY + 20, 'PLANTA', F.h2, 'middle', P, 700, P.accent);
  g += plantaPluvial(r, pox, poy, P, kf);
  var xE = 760, bw = 615, gap = 40;
  g += secPluvMarco(r, xE, topY, bw, bandH, P);
  g += cortePluvial(r, xE + bw + gap, topY, bw, bandH, P);
  // --- 3) accesorios al final ---
  g += bloqueAccesorios(r, M, topY + bandH + 70, P, full);
  return [pagina(g, P, 'Plano preliminar. Cotas en mm. Marco plegado en chapa 1/8" (<800) o 3/16" (≥800), unión a 45°, largo = ext + 15. Rejilla de planchuelas 1½"×3/16". Imprimir en A4.')];
}

/* --- REGISTRO DE TIPOS DE PLANO (cada uno: campos + motor + dibujo) --- */
var TIPOS = [
  {
    id: 'puerta-doble-faz', nombre: 'Puerta metálica doble faz',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 900, step: 10, min: 400, max: 2000, help: 'Luz libre de pared a pared.' },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 2050, step: 10, min: 1500, max: 2800, help: 'Luz libre del piso al dintel.' },
      { id: 'cantIzq', label: 'Cant. mano izq', type: 'number', value: 1, step: 1, min: 0, max: 99, help: 'Cuántas puertas de mano izquierda.' },
      { id: 'cantDer', label: 'Cant. mano der', type: 'number', value: 0, step: 1, min: 0, max: 99, help: 'Cuántas de mano derecha.' },
      { id: 'chapaMarco', label: 'Chapa marco (N°)', type: 'select', value: '16', options: [['16', 'N° 16 (≈1,6 mm)'], ['18', 'N° 18 (≈1,2 mm)'], ['14', 'N° 14 (≈2,0 mm)']], help: 'Chapa del marco. Común N°16.' },
      { id: 'chapaHoja', label: 'Chapa hoja (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)'], ['16', 'N° 16 (≈1,6 mm)'], ['14', 'N° 14 (≈2,0 mm)']], help: 'Chapa de tapa, bandeja y refuerzos. Común N°18.' },
      { id: 'tipoHoja', label: 'Tipo de hoja (marco)', type: 'select', value: 'metalica', options: [['metalica', 'Metálica (t3=35)'], ['madera', 'Madera / placa (t3=31)']], help: 'Define el tramo del marco donde apoya la hoja.' },
      { id: 'muro', label: 'Espesor de muro terminado (mm)', type: 'number', value: 200, step: 5, min: 60, max: 400, help: 'Espesor del muro ya revocado.' },
      { id: 'picaporte', label: 'Altura de picaporte (mm)', type: 'number', value: 1020, step: 10, min: 600, max: 1400, help: 'Del piso terminado al picaporte. Normal 1020.' },
      { id: 'altoPanoFijo', label: 'Alto paño fijo (mm)', type: 'number', value: 0, step: 10, min: 0, max: 1200, help: '0 = sin paño fijo. Panel de vidrio sobre la puerta + cajón divisor.' },
      { id: 'mano', label: 'Mano a dibujar', type: 'seg', value: 'izq', options: [['izq', 'Izquierda'], ['der', 'Derecha']], help: 'Cuál de las dos se muestra en el frente.' },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']], help: '"Para enterrar" agrega 30 mm bajo el piso.' }
    ],
    calcular: function (p) { return calcularDespiece(p); },
    generar: function (p, P, logo) { return generarPaginas(p, P, logo); }
  },
  {
    id: 'marco', nombre: 'Marco de puerta (solo marco)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 900, step: 10, min: 400, max: 2000, help: 'Luz libre de pared a pared.' },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 2050, step: 10, min: 1500, max: 2800, help: 'Luz libre del piso al dintel.' },
      { id: 'cantidad', label: 'Cantidad de marcos', type: 'number', value: 1, step: 1, min: 1, max: 99, help: 'Cuántos marcos iguales.' },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'tipoHoja', label: 'Para hoja', type: 'select', value: 'madera', options: [['madera', 'Madera / placa (t3=31)'], ['metalica', 'Metálica (t3=35)']], help: 'Tipo de hoja que va a recibir el marco.' },
      { id: 'muro', label: 'Espesor de muro terminado (mm)', type: 'number', value: 200, step: 5, min: 60, max: 400, help: 'Espesor del muro ya revocado.' },
      { id: 'picaporte', label: 'Altura de cerradero (mm)', type: 'number', value: 1020, step: 10, min: 600, max: 1400, help: 'Del piso terminado al cerradero. Normal 1020.' },
      { id: 'altoPanoFijo', label: 'Alto paño fijo (mm)', type: 'number', value: 0, step: 10, min: 0, max: 1200, help: '0 = sin paño fijo. Panel de vidrio arriba + cajón divisor.' },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']], help: '"Para enterrar" agrega 30 mm bajo el piso.' }
    ],
    calcular: function (p) { return calcularMarco(p); },
    generar: function (p, P, logo) { return generarMarco(p, P, logo); }
  },
  {
    id: 'gabinete', nombre: 'Gabinete con tablillas (una hoja)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 600, step: 10, min: 200, max: 2500, help: 'Luz libre del hueco.' },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 1800, step: 10, min: 300, max: 3000, help: 'Alto libre del hueco.' },
      { id: 'cantIzq', label: 'Cant. mano izq', type: 'number', value: 1, step: 1, min: 0, max: 999, help: 'Cuántos de mano izquierda.' },
      { id: 'cantDer', label: 'Cant. mano der', type: 'number', value: 0, step: 1, min: 0, max: 999, help: 'Cuántos de mano derecha.' },
      { id: 'estrA', label: 'Caño — profundidad (mm)', type: 'number', value: 50, step: 5, min: 20, max: 200, help: 'Lado del caño que entra al muro.' },
      { id: 'estrB', label: 'Caño — canto al frente (mm)', type: 'number', value: 20, step: 5, min: 10, max: 100, help: 'Lado del caño visto de frente.' },
      { id: 'estrEsp', label: 'Caño — espesor (mm)', type: 'number', value: 1.6, step: 0.1, min: 0.8, max: 6, help: 'Espesor de pared del caño.' },
      { id: 'chapa', label: 'Chapa plegados (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'mano', label: 'Mano a dibujar', type: 'seg', value: 'izq', options: [['izq', 'Izquierda'], ['der', 'Derecha']], help: 'Cuál se muestra en el frente.' },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']], help: '"Para enterrar" prolonga las jambas.' }
    ],
    calcular: function (p) { return calcularGabinete(p); },
    generar: function (p, P, logo) { return generarGabinete(p, P, logo); }
  },
  {
    id: 'gabinete-doble', nombre: 'Gabinete con tablillas (doble hoja)',
    campos: [
      { id: 'W', label: 'Ancho de vano (mm)', type: 'number', value: 1200, step: 10, min: 400, max: 3000, help: 'Luz libre del hueco.' },
      { id: 'H', label: 'Alto de vano (mm)', type: 'number', value: 1800, step: 10, min: 300, max: 3000, help: 'Alto libre del hueco.' },
      { id: 'cantidad', label: 'Cantidad de gabinetes', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántos iguales.' },
      { id: 'estrA', label: 'Caño — profundidad (mm)', type: 'number', value: 50, step: 5, min: 20, max: 200, help: 'Lado del caño que entra al muro.' },
      { id: 'estrB', label: 'Caño — canto al frente (mm)', type: 'number', value: 20, step: 5, min: 10, max: 100, help: 'Lado del caño visto de frente.' },
      { id: 'estrEsp', label: 'Caño — espesor (mm)', type: 'number', value: 1.6, step: 0.1, min: 0.8, max: 6, help: 'Espesor de pared del caño.' },
      { id: 'chapa', label: 'Chapa plegados (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)']] },
      { id: 'piso', label: 'Piso (largo de jambas)', type: 'seg', value: 'term', options: [['term', 'Terminado'], ['sin', 'Para enterrar']], help: '"Para enterrar" prolonga las jambas.' }
    ],
    calcular: function (p) { p.nHojas = 2; return calcularGabinete(p); },
    generar: function (p, P, logo) { p.nHojas = 2; return generarGabinete(p, P, logo); }
  },
  {
    id: 'camara', nombre: 'Cámara cloacal (marco + tapa)',
    campos: [
      { id: 'modo', label: 'Medida dada', type: 'seg', value: 'ext', options: [['ext', 'Exterior'], ['int', 'Interior']], help: '¿Los lados son por fuera del marco o la luz interior?' },
      { id: 'W', label: 'Lado A (mm)', type: 'number', value: 600, step: 10, min: 100, max: 2500, help: 'Un lado de la cámara.' },
      { id: 'H', label: 'Lado B (mm)', type: 'number', value: 600, step: 10, min: 100, max: 2500, help: 'El otro lado.' },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántas iguales.' },
      { id: 'agarre', label: 'Agarre tapa (≤500)', type: 'seg', value: 'tirador', options: [['manija', 'Manija'], ['tirador', 'Tirador']], cond: function (p) { return Math.max(+p.W, +p.H) <= 500; }, help: 'Solo si el lado mayor es ≤500 mm.' }
    ],
    calcular: function (p) { return calcularCamara(p); },
    generar: function (p, P, logo) { return generarCamara(p, P, logo); }
  },
  {
    id: 'pluvial', nombre: 'Cámara pluvial (marco + rejilla)',
    campos: [
      { id: 'modo', label: 'Medida dada', type: 'seg', value: 'ext', options: [['ext', 'Exterior'], ['int', 'Interior']], help: '¿Los lados son por fuera del marco o la luz interior?' },
      { id: 'W', label: 'Lado A (mm)', type: 'number', value: 600, step: 10, min: 100, max: 3000, help: 'Un lado de la cámara.' },
      { id: 'H', label: 'Lado B (mm)', type: 'number', value: 400, step: 10, min: 100, max: 3000, help: 'El otro lado.' },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántas iguales.' },
      { id: 'refuerzo', label: 'Rejilla con refuerzo (zona transitable)', type: 'check', value: false, help: 'Marcar si pasan vehículos o cargas sobre la rejilla.' }
    ],
    calcular: function (p) { return calcularPluvial(p); },
    generar: function (p, P, logo) { return generarPluvial(p, P, logo); }
  },
  {
    id: 'calf', nombre: 'Cámara tipo CALF (marco + tapa)',
    campos: [
      { id: 'W', label: 'Lado A interior (mm)', type: 'number', value: 500, step: 10, min: 100, max: 2500, help: 'Luz interior de la cámara.' },
      { id: 'H', label: 'Lado B interior (mm)', type: 'number', value: 500, step: 10, min: 100, max: 2500, help: 'El otro lado interior.' },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántas iguales.' },
      { id: 'reglamentaria', label: 'Reglamentaria (plegado 3 tramos)', type: 'check', value: false, help: 'Fuerza el plegado grande sin importar el tamaño.' },
      { id: 'agarre', label: 'Agarre tapa (≤500)', type: 'seg', value: 'manija', options: [['manija', 'Manija'], ['tirador', 'Tirador']], cond: function (p) { return Math.max(+p.W, +p.H) <= 500; }, help: 'Solo si el lado mayor es ≤500 mm.' }
    ],
    calcular: function (p) { return calcularCALF(p); },
    generar: function (p, P, logo) { return generarCALF(p, P, logo); }
  },
  {
    id: 'plegado-libre', nombre: 'Plegado libre (creador)',
    listo: function (p) { return (p.tramos || []).filter(function (t) { return +t.largo > 0; }).length >= 2; },
    campos: [
      { id: 'nombre', label: 'Nombre del plegado', type: 'text', value: 'Plegado 1', help: 'Aparece en el rótulo y el despiece.' },
      { id: 'tramos', label: 'Tramos y dobleces', type: 'tramos', value: [[35, '-'], [30, 'izq'], [35, 'der']], help: 'Largo de cada tramo (mm) y hacia dónde dobla respecto al anterior. Dobleces a 90°.' },
      { id: 'largoPerfil', label: 'Largo del perfil (mm)', type: 'number', value: 1000, step: 10, min: 0, max: 6000, help: 'Longitud de la pieza (la otra dimensión de la chapa).' },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)'], ['16', 'N° 16 (≈1,6 mm)'], ['14', 'N° 14 (≈2,0 mm)']], help: 'Define el descuento por pliegue.' },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántas piezas iguales.' },
      { id: 'puntas', label: 'Puntas', type: 'seg', value: 'pestana', options: [['pestana', 'Pestaña (−)'], ['abiertas', 'Abiertas']], help: 'Pestaña: las puntas descuentan. Abiertas: no.' }
    ],
    calcular: function (p) { return calcularPlegado(p); },
    generar: function (p, P, logo) { return generarPlegado(p, P, logo); }
  },
  {
    id: 'bandeja-libre', nombre: 'Bandeja (creador)',
    listo: function (p) {
      function ok(t) { return (t || []).filter(function (x) { return +x.largo > 0; }).length >= 2; }
      return ok(p.tramosAncho) && ok(p.tramosLargo);
    },
    campos: [
      { id: 'nombre', label: 'Nombre de la bandeja', type: 'text', value: 'Bandeja 1', help: 'Aparece en el rótulo y el despiece.' },
      { id: 'tramosAncho', label: 'Sección en el ANCHO', type: 'tramos', value: [[15, '-'], [40, 'izq'], [300, 'der'], [40, 'der'], [15, 'izq']], help: 'Pestaña → pared → base → pared → pestaña. El tramo central es la base. Editá libremente: cada lado puede ser distinto.' },
      { id: 'sentidoAncho', label: 'Sentido (ancho)', type: 'seg', value: 'arriba', options: [['arriba', 'Solapas ↑'], ['abajo', 'Solapas ↓']], help: 'Hacia dónde se doblan las solapas en el dibujo. No cambia el desarrollo.' },
      { id: 'tramosLargo', label: 'Sección en el LARGO', type: 'tramos', value: [[15, '-'], [40, 'izq'], [500, 'der'], [40, 'der'], [15, 'izq']], help: 'La otra dirección. Puede tener más o menos pliegues que el ancho.' },
      { id: 'sentidoLargo', label: 'Sentido (largo)', type: 'seg', value: 'arriba', options: [['arriba', 'Solapas ↑'], ['abajo', 'Solapas ↓']], help: 'Hacia dónde se doblan las solapas en el dibujo. No cambia el desarrollo.' },
      { id: 'chapa', label: 'Chapa (N°)', type: 'select', value: '18', options: [['18', 'N° 18 (≈1,2 mm)'], ['16', 'N° 16 (≈1,6 mm)'], ['14', 'N° 14 (≈2,0 mm)']], help: 'Define el descuento por pliegue.' },
      { id: 'cantidad', label: 'Cantidad', type: 'number', value: 1, step: 1, min: 1, max: 999, help: 'Cuántas piezas iguales.' },
      { id: 'puntas', label: 'Puntas', type: 'seg', value: 'pestana', options: [['pestana', 'Pestaña (−)'], ['abiertas', 'Abiertas']], help: 'Pestaña: las puntas descuentan. Abiertas: no.' }
    ],
    calcular: function (p) { return calcularBandeja(p); },
    generar: function (p, P, logo) { return generarBandeja(p, P, logo); }
  }
];

if (typeof module !== 'undefined') module.exports = { generarPaginas: generarPaginas, generarMarco: generarMarco, generarGabinete: generarGabinete, generarCamara: generarCamara, generarPluvial: generarPluvial, generarCALF: generarCALF, TIPOS: TIPOS, PG: PG };
