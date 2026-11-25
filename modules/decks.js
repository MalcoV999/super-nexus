// ==========================================
// --- MÓDULO 1: GESTIÓN DE BARAJAS (Super Nexus v1.0.0) ---
// ==========================================

let decksCache = [];
let mapaDecksCache = new Map();
let modoSeleccionActivo = false;
let idsSeleccionados = new Set();
let observerDecks = null;
let debounceDOMTimer = null;
let modalCheckTimer = null;
let aplicandoDOM = false;
let ultimoEstadoModal = false;

function renderizarBotonesDecks(container) {
  modoSeleccionActivo = false;
  idsSeleccionados.clear();

  container.innerHTML = `
    <button id="nt-btn-copy" class="nt-btn">📋 Copiar Nombres</button>
    <button id="nt-btn-check" class="nt-btn nt-btn-check">🔍 Comprobar Decks</button>
    <button id="nt-btn-del" class="nt-btn nt-btn-danger">🗑️ Borrar Decks</button>
    <button id="nt-btn-exp" class="nt-btn" title="Exportar colección completa en .json">📦 Exportar JSON</button>
    <button id="nt-btn-exp-zip" class="nt-btn" title="Descargar todos los mazos en un .zip de archivos .ydk">🗜️ Exportar .YDK (.zip)</button>
    <button id="nt-btn-imp" class="nt-btn" title="Importar un .json o múltiples archivos .ydk a la vez">📥 Importar (.json / .ydk)</button>
    <button id="nt-btn-ydke" class="nt-btn" title="Exportar e importar mazos en formato ydke:// y Omega Code">🔗 YDKE & Omega</button>
  `;
  document.getElementById('nt-btn-copy').onclick = copiarParaRuleta;
  document.getElementById('nt-btn-check').onclick = comprobarDecks;
  document.getElementById('nt-btn-del').onclick = activarModoSeleccion;
  document.getElementById('nt-btn-exp').onclick = descargarBackup;
  document.getElementById('nt-btn-exp-zip').onclick = exportarTodosYDKZip;
  document.getElementById('nt-btn-imp').onclick = importarDecksMultiples;
  document.getElementById('nt-btn-ydke').onclick = abrirModalYDKE;

  instalarInterceptorGlobal();
  cargarYActualizarDecksDOM();
  iniciarObservadorDecks();
  iniciarDetectorModales();
}

function desactivarModuloDecks() {
  modoSeleccionActivo = false;
  idsSeleccionados.clear();
  if (observerDecks) {
    observerDecks.disconnect();
    observerDecks = null;
  }
  if (debounceDOMTimer) {
    clearTimeout(debounceDOMTimer);
    debounceDOMTimer = null;
  }
  if (modalCheckTimer) {
    clearInterval(modalCheckTimer);
    modalCheckTimer = null;
  }
  ultimoEstadoModal = false;
  document.body.classList.remove('nt-modal-open');
}

function actualizarEstadoModal() {
  if (!window.location.pathname.includes('/decks')) return;
  const hayModal = Boolean(document.querySelector('[role="dialog"], .modal, .popup'));
  if (hayModal !== ultimoEstadoModal) {
    ultimoEstadoModal = hayModal;
    document.body.classList.toggle('nt-modal-open', hayModal);
  }
}

function iniciarDetectorModales() {
  if (modalCheckTimer) clearInterval(modalCheckTimer);
  actualizarEstadoModal();
  modalCheckTimer = setInterval(actualizarEstadoModal, 300);
}

function obtenerBtnYdkEnEvento(e) {
  const directo = e.target.closest?.('.nt-ydk-btn');
  if (directo) return directo;

  if (document.body.classList.contains('nt-modal-open')) return null;
  if (e.target.closest?.('#super-nexus-panel, #nt-progress-overlay, #nt-ydke-overlay, [role="dialog"], .modal, .popup')) {
    return null;
  }

  const botones = document.querySelectorAll('.nt-ydk-btn');
  for (const btn of botones) {
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      if (
        e.target.closest?.('a[href*="/editor"]') ||
        btn.parentElement?.contains(e.target) ||
        e.target.contains(btn)
      ) {
        return btn;
      }
    }
  }
  return null;
}

// --- INTERCEPTOR GLOBAL EN FASE DE CAPTURA (FRENTE A DUELING NEXUS) ---
function instalarInterceptorGlobal() {
  if (window.__ntGlobalClickHooked) return;
  window.__ntGlobalClickHooked = true;

  const bloquearSiEsYdk = (e) => {
    if (!window.location.pathname.includes('/decks')) return null;
    const btnYdk = obtenerBtnYdkEnEvento(e);
    if (!btnYdk) return null;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return btnYdk;
  };

  ['pointerdown', 'mousedown', 'mouseup', 'auxclick'].forEach((evt) => {
    window.addEventListener(evt, (e) => {
      bloquearSiEsYdk(e);
    }, true);
  });

  window.addEventListener('click', (e) => {
    if (!window.location.pathname.includes('/decks')) return;

    const btnYdk = bloquearSiEsYdk(e);
    if (btnYdk) {
      const key = btnYdk.dataset.deckKey;
      const deckData = mapaDecksCache.get(key);
      if (deckData) {
        descargarArchivoYDK(deckData.name, generarTextoYDK(deckData));
      }
      return;
    }

    // Selección individual de mazos para borrar
    if (modoSeleccionActivo) {
      const card = e.target.closest?.('.nt-selecting-card');
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        const chk = card.querySelector('.nt-deck-checkbox');
        if (chk) {
          chk.checked = !chk.checked;
          chk.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  }, true);

  // Listener que actualiza el Set y el contador cuando cambia cualquier checkbox
  document.addEventListener('change', (e) => {
    if (!modoSeleccionActivo || !window.location.pathname.includes('/decks')) return;
    const chk = e.target.closest?.('.nt-deck-checkbox');
    if (!chk) return;

    const id = chk.dataset.deckId;
    const card = chk.closest('.nt-selecting-card');
    if (!id) return;

    if (chk.checked) {
      idsSeleccionados.add(id);
      card?.classList.add('nt-card-selected');
    } else {
      idsSeleccionados.delete(id);
      card?.classList.remove('nt-card-selected');
    }
    actualizarContadorBorrado();
  });
}

function iniciarObservadorDecks() {
  if (observerDecks) observerDecks.disconnect();

  observerDecks = new MutationObserver((mutations) => {
    if (!window.location.pathname.includes('/decks') || aplicandoDOM) return;

    actualizarEstadoModal();

    const hayCambioExterno = mutations.some((m) => {
      const target = m.target instanceof Element ? m.target : m.target.parentElement;
      return target && !target.closest('#super-nexus-panel, #nt-progress-overlay, #nt-ydke-overlay');
    });
    if (!hayCambioExterno) return;

    clearTimeout(debounceDOMTimer);
    debounceDOMTimer = setTimeout(() => {
      aplicarElementosEnTarjetas();
    }, 350);
  });

  observerDecks.observe(document.body, { childList: true, subtree: true });
}

function buscarNodosTitulo(mapa) {
  const resultados = [];
  if (!mapa || mapa.size === 0 || !document.body) return resultados;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const txt = node.nodeValue.trim().toLowerCase();
      if (!txt || !mapa.has(txt)) return NodeFilter.FILTER_SKIP;

      const parent = node.parentElement;
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('#super-nexus-panel, #nt-progress-overlay, #nt-ydke-overlay')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let textNode;
  while ((textNode = walker.nextNode())) {
    const el = textNode.parentElement;
    if (el && el.children.length === 0) {
      const textoNodo = textNode.nodeValue.trim().toLowerCase();
      el.setAttribute('data-nt-deck-title', '1');
      resultados.push({ el, textoNodo });
    }
  }
  return resultados;
}

function encontrarTarjetaDeck(el) {
  const tr = el.closest('tr');
  if (tr) return tr;

  let curr = el.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const iconos = curr.querySelectorAll('button, a, svg, i, [role="button"]').length;
    if (iconos >= 3 && curr.offsetHeight < 520) break;
    curr = curr.parentElement;
  }

  if (!curr || curr === document.body) {
    curr = el.parentElement;
    while (curr && curr !== document.body && curr.offsetHeight < 48) {
      curr = curr.parentElement;
    }
  }

  if (!curr || curr === document.body) return null;

  while (curr.parentElement && curr.parentElement !== document.body) {
    const padre = curr.parentElement;
    const estiloPadre = window.getComputedStyle(padre);
    if (estiloPadre.display === 'grid' || padre.offsetHeight > 520) break;

    const titulosEnPadre = padre.querySelectorAll('[data-nt-deck-title="1"]').length;
    if (titulosEnPadre !== 1) break;

    curr = padre;
  }

  return curr;
}

function clasificarVistaTarjeta(tarjeta) {
  const h = tarjeta.offsetHeight;
  const esLista = h > 0 && h < 90;
  const esCubo = h > 280;

  tarjeta.classList.toggle('nt-list-row', esLista);
  tarjeta.classList.toggle('nt-cube-card', !esLista && esCubo);
}

async function cargarYActualizarDecksDOM() {
  try {
    const res = await fetch('/api/list-decks.php');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.decks)) return;

    decksCache = data.decks;
    mapaDecksCache.clear();
    data.decks.forEach(d => {
      if (d.name) mapaDecksCache.set(d.name.trim().toLowerCase(), d);
    });

    aplicarElementosEnTarjetas();
  } catch (e) {
    console.warn("No se pudieron cargar los decks:", e);
  }
}

function aplicarElementosEnTarjetas() {
  if (mapaDecksCache.size === 0) return;

  aplicandoDOM = true;
  try {
    const nodosTitulo = buscarNodosTitulo(mapaDecksCache);

    nodosTitulo.forEach(({ el, textoNodo }) => {
      const deckData = mapaDecksCache.get(textoNodo);
      const tarjeta = encontrarTarjetaDeck(el);
      if (!tarjeta) return;

      if (window.getComputedStyle(tarjeta).position === 'static') {
        tarjeta.style.position = 'relative';
      }
      clasificarVistaTarjeta(tarjeta);

      if (!tarjeta.querySelector('.nt-ydk-btn')) {
        const btnYDK = document.createElement('button');
        btnYDK.type = 'button';
        btnYDK.className = 'nt-ydk-btn';
        btnYDK.innerHTML = '📥 .ydk';
        btnYDK.title = 'Descargar en formato .ydk para EDOPro / Omega';
        btnYDK.dataset.deckKey = textoNodo;
        tarjeta.appendChild(btnYDK);
      }

      const deckId = deckData.id ?? deckData.deck_id ?? deckData.uuid ?? deckData._id;
      if (modoSeleccionActivo && deckId && !tarjeta.querySelector('.nt-checkbox-container')) {
        tarjeta.classList.add('nt-selecting-card');

        const container = document.createElement('div');
        container.className = 'nt-checkbox-container';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'nt-deck-checkbox';
        chk.dataset.deckId = String(deckId);
        chk.checked = idsSeleccionados.has(String(deckId));

        if (chk.checked) tarjeta.classList.add('nt-card-selected');

        container.appendChild(chk);
        tarjeta.appendChild(container);
      }
    });
  } finally {
    aplicandoDOM = false;
  }
}

// --- CONVERSORES .YDK, YDKE Y OMEGA CODE ---
function generarTextoYDK(d) {
  const parseList = (str) => (!str ? [] : str.split(',').map(s => s.trim()).filter(Boolean));
  const main = parseList(d.main_deck).join('\n');
  const extra = parseList(d.extra_deck).join('\n');
  const side = parseList(d.side_deck).join('\n');

return `#created by Super Nexus for EDOPro & Omega\n#main\n${main}\n#extra\n${extra}\n!side\n${side}\n`;
}

function parsearContenidoYDK(texto, nombreArchivo) {
  const main = [];
  const extra = [];
  const side = [];
  let seccion = 'main';

  const lineas = texto.split(/\r?\n/);
  for (const raw of lineas) {
    const linea = raw.trim();
    if (!linea) continue;

    const lower = linea.toLowerCase();
    if (lower === '#main') { seccion = 'main'; continue; }
    if (lower === '#extra') { seccion = 'extra'; continue; }
    if (lower === '!side' || lower === '#side') { seccion = 'side'; continue; }
    if (linea.startsWith('#') || linea.startsWith('!')) continue;

    if (/^\d+$/.test(linea)) {
      const idCarta = parseInt(linea, 10);
      if (idCarta > 0) {
        if (seccion === 'main') main.push(idCarta);
        else if (seccion === 'extra') extra.push(idCarta);
        else if (seccion === 'side') side.push(idCarta);
      }
    }
  }

  const nombre = nombreArchivo.replace(/\.ydk$/i, '').trim() || 'Deck Importado';
  return { name: nombre, main, extra, side };
}

function idsToB64(ids) {
  if (!ids || ids.length === 0) return '';
  const buf = new ArrayBuffer(ids.length * 4);
  const dv = new DataView(buf);
  for (let i = 0; i < ids.length; i++) {
    dv.setUint32(i * 4, Number(ids[i]) || 0, true);
  }
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function b64ToIds(b64) {
  if (!b64) return [];
  try {
    const bin = atob(b64.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const dv = new DataView(bytes.buffer);
    const ids = [];
    for (let i = 0; i + 3 < bytes.length; i += 4) {
      const id = dv.getUint32(i, true);
      if (id > 0) ids.push(id);
    }
    return ids;
  } catch (e) {
    return [];
  }
}

function generarYDKE(d) {
  const parseList = (str) => (!str ? [] : str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0));
  const main = idsToB64(parseList(d.main_deck));
  const extra = idsToB64(parseList(d.extra_deck));
  const side = idsToB64(parseList(d.side_deck));
  return `ydke://${main}!${extra}!${side}!`;
}

function parsearYDKE(url) {
  const cuerpo = url.trim().replace(/^ydke:\/\//i, '');
  const partes = cuerpo.split('!');
  const main = b64ToIds(partes[0] || '');
  const extra = b64ToIds(partes[1] || '');
  const side = b64ToIds(partes[2] || '');
  return { main, extra, side };
}

async function generarOmegaCode(d) {
  try {
    if (!d) return '';

    const parseList = (str) => {
      if (!str) return [];
      if (Array.isArray(str)) return str.map(Number).filter(n => n > 0);
      if (typeof str === 'string') {
        return str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0);
      }
      return [];
    };

    const main = parseList(d.main_deck || d.main);
    const extra = parseList(d.extra_deck || d.extra);
    const side = parseList(d.side_deck || d.side);

    const mainPlusExtraLen = Math.min(255, main.length + extra.length);
    const sideLen = Math.min(255, side.length);
    const allCards = [...main, ...extra, ...side];

    const buffer = new ArrayBuffer(2 + allCards.length * 4);
    const view = new DataView(buffer);
    view.setUint8(0, mainPlusExtraLen);
    view.setUint8(1, sideLen);

    for (let i = 0; i < allCards.length; i++) {
      view.setUint32(2 + (i * 4), Number(allCards[i]) || 0, true);
    }

    const uint8 = new Uint8Array(buffer);
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(uint8);
    writer.close();

    const reader = cs.readable.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const compressedBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      compressedBytes.set(chunk, offset);
      offset += chunk.length;
    }

    let binary = '';
    for (let i = 0; i < compressedBytes.length; i++) {
      binary += String.fromCharCode(compressedBytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Error generando Omega Code para el mazo:", d?.name, e);
    return '';
  }
}

function sanitizarNombreArchivo(nombre) {
  return (nombre || 'deck').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'deck';
}

function descargarArchivoYDK(nombre, contenidoYDK) {
  const blob = new Blob([contenidoYDK], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitizarNombreArchivo(nombre)}.ydk`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- GENERADOR DE .ZIP NATIVO ---
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calcularCRC32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function crearZip(archivos) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nameBytes = encoder.encode(archivo.nombre);
    const dataBytes = encoder.encode(archivo.contenido);
    const crc = calcularCRC32(dataBytes);
    const size = dataBytes.length;

    const lh = new ArrayBuffer(30 + nameBytes.length);
    const ldv = new DataView(lh);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, 0x0800, true);
    ldv.setUint16(8, 0, true);
    ldv.setUint16(10, dosTime, true);
    ldv.setUint16(12, dosDate, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, size, true);
    ldv.setUint32(22, size, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    new Uint8Array(lh, 30).set(nameBytes);

    localParts.push(new Uint8Array(lh), dataBytes);

    const ch = new ArrayBuffer(46 + nameBytes.length);
    const cdv = new DataView(ch);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0x0800, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, dosTime, true);
    cdv.setUint16(14, dosDate, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true);
    new Uint8Array(ch, 46).set(nameBytes);

    centralParts.push(new Uint8Array(ch));
    offset += 30 + nameBytes.length + size;
  }

  let cdSize = 0;
  for (const part of centralParts) cdSize += part.length;

  const eocd = new ArrayBuffer(22);
  const edv = new DataView(eocd);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, archivos.length, true);
  edv.setUint16(10, archivos.length, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, offset, true);
  edv.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, new Uint8Array(eocd)], { type: 'application/zip' });
}

// --- VENTANA DE PROGRESO FLOTANTE ---
function mostrarProgreso(titulo, actual, total, detalle) {
  let modal = document.getElementById('nt-progress-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nt-progress-overlay';
    modal.innerHTML = `
      <div class="nt-progress-box">
        <h3 id="nt-prog-title">${titulo}</h3>
        <div class="nt-prog-track"><div id="nt-prog-fill"></div></div>
        <p id="nt-prog-detail">${detalle}</p>
        <span id="nt-prog-count">${actual} / ${total}</span>
      </div>
    `;
    document.body.appendChild(modal);
  }
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0;
  document.getElementById('nt-prog-title').innerText = titulo;
  document.getElementById('nt-prog-fill').style.width = pct + '%';
  document.getElementById('nt-prog-detail').innerText = detalle;
  document.getElementById('nt-prog-count').innerText = `${actual} / ${total} (${pct}%)`;
}

function ocultarProgreso() {
  const modal = document.getElementById('nt-progress-overlay');
  if (modal) modal.remove();
}

async function copiarTextoPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return ok;
  }
}

// --- MODAL YDKE & OMEGA CODE ---
async function abrirModalYDKE() {
  const existente = document.getElementById('nt-ydke-overlay');
  if (existente) existente.remove();

  let listaDecks = [];
  try {
    const res = await fetch('/api/list-decks.php');
    const data = await res.json();
    if (data.success && Array.isArray(data.decks)) {
      listaDecks = data.decks;
    }
  } catch (e) {
    return alert("Error al cargar tus decks.");
  }

  mostrarProgreso("🔗 Preparando Códigos", 1, listaDecks.length, "Generando Omega Codes nativos...");

  const decksProcesados = [];
  for (let i = 0; i < listaDecks.length; i++) {
    const d = listaDecks[i];
    const omegaCode = await generarOmegaCode(d);
    decksProcesados.push({
      name: (d.name || 'Deck').trim(),
      ydke: generarYDKE(d),
      omega: omegaCode
    });
  }

  ocultarProgreso();

  const overlay = document.createElement('div');
  overlay.id = 'nt-ydke-overlay';
  overlay.innerHTML = `
    <div class="nt-ydke-modal">
      <div class="nt-ydke-header">
        <h3>🔗 Conversor YDKE:// & Omega Code (<span id="nt-ydke-count">${decksProcesados.length}</span>)</h3>
        <button id="nt-ydke-close" class="nt-ydke-close" type="button">✖</button>
      </div>

      <div class="nt-ydke-section">
        <div class="nt-ydke-section-top">
          <span>📤 Exportar tus mazos</span>
          <input id="nt-ydke-filter" class="nt-ydke-input" type="text" placeholder="🔎 Filtrar por nombre...">
        </div>
        <textarea id="nt-ydke-export-box" class="nt-ydke-textarea" readonly></textarea>
        <div class="nt-ydke-actions">
          <button id="nt-ydke-copy-ydke" class="nt-btn" type="button">🔗 Copiar sólo ydke://</button>
          <button id="nt-btn-copy-omega" class="nt-btn" type="button">✨ Copiar sólo Omega Code</button>
          <button id="nt-ydke-copy-named" class="nt-btn" type="button">📋 Copiar con Nombre</button>
          <button id="nt-ydke-download-txt" class="nt-btn" type="button">💾 Descargar .txt</button>
        </div>
      </div>

      <hr class="nt-ydke-divider">

      <div class="nt-ydke-section">
        <span>📥 Importar enlaces <b>ydke://</b> a tu cuenta</span>
        <textarea id="nt-ydke-import-box" class="nt-ydke-textarea" placeholder="Pega aquí uno o varios enlaces (uno por línea):&#10;ydke://...&#10;Mi Deck: ydke://..."></textarea>
        <div class="nt-ydke-actions">
          <button id="nt-ydke-import-btn" class="nt-btn nt-btn-active" type="button">📥 Importar enlaces pegados</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const filterInput = document.getElementById('nt-ydke-filter');
  const exportBox = document.getElementById('nt-ydke-export-box');
  const countSpan = document.getElementById('nt-ydke-count');

  let filtradosActuales = decksProcesados;

  const actualizarVistaExport = () => {
    const q = filterInput.value.trim().toLowerCase();
    filtradosActuales = q
      ? decksProcesados.filter(d => d.name.toLowerCase().includes(q))
      : decksProcesados;

    countSpan.innerText = filtradosActuales.length;
    exportBox.value = filtradosActuales.map(d => `${d.name}\nYDKE: ${d.ydke}\nOMEGA: ${d.omega}\n`).join('\n');
  };

  actualizarVistaExport();
  filterInput.oninput = actualizarVistaExport;

  document.getElementById('nt-ydke-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.getElementById('nt-ydke-copy-ydke').onclick = async () => {
    if (filtradosActuales.length === 0) return alert("No hay mazos en la lista.");
    const ok = await copiarTextoPortapapeles(filtradosActuales.map(d => d.ydke).join('\n'));
    if (ok) alert(`¡${filtradosActuales.length} enlace(s) ydke:// copiados!`);
  };

  document.getElementById('nt-btn-copy-omega').onclick = async () => {
    if (filtradosActuales.length === 0) return alert("No hay mazos en la lista.");
    const ok = await copiarTextoPortapapeles(filtradosActuales.map(d => d.omega).join('\n'));
    if (ok) alert(`¡${filtradosActuales.length} Omega Code(s) copiados al portapapeles!`);
  };

  document.getElementById('nt-ydke-copy-named').onclick = async () => {
    if (filtradosActuales.length === 0) return alert("No hay mazos en la lista.");
    const ok = await copiarTextoPortapapeles(filtradosActuales.map(d => `${d.name}:\nYDKE: ${d.ydke}\nOMEGA: ${d.omega}`).join('\n\n'));
    if (ok) alert(`¡${filtradosActuales.length} mazos copiados con sus códigos!`);
  };

  document.getElementById('nt-ydke-download-txt').onclick = () => {
    if (filtradosActuales.length === 0) return alert("No hay mazos para descargar.");
    const contenido = filtradosActuales.map(d => `${d.name}\nYDKE: ${d.ydke}\nOMEGA: ${d.omega}\n`).join('\n');
    const blob = new Blob([contenido], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nexus_codigos_${filtradosActuales.length}_decks.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('nt-ydke-import-btn').onclick = async () => {
    const texto = document.getElementById('nt-ydke-import-box').value || '';
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const decksParaSubir = [];
    let ultimoTituloSuelto = '';

    for (const linea of lineas) {
      const match = linea.match(/(ydke:\/\/[^\s]+)/i);
      if (match) {
        const url = match[1];
        const parsed = parsearYDKE(url);
        if (parsed.main.length === 0 && parsed.extra.length === 0 && parsed.side.length === 0) continue;
        let nombre = linea.slice(0, match.index).replace(/[-:|>\s]+$/, '').trim();
        if (!nombre && ultimoTituloSuelto) nombre = ultimoTituloSuelto;
        if (!nombre) nombre = `Deck ${decksParaSubir.length + 1}`;

        decksParaSubir.push({ name: nombre, main: parsed.main, extra: parsed.extra, side: parsed.side });
        ultimoTituloSuelto = '';
      } else {
        ultimoTituloSuelto = linea.replace(/[-:|>\s]+$/, '').trim();
      }
    }

    const total = decksParaSubir.length;
    if (total === 0) return alert("⚠️ No se detectó ningún enlace ydke:// válido.");
    if (!confirm(`¿Importar ${total} deck(s) a tu cuenta?`)) return;

    overlay.remove();

    for (let i = 0; i < total; i++) {
      const d = decksParaSubir[i];
      mostrarProgreso("📥 Importando Decks", i + 1, total, `Subiendo: "${d.name}"`);

      const fd = new FormData();
      fd.append('name', d.name);
      fd.append('deck', JSON.stringify({ main: d.main, extra: d.extra, side: d.side }));

      try {
        const resp = await fetch('/api/create-deck.php', { method: 'POST', body: fd });
        await resp.text();
      } catch (errPost) {}
      await new Promise(r => setTimeout(r, 250));
    }

    mostrarProgreso("✅ ¡Importación Completa!", total, total, "Recargando tus decks...");
    setTimeout(() => location.reload(), 600);
  };
}

// 1. COPIAR NOMBRES
async function copiarParaRuleta() {
  let misDecks = [];
  try {
    const res = await fetch('/api/list-decks.php');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.decks)) {
        misDecks = data.decks.map(d => (d.name || '').trim()).filter(Boolean);
      }
    }
  } catch (e) {}

  if (misDecks.length === 0) {
    const lineas = document.body.innerText.split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 1; i < lineas.length; i++) {
      if (/^Main\b/i.test(lineas[i])) {
        const posibleNombre = lineas[i - 1];
        if (posibleNombre && !posibleNombre.includes('.ydk')) misDecks.push(posibleNombre);
      }
    }
  }

  const listaUnica = [...new Set(misDecks)];
  if (listaUnica.length === 0) return alert('⚠️ No se encontraron decks para copiar.');

  const copiado = await copiarTextoPortapapeles(listaUnica.join('\n'));
  if (copiado) alert(`¡${listaUnica.length} nombres copiados al portapapeles!`);
  else alert('❌ El navegador bloqueó el acceso al portapapeles.');
}

async function descargarBackup() {
  try {
    const res = await fetch('/api/list-decks.php');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.decks)) return alert("Error al leer los decks.");
    const blob = new Blob([JSON.stringify(data.decks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nexus_coleccion_${data.decks.length}_decks.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert("Error al exportar JSON.");
  }
}

async function exportarTodosYDKZip() {
  try {
    mostrarProgreso("🗜️ Generando ZIP", 1, 2, "Obteniendo todos tus mazos...");
    const res = await fetch('/api/list-decks.php');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.decks) || data.decks.length === 0) {
      ocultarProgreso();
      return alert("No se encontraron decks para exportar.");
    }

    const nombresUsados = new Map();
    const archivosZip = data.decks.map((d, idx) => {
      const base = sanitizarNombreArchivo(d.name || `deck_${idx + 1}`);
      const key = base.toLowerCase();
      const conteo = (nombresUsados.get(key) || 0) + 1;
      nombresUsados.set(key, conteo);

      const nombreFinal = conteo === 1 ? `${base}.ydk` : `${base} (${conteo}).ydk`;
      return { nombre: nombreFinal, contenido: generarTextoYDK(d) };
    });

    mostrarProgreso("🗜️ Generando ZIP", 2, 2, `Empaquetando ${archivosZip.length} archivos .ydk...`);
    const zipBlob = crearZip(archivosZip);

    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `nexus_coleccion_${archivosZip.length}_ydk.zip`;
    a.click();
    URL.revokeObjectURL(a.href);

    ocultarProgreso();
    alert(`✅ ¡Se descargó el .zip con ${archivosZip.length} archivos .ydk!`);
  } catch (e) {
    ocultarProgreso();
    alert("Error al generar el ZIP de .ydk.");
  }
}

function importarDecksMultiples() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.ydk';
  input.multiple = true;

  input.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const parseCards = (str) => (!str ? [] : str.split(',').map(x => x.trim()).filter(Boolean).map(Number));
    const decksParaSubir = [];

    try {
      for (const file of files) {
        const texto = await file.text();
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(texto);
          if (Array.isArray(parsed)) {
            for (const d of parsed) {
              if (!d || !d.name) continue;
              decksParaSubir.push({
                name: d.name,
                main: Array.isArray(d.main) ? d.main : parseCards(d.main_deck),
                extra: Array.isArray(d.extra) ? d.extra : parseCards(d.extra_deck),
                side: Array.isArray(d.side) ? d.side : parseCards(d.side_deck)
              });
            }
          }
        } else if (file.name.toLowerCase().endsWith('.ydk')) {
          decksParaSubir.push(parsearContenidoYDK(texto, file.name));
        }
      }

      const total = decksParaSubir.length;
      if (total === 0) return alert("No se encontraron decks válidos.");
      if (!confirm(`¿Importar ${total} deck(s) a esta cuenta?`)) return;

      for (let i = 0; i < total; i++) {
        const d = decksParaSubir[i];
        mostrarProgreso("📥 Importando Decks", i + 1, total, `Subiendo: "${d.name}"`);

        const fd = new FormData();
        fd.append('name', d.name);
        fd.append('deck', JSON.stringify({ main: d.main, extra: d.extra, side: d.side }));

        try {
          const resp = await fetch('/api/create-deck.php', { method: 'POST', body: fd });
          await resp.text();
        } catch (errPost) {}
        await new Promise(r => setTimeout(r, 250));
      }

      mostrarProgreso("✅ ¡Importación Completa!", total, total, "Recargando tus decks...");
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      ocultarProgreso();
      alert("Error al leer los archivos seleccionados.");
    }
  };
  input.click();
}

async function comprobarDecks() {
  document.querySelectorAll('.nt-card-warn').forEach(el => el.classList.remove('nt-card-warn'));
  document.querySelectorAll('.nt-badge-warn').forEach(b => b.remove());

  try {
    const res = await fetch('/api/list-decks.php');
    const data = await res.json();
    if (!data.success || !data.decks) return alert("Error al conectar.");

    const totalDecks = data.decks.length;
    let validos = 0;
    const listaReporte = [];
    const mapaFallos = new Map();
    const contar = (str) => (!str ? 0 : str.split(',').map(s => s.trim()).filter(Boolean).length);

    data.decks.forEach(d => {
      const main = contar(d.main_deck);
      const extra = contar(d.extra_deck);
      const side = contar(d.side_deck);
      const mainOk = main >= 40 && main <= 60;
      const extraOk = extra <= 15;
      const sideOk = side <= 15;
      const nombreLimpio = d.name.trim();

      if (mainOk && extraOk && sideOk) {
        validos++;
      } else {
        const motivos = [];
        let etiqueta = "";
        if (main === 0) { motivos.push(`Main Deck vacío`); etiqueta = `⚠️ Vacío`; }
        else if (main < 40) { motivos.push(`Main incompleto: ${main}/40`); etiqueta = `⚠️ Incompleto`; }
        else if (main > 60) { motivos.push(`Exceso Main: ${main}/60`); etiqueta = `❌ Exceso`; }
        if (extra > 15) motivos.push(`Exceso Extra`);
        if (side > 15) motivos.push(`Exceso Side`);
        listaReporte.push(`• "${nombreLimpio}": ${motivos.join(' | ')}`);
        mapaFallos.set(nombreLimpio.toLowerCase(), etiqueta);
      }
    });

    aplicandoDOM = true;
    try {
      const nodosFallos = buscarNodosTitulo(mapaFallos);
      nodosFallos.forEach(({ el, textoNodo }) => {
        const tarjeta = encontrarTarjetaDeck(el);
        if (tarjeta && !tarjeta.classList.contains('nt-card-warn')) {
          if (window.getComputedStyle(tarjeta).position === 'static') {
            tarjeta.style.position = 'relative';
          }
          clasificarVistaTarjeta(tarjeta);
          tarjeta.classList.add('nt-card-warn');
          const badge = document.createElement('div');
          badge.className = 'nt-badge-warn';
          badge.innerText = mapaFallos.get(textoNodo);
          tarjeta.appendChild(badge);
        }
      });
    } finally {
      aplicandoDOM = false;
    }

    setTimeout(() => {
      if (listaReporte.length === 0) alert("🎉 ¡TODOS LOS DECKS CUMPLEN LAS REGLAS!");
      else alert(`📋 COMPROBACIÓN DE DECKS (${totalDecks}):\n\n✅ Listos: ${validos}\n⚠️ Con fallas (${listaReporte.length}):\n\n${listaReporte.join('\n')}`);
    }, 60);

  } catch (err) {
    alert("Error al comprobar.");
  }
}

function actualizarContadorBorrado() {
  const btn = document.getElementById('nt-btn-delete-confirm');
  if (btn) btn.innerHTML = `🗑️ Eliminar (${idsSeleccionados.size})`;
}

function salirModoSeleccion() {
  modoSeleccionActivo = false;
  idsSeleccionados.clear();
  document.querySelectorAll('.nt-checkbox-container').forEach(el => el.remove());
  document.querySelectorAll('.nt-selecting-card').forEach(el => el.classList.remove('nt-selecting-card', 'nt-card-selected'));
  const content = document.querySelector('.nt-content');
  if (content) renderizarBotonesDecks(content);
}

async function activarModoSeleccion() {
  const content = document.querySelector('.nt-content');
  if (!content) return;

  modoSeleccionActivo = true;
  idsSeleccionados.clear();

  await cargarYActualizarDecksDOM();

  content.innerHTML = `
    <button id="nt-btn-select-all" class="nt-btn">☑️ Todos</button>
    <button id="nt-btn-delete-confirm" class="nt-btn nt-btn-danger">🗑️ Eliminar (0)</button>
    <button id="nt-btn-cancel-delete" class="nt-btn">✖ Cancelar</button>
  `;

  document.getElementById('nt-btn-select-all').onclick = () => {
    const todas = document.querySelectorAll('.nt-deck-checkbox');
    const todasMarcadas = todas.length > 0 && Array.from(todas).every(c => c.checked);

    todas.forEach(chk => {
      chk.checked = !todasMarcadas;
      const id = chk.dataset.deckId;
      const card = chk.closest('.nt-selecting-card');
      if (id) {
        if (!todasMarcadas) {
          idsSeleccionados.add(id);
          card?.classList.add('nt-card-selected');
        } else {
          idsSeleccionados.delete(id);
          card?.classList.remove('nt-card-selected');
        }
      }
    });
    actualizarContadorBorrado();
  };

  document.getElementById('nt-btn-delete-confirm').onclick = async () => {
    const total = idsSeleccionados.size;
    if (total === 0) return alert("No has seleccionado decks.");
    if (!confirm(`¿ELIMINAR ${total} decks permanentemente?`)) return;

    let borrados = 0;
    for (const id of idsSeleccionados) {
      if (!id) continue;
      borrados++;
      mostrarProgreso("🗑️ Borrando Decks", borrados, total, `Eliminando mazo ${borrados} de ${total}...`);

      const fd = new FormData();
      fd.append('id', id);

      try {
        const resp = await fetch('/api/delete-deck.php', { method: 'POST', body: fd });
        await resp.text();
      } catch (e) {}
      await new Promise(r => setTimeout(r, 200));
    }

    mostrarProgreso("✅ ¡Limpieza Completa!", total, total, "Recargando tus decks...");
    setTimeout(() => location.reload(), 600);
  };

  document.getElementById('nt-btn-cancel-delete').onclick = salirModoSeleccion;

  aplicarElementosEnTarjetas();
}