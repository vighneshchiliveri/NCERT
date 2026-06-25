let library = { notes: [], summaries: [], qa: [] };
let currentView = 'notes';
let selectedClass = null;
let activeReaderId = null;
const contentCache = {};

const homeBtn = document.getElementById('homeBtn');
const classSelectSection = document.getElementById('classSelectSection');
const classGrid = document.getElementById('classGrid');
const catalogControls = document.getElementById('catalogControls');
const selectedClassText = document.getElementById('selectedClassText');
const changeClassBtn = document.getElementById('changeClassBtn');
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
const readerPdf = document.getElementById('readerPdf');
const readerPrint = document.getElementById('readerPrint');
const readerTitle = document.getElementById('readerTitle');
const readerKicker = document.getElementById('readerKicker');
const readerContent = document.getElementById('readerContent');
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');

async function loadLibrary() {
  try {
    const res = await fetch('media/library.json');
    library = await res.json();
  } catch (err) {
    console.error('Could not load media/library.json', err);
    library = { notes: [], summaries: [], qa: [] };
  }

  renderClassSelection();
  catalogEl.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';
}

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getAllItems() {
  return Object.values(library).flat();
}

function getCurrentItems() {
  return library[currentView] || [];
}

function getAvailableClasses() {
  return [...new Set(getAllItems().map(item => item.class).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
}

function renderClassSelection() {
  const classes = getAvailableClasses();

  classGrid.innerHTML = classes.map(cls => `
    <button class="class-card" type="button" data-class="${escapeHtml(cls)}">
      <span>Class</span>
      <strong>${escapeHtml(cls)}</strong>
    </button>
  `).join('');

  classGrid.querySelectorAll('.class-card').forEach(btn => {
    btn.addEventListener('click', () => selectClass(btn.dataset.class));
  });
}

function selectClass(cls) {
  selectedClass = cls;
  selectedClassText.textContent = `Class ${cls}`;
  classSelectSection.hidden = true;
  catalogControls.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  searchInput.value = '';
  genreFilter.value = '';
  populateSubjects();
  render();
}

function changeClass() {
  selectedClass = null;
  activeReaderId = null;
  catalogControls.hidden = true;
  classSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateSubjects() {
  const items = getCurrentItems().filter(item => !selectedClass || item.class === selectedClass);
  const subjects = [...new Set(items.map(i => i.subject).filter(Boolean))].sort();

  genreFilter.innerHTML = '<option value="">All</option>' +
    subjects.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function getFiltered() {
  if (!selectedClass) return [];

  const items = getCurrentItems().filter(item => item.class === selectedClass);
  const q = searchInput.value.trim().toLowerCase();
  const subject = genreFilter.value;

  return items.filter(item => {
    const haystack = `${item.title} ${item.class || ''} ${item.subject || ''} ${item.chapter || ''} ${item.book || ''}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!subject || item.subject === subject);
  });
}

function render() {
  const filtered = getFiltered();
  const items = getCurrentItems().filter(item => item.class === selectedClass);

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

function findItem(id) {
  return getCurrentItems().find(i => i.id === id) || getAllItems().find(i => i.id === id);
}

async function loadItemContent(item) {
  if (!item) return null;

  if (item.content) return item.content;

  if (item.contentHref) {
    if (contentCache[item.contentHref]) return contentCache[item.contentHref];

    try {
      const res = await fetch(item.contentHref);
      const content = await res.json();
      contentCache[item.contentHref] = content;
      return content;
    } catch (err) {
      console.error('Could not load content file:', item.contentHref, err);
    }
  }

  return {
    title: item.title,
    class: item.class,
    subject: item.subject,
    chapter: item.chapter,
    book: item.book,
    type: item.type,
    notes: ['Add notes in the linked content JSON file.'],
    summary: 'Add summary in the linked content JSON file.',
    qa: [{ q: 'Add question here?', a: 'Add answer here.' }]
  };
}

async function openModal(id) {
  const item = findItem(id);
  if (!item) return;

  const content = await loadItemContent(item);
  const notesPreview = (content.notes || []).slice(0, 3).map(n => `<li>${escapeHtml(n)}</li>`).join('');
  const qaCount = (content.qa || []).length;

  modalContent.innerHTML = `
    <div class="modal-cover">${item.icon || '📘'}</div>
    <div class="modal-body">
      <h2 id="modalTitle" class="modal-title">${escapeHtml(item.title)}</h2>
      <p class="modal-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')} · ${escapeHtml(item.chapter || '')}</p>
      <p class="modal-desc">${escapeHtml(item.description || 'Study material for NCERT preparation.')}</p>

      <div class="preview-box">
        <p class="quality-label">Preview</p>
        <ul>${notesPreview || '<li>No preview added yet.</li>'}</ul>
        <p class="modal-sub">${qaCount} Question Answers available</p>
      </div>

      <div class="modal-actions">
        <button class="download-btn wide" type="button" onclick="openReader('${escapeHtml(item.id)}')">Open Detailed Notes</button>
        <button class="download-btn wide" type="button" onclick="generatePdfFromId('${escapeHtml(item.id)}')">Open PDF</button>
      </div>
    </div>`;

  modalBackdrop.classList.add('open');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
}

function contentToHtml(content) {
  const notesHtml = (content.notes || []).map(n => `<li>${escapeHtml(n)}</li>`).join('');
  const qaHtml = (content.qa || []).map((x, i) => `
    <div class="qa-block">
      <p><strong>Q${i + 1}.</strong> ${escapeHtml(x.q)}</p>
      <p><strong>Answer:</strong> ${escapeHtml(x.a)}</p>
    </div>
  `).join('');

  return `
    <section>
      <h2>📖 Notes</h2>
      <ul>${notesHtml || '<li>No notes added yet.</li>'}</ul>
    </section>
    <section>
      <h2>📝 Summary</h2>
      <p>${escapeHtml(content.summary || 'No summary added yet.')}</p>
    </section>
    <section>
      <h2>❓ Question & Answers</h2>
      ${qaHtml || '<p>No question answers added yet.</p>'}
    </section>
  `;
}

async function openReader(id) {
  const item = findItem(id);
  if (!item) return;

  activeReaderId = id;
  const content = await loadItemContent(item);

  readerTitle.textContent = content.title || item.title;
  readerKicker.textContent = `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || ''}`;
  readerContent.innerHTML = contentToHtml(content);

  closeModal();
  readerView.hidden = false;
  document.body.classList.add('reader-open');
  updateReaderNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeReader() {
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  activeReaderId = null;
}

function getReaderList() {
  return getFiltered();
}

function updateReaderNav() {
  const list = getReaderList();
  const index = list.findIndex(item => item.id === activeReaderId);
  prevChapterBtn.disabled = index <= 0;
  nextChapterBtn.disabled = index < 0 || index >= list.length - 1;
}

async function openAdjacentReader(direction) {
  const list = getReaderList();
  const index = list.findIndex(item => item.id === activeReaderId);
  const next = list[index + direction];
  if (next) await openReader(next.id);
}

function addPdfText(doc, text, x, y, maxWidth, lineHeight) {
  const pageHeight = doc.internal.pageSize.height;
  const lines = doc.splitTextToSize(text || '', maxWidth);

  lines.forEach(line => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
}

async function generatePdfFromId(id) {
  const item = findItem(id);
  if (!item) return;

  const content = await loadItemContent(item);

  if (!window.jspdf || !window.jspdf.jsPDF) {
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - 28;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  y = addPdfText(doc, content.title || item.title, 14, y, maxWidth, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addPdfText(doc, `Class ${content.class || item.class || ''} | ${content.subject || item.subject || ''} | ${content.chapter || item.chapter || ''} | ${content.book || item.book || ''}`, 14, y + 2, maxWidth, 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y = addPdfText(doc, 'Notes', 14, y + 8, maxWidth, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  (content.notes || []).forEach((note, i) => {
    y = addPdfText(doc, `${i + 1}. ${note}`, 14, y + 2, maxWidth, 6);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y = addPdfText(doc, 'Summary', 14, y + 8, maxWidth, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y = addPdfText(doc, content.summary || '', 14, y + 2, maxWidth, 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y = addPdfText(doc, 'Question & Answers', 14, y + 8, maxWidth, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  (content.qa || []).forEach((qa, i) => {
    y = addPdfText(doc, `Q${i + 1}. ${qa.q}`, 14, y + 3, maxWidth, 6);
    y = addPdfText(doc, `Answer: ${qa.a}`, 14, y + 1, maxWidth, 6);
  });

  const fileName = `${(content.title || item.title).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
}

window.openReader = openReader;
window.generatePdfFromId = generatePdfFromId;

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    if (!readerView.hidden) closeReader();
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
    genreFilter.value = '';

    if (selectedClass) {
      populateSubjects();
      render();
      if (!readerView.hidden) closeReader();
    }
  });
});

homeBtn.addEventListener('click', changeClass);
changeClassBtn.addEventListener('click', changeClass);
searchInput.addEventListener('input', render);
genreFilter.addEventListener('change', render);
readerBack.addEventListener('click', closeReader);
readerPrint.addEventListener('click', () => window.print());
readerPdf.addEventListener('click', () => {
  if (activeReaderId) generatePdfFromId(activeReaderId);
});
prevChapterBtn.addEventListener('click', () => openAdjacentReader(-1));
nextChapterBtn.addEventListener('click', () => openAdjacentReader(1));

loadLibrary();
