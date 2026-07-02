let library = { chapters: [] };
let selectedClass = null;
let selectedSubject = null;
let selectedBook = null;
let activeChapterId = null;
let activeReaderId = null;
let activeReaderType = null;
const contentCache = {};

const CONTENT_TYPES = [
  {
    key: 'notes',
    title: 'Notes',
    icon: '📝',
    description: 'Detailed notes and important points'
  },
  {
    key: 'summary',
    title: 'Summary',
    icon: '📌',
    description: 'Short chapter summary for quick revision'
  },
  {
    key: 'qa',
    title: 'Q&A',
    icon: '❓',
    description: 'Questions and answers from the chapter'
  }
];

const homeBtn = document.getElementById('homeBtn');
const classSelectSection = document.getElementById('classSelectSection');
const classGrid = document.getElementById('classGrid');
const subjectSelectSection = document.getElementById('subjectSelectSection');
const subjectGrid = document.getElementById('subjectGrid');
const textbookSelectSection = document.getElementById('textbookSelectSection');
const textbookGrid = document.getElementById('textbookGrid');
const catalogControls = document.getElementById('catalogControls');
const selectedClassText = document.getElementById('selectedClassText');
const selectedSubjectText = document.getElementById('selectedSubjectText');
const selectedBookText = document.getElementById('selectedBookText');
const changeTextbookBtn = document.getElementById('changeTextbookBtn');
const changeSubjectBtn = document.getElementById('changeSubjectBtn');
const changeClassBtn = document.getElementById('changeClassBtn');
const catalogEl = document.getElementById('catalog');
const emptyStateEl = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const contentTypeSection = document.getElementById('contentTypeSection');
const contentTypeGrid = document.getElementById('contentTypeGrid');
const selectedChapterText = document.getElementById('selectedChapterText');
const backToChaptersBtn = document.getElementById('backToChaptersBtn');

const readerView = document.getElementById('readerView');
const readerBack = document.getElementById('readerBack');
const readerPdf = document.getElementById('readerPdf');
const readerPrint = document.getElementById('readerPrint');
const readerTitle = document.getElementById('readerTitle');
const readerKicker = document.getElementById('readerKicker');
const readerContent = document.getElementById('readerContent');
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');

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

function getContentTypeInfo(type) {
  return CONTENT_TYPES.find(item => item.key === type) || CONTENT_TYPES[0];
}

function getBookName(item) {
  return item.book || 'NCERT';
}

function clearReaderState() {
  activeReaderId = null;
  activeReaderType = null;
}

function showOnlyContentTypePage() {
  classSelectSection.hidden = true;
  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = true;
  catalogControls.hidden = true;
  catalogEl.hidden = true;
  emptyStateEl.hidden = true;
  contentTypeSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
}

function showChapterListPage() {
  classSelectSection.hidden = true;
  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = true;
  contentTypeSection.hidden = true;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogControls.hidden = false;
  catalogEl.hidden = false;
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
  textbookSelectSection.hidden = true;
  contentTypeSection.hidden = true;
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
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
    textbookSelectSection.hidden = true;
    catalogControls.hidden = true;
    contentTypeSection.hidden = true;
    catalogEl.innerHTML = '';
    catalogEl.hidden = false;
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
  selectedBook = null;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  selectedClassText.textContent = `Class ${cls}`;
  selectedSubjectText.textContent = 'Subject';
  selectedBookText.textContent = 'Textbook';

  classSelectSection.hidden = true;
  subjectSelectSection.hidden = false;
  textbookSelectSection.hidden = true;
  catalogControls.hidden = true;
  contentTypeSection.hidden = true;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');

  searchInput.value = '';
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderSubjectSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeClass() {
  selectedClass = null;
  selectedSubject = null;
  selectedBook = null;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  catalogControls.hidden = true;
  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = true;
  contentTypeSection.hidden = true;
  classSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
  subjectGrid.innerHTML = '';
  textbookGrid.innerHTML = '';
  contentTypeGrid.innerHTML = '';
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
      existing.books.add(getBookName(item));
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
  selectedBook = null;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  selectedClassText.textContent = `Class ${selectedClass}`;
  selectedSubjectText.textContent = subject;
  selectedBookText.textContent = 'Textbook';

  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = false;
  contentTypeSection.hidden = true;
  catalogControls.hidden = true;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');

  searchInput.value = '';
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderTextbookSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getBooksForSelectedSubject() {
  if (!selectedClass || !selectedSubject) return [];

  const bookMap = new Map();

  getCurrentItems()
    .filter(item => item.class === selectedClass && (item.subject || 'General') === selectedSubject)
    .forEach(item => {
      const book = getBookName(item);
      const existing = bookMap.get(book) || {
        book,
        count: 0,
        icon: item.bookIcon || item.icon || '📘',
        chapters: new Set()
      };

      existing.count += 1;
      if (item.chapter) existing.chapters.add(item.chapter);
      bookMap.set(book, existing);
    });

  return [...bookMap.values()].sort((a, b) => a.book.localeCompare(b.book));
}

function renderTextbookSelection() {
  const books = getBooksForSelectedSubject();

  if (!books.length) {
    textbookGrid.innerHTML = `
      <div class="empty-library">
        <h3>No textbooks found</h3>
        <p>Add textbook/book names for Class ${escapeHtml(selectedClass || '')} ${escapeHtml(selectedSubject || '')} in <code>media/library.json</code>.</p>
      </div>
    `;
    return;
  }

  textbookGrid.innerHTML = books.map(item => {
    const chapterLabel = item.count === 1 ? 'chapter' : 'chapters';
    const uniqueChapterCount = item.chapters.size || item.count;

    return `
      <button class="textbook-card" type="button" data-book="${escapeHtml(item.book)}">
        <span class="textbook-icon">${item.icon}</span>
        <strong>${escapeHtml(item.book)}</strong>
        <small>${uniqueChapterCount} ${chapterLabel}</small>
        <em>Class ${escapeHtml(selectedClass || '')} · ${escapeHtml(selectedSubject || '')}</em>
      </button>
    `;
  }).join('');

  textbookGrid.querySelectorAll('.textbook-card').forEach(btn => {
    btn.addEventListener('click', () => selectTextbook(btn.dataset.book));
  });
}

function selectTextbook(book) {
  selectedBook = book;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  selectedBookText.textContent = book;

  textbookSelectSection.hidden = true;
  contentTypeSection.hidden = true;
  catalogControls.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');

  searchInput.value = '';
  catalogEl.hidden = false;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeTextbook() {
  selectedBook = null;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  selectedBookText.textContent = 'Textbook';
  catalogControls.hidden = true;
  contentTypeSection.hidden = true;
  textbookSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderTextbookSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeSubject() {
  selectedSubject = null;
  selectedBook = null;
  activeChapterId = null;
  activeReaderId = null;
  activeReaderType = null;
  selectedSubjectText.textContent = 'Subject';
  selectedBookText.textContent = 'Textbook';
  catalogControls.hidden = true;
  contentTypeSection.hidden = true;
  textbookSelectSection.hidden = true;
  subjectSelectSection.hidden = false;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  catalogEl.innerHTML = '';
  catalogEl.hidden = false;
  emptyStateEl.hidden = true;
  resultCount.textContent = '0 / 0';

  renderSubjectSelection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getFiltered() {
  if (!selectedClass || !selectedSubject || !selectedBook) return [];

  const items = getCurrentItems().filter(item => {
    const subject = item.subject || 'General';
    return item.class === selectedClass && subject === selectedSubject && getBookName(item) === selectedBook;
  });
  const q = searchInput.value.trim().toLowerCase();

  return items.filter(item => {
    const haystack = `
      ${getCardTitle(item)}
      ${item.class || ''}
      ${item.subject || ''}
      ${item.chapter || ''}
      ${getBookName(item)}
      ${item.description || ''}
    `.toLowerCase();

    return !q || haystack.includes(q);
  });
}

function render() {
  const filtered = getFiltered();
  const items = getCurrentItems().filter(item => {
    const subject = item.subject || 'General';
    return item.class === selectedClass && subject === selectedSubject && getBookName(item) === selectedBook;
  });

  contentTypeSection.hidden = true;
  catalogEl.hidden = false;
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
            <span>${escapeHtml(getBookName(item))}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  catalogEl.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => openContentTypeSelection(card.dataset.id));

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openContentTypeSelection(card.dataset.id);
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

function hasContentType(content, type) {
  if (!content) return false;
  if (type === 'notes') return hasContent(content.notes);
  if (type === 'summary') return hasContent(content.summary);
  if (type === 'qa') return hasContent(content.qa);
  return false;
}

function contentTypeToHtml(content, type) {
  if (type === 'notes') {
    return `
      <section class="reader-section" data-reader-section="notes">
        <h2>Detailed Notes</h2>
        ${renderNotes(content.notes)}
      </section>
    `;
  }

  if (type === 'summary') {
    return `
      <section class="reader-section" data-reader-section="summary">
        <h2>Summary</h2>
        ${hasContent(content.summary) ? renderTextBlock(content.summary) : '<p>No summary added yet.</p>'}
      </section>
    `;
  }

  if (type === 'qa') {
    return `
      <section class="reader-section" data-reader-section="qa">
        <h2>Question & Answers</h2>
        ${renderQA(content.qa)}
      </section>
    `;
  }

  return '<p>No content added yet.</p>';
}

async function openContentTypeSelection(id) {
  const item = findItem(id);
  if (!item) return;

  activeChapterId = id;
  activeReaderId = null;
  activeReaderType = null;

  const content = await loadItemContent(item);
  const title = cleanTitle(content.title || item.title || getCardTitle(item));
  const meta = `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || 'NCERT'}`;

  selectedChapterText.innerHTML = `<span class="selected-chapter-badge">Selected Chapter</span><br><strong>${escapeHtml(title)}</strong><br><span>${escapeHtml(meta)}</span>`;

  contentTypeGrid.innerHTML = CONTENT_TYPES.map(type => {
    const available = hasContentType(content, type.key);
    const status = available ? type.description : `${type.title} not added yet`;

    return `
      <button class="content-type-card ${available ? '' : 'is-disabled'}" type="button" data-type="${type.key}" ${available ? '' : 'disabled'}>
        <span class="content-type-icon">${type.icon}</span>
        <strong>${escapeHtml(type.title)}</strong>
        <small>${escapeHtml(status)}</small>
      </button>
    `;
  }).join('');

  contentTypeGrid.querySelectorAll('.content-type-card:not(.is-disabled)').forEach(card => {
    card.addEventListener('click', () => openReader(id, card.dataset.type));
  });

  showOnlyContentTypePage();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToChapters() {
  activeChapterId = null;
  clearReaderState();
  showChapterListPage();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function openReader(id, type = 'notes') {
  const item = findItem(id);
  if (!item) return;

  activeChapterId = id;
  activeReaderId = id;
  activeReaderType = type;

  const content = await loadItemContent(item);
  const typeInfo = getContentTypeInfo(type);
  const chapterTitle = cleanTitle(content.title || item.title || getCardTitle(item));

  readerTitle.textContent = `${chapterTitle} — ${typeInfo.title}`;
  readerKicker.textContent =
    `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || ''} · ${typeInfo.title}`;

  readerContent.innerHTML = contentTypeToHtml(content, type);

  classSelectSection.hidden = true;
  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = true;
  catalogControls.hidden = true;
  catalogEl.hidden = true;
  emptyStateEl.hidden = true;
  contentTypeSection.hidden = true;
  readerView.hidden = false;
  document.body.classList.add('reader-open');
  updateReaderNav();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function closeReader() {
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
  clearReaderState();

  if (activeChapterId) {
    await openContentTypeSelection(activeChapterId);
  }
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
  const currentType = activeReaderType || 'notes';

  if (next) await openReader(next.id, currentType);
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

function contentTypeToPlainText(content, type) {
  if (type === 'notes') return notesToPlainText(content.notes) || 'No notes added yet.';
  if (type === 'summary') return String(content.summary || 'No summary added yet.');
  if (type === 'qa') return qaToPlainText(content.qa) || 'No question answers added yet.';
  return '';
}

async function generatePdfFromId(id, type = activeReaderType || 'notes') {
  const item = findItem(id);
  if (!item) return;

  const content = await loadItemContent(item);
  const typeInfo = getContentTypeInfo(type);

  if (!window.jspdf || !window.jspdf.jsPDF) {
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - 28;
  let y = 18;
  const chapterTitle = cleanTitle(content.title || item.title || getCardTitle(item));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  y = addPdfText(doc, `${chapterTitle} - ${typeInfo.title}`, 14, y, maxWidth, 8);

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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y = addPdfText(doc, typeInfo.title === 'Q&A' ? 'Question & Answers' : typeInfo.title, 14, y + 8, maxWidth, 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y = addPdfText(doc, contentTypeToPlainText(content, type), 14, y + 2, maxWidth, 6);

  const fileName = `${chapterTitle}-${typeInfo.title}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pdf';
  doc.save(fileName);
}

window.openReader = openReader;
window.openContentTypeSelection = openContentTypeSelection;
window.generatePdfFromId = generatePdfFromId;

// Keep PDF text clean if answers contain HTML from copied sources.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !readerView.hidden) {
    closeReader();
  }
});

homeBtn.addEventListener('click', changeClass);
changeTextbookBtn.addEventListener('click', changeTextbook);
changeSubjectBtn.addEventListener('click', changeSubject);
changeClassBtn.addEventListener('click', changeClass);
backToChaptersBtn.addEventListener('click', backToChapters);
searchInput.addEventListener('input', render);
readerBack.addEventListener('click', closeReader);
readerPrint.addEventListener('click', () => window.print());

readerPdf.addEventListener('click', () => {
  if (activeReaderId) generatePdfFromId(activeReaderId, activeReaderType || 'notes');
});

prevChapterBtn.addEventListener('click', () => openAdjacentReader(-1));
nextChapterBtn.addEventListener('click', () => openAdjacentReader(1));

loadLibrary();
