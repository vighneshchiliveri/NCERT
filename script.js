let library = { notes: [], summaries: [], qa: [] };
let currentView = 'notes';

const catalogEl = document.getElementById('catalog');
const emptyStateEl = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const genreFilter = document.getElementById('genreFilter');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

async function loadLibrary() {
  try {
    const res = await fetch('media/library.json');
    library = await res.json();
  } catch (err) {
    console.error('Could not load media/library.json', err);
    library = { notes: [], summaries: [], qa: [] };
  }
  populateSubjects();
  render();
}

function populateSubjects() {
  const items = library[currentView] || [];
  const subjects = [...new Set(items.map(i => i.subject).filter(Boolean))].sort();
  genreFilter.innerHTML = '<option value="">All</option>' + subjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function normalizeDriveUrl(path) {
  if (!path) return path;
  const match = path.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  const openMatch = path.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
  return path;
}

function isExternalUrl(path) {
  return /^https?:\/\//i.test(path);
}

function getFiltered() {
  const items = library[currentView] || [];
  const q = searchInput.value.trim().toLowerCase();
  const subject = genreFilter.value;
  return items.filter(item => {
    const haystack = `${item.title} ${item.class || ''} ${item.subject || ''} ${item.chapter || ''} ${item.book || ''}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!subject || item.subject === subject);
  });
}

function render() {
  const filtered = getFiltered();
  const items = library[currentView] || [];
  resultCount.textContent = `${filtered.length} / ${items.length}`;
  if (!filtered.length) {
    catalogEl.innerHTML = '';
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;
  catalogEl.innerHTML = filtered.map((item, idx) => {
    const catNum = String(idx + 1).padStart(3, '0');
    const icon = item.icon || '📘';
    return `
      <article class="entry-card" tabindex="0" data-id="${escapeHtml(item.id)}">
        <div class="entry-cover">${icon}</div>
        <span class="entry-cat">No. ${catNum}</span>
        <div class="entry-body">
          <h3 class="entry-title">${escapeHtml(item.title)}</h3>
          <p class="entry-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')}</p>
          <div class="entry-meta">
            <span>${escapeHtml(item.chapter || '')}</span>
            <span>${escapeHtml(item.type || '')}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  catalogEl.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.dataset.id);
      }
    });
  });
}

function openModal(id) {
  const item = (library[currentView] || []).find(i => i.id === id);
  if (!item) return;
  const filesHtml = (item.files || []).map(f => {
    const href = normalizeDriveUrl(f.path);
    const downloadAttr = isExternalUrl(href) ? '' : 'download';
    return `
      <div class="quality-row">
        <div class="quality-info">
          <span class="quality-name">${escapeHtml(f.format)} — ${escapeHtml(f.label)}</span>
          <span class="quality-size">${escapeHtml(f.size || '')}</span>
        </div>
        <a class="download-btn" href="${escapeHtml(href)}" ${downloadAttr} target="_blank" rel="noopener">Open</a>
      </div>`;
  }).join('');

  modalContent.innerHTML = `
    <div class="modal-cover">${item.icon || '📘'}</div>
    <div class="modal-body">
      <h2 id="modalTitle" class="modal-title">${escapeHtml(item.title)}</h2>
      <p class="modal-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')} · ${escapeHtml(item.chapter || '')}</p>
      <p class="modal-desc">${escapeHtml(item.description || 'Study material for NCERT preparation.')}</p>
      <p class="quality-label">Available material</p>
      <div class="quality-list">${filesHtml || '<p>No file/link attached yet.</p>'}</div>
    </div>`;
  modalBackdrop.classList.add('open');
}

function closeModal() { modalBackdrop.classList.remove('open'); }

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentView = btn.dataset.view;
    searchInput.value = '';
    populateSubjects();
    render();
  });
});

searchInput.addEventListener('input', render);
genreFilter.addEventListener('change', render);
loadLibrary();
