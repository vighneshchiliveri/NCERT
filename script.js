let library = { notes: [], summaries: [], qa: [] };
let currentView = 'notes';
let activeReaderId = null;

const catalogEl = document.getElementById('catalog');
const emptyStateEl = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const genreFilter = document.getElementById('genreFilter');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const readerView = document.getElementById('readerView');
const readerBack = document.getElementById('readerBack');
const readerPrint = document.getElementById('readerPrint');
const readerTitle = document.getElementById('readerTitle');
const readerKicker = document.getElementById('readerKicker');
const readerContent = document.getElementById('readerContent');

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
  div.textContent = String(str);
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

function getAllItems() {
  return Object.values(library).flat();
}

function findItemById(id) {
  return getAllItems().find(item => item.id === id);
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

function renderNotes(notes = []) {
  if (!notes.length) return '<p class="muted-text">Notes are not added yet.</p>';

  return notes.map(note => {
    if (typeof note === 'string') {
      return `<p>${escapeHtml(note)}</p>`;
    }

    const points = (note.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('');
    return `
      <article class="note-block">
        ${note.heading ? `<h4>${escapeHtml(note.heading)}</h4>` : ''}
        ${points ? `<ul>${points}</ul>` : ''}
      </article>`;
  }).join('');
}

function renderSummary(summary) {
  if (!summary) return '<p class="muted-text">Summary is not added yet.</p>';

  if (Array.isArray(summary)) {
    return summary.map(point => `<p>${escapeHtml(point)}</p>`).join('');
  }

  return `<p>${escapeHtml(summary)}</p>`;
}

function renderQuestions(qa = []) {
  if (!qa.length) return '<p class="muted-text">Question answers are not added yet.</p>';

  return qa.map((item, index) => `
    <article class="qa-block">
      <p class="question"><strong>Q${index + 1}.</strong> ${escapeHtml(item.q)}</p>
      <p class="answer"><strong>Answer:</strong> ${escapeHtml(item.a)}</p>
    </article>`).join('');
}

function renderFullContent(item) {
  const content = item.content || {};
  return `
    <section class="full-content-section">
      <h3>📖 Notes</h3>
      ${renderNotes(content.notes || [])}
    </section>

    <section class="full-content-section">
      <h3>📝 Summary</h3>
      ${renderSummary(content.summary)}
    </section>

    <section class="full-content-section">
      <h3>❓ Question & Answers</h3>
      ${renderQuestions(content.qa || [])}
    </section>`;
}

function renderFiles(item) {
  return (item.files || []).map(f => {
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
}

function openModal(id) {
  const item = findItemById(id);
  if (!item) return;

  const filesHtml = renderFiles(item);

  modalContent.innerHTML = `
    <div class="modal-cover">${item.icon || '📘'}</div>
    <div class="modal-body">
      <h2 id="modalTitle" class="modal-title">${escapeHtml(item.title)}</h2>
      <p class="modal-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')} · ${escapeHtml(item.chapter || '')}</p>
      <p class="modal-desc">${escapeHtml(item.description || 'Study material for NCERT preparation.')}</p>

      <button class="fullscreen-btn" type="button" data-open-reader="${escapeHtml(item.id)}">
        📖 Open Full Screen Detailed Notes
      </button>

      <p class="quality-label">Available material</p>
      <div class="quality-list">${filesHtml || '<p>No file/link attached yet.</p>'}</div>

      <div class="modal-divider"></div>
      <div class="modal-study-content">
        ${renderFullContent(item)}
      </div>
    </div>`;

  const readerButton = modalContent.querySelector('[data-open-reader]');
  readerButton.addEventListener('click', () => openReader(item.id));
  modalBackdrop.classList.add('open');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
}

function getReaderNavigation(id) {
  const items = getFiltered();
  const index = items.findIndex(item => item.id === id);

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index > -1 && index < items.length - 1 ? items[index + 1] : null
  };
}

function openReader(id) {
  const item = findItemById(id);
  if (!item) return;

  activeReaderId = id;
  const nav = getReaderNavigation(id);

  readerTitle.textContent = item.title;
  readerKicker.textContent = `Class ${item.class || ''} · ${item.subject || ''} · ${item.chapter || ''} · ${item.type || ''}`;

  readerContent.innerHTML = `
    <section class="reader-hero">
      <div class="reader-icon">${item.icon || '📘'}</div>
      <div>
        <p class="reader-book">${escapeHtml(item.book || 'NCERT')}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.description || '')}</p>
        <div class="reader-chips">
          <span>Class ${escapeHtml(item.class || '')}</span>
          <span>${escapeHtml(item.subject || '')}</span>
          <span>${escapeHtml(item.chapter || '')}</span>
        </div>
      </div>
    </section>

    ${renderFullContent(item)}

    <section class="reader-nav">
      <button class="reader-nav-btn" type="button" ${nav.prev ? `data-nav-id="${escapeHtml(nav.prev.id)}"` : 'disabled'}>← Previous</button>
      <button class="reader-nav-btn" type="button" ${nav.next ? `data-nav-id="${escapeHtml(nav.next.id)}"` : 'disabled'}>Next →</button>
    </section>`;

  readerContent.querySelectorAll('[data-nav-id]').forEach(btn => {
    btn.addEventListener('click', () => openReader(btn.dataset.navId));
  });

  closeModal();
  readerView.hidden = false;
  document.body.classList.add('reader-open');
  readerView.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeReader() {
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  activeReaderId = null;
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
readerBack.addEventListener('click', closeReader);
readerPrint.addEventListener('click', () => window.print());

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!readerView.hidden) closeReader();
    else closeModal();
  }
});

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
