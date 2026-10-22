// Build reproducible: ensambla el motor (bundle.js) + la capa de dibujo (draw.js)
// y genera ../index.html (versión standalone, con descarga directa de PDF).
//   uso:  node src/build.cjs       (o desde src/: node build.cjs)
const fs = require('fs');
const path = require('path');
const D = __dirname;
const _full = fs.readFileSync(path.join(D, 'bundle.js'), 'utf8');
const _eng = _full.slice(0, _full.indexOf('function generarSVG'));   // descarta el SVG viejo sin uso
const _draw = fs.readFileSync(path.join(D, 'draw.js'), 'utf8').replace(/if \(typeof module[\s\S]*$/, '');
const bundle = _eng + '\n\n' + _draw;
const logoB64 = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(D, 'logo.jpg')).toString('base64');

const mkHtml = (DL) => `<title>Plano puerta doble faz</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/svg2pdf.js/2.2.1/svg2pdf.umd.min.js"></script>
<style>
/* Layout: panel de control fijo a la izquierda (abajo en móvil) + hoja de dibujo. */
:root{
  --bg:#f3f5f8; --fg:#13213a; --panel:#ffffff; --border:#d6deea; --muted:#5b6b82; --accent:#0a3f85;
  /* paleta del dibujo (claro = papel) */
  --dw-paper:#ffffff; --dw-line:#13213a; --dw-text:#13213a; --dw-accent:#0a3f85; --dw-hatch:#eef4fb; --dw-muted:#5b6b82;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0a1726; --fg:#dbe9fb; --panel:#102138; --border:#24405f; --muted:#8aa6c4; --accent:#6fb7ec;
  --dw-paper:#0e2038; --dw-line:#a9cdf0; --dw-text:#dbe9fb; --dw-accent:#6fb7ec; --dw-hatch:#16314f; --dw-muted:#8aa6c4;
  color-scheme:dark;
}}
:root[data-theme="dark"]{
  --bg:#0a1726; --fg:#dbe9fb; --panel:#102138; --border:#24405f; --muted:#8aa6c4; --accent:#6fb7ec;
  --dw-paper:#0e2038; --dw-line:#a9cdf0; --dw-text:#dbe9fb; --dw-accent:#6fb7ec; --dw-hatch:#16314f; --dw-muted:#8aa6c4;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font-family:'IBM Plex Sans',system-ui,sans-serif;margin:0}
.wrap{display:flex;gap:20px;align-items:flex-start;padding-block:20px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.panel{flex:0 0 300px;position:sticky;top:env(safe-area-inset-top,0px);display:flex;flex-direction:column;gap:18px}
.sheet{flex:1 1 auto;min-width:0}
h1{font-size:20px;margin:0 0 2px;font-weight:700;letter-spacing:-.01em}
.sub{color:var(--muted);font-size:13px;margin:0}
.card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:16px}
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.field:last-child{margin-bottom:0}
label{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
input,select,textarea{font:inherit;font-size:15px;padding:9px 11px;border:1px solid var(--border);border-radius:8px;
  background:var(--bg);color:var(--fg)}
textarea{resize:vertical;min-height:72px;line-height:1.4}
input:focus,select:focus,textarea:focus{outline:2px solid var(--accent);outline-offset:1px}
.seg{display:flex;gap:6px}
.seg button{flex:1;font:inherit;font-size:14px;font-weight:600;padding:9px;border:1px solid var(--border);
  border-radius:8px;background:var(--bg);color:var(--fg);cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}
.warn{font-size:13px;color:#b45309;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px;line-height:1.4}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .warn{color:#fcd34d;background:#3a2c08;border-color:#6b5210}}
:root[data-theme="dark"] .warn{color:#fcd34d;background:#3a2c08;border-color:#6b5210}
.draw{display:flex;flex-direction:column;gap:16px;padding:4px}
.page{background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 1px 6px rgba(0,0,0,.12);overflow:hidden}
.page svg{display:block;width:100%;height:auto}
table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--border)}
th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
td.n{text-align:right;font-family:'IBM Plex Mono',monospace}
.note{font-size:12px;color:var(--muted);line-height:1.5}
.note b{color:var(--fg);font-weight:600}
.pdfbtn{width:100%;margin-top:4px;font:inherit;font-size:14px;font-weight:600;padding:11px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
.pdfbtn:disabled{opacity:.5;cursor:default}
.themebtn{font:inherit;font-size:13px;padding:7px 11px;border:1px solid var(--border);border-radius:8px;
  background:var(--bg);color:var(--fg);cursor:pointer}
@media (max-width:760px){.wrap{flex-direction:column}.panel{position:static;flex-basis:auto;width:100%}}
#printarea{display:none}
@media print{
  html,body{background:#fff;margin:0;padding:0}
  body>*{display:none !important}
  #printarea{display:block !important}
  #printarea svg{width:210mm;height:297mm;display:block}
  @page{size:A4 portrait;margin:0}
}
</style>

<div class="wrap">
  <div class="panel">
    <div>
      <h1>Generador de planos</h1>
      <p class="sub">Roque Mocciola · fuera de escala, cotas en mm</p>
    </div>
    <div class="card">
      <div class="field"><label for="tipo">Tipo de plano</label><select id="tipo"></select></div>
      <div id="campos"></div>
    </div>
    <div class="card">
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Rótulo (editable)</div>
      <div class="field"><label for="rPlano">Plano</label><input id="rPlano" type="text" value="Puertas tipo P3"></div>
      <div class="field"><label for="rObra">Obra</label><input id="rObra" type="text" value="Complejo San Martín"></div>
      <div class="field"><label for="rOt">OT</label><input id="rOt" type="text" value="Orden N° 1"></div>
      <div class="field"><label for="rFecha">Fecha</label><input id="rFecha" type="text" value="05-10-2026"></div>
    </div>
    <div class="card">
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Herrajes</div>
      <div class="field"><label for="herrajes">Uno por línea (ej.: <em>3 Bisagras reforzadas</em>)</label><textarea id="herrajes" rows="5" placeholder="1 Cerradura de seguridad&#10;3 Bisagras reforzadas&#10;1 Juego de manijas"></textarea></div>
      <button id="pdf" class="pdfbtn">Imprimir / Guardar PDF (A4)</button>
    </div>
    <div id="warn" class="warn" hidden></div>
    <div class="card">
      <table id="tabla"><thead><tr><th>Pieza</th><th>Desc.</th><th class="n">Cant</th><th class="n">Ancho×Largo</th></tr></thead><tbody></tbody></table>
    </div>
    <div class="card note">
      <b>Tipos disponibles</b>: puerta metálica doble faz y marco de puerta (solo marco). El motor se irá ampliando con otros tipos (tapas de cámara, etc.).<br><br>
      <b>Alcance</b>: perfiles fuera de escala con sus desarrollos, cajetín y herrajes editables, y export a PDF A4.
    </div>
    <button id="theme" class="themebtn">Cambiar tema</button>
  </div>
  <div class="sheet"><div class="draw" id="draw"></div></div>
</div>
<div id="printarea"></div>

<script>
const LOGO=${JSON.stringify(logoB64)};
${bundle}

function palette(){
  const s=getComputedStyle(document.documentElement);
  const g=n=>s.getPropertyValue(n).trim();
  return {paper:g('--dw-paper'),line:g('--dw-line'),thin:g('--dw-line'),
    text:g('--dw-text'),accent:g('--dw-accent'),hatch:g('--dw-hatch'),
    muted:g('--dw-muted')||g('--dw-text'),dim:g('--dw-text'),card:'none',head:g('--dw-hatch')};
}
const val=id=>document.getElementById(id).value;
const escH=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const TIPOMAP={}; TIPOS.forEach(t=>TIPOMAP[t.id]=t);
let tipoId=TIPOS[0].id;
const segState={};
function tipoActual(){ return TIPOMAP[tipoId]; }

function renderCampos(){
  const t=tipoActual();
  Object.keys(segState).forEach(k=>delete segState[k]);
  let h='';
  t.campos.forEach(c=>{
    if(c.type==='number'){
      h+='<div class="field"><label for="f_'+c.id+'">'+escH(c.label)+'</label><input id="f_'+c.id+'" type="number" value="'+c.value+'" step="'+(c.step||1)+'"'+(c.min!=null?' min="'+c.min+'"':'')+(c.max!=null?' max="'+c.max+'"':'')+'></div>';
    } else if(c.type==='select'){
      h+='<div class="field"><label for="f_'+c.id+'">'+escH(c.label)+'</label><select id="f_'+c.id+'">'+c.options.map(o=>'<option value="'+o[0]+'"'+(o[0]===c.value?' selected':'')+'>'+escH(o[1])+'</option>').join('')+'</select></div>';
    } else if(c.type==='seg'){
      segState[c.id]=c.value;
      h+='<div class="field"><label>'+escH(c.label)+'</label><div class="seg" data-seg="'+c.id+'">'+c.options.map(o=>'<button type="button" data-val="'+o[0]+'" aria-pressed="'+(o[0]===c.value)+'">'+escH(o[1])+'</button>').join('')+'</div></div>';
    }
  });
  document.getElementById('campos').innerHTML=h;
  t.campos.forEach(c=>{
    if(c.type==='seg'){
      const btns=document.querySelectorAll('[data-seg="'+c.id+'"] button');
      btns.forEach(b=>b.addEventListener('click',()=>{
        segState[c.id]=b.getAttribute('data-val');
        btns.forEach(x=>x.setAttribute('aria-pressed', x===b));
        dibujar();
      }));
    } else {
      document.getElementById('f_'+c.id).addEventListener(c.type==='select'?'change':'input', dibujar);
    }
  });
}

function getParams(){
  const t=tipoActual(), p={};
  t.campos.forEach(c=>{
    let v = c.type==='seg' ? segState[c.id] : document.getElementById('f_'+c.id).value;
    if(c.type==='number') v=+v;
    p[c.id]=v;
  });
  if('muro' in p) p.espesorMuro=p.muro;
  if('mano' in p) p.drawMano=p.mano;
  if('piso' in p) p.pisoTerminado=(p.piso==='term');
  if('chapa' in p) p.chapa=+p.chapa;
  p.rotulo={ plano:val('rPlano'), obra:val('rObra'), ot:val('rOt'), fecha:val('rFecha') };
  p.herrajes=(val('herrajes')||'').split('\\n').map(s=>s.trim()).filter(Boolean);
  return p;
}
function validarGen(p){
  if(!(p.W>0)||!(p.H>0)) return 'Completá ancho y alto.';
  if(p.W-60<=0) return 'El ancho es menor que el marco: no hay luz de paso.';
  const t3=p.tipoHoja==='madera'?31:35, t7=((p.espesorMuro||0)+3)-t3-15;
  if(t7<=0) return 'El muro es muy chico para este marco (tramo 7 ≤ 0).';
  const msgs=[];
  if(p.W<700||p.W>1200) msgs.push('ancho fuera del rango piloto (700–1200)');
  if(p.H<1900||p.H>2400) msgs.push('alto fuera del rango piloto (1900–2400)');
  return msgs.length? 'Verificar: '+msgs.join('; ')+'. Se genera igual.' : '';
}
function dibujar(){
  const t=tipoActual(), p=getParams();
  const w=document.getElementById('warn'), msg=validarGen(p);
  w.hidden=!msg; w.textContent=msg;
  if(!(p.W>0)||!(p.H>0)||p.W-60<=0) return;
  let r, pags;
  try{ r=t.calcular(p); pags=t.generar(p,palette(),LOGO); }
  catch(e){ console.error(e); return; }
  document.getElementById('draw').innerHTML=pags.map(s=>'<div class="page">'+s+'</div>').join('');
  const tb=document.querySelector('#tabla tbody');
  tb.innerHTML=(r.despiece||[]).map(d=>'<tr><td>'+d.pieza+'</td><td>'+d.desc+'</td><td class="n">'+d.cant+'</td><td class="n">'+d.ancho+'×'+d.largo+'</td></tr>').join('');
}
// PDF: frente/lateral a 1:ESCALA. Paleta clara fija (papel). Funciona en deployment real;
// dentro del sandbox del artifact la descarga puede quedar bloqueada.
const PDFPAL={paper:'#ffffff',line:'#13213a',thin:'#13213a',text:'#13213a',accent:'#0a3f85',hatch:'#eef4fb',muted:'#5b6b82',dim:'#5b6b82',card:'none',head:'#eef4fb'};
var FONTLINK='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">';
function planoHTML(p,nombre){
  var svg=tipoActual().generar(p,PDFPAL,LOGO).join('');
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'+FONTLINK+
    '<title>'+nombre+'</title><style>@page{size:A4 portrait;margin:0}'+
    'html,body{margin:0;padding:0;background:#525659}'+
    'svg{width:210mm;height:297mm;display:block;margin:0 auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.4)}'+
    '.bar{position:fixed;top:10px;right:12px}'+
    '.bar button{font:600 14px system-ui,sans-serif;padding:10px 16px;background:#0a3f85;color:#fff;border:none;border-radius:8px;cursor:pointer}'+
    '@media print{.bar{display:none}html,body{background:#fff}svg{box-shadow:none;margin:0}}</style></head>'+
    '<body><div class="bar"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>'+svg+'</body></html>';
}
async function construirPDF(p){
  var doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  var pags=tipoActual().generar(p,PDFPAL,LOGO);
  for(var i=0;i<pags.length;i++){
    if(i>0) doc.addPage('a4','portrait');
    var el=new DOMParser().parseFromString(pags[i],'image/svg+xml').documentElement;
    document.body.appendChild(el); el.style.position='fixed'; el.style.left='-99999px';
    await doc.svg(el,{x:0,y:0,width:210,height:297}); el.remove();
  }
  return doc;
}
${DL}
document.getElementById('pdf').addEventListener('click',descargarPDF);
// selector de tipo
(function(){ const s=document.getElementById('tipo');
  s.innerHTML=TIPOS.map(t=>'<option value="'+t.id+'">'+escH(t.nombre)+'</option>').join('');
  s.value=tipoId;
  s.addEventListener('change',()=>{ tipoId=s.value; renderCampos(); dibujar(); });
})();
['rPlano','rObra','rOt','rFecha','herrajes'].forEach(id=>document.getElementById(id).addEventListener('input',dibujar));
document.getElementById('theme').addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':(cur==='light'?'dark':(matchMedia('(prefers-color-scheme:dark)').matches?'light':'dark'));
  document.documentElement.setAttribute('data-theme',next);dibujar();
});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',dibujar);
renderCampos();
dibujar();
</script>`;

// --- Variante de descarga para el ARTEFACTO (capability "downloads") ---
const DL_ARTIFACT = `
async function descargarPDF(){
  var btn=document.getElementById('pdf'); var prev=btn.textContent;
  var p=getParams(); var nombre='plano-'+((p.rotulo.ot||'puerta').replace(/[^\\w-]+/g,'_'));
  var dl=null; try{ if(window.claude&&window.claude.use) dl=await window.claude.use('downloads'); }catch(e){}
  if(dl && window.jspdf && window.jspdf.jsPDF){
    btn.disabled=true; btn.textContent='Generando…';
    try{ var doc=await construirPDF(p);
      await dl.save({filename:nombre+'.pdf', data:doc.output('arraybuffer')});
      btn.textContent=prev; btn.disabled=false; return;
    }catch(e){ btn.disabled=false; btn.textContent=prev; if(e&&e.code==='declined') return; console.error(e); }
  }
  if(dl){ try{ await dl.save({filename:nombre+'.html', data:planoHTML(p,nombre)}); return; }
    catch(e){ if(e&&e.code==='declined') return; console.error(e); } }
  var w=window.open('','_blank');
  if(w&&w.document){ w.document.open(); w.document.write(planoHTML(p,nombre)); w.document.close(); return; }
  btn.textContent='No se pudo generar (permití ventanas)';
}`;

// --- Variante de descarga STANDALONE (página normal: descarga directa) ---
const DL_STANDALONE = `
async function descargarPDF(){
  var btn=document.getElementById('pdf'); var prev=btn.textContent;
  var p=getParams(); var nombre='plano-'+((p.rotulo.ot||'puerta').replace(/[^\\w-]+/g,'_'));
  if(window.jspdf && window.jspdf.jsPDF){
    btn.disabled=true; btn.textContent='Generando…';
    try{ var doc=await construirPDF(p); doc.save(nombre+'.pdf');
      btn.textContent=prev; btn.disabled=false; return;
    }catch(e){ btn.disabled=false; btn.textContent=prev; console.error(e); }
  }
  var w=window.open('','_blank');  // respaldo: imprimir desde pestaña
  if(w&&w.document){ w.document.open(); w.document.write(planoHTML(p,nombre)); w.document.close(); return; }
  btn.textContent='No se pudo generar (permití ventanas)';
}`;

const standalone = mkHtml(DL_STANDALONE);
const out = path.join(D, '..', 'index.html');
fs.writeFileSync(out, standalone);
console.log('index.html', (standalone.length / 1024).toFixed(0) + 'KB', '->', out);
