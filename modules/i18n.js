// ==========================================
// --- MÓDULO 0: IDIOMAS / LANGUAGES (Super Nexus v1.1.0) ---
// ==========================================

const NT_I18N = {
  es: {
    // Panel
    langBtnTitle: 'Idioma / Language',

    // Botones de la barra
    btnCopy: '📋 Copiar Nombres',
    btnCheck: '🔍 Comprobar Decks',
    btnDelete: '🗑️ Borrar Decks',
    btnExportJson: '📦 Exportar JSON',
    btnExportJsonTitle: 'Exportar colección completa en .json',
    btnExportZip: '🗜️ Exportar .YDK (.zip)',
    btnExportZipTitle: 'Descargar todos los mazos en un .zip de archivos .ydk',
    btnImport: '📥 Importar (.json / .ydk)',
    btnImportTitle: 'Importar un .json o múltiples archivos .ydk a la vez',
    btnYdke: '🔗 YDKE & Omega',
    btnYdkeTitle: 'Exportar e importar mazos en formato ydke:// y Omega Code',
    ydkBtnTitle: 'Descargar en formato .ydk para EDOPro / Omega',

    // Modo de selección / borrado
    btnSelectAll: '☑️ Todos',
    btnDeleteConfirm: '🗑️ Eliminar ({n})',
    btnCancel: '✖ Cancelar',
    noneSelected: 'No has seleccionado decks.',
    confirmDelete: '¿ELIMINAR {n} decks permanentemente?',
    progDeleteTitle: '🗑️ Borrando Decks',
    progDeleteDetail: 'Eliminando mazo {i} de {n}...',
    progCleanDone: '✅ ¡Limpieza Completa!',

    // Progreso general
    progReloading: 'Recargando tus decks...',
    progImportTitle: '📥 Importando Decks',
    progUploading: 'Subiendo: "{name}"',
    progImportDone: '✅ ¡Importación Completa!',

    // Importar
    noValidDecks: 'No se encontraron decks válidos.',
    confirmImportThisAccount: '¿Importar {n} deck(s) a esta cuenta?',
    errReadFiles: 'Error al leer los archivos seleccionados.',
    defaultImportedDeck: 'Deck Importado',

    // Copiar nombres
    noDecksToCopy: '⚠️ No se encontraron decks para copiar.',
    copiedNames: '¡{n} nombres copiados al portapapeles!',
    clipboardBlocked: '❌ El navegador bloqueó el acceso al portapapeles.',

    // Backup JSON
    errReadDecks: 'Error al leer los decks.',
    errExportJson: 'Error al exportar JSON.',

    // ZIP
    progZipTitle: '🗜️ Generando ZIP',
    progZipFetching: 'Obteniendo todos tus mazos...',
    progZipPacking: 'Empaquetando {n} archivos .ydk...',
    noDecksToExport: 'No se encontraron decks para exportar.',
    zipDone: '✅ ¡Se descargó el .zip con {n} archivos .ydk!',
    errZip: 'Error al generar el ZIP de .ydk.',

    // Comprobador
    errConnect: 'Error al conectar.',
    reasonMainEmpty: 'Main Deck vacío',
    badgeEmpty: '⚠️ Vacío',
    reasonMainIncomplete: 'Main incompleto: {n}/40',
    badgeIncomplete: '⚠️ Incompleto',
    reasonMainExcess: 'Exceso Main: {n}/60',
    badgeExcess: '❌ Exceso',
    reasonExtraExcess: 'Exceso Extra',
    reasonSideExcess: 'Exceso Side',
    allDecksOk: '🎉 ¡TODOS LOS DECKS CUMPLEN LAS REGLAS!',
    checkReport: '📋 COMPROBACIÓN DE DECKS ({total}):\n\n✅ Listos: {ok}\n⚠️ Con fallas ({bad}):\n\n{list}',

    // Modal YDKE & Omega
    errLoadDecks: 'Error al cargar tus decks.',
    progPrepTitle: '🔗 Preparando Códigos',
    progPrepDetail: 'Generando Omega Codes nativos...',
    ydkeModalTitle: '🔗 Conversor YDKE:// & Omega Code',
    ydkeExportLabel: '📤 Exportar tus mazos',
    ydkeFilterPlaceholder: '🔎 Filtrar por nombre...',
    ydkeCopyYdke: '🔗 Copiar sólo ydke://',
    ydkeCopyOmega: '✨ Copiar sólo Omega Code',
    ydkeCopyNamed: '📋 Copiar con Nombre',
    ydkeDownloadTxt: '💾 Descargar .txt',
    ydkeImportLabel: '📥 Importar enlaces <b>ydke://</b> a tu cuenta',
    ydkeImportPlaceholder: 'Pega aquí uno o varios enlaces (uno por línea):\nydke://...\nMi Deck: ydke://...',
    ydkeImportBtn: '📥 Importar enlaces pegados',
    noDecksInList: 'No hay mazos en la lista.',
    copiedYdke: '¡{n} enlace(s) ydke:// copiados!',
    copiedOmega: '¡{n} Omega Code(s) copiados al portapapeles!',
    copiedNamed: '¡{n} mazos copiados con sus códigos!',
    noDecksToDownload: 'No hay mazos para descargar.',
    noValidYdke: '⚠️ No se detectó ningún enlace ydke:// válido.',
    confirmImportAccount: '¿Importar {n} deck(s) a tu cuenta?'
  },

  en: {
    // Panel
    langBtnTitle: 'Idioma / Language',

    // Toolbar buttons
    btnCopy: '📋 Copy Names',
    btnCheck: '🔍 Check Decks',
    btnDelete: '🗑️ Delete Decks',
    btnExportJson: '📦 Export JSON',
    btnExportJsonTitle: 'Export the full collection as .json',
    btnExportZip: '🗜️ Export .YDK (.zip)',
    btnExportZipTitle: 'Download all decks as a .zip of .ydk files',
    btnImport: '📥 Import (.json / .ydk)',
    btnImportTitle: 'Import a .json or several .ydk files at once',
    btnYdke: '🔗 YDKE & Omega',
    btnYdkeTitle: 'Export and import decks as ydke:// and Omega Code',
    ydkBtnTitle: 'Download as .ydk for EDOPro / Omega',

    // Selection / delete mode
    btnSelectAll: '☑️ All',
    btnDeleteConfirm: '🗑️ Delete ({n})',
    btnCancel: '✖ Cancel',
    noneSelected: 'You have not selected any decks.',
    confirmDelete: 'PERMANENTLY DELETE {n} decks?',
    progDeleteTitle: '🗑️ Deleting Decks',
    progDeleteDetail: 'Deleting deck {i} of {n}...',
    progCleanDone: '✅ Cleanup Complete!',

    // General progress
    progReloading: 'Reloading your decks...',
    progImportTitle: '📥 Importing Decks',
    progUploading: 'Uploading: "{name}"',
    progImportDone: '✅ Import Complete!',

    // Import
    noValidDecks: 'No valid decks were found.',
    confirmImportThisAccount: 'Import {n} deck(s) into this account?',
    errReadFiles: 'Error reading the selected files.',
    defaultImportedDeck: 'Imported Deck',

    // Copy names
    noDecksToCopy: '⚠️ No decks were found to copy.',
    copiedNames: '{n} names copied to the clipboard!',
    clipboardBlocked: '❌ The browser blocked clipboard access.',

    // JSON backup
    errReadDecks: 'Error reading the decks.',
    errExportJson: 'Error exporting JSON.',

    // ZIP
    progZipTitle: '🗜️ Generating ZIP',
    progZipFetching: 'Fetching all your decks...',
    progZipPacking: 'Packing {n} .ydk files...',
    noDecksToExport: 'No decks were found to export.',
    zipDone: '✅ Downloaded the .zip with {n} .ydk files!',
    errZip: 'Error generating the .ydk ZIP.',

    // Deck checker
    errConnect: 'Connection error.',
    reasonMainEmpty: 'Main Deck empty',
    badgeEmpty: '⚠️ Empty',
    reasonMainIncomplete: 'Main incomplete: {n}/40',
    badgeIncomplete: '⚠️ Incomplete',
    reasonMainExcess: 'Main excess: {n}/60',
    badgeExcess: '❌ Excess',
    reasonExtraExcess: 'Extra excess',
    reasonSideExcess: 'Side excess',
    allDecksOk: '🎉 ALL DECKS FOLLOW THE RULES!',
    checkReport: '📋 DECK CHECK ({total}):\n\n✅ Ready: {ok}\n⚠️ With problems ({bad}):\n\n{list}',

    // YDKE & Omega modal
    errLoadDecks: 'Error loading your decks.',
    progPrepTitle: '🔗 Preparing Codes',
    progPrepDetail: 'Generating native Omega Codes...',
    ydkeModalTitle: '🔗 YDKE:// & Omega Code Converter',
    ydkeExportLabel: '📤 Export your decks',
    ydkeFilterPlaceholder: '🔎 Filter by name...',
    ydkeCopyYdke: '🔗 Copy ydke:// only',
    ydkeCopyOmega: '✨ Copy Omega Code only',
    ydkeCopyNamed: '📋 Copy with Name',
    ydkeDownloadTxt: '💾 Download .txt',
    ydkeImportLabel: '📥 Import <b>ydke://</b> links into your account',
    ydkeImportPlaceholder: 'Paste one or more links here (one per line):\nydke://...\nMy Deck: ydke://...',
    ydkeImportBtn: '📥 Import pasted links',
    noDecksInList: 'There are no decks in the list.',
    copiedYdke: '{n} ydke:// link(s) copied!',
    copiedOmega: '{n} Omega Code(s) copied to the clipboard!',
    copiedNamed: '{n} deck(s) copied with their codes!',
    noDecksToDownload: 'There are no decks to download.',
    noValidYdke: '⚠️ No valid ydke:// link was found.',
    confirmImportAccount: 'Import {n} deck(s) into your account?'
  }
};

function ntDetectarIdioma() {
  try {
    const guardado = localStorage.getItem('nt_lang');
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch (e) {}
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('es') ? 'es' : 'en';
}

let ntLang = ntDetectarIdioma();

function ntSetLang(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  ntLang = lang;
  try { localStorage.setItem('nt_lang', lang); } catch (e) {}
}

// Traduce una clave. Soporta variables con {nombre}: ntT('copiedNames', { n: 5 })
function ntT(key, vars) {
  const dict = NT_I18N[ntLang] || NT_I18N.en;
  let str = dict[key] ?? NT_I18N.en[key] ?? key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  }
  return str;
}
