// ==========================================
// --- ENRUTADOR PRINCIPAL (ROUTER) ---
// ==========================================

function iniciarSuperNexus() {
  if (document.getElementById('super-nexus-panel')) return;

  // Panel Flotante
  const panel = document.createElement('div');
  panel.id = 'super-nexus-panel';
  panel.style.display = 'none';

  let posGuardada = null;
  try {
    posGuardada = JSON.parse(localStorage.getItem('nt_panel_pos') || 'null');
  } catch (e) {
    posGuardada = null;
  }

  if (posGuardada && typeof posGuardada.x === 'number' && typeof posGuardada.y === 'number') {
    const x = Math.max(10, Math.min(window.innerWidth - 120, posGuardada.x));
    const y = Math.max(10, Math.min(window.innerHeight - 60, posGuardada.y));
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
  }

  const dragHandle = document.createElement('div');
  dragHandle.className = 'nt-drag-handle';
  dragHandle.innerHTML = '⠿ NEXUS DECKS';

  const content = document.createElement('div');
  content.className = 'nt-content';

  // Selector de idioma (ES / EN)
  const btnLang = document.createElement('button');
  btnLang.className = 'nt-toggle';
  btnLang.type = 'button';

  const actualizarBtnLang = () => {
    btnLang.textContent = ntLang.toUpperCase();
    btnLang.title = ntT('langBtnTitle');
  };
  actualizarBtnLang();

  btnLang.onclick = () => {
    ntSetLang(ntLang === 'es' ? 'en' : 'es');
    actualizarBtnLang();
    if (window.location.pathname.includes('/decks') && typeof refrescarIdiomaDecks === 'function') {
      refrescarIdiomaDecks(content);
    }
  };

  const btnToggle = document.createElement('button');
  btnToggle.className = 'nt-toggle';
  btnToggle.type = 'button';
  btnToggle.innerHTML = '➖';
  btnToggle.onclick = () => {
    panel.classList.toggle('minimized');
    btnToggle.innerHTML = panel.classList.contains('minimized') ? '➕' : '➖';
  };

  panel.appendChild(dragHandle);
  panel.appendChild(content);
  panel.appendChild(btnLang);
  panel.appendChild(btnToggle);
  document.body.appendChild(panel);

  // --- CONTROL POR RUTA (SOLO EN /decks) ---
  let rutaActual = '';

  function router() {
    const path = window.location.pathname;
    if (path === rutaActual) return;
    rutaActual = path;

    if (path.includes('/decks')) {
      if (typeof renderizarBotonesDecks === 'function') renderizarBotonesDecks(content);
      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
      if (typeof desactivarModuloDecks === 'function') desactivarModuloDecks();
    }
  }

  router();
  window.addEventListener('popstate', router);
  setInterval(router, 400);

  // Arrastre (Mouse + Táctil con Pointer Events)
  let isDragging = false, offsetX = 0, offsetY = 0;

  dragHandle.addEventListener('pointerdown', (e) => {
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    dragHandle.setPointerCapture?.(e.pointerId);
  });

  document.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const x = Math.max(10, Math.min(window.innerWidth - panel.offsetWidth - 10, e.clientX - offsetX));
    const y = Math.max(10, Math.min(window.innerHeight - panel.offsetHeight - 10, e.clientY - offsetY));
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
  });

  document.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    const rect = panel.getBoundingClientRect();
    try {
      localStorage.setItem('nt_panel_pos', JSON.stringify({ x: rect.left, y: rect.top }));
    } catch (e) {}
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarSuperNexus);
} else {
  iniciarSuperNexus();
}