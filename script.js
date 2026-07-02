let library = { chapters: [] };
let selectedClass = null;
let selectedSubject = null;
let activeReaderId = null;
const readerContentVisibility = { notes: true, summary: true, qa: true };
const contentCache = {};

const homeBtn = document.getElementById('homeBtn');
const classSelectSection = document.getElementById('classSelectSection');
const classGrid = document.getElementById('classGrid');
const subjectSelectSection = document.getElementById('subjectSelectSection');
const subjectGrid = document.getElementById('subjectGrid');
const catalogControls = document.getElementById('catalogControls');
const selectedClassText = document.getElementById('selectedClassText');
const selectedSubjectText = document.getElementById('selectedSubjectText');
const changeSubjectBtn = document.getElementById('changeSubjectBtn');
const changeClassBtn = document.getElementById('changeClassBtn');
const catalogEl = document.getElementById('catalog');
const emptyStateEl = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');

const readerView = document.getElementById('readerView');
const readerBack = document.getElementById('readerBack');
const readerPdf = document.getElementById('readerPdf');
const readerPrint = document.getElementById('readerPrint');
const readerTitle = document.getElementById('readerTitle');
const readerKicker = document.getElementById('readerKicker');
const readerContent = document.getElementById('readerContent');
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');
const toggleNotes = document.getElementById('toggleNotes');
const toggleSummary = document.getElementById('toggleSummary');
const toggleQA = document.getElementById('toggleQA');

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function cleanTitle(title = '') {
  return String(title)
    .replace(/\s*[—-]\s*(Notes|Summary|Summaries|Q\s*&\s*A|QA|Question Answers?)\s*$/i, '')
    .trim();
}

function getCardTitle(item) {
  return item.displayTitle || item.chapterTitle || cleanTitle(item.title || item.chapter || 'Untitled Chapter');
}

async function loadLibrary() {
  try {
    const res = await fetch('media/library.json', { cache: 'no-store' });
    library = await res.json();
  } catch (err) {
    console.error('Could not load media/library.json', err);
    library = { chapters: [] };
  }

  renderClassSelection();
  subjectSelectSection.hidden = true;
  catalogEl.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';
}

function rawItems() {
  if (Array.isArray(library.chapters)) return library.chapters;

  return [
    ...(library.notes || []),
    ...(library.summaries || []),
    ...(library.qa || [])
  ];
}

function getAllItems() {
  const seen = new Set();

  return rawItems().filter(item => {
    if (!item) return false;

    const key = item.contentHref ||
      `${item.class || ''}|${item.subject || ''}|${item.chapter || ''}|${cleanTitle(item.title || '')}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCurrentItems() {
  return getAllItems();
}

function getAvailableClasses() {
  return [...new Set(getAllItems().map(item => item.class).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
}

function renderClassSelection() {
  const classes = getAvailableClasses();

  if (!classes.length) {
    classGrid.innerHTML = `
      <div class="empty-library">
        <h3>No chapters added yet</h3>
        <p>Add chapter cards in <code>media/library.json</code>. Add full chapter content JSON files inside <code>content/</code>.</p>
        <p>Use <code>media/library-template.json</code> and <code>chapter-content-template.json</code> as your copy-paste templates.</p>
      </div>
    `;
    subjectSelectSection.hidden = true;
    catalogControls.hidden = true;
    catalogEl.innerHTML = '';
    emptyStateEl.hidden = true;
    resultCount.textContent = '0 / 0';
    return;
  }

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
  selectedSubject = null;
  selectedClassText.textContent = `Class ${cls}`;
  selectedSubjectText.textContent = 'Subject';

  classSelectSection.hidden = true;
  subjectSelectSection.hidden = false;
  catalogControls.hidden = true;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');

  searchInput.value = '';
  catalogEl.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderSubjectSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeClass() {
  selectedClass = null;
  selectedSubject = null;
  activeReaderId = null;
  catalogControls.hidden = true;
  subjectSelectSection.hidden = true;
  classSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  subjectGrid.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderClassSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSubjectIcon(subject = '') {
  const name = subject.toLowerCase();

  if (name.includes('english')) return '📖';
  if (name.includes('math')) return '➗';
  if (name.includes('physics')) return '⚛️';
  if (name.includes('chem')) return '🧪';
  if (name.includes('bio')) return '🌿';
  if (name.includes('science')) return '🔬';
  if (name.includes('history')) return '🏛️';
  if (name.includes('geo')) return '🌍';
  if (name.includes('polit')) return '⚖️';
  if (name.includes('econom')) return '📊';
  if (name.includes('hindi')) return '📝';
  if (name.includes('telugu')) return '✍️';

  return '📚';
}

function getSubjectsForSelectedClass() {
  if (!selectedClass) return [];

  const subjectMap = new Map();

  getCurrentItems()
    .filter(item => item.class === selectedClass)
    .forEach(item => {
      const subject = item.subject || 'General';
      const existing = subjectMap.get(subject) || {
        subject,
        count: 0,
        books: new Set(),
        icon: getSubjectIcon(subject)
      };

      existing.count += 1;
      if (item.book) existing.books.add(item.book);
      subjectMap.set(subject, existing);
    });

  return [...subjectMap.values()].sort((a, b) => a.subject.localeCompare(b.subject));
}

function renderSubjectSelection() {
  const subjects = getSubjectsForSelectedClass();

  if (!subjects.length) {
    subjectGrid.innerHTML = `
      <div class="empty-library">
        <h3>No subjects found</h3>
        <p>Add chapter cards for Class ${escapeHtml(selectedClass || '')} in <code>media/library.json</code>.</p>
      </div>
    `;
    return;
  }

  subjectGrid.innerHTML = subjects.map(item => {
    const bookList = [...item.books].join(', ') || 'NCERT';
    const chapterLabel = item.count === 1 ? 'chapter' : 'chapters';

    return `
      <button class="subject-card" type="button" data-subject="${escapeHtml(item.subject)}">
        <span class="subject-icon">${item.icon}</span>
        <strong>${escapeHtml(item.subject)}</strong>
        <small>${item.count} ${chapterLabel}</small>
        <em>${escapeHtml(bookList)}</em>
      </button>
    `;
  }).join('');

  subjectGrid.querySelectorAll('.subject-card').forEach(btn => {
    btn.addEventListener('click', () => selectSubject(btn.dataset.subject));
  });
}

function selectSubject(subject) {
  selectedSubject = subject;
  selectedClassText.textContent = `Class ${selectedClass}`;
  selectedSubjectText.textContent = subject;

  subjectSelectSection.hidden = true;
  catalogControls.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');

  searchInput.value = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeSubject() {
  selectedSubject = null;
  activeReaderId = null;
  selectedSubjectText.textContent = 'Subject';
  catalogControls.hidden = true;
  subjectSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderSubjectSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getFiltered() {
  if (!selectedClass || !selectedSubject) return [];

  const items = getCurrentItems().filter(item => {
    const subject = item.subject || 'General';
    return item.class === selectedClass && subject === selectedSubject;
  });
  const q = searchInput.value.trim().toLowerCase();

  return items.filter(item => {
    const haystack = `
      ${getCardTitle(item)}
      ${item.class || ''}
      ${item.subject || ''}
      ${item.chapter || ''}
      ${item.book || ''}
      ${item.description || ''}
    `.toLowerCase();

    return !q || haystack.includes(q);
  });
}

function render() {
  const filtered = getFiltered();
  const items = getCurrentItems().filter(item => {
    const subject = item.subject || 'General';
    return item.class === selectedClass && subject === selectedSubject;
  });

  resultCount.textContent = `${filtered.length} / ${items.length}`;

  if (!filtered.length) {
    catalogEl.innerHTML = '';
    emptyStateEl.textContent = searchInput.value.trim()
      ? 'No NCERT material matches your search.'
      : 'No chapters added for this subject yet.';
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
          <h3 class="entry-title">${escapeHtml(getCardTitle(item))}</h3>
          <p class="entry-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')}</p>

          <div class="entry-meta">
            <span>${escapeHtml(item.chapter || '')}</span>
            <span>${escapeHtml(item.book || 'NCERT')}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  catalogEl.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => openReader(card.dataset.id));

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openReader(card.dataset.id);
      }
    });
  });
}

function findItem(id) {
  return getCurrentItems().find(i => i.id === id) || getAllItems().find(i => i.id === id);
}

async function loadItemContent(item) {
  if (!item) return null;

  if (item.content) {
    return { ...item, ...item.content };
  }

  if (item.contentHref) {
    if (contentCache[item.contentHref]) {
      return { ...item, ...contentCache[item.contentHref] };
    }

    try {
      const res = await fetch(item.contentHref, { cache: 'no-store' });
      const content = await res.json();
      contentCache[item.contentHref] = content;
      return { ...item, ...content };
    } catch (err) {
      console.error('Could not load content file:', item.contentHref, err);
    }
  }

  return {
    ...item,
    title: getCardTitle(item),
    notes: ['Add notes in the linked content JSON file.'],
    summary: 'Add summary in the linked content JSON file.',
    qa: [{ q: 'Add question here?', a: 'Add answer here.' }]
  };
}

function renderTextBlock(value) {
  if (!value) return '';

  if (Array.isArray(value)) {
    return `<ul>${value.map(v => `<li>${escapeHtml(v)}</li>`).join('')}</ul>`;
  }

  return String(value)
    .split(/\n+/)
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join('');
}

function renderNotes(notes = []) {
  if (!Array.isArray(notes) || !notes.length) {
    return '<p>No notes added yet.</p>';
  }

  const simpleNotes = notes.every(n => typeof n === 'string');

  if (simpleNotes) {
    return `<ul>${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`;
  }

  return notes.map(note => {
    if (typeof note === 'string') {
      return `<div class="qa-block"><p>${escapeHtml(note)}</p></div>`;
    }

    const heading = note.heading || note.title || note.topic || '';
    const text = note.text || note.description || note.content || '';
    const points = note.points || note.subpoints || note.items || [];

    return `
      <div class="qa-block">
        ${heading ? `<h3>${escapeHtml(heading)}</h3>` : ''}
        ${text ? renderTextBlock(text) : ''}
        ${Array.isArray(points) && points.length
          ? `<ul>${points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`
          : ''
        }
      </div>
    `;
  }).join('');
}

function groupQABySection(qa = []) {
  const groups = [];
  const map = new Map();

  qa.forEach(item => {
    const section = String(item.section || item.heading || '').trim();
    const key = section.toLowerCase();

    if (section && map.has(key)) {
      map.get(key).items.push(item);
    } else if (section) {
      const group = { section, items: [item] };
      groups.push(group);
      map.set(key, group);
    } else {
      groups.push({ section: '', items: [item] });
    }
  });

  return groups;
}

function renderQA(qa = []) {
  if (!Array.isArray(qa) || !qa.length) {
    return '<p>No question answers added yet.</p>';
  }

  return groupQABySection(qa).map(group => `
    ${group.section ? `<h3 class="qa-section-title">${escapeHtml(group.section)}</h3>` : ''}
    ${group.items.map((x, i) => `
      <div class="qa-block">
        <p class="qa-question">Q${i + 1}. ${escapeHtml(x.q || x.question || '')}</p>
        <div class="qa-answer">${renderTextBlock(x.a || x.answer || '')}</div>
      </div>
    `).join('')}
  `).join('');
}

function hasContent(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function contentToHtml(content) {
  const sections = [];

  if (hasContent(content.notes)) {
    sections.push(`
      <section class="reader-section" data-reader-section="notes">
        <h2>Detailed Notes</h2>
        ${renderNotes(content.notes)}
      </section>
    `);
  }

  if (hasContent(content.summary)) {
    sections.push(`
      <section class="reader-section" data-reader-section="summary">
        <h2>Summary</h2>
        ${renderTextBlock(content.summary)}
      </section>
    `);
  }

  if (hasContent(content.qa)) {
    sections.push(`
      <section class="reader-section" data-reader-section="qa">
        <h2>Question & Answers</h2>
        ${renderQA(content.qa)}
      </section>
    `);
  }

  return sections.join('') || '<p>No content added yet.</p>';
}

function syncReaderToggleInputs() {
  toggleNotes.checked = readerContentVisibility.notes;
  toggleSummary.checked = readerContentVisibility.summary;
  toggleQA.checked = readerContentVisibility.qa;
}

function applyReaderContentVisibility() {
  const sections = [...readerContent.querySelectorAll('[data-reader-section]')];
  let visibleCount = 0;

  sections.forEach(section => {
    const key = section.dataset.readerSection;
    const isVisible = readerContentVisibility[key] !== false;
    section.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  const oldEmpty = readerContent.querySelector('.reader-empty-selection');
  if (oldEmpty) oldEmpty.remove();

  if (sections.length && visibleCount === 0) {
    readerContent.insertAdjacentHTML('beforeend', '<p class="reader-empty-selection">Turn on Notes, Summary, or Q&A to view content.</p>');
  }
}

function updateReaderToggleAvailability(content) {
  const availability = {
    notes: hasContent(content.notes),
    summary: hasContent(content.summary),
    qa: hasContent(content.qa)
  };

  [
    ['notes', toggleNotes],
    ['summary', toggleSummary],
    ['qa', toggleQA]
  ].forEach(([key, input]) => {
    input.disabled = !availability[key];
    input.closest('.switch-pill').classList.toggle('is-disabled', !availability[key]);
  });
}

async function openReader(id) {
  const item = findItem(id);
  if (!item) return;

  activeReaderId = id;

  const content = await loadItemContent(item);

  readerTitle.textContent = cleanTitle(content.title || item.title || getCardTitle(item));
  readerKicker.textContent =
    `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || ''}`;

  readerContent.innerHTML = contentToHtml(content);
  syncReaderToggleInputs();
  updateReaderToggleAvailability(content);
  applyReaderContentVisibility();

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
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);

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

function notesToPlainText(notes = []) {
  if (!Array.isArray(notes)) return '';

  return notes.map(note => {
    if (typeof note === 'string') return `• ${note}`;

    const heading = note.heading || note.title || note.topic || '';
    const text = note.text || note.description || note.content || '';
    const points = note.points || note.subpoints || note.items || [];

    return [
      heading,
      text,
      ...(Array.isArray(points) ? points.map(p => `- ${p}`) : [])
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

function qaToPlainText(qa = []) {
  if (!Array.isArray(qa)) return '';

  return groupQABySection(qa).map(group => {
    const heading = group.section ? `${group.section}\n` : '';
    const body = group.items.map((x, i) => {
      return `Q${i + 1}. ${x.q || x.question || ''}\nAnswer: ${x.a || x.answer || ''}`;
    }).join('\n\n');
    return `${heading}${body}`;
  }).join('\n\n');
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
  y = addPdfText(doc, cleanTitle(content.title || item.title || getCardTitle(item)), 14, y, maxWidth, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addPdfText(
    doc,
    `Class ${content.class || item.class || ''} | ${content.subject || item.subject || ''} | ${content.chapter || item.chapter || ''} | ${content.book || item.book || ''}`,
    14,
    y + 2,
    maxWidth,
    6
  );

  if (hasContent(content.notes)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    y = addPdfText(doc, 'Detailed Notes', 14, y + 8, maxWidth, 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = addPdfText(doc, notesToPlainText(content.notes), 14, y + 2, maxWidth, 6);
  }

  if (hasContent(content.summary)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    y = addPdfText(doc, 'Summary', 14, y + 8, maxWidth, 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = addPdfText(doc, content.summary || '', 14, y + 2, maxWidth, 6);
  }

  if (hasContent(content.qa)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    y = addPdfText(doc, 'Question & Answers', 14, y + 8, maxWidth, 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = addPdfText(doc, qaToPlainText(content.qa), 14, y + 2, maxWidth, 6);
  }

  const fileName = `${cleanTitle(content.title || item.title || 'chapter').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
}

window.openReader = openReader;
window.generatePdfFromId = generatePdfFromId;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !readerView.hidden) {
    closeReader();
  }
});

homeBtn.addEventListener('click', changeClass);
changeSubjectBtn.addEventListener('click', changeSubject);
changeClassBtn.addEventListener('click', changeClass);
searchInput.addEventListener('input', render);
readerBack.addEventListener('click', closeReader);
readerPrint.addEventListener('click', () => window.print());

readerPdf.addEventListener('click', () => {
  if (activeReaderId) generatePdfFromId(activeReaderId);
});

prevChapterBtn.addEventListener('click', () => openAdjacentReader(-1));
nextChapterBtn.addEventListener('click', () => openAdjacentReader(1));

[
  ['notes', toggleNotes],
  ['summary', toggleSummary],
  ['qa', toggleQA]
].forEach(([key, input]) => {
  input.addEventListener('change', () => {
    readerContentVisibility[key] = input.checked;
    applyReaderContentVisibility();
  });
});

loadLibrary();
