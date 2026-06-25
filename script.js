let library = { notes: [], summaries: [], qa: [] };
let currentView = 'notes';
let activeReaderId = null;
const contentCache = {};

async function loadItemContent(item) {
  if (!item) return null;
  if (item.contentHref) {
    try {
      if (!contentCache[item.contentHref]) {
        const res = await fetch(item.contentHref);
        if (!res.ok) throw new Error('Content file not found');
        contentCache[item.contentHref] = await res.json();
      }
      const external = contentCache[item.contentHref];
      item.content = {
        notes: external.notes || [],
        summary: external.summary || '',
        qa: external.qa || []
      };
      item.title = external.title || item.title;
      item.class = external.class || item.class;
      item.subject = external.subject || item.subject;
      item.chapter = external.chapter || item.chapter;
    } catch (err) {
      console.warn('Could not load chapter content file:', item.contentHref, err);
      item.content = item.content || { notes: [], summary: '', qa: [] };
    }
  }
  return item;
}

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


function cleanPdfText(value = '') {
  return String(value)
    .replace(/[📖📝❓📘📗📙📕🧬🌾➗⚖️]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—|–/g, '-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/×/g, 'x')
    .replace(/√/g, 'sqrt')
    .replace(/•/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeFilename(value = 'NCERT-notes') {
  return cleanPdfText(value)
    .replace(/[^a-z0-9\- ]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'NCERT-notes';
}

function ensurePdfSpace(doc, y, needed = 18) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 54;
  if (y + needed > pageHeight - bottomMargin) {
    doc.addPage();
    return 54;
  }
  return y;
}

function addWrappedPdfText(doc, text, x, y, maxWidth, options = {}) {
  const fontSize = options.fontSize || 11;
  const lineHeight = options.lineHeight || fontSize + 5;
  const style = options.style || 'normal';
  const color = options.color || [34, 31, 26];

  doc.setFont('helvetica', style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  const cleaned = cleanPdfText(text);
  if (!cleaned) return y;

  const lines = doc.splitTextToSize(cleaned, maxWidth);
  lines.forEach(line => {
    y = ensurePdfSpace(doc, y, lineHeight);
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function addPdfSectionTitle(doc, title, y, margin, contentWidth) {
  y = ensurePdfSpace(doc, y, 40);
  doc.setDrawColor(34, 31, 26);
  doc.setFillColor(243, 214, 150);
  doc.roundedRect(margin, y - 20, contentWidth, 32, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(34, 31, 26);
  doc.text(cleanPdfText(title), margin + 12, y + 1);
  return y + 26;
}

function addPdfFooter(doc, title) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(213, 201, 178);
    doc.line(48, pageHeight - 38, pageWidth - 48, pageHeight - 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(111, 100, 82);
    doc.text(cleanPdfText(title), 48, pageHeight - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 48, pageHeight - 22, { align: 'right' });
  }
}

function buildItemPdf(item) {
  const PdfConstructor = window.jspdf && window.jspdf.jsPDF;
  if (!PdfConstructor) return null;

  const doc = new PdfConstructor({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const content = item.content || {};
  let y = 58;

  doc.setDrawColor(34, 31, 26);
  doc.setFillColor(251, 248, 241);
  doc.roundedRect(margin, 36, contentWidth, 118, 10, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(34, 31, 26);
  doc.text(cleanPdfText(item.title || 'NCERT Notes'), margin + 18, y);
  y += 24;

  const meta = `Class ${item.class || ''} | ${item.subject || ''} | ${item.chapter || ''} | ${item.type || ''}`;
  y = addWrappedPdfText(doc, meta, margin + 18, y, contentWidth - 36, { fontSize: 10, lineHeight: 14, color: [111, 100, 82] });
  y += 6;
  y = addWrappedPdfText(doc, item.description || 'Study material for NCERT preparation.', margin + 18, y, contentWidth - 36, { fontSize: 10, lineHeight: 15 });
  y = 190;

  y = addPdfSectionTitle(doc, 'NOTES', y, margin, contentWidth);
  const notes = content.notes || [];
  if (!notes.length) {
    y = addWrappedPdfText(doc, 'Notes are not added yet.', margin, y, contentWidth, { fontSize: 11, lineHeight: 16 });
  } else {
    notes.forEach((note, noteIndex) => {
      if (typeof note === 'string') {
        y = addWrappedPdfText(doc, `${noteIndex + 1}. ${note}`, margin, y, contentWidth, { fontSize: 11, lineHeight: 16 });
        y += 4;
      } else {
        if (note.heading) {
          y = ensurePdfSpace(doc, y, 28);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(34, 31, 26);
          doc.text(cleanPdfText(note.heading), margin, y);
          y += 18;
        }
        (note.points || []).forEach(point => {
          y = addWrappedPdfText(doc, `- ${point}`, margin + 10, y, contentWidth - 10, { fontSize: 11, lineHeight: 16 });
        });
        y += 8;
      }
    });
  }

  y += 10;
  y = addPdfSectionTitle(doc, 'SUMMARY', y, margin, contentWidth);
  const summary = content.summary;
  if (Array.isArray(summary)) {
    summary.forEach(point => {
      y = addWrappedPdfText(doc, `- ${point}`, margin + 10, y, contentWidth - 10, { fontSize: 11, lineHeight: 16 });
    });
  } else {
    y = addWrappedPdfText(doc, summary || 'Summary is not added yet.', margin, y, contentWidth, { fontSize: 11, lineHeight: 16 });
  }

  y += 10;
  y = addPdfSectionTitle(doc, 'QUESTION & ANSWERS', y, margin, contentWidth);
  const qa = content.qa || [];
  if (!qa.length) {
    y = addWrappedPdfText(doc, 'Question answers are not added yet.', margin, y, contentWidth, { fontSize: 11, lineHeight: 16 });
  } else {
    qa.forEach((question, index) => {
      y = ensurePdfSpace(doc, y, 46);
      y = addWrappedPdfText(doc, `Q${index + 1}. ${question.q}`, margin, y, contentWidth, { fontSize: 11, lineHeight: 16, style: 'bold' });
      y = addWrappedPdfText(doc, `Answer: ${question.a}`, margin + 12, y, contentWidth - 12, { fontSize: 11, lineHeight: 16 });
      y += 8;
    });
  }

  addPdfFooter(doc, item.title || 'NCERT Notes');
  return doc;
}

async function openGeneratedPdf(id) {
  const item = await loadItemContent(findItemById(id));
  if (!item) return;

  const doc = buildItemPdf(item);
  if (!doc) {
    openReader(id);
    setTimeout(() => window.print(), 200);
    return;
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const newWindow = window.open(pdfUrl, '_blank');
  if (!newWindow) {
    doc.save(`${sanitizeFilename(item.title)}.pdf`);
  }
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
}

function renderFiles(item) {
  return (item.files || []).map(f => {
    const format = String(f.format || '');
    const isPdf = format.toLowerCase().includes('pdf');
    const isContent = format.toLowerCase().includes('content');

    if (isContent) {
      const href = normalizeDriveUrl(f.path);
      return `
        <div class="quality-row">
          <div class="quality-info">
            <span class="quality-name">${escapeHtml(f.label || 'Chapter Content JSON')}</span>
            <span class="quality-size">${escapeHtml(f.size || 'Edit/upload this JSON file')}</span>
          </div>
          <a class="download-btn secondary-btn" href="${escapeHtml(href)}" target="_blank" rel="noopener">Open Template</a>
        </div>`;
    }

    if (isPdf) {
      return `
        <div class="quality-row">
          <div class="quality-info">
            <span class="quality-name">${escapeHtml(f.format)} — ${escapeHtml(f.label || 'Full Notes PDF')}</span>
            <span class="quality-size">Generated from notes, summary and Q&A</span>
          </div>
          <button class="download-btn" type="button" data-generate-pdf="${escapeHtml(item.id)}">Open PDF</button>
        </div>`;
    }

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

async function openModal(id) {
  const item = await loadItemContent(findItemById(id));
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

  modalContent.querySelectorAll('[data-generate-pdf]').forEach(btn => {
    btn.addEventListener('click', () => openGeneratedPdf(btn.dataset.generatePdf));
  });

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

async function openReader(id) {
  const item = await loadItemContent(findItemById(id));
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
readerPrint.addEventListener('click', () => { if (activeReaderId) openGeneratedPdf(activeReaderId); });

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
