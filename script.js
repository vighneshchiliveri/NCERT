'use strict';

let library = { chapters: [] };
let selectedClass = null;
let selectedSubject = null;
let selectedBook = null;
let activeChapterId = null;
let activeReaderId = null;
let activeReaderType = null;
let suppressHistory = false;
let toastTimer = null;
let topicObserver = null;

const contentCache = Object.create(null);
const availabilityCache = Object.create(null);

const STORAGE_KEYS = {
  lastRead: 'ncert:lastRead:v2',
  bookmarks: 'ncert:bookmarks:v2',
  completed: 'ncert:completed:v2',
  preferences: 'ncert:readerPreferences:v2'
};

const CONTENT_TYPES = [
  { key: 'notes', title: 'Notes', icon: '📝', description: 'Detailed notes and important points' },
  { key: 'summary', title: 'Summary', icon: '📌', description: 'Short chapter summary for quick revision' },
  { key: 'qa', title: 'Q&A', icon: '❓', description: 'Questions and answers from the chapter' }
];

const DEFAULT_PREFERENCES = {
  fontSize: 18,
  lineHeight: 1.75,
  theme: 'paper'
};

const homeBtn = document.getElementById('homeBtn');
const mainContent = document.getElementById('mainContent');
const breadcrumbWrap = document.getElementById('breadcrumbWrap');
const breadcrumb = document.getElementById('breadcrumb');

const globalSearchWrap = document.getElementById('globalSearchWrap');
const globalSearchInput = document.getElementById('globalSearchInput');
const globalSearchResults = document.getElementById('globalSearchResults');

const studyDashboard = document.getElementById('studyDashboard');
const dashboardGrid = document.getElementById('dashboardGrid');
const clearProgressBtn = document.getElementById('clearProgressBtn');

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
const readerPaper = document.getElementById('readerPaper');
const readerBack = document.getElementById('readerBack');
const readerPdf = document.getElementById('readerPdf');
const readerPrint = document.getElementById('readerPrint');
const readerTitle = document.getElementById('readerTitle');
const readerKicker = document.getElementById('readerKicker');
const readerContent = document.getElementById('readerContent');
const readerTypeTabs = document.getElementById('readerTypeTabs');
const readerTopics = document.getElementById('readerTopics');
const readerTopicsDetails = document.getElementById('readerTopicsDetails');
const readerTopicsList = document.getElementById('readerTopicsList');
const readerTopicsCount = document.getElementById('readerTopicsCount');
const readingTime = document.getElementById('readingTime');
const readerStatus = document.getElementById('readerStatus');
const prevChapterBtn = document.getElementById('prevChapterBtn');
const nextChapterBtn = document.getElementById('nextChapterBtn');
const decreaseFontBtn = document.getElementById('decreaseFontBtn');
const increaseFontBtn = document.getElementById('increaseFontBtn');
const lineSpacingBtn = document.getElementById('lineSpacingBtn');
const readerThemeBtn = document.getElementById('readerThemeBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const completeBtn = document.getElementById('completeBtn');
const shareBtn = document.getElementById('shareBtn');
const toast = document.getElementById('toast');

function escapeHtml(value = '') {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

const ACADEMIC_MATH_OPERATOR_PATTERN = /(?:=|→|⇌|↔|⟶|⇒|⟷|->|<->|<=|>=|≤|≥|≈|≠|∝|±|×|÷|√|∫|∑|Σ|∏|∆|Δ)/;
const ACADEMIC_MATH_NOTATION_PATTERN = /(?:[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]|[λμνθπρστφψωαβγδεζηκξχ]|\b(?:sin|cos|tan|log|ln)\b|\d+\s*\/\s*[A-Za-z0-9([])/i;
const CHEMICAL_FORMULA_PATTERN = /(?:\b(?:[A-Z][a-z]?[0-9₀-₉]*){2,}\b|(?:[A-Z][a-z]?[0-9₀-₉]*)(?:[-–—](?:[A-Z][A-Za-z0-9₀-₉()]*)){1,}|\[[A-Z][A-Za-z0-9₀-₉()]+\](?:[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)?)/;
const FORMULA_LABEL_PATTERN = /\b(?:formula|equation|reaction|structure|notation|representation|expression|law|relation|rate|potential|energy|force|radius|velocity|frequency|wavelength|current|voltage|resistance|capacitance|inductance|power|momentum|charge|field|flux|molarity|molality|conductivity|constant|order|half-life|cell)\b/i;
const CHEMICAL_ELEMENTS = new Set([
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra',
  'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db',
  'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
]);
const INLINE_SCIENTIFIC_TOKEN_PATTERN = /(?:e[⁺⁻−]|[A-Za-z](?:_[A-Za-z0-9]+|[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]+)|[λμνθπρστφψωαβγδεζηκξχ](?:_[A-Za-z0-9]+|[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]+)?|\[[A-Z][A-Za-z0-9₀-₉()]*\][0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻+−-]*|[A-Z][A-Za-z0-9₀-₉()]*[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−]*[+-]?)/g;

function isChemicalFormulaToken(token = '') {
  const value = String(token).replace(/^\[|\]([0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−]*)$/g, '$1');
  const hasNumberOrCharge = /[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−]/.test(value);
  const letters = value.replace(/[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻−()]/g, '');
  if (!letters || !/^[A-Z]/.test(letters)) return false;

  let index = 0;
  let elementCount = 0;
  while (index < letters.length) {
    const symbol = letters[index] + (/[a-z]/.test(letters[index + 1] || '') ? letters[index + 1] : '');
    if (!CHEMICAL_ELEMENTS.has(symbol)) return false;
    elementCount += 1;
    index += symbol.length;
  }

  return elementCount >= 2 || hasNumberOrCharge;
}

function isInlineScientificToken(token = '') {
  const value = String(token);
  if (/^e[⁺⁻−]$/.test(value)) return true;
  if (/^[A-Za-z](?:_[A-Za-z0-9]+|[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/.test(value)) return true;
  if (/^[λμνθπρστφψωαβγδεζηκξχ](?:_[A-Za-z0-9]+|[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]+)?$/.test(value)) return true;
  return isChemicalFormulaToken(value);
}

function formatInlineScientificTokens(text = '') {
  const value = String(text);
  let html = '';
  let cursor = 0;
  INLINE_SCIENTIFIC_TOKEN_PATTERN.lastIndex = 0;

  for (const match of value.matchAll(INLINE_SCIENTIFIC_TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;
    html += escapeHtml(value.slice(cursor, index));
    html += isInlineScientificToken(token)
      ? `<span class="math-expression">${escapeHtml(token)}</span>`
      : escapeHtml(token);
    cursor = index + token.length;
  }

  html += escapeHtml(value.slice(cursor));
  return html;
}

function containsValidatedChemicalFormula(text = '') {
  INLINE_SCIENTIFIC_TOKEN_PATTERN.lastIndex = 0;
  for (const match of String(text).matchAll(INLINE_SCIENTIFIC_TOKEN_PATTERN)) {
    if (isChemicalFormulaToken(match[0])) return true;
  }
  return false;
}

function looksLikeAcademicMath(text = '') {
  const value = String(text).trim();
  if (!value) return false;

  if (ACADEMIC_MATH_OPERATOR_PATTERN.test(value)) return true;
  if (FORMULA_LABEL_PATTERN.test(value) && (ACADEMIC_MATH_NOTATION_PATTERN.test(value) || containsValidatedChemicalFormula(value))) return true;

  const compact = value.replace(/\s+/g, '');
  const words = value.match(/[A-Za-z]{3,}/g) || [];
  const notationCount = (compact.match(/[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹+\-*/()[\]{}|.:]/g) || []).length;
  return words.length <= 3 && notationCount >= 2 && (ACADEMIC_MATH_NOTATION_PATTERN.test(value) || containsValidatedChemicalFormula(value));
}

function formatAcademicSegment(segment = '') {
  if (!segment) return '';
  const leading = segment.match(/^\s*/)?.[0] || '';
  const trailing = segment.match(/\s*$/)?.[0] || '';
  const core = segment.slice(leading.length, segment.length - trailing.length);
  if (!core) return escapeHtml(segment);

  const colonIndex = core.lastIndexOf(':');
  if (colonIndex >= 0) {
    const prefix = core.slice(0, colonIndex + 1);
    const expression = core.slice(colonIndex + 1);
    if (looksLikeAcademicMath(expression)) {
      return `${escapeHtml(leading)}${formatInlineScientificTokens(prefix)}<span class="math-expression">${escapeHtml(expression)}</span>${escapeHtml(trailing)}`;
    }
  }

  if (looksLikeAcademicMath(core)) {
    return `${escapeHtml(leading)}<span class="math-expression">${escapeHtml(core)}</span>${escapeHtml(trailing)}`;
  }

  return `${escapeHtml(leading)}${formatInlineScientificTokens(core)}${escapeHtml(trailing)}`;
}

function isCambriaMathSubject() {
  const subject = String(selectedSubject || readerContent?.dataset?.subject || '').trim().toLowerCase();
  return subject === 'chemistry' || subject === 'physics' || subject === 'mathematics' || subject === 'maths';
}

const SUPERSCRIPT_TO_ASCII = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n'
};
const SUBSCRIPT_TO_ASCII = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')', 'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j',
  'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o', 'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ₓ': 'x'
};
const MATH_WORDS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'cosec', 'log', 'ln', 'exp', 'lim', 'max', 'min',
  'mol', 'kg', 'cm', 'mm', 'nm', 'pm', 'km', 'ms', 'Hz', 'kHz', 'MHz', 'GHz', 'eV', 'keV', 'MeV',
  'J', 'kJ', 'C', 'A', 'V', 'W', 'K', 'N', 'Pa', 'S', 'M', 'L', 'm', 's', 'h', 'rad', 'sr', 'T', 'Wb',
  'Ecell', 'Ecathode', 'Eanode', 'Kc', 'Ka', 'Kb', 'Ksp', 'pH', 'pOH', 'EMF', 'RMS', 'AC', 'DC'
]);
const FORMULA_OPERATOR_REGEX = /(⇌|↔|→|⟶|⇒|<=>|<->|->|≤|≥|≈|≠|∝|±|=)/g;

function convertUnicodeScripts(value = '', mode = 'math') {
  const source = String(value);
  let output = '';
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const superscript = SUPERSCRIPT_TO_ASCII[character];
    const subscript = SUBSCRIPT_TO_ASCII[character];
    if (superscript !== undefined) {
      let group = superscript;
      while (SUPERSCRIPT_TO_ASCII[source[index + 1]] !== undefined) {
        index += 1;
        group += SUPERSCRIPT_TO_ASCII[source[index]];
      }
      output += mode === 'chemistry' ? `^${group.length > 1 ? `{${group}}` : group}` : `^{${group}}`;
    } else if (subscript !== undefined) {
      let group = subscript;
      while (SUBSCRIPT_TO_ASCII[source[index + 1]] !== undefined) {
        index += 1;
        group += SUBSCRIPT_TO_ASCII[source[index]];
      }
      output += mode === 'chemistry' ? group : `_{${group}}`;
    } else {
      output += character;
    }
  }
  return output;
}

function chemistryToLatex(value = '') {
  return convertUnicodeScripts(value, 'chemistry')
    .replace(/⇌|↔/g, '<=>')
    .replace(/→|⟶|⇒/g, '->')
    .replace(/↓/g, ' v')
    .replace(/↑/g, ' ^')
    .replace(/−/g, '-')
    .replace(/·/g, ' * ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mathToLatex(value = '') {
  let result = convertUnicodeScripts(value, 'math')
    .replace(/−/g, '-')
    .replace(/×/g, String.raw`\times `)
    .replace(/÷/g, String.raw`\div `)
    .replace(/·/g, String.raw`\cdot `)
    .replace(/⇌/g, String.raw`\rightleftharpoons `)
    .replace(/↔/g, String.raw`\leftrightarrow `)
    .replace(/→|⟶|⇒/g, String.raw`\to `)
    .replace(/≤/g, String.raw`\le `)
    .replace(/≥/g, String.raw`\ge `)
    .replace(/≈/g, String.raw`\approx `)
    .replace(/≠/g, String.raw`\ne `)
    .replace(/∝/g, String.raw`\propto `)
    .replace(/±/g, String.raw`\pm `)
    .replace(/∞/g, String.raw`\infty `)
    .replace(/√\s*\(([^()]+)\)/g, String.raw`\sqrt{$1}`)
    .replace(/√\s*([A-Za-z0-9_[\]{}]+)/g, String.raw`\sqrt{$1}`)
    .replace(/Φ/g, String.raw`\Phi `)
    .replace(/Δ/g, String.raw`\Delta `)
    .replace(/Ω/g, String.raw`\Omega `)
    .replace(/λ/g, String.raw`\lambda `)
    .replace(/ν/g, String.raw`\nu `)
    .replace(/μ/g, String.raw`\mu `)
    .replace(/ρ/g, String.raw`\rho `)
    .replace(/κ/g, String.raw`\kappa `)
    .replace(/α/g, String.raw`\alpha `)
    .replace(/β/g, String.raw`\beta `)
    .replace(/θ/g, String.raw`\theta `)
    .replace(/π/g, String.raw`\pi `)
    .replace(/ε/g, String.raw`\varepsilon `)
    .replace(/°/g, String.raw`^{\circ}`);

  // Convert common ASCII powers such as 10^-19, n^2 and L^-1.
  result = result.replace(/\^(?!\{)\s*([+\-]?\d+(?:\.\d+)?)/g, '^{$1}');

  // Convert derivatives and common fractions while avoiding superscript/subscript fragments.
  result = result.replace(/\s+([_^])/g, '$1');
  result = result.replace(/d(\\?[A-Za-z]+(?:_[A-Za-z0-9{}]+)?)\s*\/\s*d([A-Za-z]+)/g, String.raw`\frac{d$1}{d$2}`);
  result = result.replace(/((?:\[[^\]]+\]\^[A-Za-z])+)\s*\/\s*((?:\[[^\]]+\]\^[A-Za-z])+)/g, String.raw`\frac{$1}{$2}`);
  const atom = String.raw`(?:\\sqrt\{(?:[^{}]|\{[^{}]*\})+\}|\\?[A-Za-z]+(?:_\{[^{}]+\}|_?[A-Za-z0-9]+)?(?:\^\{[^{}]+\})?|\d+(?:\.\d+)?(?:\^\{[^{}]+\})?|\([^()]+\)|\[[^\[\]]+\])`;
  const fractionPattern = new RegExp(`(?<![_^])(${atom})\\s*\\/\\s*(${atom})(?!\\s*\^)`, 'g');
  for (let pass = 0; pass < 2; pass += 1) {
    result = result.replace(fractionPattern, String.raw`\frac{$1}{$2}`);
  }

  // Use readable subscripts for common named quantities.
  result = result
    .replace(/E\^\{\\circ\}(cell|cathode|anode)/g, String.raw`E_{\mathrm{$1}}^{\circ}`)
    .replace(/\bE(cell|cathode|anode)\b/g, String.raw`E_{\mathrm{$1}}`);

  // Roman typography for common units when they are separate tokens.
  result = result.replace(/\b(mol|kg|cm|mm|nm|pm|km|Hz|kHz|MHz|GHz|eV|keV|MeV|kJ|J|Pa|Wb|rad|sr)\b/g, String.raw`\mathrm{$1}`);
  result = result.replace(/(\d|\})\s+(m|s|V|A|C|K|L|T|N|S|W)\b/g, String.raw`$1\,\mathrm{$2}`);
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

function stripTokenPunctuation(token = '') {
  return String(token).replace(/^[,:;]+/, '').replace(/[,:;.?!]+$/, '');
}

function isMathToken(token = '') {
  const value = stripTokenPunctuation(token);
  if (!value) return false;
  if (/[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹=+\-−×÷·/^()[\]{}|°ΔλνμρκαβθπΩ∞↓↑]/.test(value)) return true;
  if (MATH_WORDS.has(value)) return true;
  if (/^[A-Za-z]$/.test(value)) return true;
  if (/^[A-Z][a-z]?$/.test(value)) return true;
  if (/^[A-Z](?:cell|cathode|anode|higher|lower|initial|final|avg|rms)$/.test(value)) return true;
  if (/^[A-Za-z]{1,3}_[A-Za-z0-9]+$/.test(value)) return true;
  if (/^[A-Z][a-z]?[0-9₀-₉]*(?:[A-Z][a-z]?[0-9₀-₉]*)+$/.test(value)) return true;
  return false;
}

function formulaRanges(text = '') {
  const source = String(text);
  const tokens = [...source.matchAll(/\S+/g)].map(match => ({
    text: match[0],
    start: match.index || 0,
    end: (match.index || 0) + match[0].length
  }));
  if (!tokens.length) return [];

  const ranges = [];
  FORMULA_OPERATOR_REGEX.lastIndex = 0;
  for (const match of source.matchAll(FORMULA_OPERATOR_REGEX)) {
    const operatorStart = match.index || 0;
    const tokenIndex = tokens.findIndex(token => token.start <= operatorStart && token.end >= operatorStart + match[0].length);
    if (tokenIndex < 0) continue;

    const isReactionOperator = /(?:⇌|↔|→|⟶|⇒|<=>|<->|->)/.test(match[0]);
    let left = tokenIndex;
    let right = tokenIndex;
    while (left > 0 && isMathToken(tokens[left - 1].text)) {
      if (/[,:;.?!]$/.test(tokens[left - 1].text)) break;
      left -= 1;
    }
    while (right + 1 < tokens.length && isMathToken(tokens[right + 1].text)) {
      if (/[.;?!]$/.test(tokens[right].text)) break;
      if (isReactionOperator && /,$/.test(tokens[right].text)) break;
      right += 1;
    }

    let start = tokens[left].start;
    let end = tokens[right].end;

    // A label such as “Formula:” or “Reaction:” is prose, not part of the equation.
    const colonBeforeOperator = source.lastIndexOf(':', operatorStart);
    if (colonBeforeOperator >= start) start = colonBeforeOperator + 1;
    while (start < end && /[,:;\s]/.test(source[start])) start += 1;
    while (end > start && /[,:;.?!\s]/.test(source[end - 1])) end -= 1;

    if (/^a\s+[A-Z][a-z]?(?:=|≡)/.test(source.slice(start, end).trim())) {
      start = source.indexOf(' ', start) + 1;
    }

    const expression = source.slice(start, end).trim();
    const hasSubstance = /[A-Za-z0-9ΔλνμρκαβθπΩ₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(expression);
    if (hasSubstance && expression.length <= 260) ranges.push({ start, end });
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  ranges.forEach(range => {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end + 1) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  });
  return merged;
}

function formatPlainScientificText(value = '') {
  return formatInlineScientificTokens(value);
}

function formatAcademicText(value = '') {
  const text = String(value ?? '');
  if (!text) return '';
  if (!isCambriaMathSubject()) return escapeHtml(text);

  // Preserve equations that are already written with KaTeX/LaTeX delimiters.
  if (text.includes('\\(') || text.includes('\\[') || /\$\$[^$]+\$\$|\$[^$]+\$/.test(text)) return escapeHtml(text);

  const ranges = formulaRanges(text);
  if (!ranges.length) return formatPlainScientificText(text);

  let html = '';
  let cursor = 0;
  ranges.forEach(range => {
    html += formatPlainScientificText(text.slice(cursor, range.start));
    const expression = text.slice(range.start, range.end);
    const isReaction = /(?:→|⇌|↔|⟶|⇒|->|<=>|<->)/.test(expression) && String(selectedSubject || readerContent?.dataset?.subject || '').toLowerCase() === 'chemistry';
    const latex = isReaction
      ? String.raw`\ce{${chemistryToLatex(expression)}}`
      : mathToLatex(expression);
    html += `\\(${escapeHtml(latex)}\\)`;
    cursor = range.end;
  });
  html += formatPlainScientificText(text.slice(cursor));
  return html;
}

function renderReaderMath() {
  if (typeof window.renderMathInElement !== 'function') return;
  window.renderMathInElement(readerContent, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false,
    strict: false,
    trust: false,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
  });
}

function cleanTitle(title = '') {
  return String(title)
    .replace(/\s*[—-]\s*(Notes|Summary|Summaries|Q\s*&\s*A|QA|Question Answers?)\s*$/i, '')
    .trim();
}

function getCardTitle(item) {
  return item?.displayTitle || item?.chapterTitle || cleanTitle(item?.title || item?.chapter || 'Untitled Chapter');
}

function getContentTypeInfo(type) {
  return CONTENT_TYPES.find(item => item.key === type) || CONTENT_TYPES[0];
}

function getBookName(item) {
  return item?.book || 'NCERT';
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  try {
    return safeJsonParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to save browser storage.', error);
  }
}

function getBookmarks() {
  const value = readStorage(STORAGE_KEYS.bookmarks, []);
  return Array.isArray(value) ? value : [];
}

function getCompleted() {
  const value = readStorage(STORAGE_KEYS.completed, []);
  return Array.isArray(value) ? value : [];
}

function getPreferences() {
  return { ...DEFAULT_PREFERENCES, ...readStorage(STORAGE_KEYS.preferences, {}) };
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => { toast.hidden = true; }, 180);
  }, 2400);
}

function focusHeading(section) {
  const heading = section?.querySelector('h1, h2');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function scrollTop(smooth = true) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

function rawItems() {
  if (Array.isArray(library.chapters)) return library.chapters;
  return [
    ...(Array.isArray(library.notes) ? library.notes : []),
    ...(Array.isArray(library.summaries) ? library.summaries : []),
    ...(Array.isArray(library.qa) ? library.qa : [])
  ];
}

function getAllItems() {
  const seen = new Set();
  return rawItems().filter(item => {
    if (!item) return false;
    const key = item.id || item.contentHref || `${item.class || ''}|${item.subject || ''}|${item.chapter || ''}|${getCardTitle(item)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findItem(id) {
  return getAllItems().find(item => item.id === id);
}

function getAvailableClasses() {
  return [...new Set(getAllItems().map(item => String(item.class || '')).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
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

function routeUrl() {
  const params = new URLSearchParams();
  if (selectedClass) params.set('class', selectedClass);
  if (selectedSubject) params.set('subject', selectedSubject);
  if (selectedBook) params.set('book', selectedBook);
  if (activeChapterId) params.set('chapter', activeChapterId);
  if (activeReaderType) params.set('type', activeReaderType);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

function updateHistory(mode = 'push') {
  if (suppressHistory) return;
  const url = routeUrl();
  const state = {
    selectedClass,
    selectedSubject,
    selectedBook,
    activeChapterId,
    activeReaderType
  };
  if (mode === 'replace') history.replaceState(state, '', url);
  else history.pushState(state, '', url);
}

function updateDocumentMetadata(title, description) {
  document.title = title ? `${title} | NCERT Study Archive` : 'NCERT Study Archive — Notes, Summaries & Q&A';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', description || 'Browse NCERT chapter notes, summaries and question answers by class, subject and textbook.');
}

function hideAllMainSections() {
  classSelectSection.hidden = true;
  subjectSelectSection.hidden = true;
  textbookSelectSection.hidden = true;
  catalogControls.hidden = true;
  catalogEl.hidden = true;
  contentTypeSection.hidden = true;
  emptyStateEl.hidden = true;
  studyDashboard.hidden = true;
  readerView.hidden = true;
  document.body.classList.remove('reader-open');
}

function clearReaderState() {
  activeReaderId = null;
  activeReaderType = null;
  if (topicObserver) {
    topicObserver.disconnect();
    topicObserver = null;
  }
  readerTopics.hidden = true;
  readerTopicsList.innerHTML = '';
}

function updateBreadcrumb() {
  const crumbs = [{ label: 'Home', action: 'home' }];
  if (selectedClass) crumbs.push({ label: `Class ${selectedClass}`, action: 'class' });
  if (selectedSubject) crumbs.push({ label: selectedSubject, action: 'subject' });
  if (selectedBook) crumbs.push({ label: selectedBook, action: 'book' });
  if (activeChapterId) {
    const item = findItem(activeChapterId);
    crumbs.push({ label: getCardTitle(item), action: 'chapter' });
  }
  if (activeReaderType) crumbs.push({ label: getContentTypeInfo(activeReaderType).title, action: 'current' });

  breadcrumbWrap.hidden = crumbs.length <= 1;
  breadcrumb.innerHTML = crumbs.map((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    return `
      <li>
        ${isLast
          ? `<span aria-current="page">${escapeHtml(crumb.label)}</span>`
          : `<button type="button" data-action="${escapeHtml(crumb.action)}">${escapeHtml(crumb.label)}</button>`}
      </li>
    `;
  }).join('');

  breadcrumb.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'home') goHome();
      if (action === 'class') changeSubject();
      if (action === 'subject') changeTextbook();
      if (action === 'book') backToChapters();
      if (action === 'chapter' && activeChapterId) openContentTypeSelection(activeChapterId);
    });
  });
}

function renderClassSelection() {
  const classes = getAvailableClasses();
  if (!classes.length) {
    classGrid.innerHTML = `
      <div class="empty-library">
        <h2>No chapters added yet</h2>
        <p>Add chapter cards in <code>media/library.json</code> and chapter content files inside <code>content/</code>.</p>
      </div>
    `;
    return;
  }

  classGrid.innerHTML = classes.map(cls => {
    const count = getAllItems().filter(item => String(item.class) === cls).length;
    return `
      <button class="class-card" type="button" data-class="${escapeHtml(cls)}">
        <span>Class</span>
        <strong>${escapeHtml(cls)}</strong>
        <small>${count} ${count === 1 ? 'chapter' : 'chapters'}</small>
      </button>
    `;
  }).join('');

  classGrid.querySelectorAll('.class-card').forEach(button => {
    button.addEventListener('click', () => selectClass(button.dataset.class));
  });
}

function getSubjectsForSelectedClass() {
  if (!selectedClass) return [];
  const subjectMap = new Map();

  getAllItems()
    .filter(item => String(item.class) === selectedClass)
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
    subjectGrid.innerHTML = '<div class="empty-library"><h2>No subjects found</h2><p>Add chapters for this class in <code>media/library.json</code>.</p></div>';
    return;
  }

  subjectGrid.innerHTML = subjects.map(item => `
    <button class="subject-card" type="button" data-subject="${escapeHtml(item.subject)}">
      <span class="subject-icon" aria-hidden="true">${item.icon}</span>
      <strong>${escapeHtml(item.subject)}</strong>
      <small>${item.count} ${item.count === 1 ? 'chapter' : 'chapters'}</small>
      <em>${escapeHtml([...item.books].join(', '))}</em>
    </button>
  `).join('');

  subjectGrid.querySelectorAll('.subject-card').forEach(button => {
    button.addEventListener('click', () => selectSubject(button.dataset.subject));
  });
}

function getBooksForSelectedSubject() {
  if (!selectedClass || !selectedSubject) return [];
  const bookMap = new Map();

  getAllItems()
    .filter(item => String(item.class) === selectedClass && (item.subject || 'General') === selectedSubject)
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
    textbookGrid.innerHTML = '<div class="empty-library"><h2>No textbooks found</h2><p>Add a book name to each chapter in <code>media/library.json</code>.</p></div>';
    return;
  }

  textbookGrid.innerHTML = books.map(item => {
    const count = item.chapters.size || item.count;
    return `
      <button class="textbook-card" type="button" data-book="${escapeHtml(item.book)}">
        <span class="textbook-icon" aria-hidden="true">${item.icon}</span>
        <strong>${escapeHtml(item.book)}</strong>
        <small>${count} ${count === 1 ? 'chapter' : 'chapters'}</small>
        <em>Class ${escapeHtml(selectedClass)} · ${escapeHtml(selectedSubject)}</em>
      </button>
    `;
  }).join('');

  textbookGrid.querySelectorAll('.textbook-card').forEach(button => {
    button.addEventListener('click', () => selectTextbook(button.dataset.book));
  });
}

function getBookItems() {
  if (!selectedClass || !selectedSubject || !selectedBook) return [];
  return getAllItems().filter(item =>
    String(item.class) === selectedClass &&
    (item.subject || 'General') === selectedSubject &&
    getBookName(item) === selectedBook
  );
}

function getFiltered() {
  const query = searchInput.value.trim().toLowerCase();
  return getBookItems().filter(item => {
    const haystack = [
      getCardTitle(item),
      item.class,
      item.subject,
      item.chapter,
      getBookName(item),
      item.description
    ].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });
}

async function loadItemContent(item) {
  if (!item) return null;
  if (item.content) return { ...item, ...item.content };

  if (item.contentHref) {
    if (contentCache[item.contentHref]) return { ...item, ...contentCache[item.contentHref] };
    try {
      const response = await fetch(encodeURI(item.contentHref));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.json();
      contentCache[item.contentHref] = content;
      return { ...item, ...content };
    } catch (error) {
      console.error('Could not load content file:', item.contentHref, error);
    }
  }

  return {
    ...item,
    title: getCardTitle(item),
    notes: [],
    summary: '',
    qa: []
  };
}

function hasContent(value) {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function getAvailabilityFromContent(content) {
  return {
    notes: hasContent(content?.notes),
    summary: hasContent(content?.summary),
    qa: hasContent(content?.qa)
  };
}

async function ensureAvailability(items) {
  await Promise.all(items.map(async item => {
    if (availabilityCache[item.id]) return;
    const content = await loadItemContent(item);
    availabilityCache[item.id] = getAvailabilityFromContent(content);
  }));
}

function availabilityBadge(type, available) {
  const info = getContentTypeInfo(type);
  return `<span class="content-badge ${available ? 'is-available' : 'is-missing'}" title="${available ? `${info.title} available` : `${info.title} not available`}">${escapeHtml(info.title)} ${available ? '✓' : '—'}</span>`;
}

function renderCatalog() {
  const filtered = getFiltered();
  const items = getBookItems();
  resultCount.textContent = `${filtered.length} / ${items.length}`;
  contentTypeSection.hidden = true;
  catalogEl.hidden = false;

  if (!filtered.length) {
    catalogEl.innerHTML = '';
    emptyStateEl.textContent = searchInput.value.trim()
      ? 'No chapters in this textbook match your search.'
      : 'No chapters have been added for this textbook.';
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;
  const completed = new Set(getCompleted());
  const bookmarks = new Set(getBookmarks());

  catalogEl.innerHTML = filtered.map((item, index) => {
    const availability = availabilityCache[item.id] || { notes: false, summary: false, qa: false };
    const catNum = String(index + 1).padStart(3, '0');
    const stateLabels = [
      completed.has(item.id) ? '<span class="chapter-state completed">Completed</span>' : '',
      bookmarks.has(item.id) ? '<span class="chapter-state bookmarked">Bookmarked</span>' : ''
    ].filter(Boolean).join('');

    return `
      <article class="entry-card" tabindex="0" role="button" data-id="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(getCardTitle(item))}">
        <div class="entry-cover" aria-hidden="true">${item.icon || '📘'}</div>
        <span class="entry-cat">No. ${catNum}</span>
        <div class="entry-body">
          <div class="chapter-states">${stateLabels}</div>
          <h2 class="entry-title">${escapeHtml(getCardTitle(item))}</h2>
          <p class="entry-sub">Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')}</p>
          <div class="content-badges" aria-label="Available content">
            ${availabilityBadge('notes', availability.notes)}
            ${availabilityBadge('summary', availability.summary)}
            ${availabilityBadge('qa', availability.qa)}
          </div>
          <div class="entry-meta">
            <span>${escapeHtml(item.chapter || '')}</span>
            <span>${escapeHtml(getBookName(item))}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  catalogEl.querySelectorAll('.entry-card').forEach(card => {
    const open = () => openContentTypeSelection(card.dataset.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function showCatalogLoading() {
  catalogEl.hidden = false;
  catalogEl.innerHTML = `
    <div class="catalog-loading" role="status">
      <span class="loading-dot"></span>
      Checking chapter content…
    </div>
  `;
  emptyStateEl.hidden = true;
}

function showHome({ historyMode = 'push', focus = true } = {}) {
  selectedClass = null;
  selectedSubject = null;
  selectedBook = null;
  activeChapterId = null;
  clearReaderState();
  searchInput.value = '';

  hideAllMainSections();
  classSelectSection.hidden = false;
  catalogEl.innerHTML = '';
  renderClassSelection();
  renderStudyDashboard();
  updateBreadcrumb();
  updateDocumentMetadata();
  updateHistory(historyMode);
  if (focus) {
    scrollTop();
    focusHeading(classSelectSection);
  }
}

function goHome(options = {}) {
  showHome(options);
}

function selectClass(cls, { historyMode = 'push', focus = true } = {}) {
  selectedClass = String(cls);
  selectedSubject = null;
  selectedBook = null;
  activeChapterId = null;
  clearReaderState();
  searchInput.value = '';

  hideAllMainSections();
  subjectSelectSection.hidden = false;
  renderSubjectSelection();
  updateBreadcrumb();
  updateDocumentMetadata(`Class ${selectedClass}`);
  updateHistory(historyMode);
  if (focus) {
    scrollTop();
    focusHeading(subjectSelectSection);
  }
}

function selectSubject(subject, { historyMode = 'push', focus = true } = {}) {
  selectedSubject = subject;
  selectedBook = null;
  activeChapterId = null;
  clearReaderState();
  searchInput.value = '';

  hideAllMainSections();
  textbookSelectSection.hidden = false;
  renderTextbookSelection();
  updateBreadcrumb();
  updateDocumentMetadata(`${selectedSubject} · Class ${selectedClass}`);
  updateHistory(historyMode);
  if (focus) {
    scrollTop();
    focusHeading(textbookSelectSection);
  }
}

async function selectTextbook(book, { historyMode = 'push', focus = true } = {}) {
  selectedBook = book;
  activeChapterId = null;
  clearReaderState();
  searchInput.value = '';

  hideAllMainSections();
  catalogControls.hidden = false;
  catalogEl.hidden = false;
  selectedClassText.textContent = `Class ${selectedClass}`;
  selectedSubjectText.textContent = selectedSubject;
  selectedBookText.textContent = selectedBook;
  showCatalogLoading();
  updateBreadcrumb();
  updateDocumentMetadata(`${selectedBook} · ${selectedSubject} · Class ${selectedClass}`);
  updateHistory(historyMode);

  const items = getBookItems();
  await ensureAvailability(items);
  renderCatalog();

  if (focus) {
    scrollTop();
    searchInput.focus({ preventScroll: true });
  }
}

function changeClass() {
  showHome();
}

function changeSubject() {
  if (!selectedClass) return showHome();
  selectClass(selectedClass);
}

function changeTextbook() {
  if (!selectedClass || !selectedSubject) return changeSubject();
  selectSubject(selectedSubject);
}

function showOnlyContentTypePage() {
  hideAllMainSections();
  contentTypeSection.hidden = false;
  document.body.classList.remove('reader-open');
}

function showChapterListPage() {
  hideAllMainSections();
  catalogControls.hidden = false;
  catalogEl.hidden = false;
  selectedClassText.textContent = `Class ${selectedClass}`;
  selectedSubjectText.textContent = selectedSubject;
  selectedBookText.textContent = selectedBook;
  renderCatalog();
}

function renderTextBlock(value) {
  if (!hasContent(value)) return '';
  if (Array.isArray(value)) {
    return `<ul>${value.map(item => `<li>${formatAcademicText(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('')}</ul>`;
  }
  return String(value)
    .split(/\n+/)
    .map(text => text.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${formatAcademicText(paragraph)}</p>`)
    .join('');
}

function notePointToText(point) {
  if (typeof point === 'string' || typeof point === 'number') return String(point);
  if (!point || typeof point !== 'object') return '';
  return point.text || point.point || point.content || point.description || JSON.stringify(point);
}

function renderNotes(notes = []) {
  if (!Array.isArray(notes) || !notes.length) return '<p>No notes added yet.</p>';

  return `
    <div class="notes-list" aria-label="Chapter notes">
      ${notes.map((note, index) => {
        const isPlainNote = typeof note === 'string';
        const heading = isPlainNote
          ? `Topic ${index + 1}`
          : note.heading || note.title || note.topic || `Topic ${index + 1}`;
        const text = isPlainNote ? note : note.text || note.description || note.content || '';
        const points = isPlainNote ? [] : note.points || note.subpoints || note.items || [];
        const renderedPoints = Array.isArray(points)
          ? points.map(notePointToText).filter(Boolean)
          : [];

        return `
          <section class="note-topic" id="note-topic-${index + 1}" data-topic-anchor>
            <h3 data-topic-heading>${formatAcademicText(heading)}</h3>
            <div class="note-topic-content">
              ${text ? renderTextBlock(text) : ''}
              ${renderedPoints.length ? `<ul>${renderedPoints.map(point => `<li>${formatAcademicText(point)}</li>`).join('')}</ul>` : ''}
            </div>
          </section>
        `;
      }).join('')}
    </div>
  `;
}

function groupQABySection(qa = []) {
  const groups = [];
  const map = new Map();
  qa.forEach(item => {
    const section = String(item?.section || item?.heading || '').trim();
    const key = section.toLowerCase();
    if (section && map.has(key)) {
      map.get(key).items.push(item);
    } else if (section) {
      const group = { section, items: [item] };
      groups.push(group);
      map.set(key, group);
    } else {
      const plainGroup = groups.find(group => !group.section);
      if (plainGroup) plainGroup.items.push(item);
      else groups.push({ section: '', items: [item] });
    }
  });
  return groups;
}

function renderQA(qa = []) {
  if (!Array.isArray(qa) || !qa.length) return '<p>No question answers added yet.</p>';
  let runningNumber = 0;
  return groupQABySection(qa).map(group => `
    ${group.section ? `<h3 class="qa-section-title">${formatAcademicText(group.section)}</h3>` : ''}
    ${group.items.map(item => {
      runningNumber += 1;
      return `
        <section class="qa-block" id="qa-topic-${runningNumber}" data-topic-anchor>
          <h4 class="qa-question" data-topic-heading>Q${runningNumber}. ${formatAcademicText(item.q || item.question || '')}</h4>
          <div class="qa-answer">${renderTextBlock(item.a || item.answer || '')}</div>
        </section>
      `;
    }).join('')}
  `).join('');
}

function hasContentType(content, type) {
  if (type === 'notes') return hasContent(content?.notes);
  if (type === 'summary') return hasContent(content?.summary);
  if (type === 'qa') return hasContent(content?.qa);
  return false;
}

function contentTypeToHtml(content, type) {
  if (type === 'notes') {
    return `<section class="reader-section" data-reader-section="notes"><h2>Detailed Notes</h2>${renderNotes(content.notes)}</section>`;
  }
  if (type === 'summary') {
    return `<section class="reader-section" data-reader-section="summary" id="summary-topic" data-topic-anchor><h2 data-topic-heading>Summary</h2>${hasContent(content.summary) ? renderTextBlock(content.summary) : '<p>No summary added yet.</p>'}</section>`;
  }
  if (type === 'qa') {
    return `<section class="reader-section" data-reader-section="qa"><h2>Question &amp; Answers</h2>${renderQA(content.qa)}</section>`;
  }
  return '<p>No content added yet.</p>';
}

function setActiveReaderTopic(topicId) {
  readerTopicsList.querySelectorAll('button[data-topic-id]').forEach(button => {
    const active = button.dataset.topicId === topicId;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  });
}

function setupReaderTopics() {
  if (topicObserver) {
    topicObserver.disconnect();
    topicObserver = null;
  }

  const anchors = [...readerContent.querySelectorAll('[data-topic-anchor]')]
    .filter(anchor => anchor.querySelector('[data-topic-heading]'));

  readerTopicsList.innerHTML = '';

  if (!anchors.length || (activeReaderType === 'summary' && anchors.length === 1)) {
    readerTopics.hidden = true;
    return;
  }

  anchors.forEach((anchor, index) => {
    if (!anchor.id) anchor.id = `reader-topic-${index + 1}`;
    const heading = anchor.querySelector('[data-topic-heading]');
    const title = heading?.textContent?.trim() || `Topic ${index + 1}`;
    const item = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.dataset.topicId = anchor.id;
    button.title = title;
    button.innerHTML = `<span class="reader-topic-number">${index + 1}</span><span class="reader-topic-title"></span>`;
    button.querySelector('.reader-topic-title').textContent = title;
    button.addEventListener('click', () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setActiveReaderTopic(anchor.id);
      anchor.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      anchor.classList.remove('topic-target-flash');
      window.requestAnimationFrame(() => anchor.classList.add('topic-target-flash'));
      window.setTimeout(() => anchor.classList.remove('topic-target-flash'), 1400);
    });

    item.appendChild(button);
    readerTopicsList.appendChild(item);
  });

  readerTopicsCount.textContent = String(anchors.length);
  readerTopics.hidden = false;
  readerTopicsDetails.open = window.matchMedia('(min-width: 1181px)').matches;
  setActiveReaderTopic(anchors[0].id);

  if ('IntersectionObserver' in window) {
    topicObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveReaderTopic(visible[0].target.id);
    }, { rootMargin: '-14% 0px -70% 0px', threshold: [0, 0.15, 0.5, 1] });

    anchors.forEach(anchor => topicObserver.observe(anchor));
  }
}

async function openContentTypeSelection(id, { historyMode = 'push', focus = true } = {}) {
  const item = findItem(id);
  if (!item) return;

  selectedClass = String(item.class || selectedClass || '');
  selectedSubject = item.subject || selectedSubject || 'General';
  selectedBook = getBookName(item);
  activeChapterId = id;
  clearReaderState();

  const content = await loadItemContent(item);
  const availability = getAvailabilityFromContent(content);
  availabilityCache[item.id] = availability;
  const chapterTitle = cleanTitle(content.title || item.title || getCardTitle(item));
  const meta = `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || 'NCERT'}`;

  selectedChapterText.innerHTML = `
    <span class="selected-chapter-badge">Selected Chapter</span><br>
    <strong>${escapeHtml(chapterTitle)}</strong><br>
    <span>${escapeHtml(meta)}</span>
  `;

  contentTypeGrid.innerHTML = CONTENT_TYPES.map(type => {
    const available = availability[type.key];
    return `
      <button class="content-type-card ${available ? '' : 'is-disabled'}" type="button" data-type="${type.key}" ${available ? '' : 'disabled'}>
        <span class="content-type-icon" aria-hidden="true">${type.icon}</span>
        <strong>${escapeHtml(type.title)}</strong>
        <small>${escapeHtml(available ? type.description : `${type.title} not added yet`)}</small>
      </button>
    `;
  }).join('');

  contentTypeGrid.querySelectorAll('.content-type-card:not(.is-disabled)').forEach(card => {
    card.addEventListener('click', () => openReader(id, card.dataset.type));
  });

  showOnlyContentTypePage();
  updateBreadcrumb();
  updateDocumentMetadata(chapterTitle, item.description);
  updateHistory(historyMode);
  if (focus) {
    scrollTop();
    focusHeading(contentTypeSection);
  }
}

function backToChapters({ historyMode = 'push', focus = true } = {}) {
  activeChapterId = null;
  clearReaderState();
  showChapterListPage();
  updateBreadcrumb();
  updateDocumentMetadata(`${selectedBook} · ${selectedSubject} · Class ${selectedClass}`);
  updateHistory(historyMode);
  if (focus) {
    scrollTop();
    searchInput.focus({ preventScroll: true });
  }
}

function getReaderList() {
  const query = searchInput.value.trim();
  if (query) return getFiltered();
  return getBookItems();
}

function updateReaderNav() {
  const list = getReaderList();
  const index = list.findIndex(item => item.id === activeReaderId);
  prevChapterBtn.disabled = index <= 0;
  nextChapterBtn.disabled = index < 0 || index >= list.length - 1;
  if (index > 0) prevChapterBtn.setAttribute('aria-label', `Previous chapter: ${getCardTitle(list[index - 1])}`);
  if (index >= 0 && index < list.length - 1) nextChapterBtn.setAttribute('aria-label', `Next chapter: ${getCardTitle(list[index + 1])}`);
}

function renderReaderTabs(content) {
  readerTypeTabs.innerHTML = CONTENT_TYPES.map(type => {
    const available = hasContentType(content, type.key);
    const active = type.key === activeReaderType;
    return `
      <button
        type="button"
        role="tab"
        data-type="${type.key}"
        aria-selected="${active}"
        class="reader-type-tab ${active ? 'is-active' : ''}"
        ${available ? '' : 'disabled'}
      >${type.icon} ${escapeHtml(type.title)}</button>
    `;
  }).join('');

  readerTypeTabs.querySelectorAll('button:not(:disabled)').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.type !== activeReaderType) openReader(activeReaderId, button.dataset.type);
    });
  });
}

function plainTextFromHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

function calculateReadingTime(html) {
  const words = plainTextFromHtml(html).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function updateProgressButtons() {
  const bookmarks = new Set(getBookmarks());
  const completed = new Set(getCompleted());
  const isBookmarked = bookmarks.has(activeReaderId);
  const isCompleted = completed.has(activeReaderId);

  bookmarkBtn.setAttribute('aria-pressed', String(isBookmarked));
  bookmarkBtn.textContent = isBookmarked ? '★ Bookmarked' : '☆ Bookmark';
  bookmarkBtn.classList.toggle('is-active', isBookmarked);

  completeBtn.setAttribute('aria-pressed', String(isCompleted));
  completeBtn.textContent = isCompleted ? '✓ Completed' : '✓ Complete';
  completeBtn.classList.toggle('is-active', isCompleted);

  readerStatus.textContent = [isCompleted ? 'Completed' : '', isBookmarked ? 'Bookmarked' : ''].filter(Boolean).join(' · ');
}

function saveLastRead(item, type) {
  writeStorage(STORAGE_KEYS.lastRead, {
    id: item.id,
    type,
    title: getCardTitle(item),
    class: String(item.class || ''),
    subject: item.subject || '',
    book: getBookName(item),
    updatedAt: new Date().toISOString()
  });
  renderStudyDashboard();
}

function applyReaderPreferences() {
  const preferences = getPreferences();
  readerPaper.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
  readerPaper.style.setProperty('--reader-line-height', String(preferences.lineHeight));
  readerPaper.dataset.theme = preferences.theme;
  lineSpacingBtn.setAttribute('aria-label', `Line spacing ${preferences.lineHeight}`);
  readerThemeBtn.textContent = preferences.theme === 'dark' ? 'Dark' : preferences.theme === 'sepia' ? 'Sepia' : 'Paper';
}

function updatePreference(patch) {
  const preferences = { ...getPreferences(), ...patch };
  writeStorage(STORAGE_KEYS.preferences, preferences);
  applyReaderPreferences();
}

async function openReader(id, type = 'notes', { historyMode = 'push', focus = true } = {}) {
  const item = findItem(id);
  if (!item) return;

  selectedClass = String(item.class || selectedClass || '');
  selectedSubject = item.subject || selectedSubject || 'General';
  selectedBook = getBookName(item);
  activeChapterId = id;
  activeReaderId = id;

  const content = await loadItemContent(item);
  const availability = getAvailabilityFromContent(content);
  availabilityCache[item.id] = availability;
  const requestedType = availability[type] ? type : CONTENT_TYPES.find(entry => availability[entry.key])?.key;
  if (!requestedType) return openContentTypeSelection(id, { historyMode, focus });
  activeReaderType = requestedType;

  const typeInfo = getContentTypeInfo(activeReaderType);
  const chapterTitle = cleanTitle(content.title || item.title || getCardTitle(item));
  readerTitle.textContent = `${chapterTitle} — ${typeInfo.title}`;
  readerKicker.textContent = `Class ${content.class || item.class || ''} · ${content.subject || item.subject || ''} · ${content.chapter || item.chapter || ''} · ${content.book || item.book || ''}`;
  readerContent.dataset.subject = String(content.subject || item.subject || '').toLowerCase();
  readerContent.innerHTML = contentTypeToHtml(content, activeReaderType);
  renderReaderMath();
  readingTime.textContent = `${calculateReadingTime(readerContent.textContent)} min read`;
  renderReaderTabs(content);

  hideAllMainSections();
  readerView.hidden = false;
  document.body.classList.add('reader-open');
  setupReaderTopics();
  applyReaderPreferences();
  updateProgressButtons();
  updateReaderNav();
  updateBreadcrumb();
  updateDocumentMetadata(`${chapterTitle} — ${typeInfo.title}`, item.description);
  saveLastRead(item, activeReaderType);
  updateHistory(historyMode);

  if (focus) {
    scrollTop();
    readerTitle.setAttribute('tabindex', '-1');
    readerTitle.focus({ preventScroll: true });
  }
}

async function closeReader({ historyMode = 'push', focus = true } = {}) {
  if (!activeChapterId) return backToChapters({ historyMode, focus });
  const chapterId = activeChapterId;
  clearReaderState();
  await openContentTypeSelection(chapterId, { historyMode, focus });
}

async function openAdjacentReader(direction) {
  const list = getReaderList();
  const index = list.findIndex(item => item.id === activeReaderId);
  const next = list[index + direction];
  if (!next) return;
  const requestedType = activeReaderType || 'notes';
  const content = await loadItemContent(next);
  const availability = getAvailabilityFromContent(content);
  const type = availability[requestedType]
    ? requestedType
    : CONTENT_TYPES.find(entry => availability[entry.key])?.key;
  if (type) openReader(next.id, type);
}

function toggleIdInStorage(key, id) {
  const values = new Set(readStorage(key, []));
  if (values.has(id)) values.delete(id);
  else values.add(id);
  writeStorage(key, [...values]);
  return values.has(id);
}

function renderStudyDashboard() {
  const lastRead = readStorage(STORAGE_KEYS.lastRead, null);
  const bookmarks = getBookmarks().filter(id => findItem(id));
  const completed = getCompleted().filter(id => findItem(id));
  const lastItem = lastRead?.id ? findItem(lastRead.id) : null;

  if (!lastItem && !bookmarks.length && !completed.length) {
    studyDashboard.hidden = true;
    dashboardGrid.innerHTML = '';
    return;
  }

  studyDashboard.hidden = Boolean(selectedClass || selectedSubject || selectedBook || activeChapterId || activeReaderId);
  const cards = [];

  if (lastItem) {
    cards.push(`
      <button class="dashboard-card dashboard-card-primary" type="button" data-action="continue" data-id="${escapeHtml(lastItem.id)}" data-type="${escapeHtml(lastRead.type || 'notes')}">
        <span class="dashboard-icon" aria-hidden="true">▶</span>
        <span>
          <small>Continue reading</small>
          <strong>${escapeHtml(getCardTitle(lastItem))}</strong>
          <em>Class ${escapeHtml(lastItem.class || '')} · ${escapeHtml(lastItem.subject || '')} · ${escapeHtml(getBookName(lastItem))}</em>
        </span>
      </button>
    `);
  }

  if (bookmarks.length) {
    const first = findItem(bookmarks[0]);
    cards.push(`
      <button class="dashboard-card" type="button" data-action="bookmark" data-id="${escapeHtml(first.id)}">
        <span class="dashboard-icon" aria-hidden="true">★</span>
        <span>
          <small>${bookmarks.length} bookmarked ${bookmarks.length === 1 ? 'chapter' : 'chapters'}</small>
          <strong>${escapeHtml(getCardTitle(first))}</strong>
          <em>Open your latest bookmark</em>
        </span>
      </button>
    `);
  }

  cards.push(`
    <div class="dashboard-card dashboard-stat" aria-label="Study progress">
      <span class="dashboard-icon" aria-hidden="true">✓</span>
      <span>
        <small>Study progress</small>
        <strong>${completed.length} completed</strong>
        <em>${getAllItems().length} chapters currently available</em>
      </span>
    </div>
  `);

  dashboardGrid.innerHTML = cards.join('');
  dashboardGrid.querySelectorAll('button[data-id]').forEach(button => {
    button.addEventListener('click', () => {
      const type = button.dataset.type || 'notes';
      if (button.dataset.action === 'bookmark') openContentTypeSelection(button.dataset.id);
      else openReader(button.dataset.id, type);
    });
  });
}

function searchAllItems(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return getAllItems().map(item => {
    const title = getCardTitle(item).toLowerCase();
    const fields = [title, item.class, item.subject, item.chapter, getBookName(item), item.description]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (title.startsWith(normalized)) score += 5;
    if (title.includes(normalized)) score += 3;
    if (fields.includes(normalized)) score += 1;
    return { item, score };
  }).filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || getCardTitle(a.item).localeCompare(getCardTitle(b.item)))
    .slice(0, 10)
    .map(result => result.item);
}

function closeGlobalSearch() {
  globalSearchResults.hidden = true;
  globalSearchInput.setAttribute('aria-expanded', 'false');
}

function renderGlobalSearch() {
  const query = globalSearchInput.value;
  if (!query.trim()) {
    closeGlobalSearch();
    globalSearchResults.innerHTML = '';
    return;
  }

  const results = searchAllItems(query);
  globalSearchResults.innerHTML = results.length
    ? results.map(item => `
        <button class="global-result" type="button" role="option" data-id="${escapeHtml(item.id)}">
          <span class="global-result-icon" aria-hidden="true">${item.icon || '📘'}</span>
          <span>
            <strong>${escapeHtml(getCardTitle(item))}</strong>
            <small>Class ${escapeHtml(item.class || '')} · ${escapeHtml(item.subject || '')} · ${escapeHtml(getBookName(item))}</small>
          </span>
        </button>
      `).join('')
    : '<p class="global-no-results">No chapter found.</p>';

  globalSearchResults.hidden = false;
  globalSearchInput.setAttribute('aria-expanded', 'true');
  globalSearchResults.querySelectorAll('.global-result').forEach(button => {
    button.addEventListener('click', () => {
      globalSearchInput.value = '';
      closeGlobalSearch();
      openContentTypeSelection(button.dataset.id);
    });
  });
}

function notesToPlainText(notes = []) {
  if (!Array.isArray(notes)) return '';
  return notes.map(note => {
    if (typeof note === 'string') return `• ${note}`;
    const heading = note.heading || note.title || note.topic || '';
    const text = note.text || note.description || note.content || '';
    const points = note.points || note.subpoints || note.items || [];
    return [heading, text, ...(Array.isArray(points) ? points.map(point => `- ${point}`) : [])]
      .filter(Boolean)
      .join('\n');
  }).join('\n\n');
}

function qaToPlainText(qa = []) {
  if (!Array.isArray(qa)) return '';
  let number = 0;
  return groupQABySection(qa).map(group => {
    const heading = group.section ? `${group.section}\n` : '';
    const body = group.items.map(item => {
      number += 1;
      return `Q${number}. ${item.q || item.question || ''}\nAnswer: ${item.a || item.answer || ''}`;
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

function addPdfText(doc, text, x, y, maxWidth, lineHeight) {
  const pageHeight = doc.internal.pageSize.height;
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  lines.forEach(line => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

async function generatePdfFromId(id, type = activeReaderType || 'notes') {
  const item = findItem(id);
  if (!item) return;
  const content = await loadItemContent(item);
  const typeInfo = getContentTypeInfo(type);
  const chapterTitle = cleanTitle(content.title || item.title || getCardTitle(item));
  const bodyText = contentTypeToPlainText(content, type);
  const subject = String(content.subject || item.subject || '').toLowerCase();

  if (subject === 'chemistry' || subject === 'physics') {
    showToast('Use Save as PDF in the print window to preserve Cambria Math formulas.');
    window.print();
    return;
  }

  if (/[^\u0000-\u00ff]/.test(`${chapterTitle}${bodyText}`)) {
    showToast('For Indian-language text, use Print → Save as PDF to preserve the font.');
    window.print();
    return;
  }

  if (!window.jspdf?.jsPDF) {
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
  y = addPdfText(doc, `${chapterTitle} — ${typeInfo.title}`, 14, y, maxWidth, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addPdfText(doc, `Class ${content.class || item.class || ''} | ${content.subject || item.subject || ''} | ${content.chapter || item.chapter || ''} | ${content.book || item.book || ''}`, 14, y + 2, maxWidth, 6);

  doc.setDrawColor(80);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  doc.setFontSize(11);
  y = addPdfText(doc, bodyText, 14, y + 10, maxWidth, 6);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text('NCERT Study Archive', 14, 289);
    doc.text(`Page ${page} of ${pages}`, pageWidth - 14, 289, { align: 'right' });
  }

  const blobUrl = doc.output('bloburl');
  const popup = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    const fileName = `${chapterTitle}-${typeInfo.title}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pdf';
    doc.save(fileName);
  }
}

async function shareCurrentPage() {
  const item = findItem(activeReaderId || activeChapterId);
  const title = item ? getCardTitle(item) : 'NCERT Study Archive';
  const shareData = { title, text: `Study ${title} on NCERT Study Archive`, url: window.location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    showToast('Chapter link copied.');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('Could not share this link.');
  }
}

async function applyRouteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const cls = params.get('class');
  const subject = params.get('subject');
  const book = params.get('book');
  const chapter = params.get('chapter');
  const type = params.get('type');

  suppressHistory = true;
  try {
    if (!cls || !getAvailableClasses().includes(cls)) {
      showHome({ historyMode: 'replace', focus: false });
      return;
    }

    selectClass(cls, { historyMode: 'replace', focus: false });
    const validSubject = getSubjectsForSelectedClass().some(entry => entry.subject === subject);
    if (!subject || !validSubject) return;

    selectSubject(subject, { historyMode: 'replace', focus: false });
    const validBook = getBooksForSelectedSubject().some(entry => entry.book === book);
    if (!book || !validBook) return;

    await selectTextbook(book, { historyMode: 'replace', focus: false });
    const item = chapter ? findItem(chapter) : null;
    const chapterMatches = item && String(item.class) === cls && (item.subject || 'General') === subject && getBookName(item) === book;
    if (!chapter || !chapterMatches) return;

    if (type && CONTENT_TYPES.some(entry => entry.key === type)) {
      await openReader(chapter, type, { historyMode: 'replace', focus: false });
    } else {
      await openContentTypeSelection(chapter, { historyMode: 'replace', focus: false });
    }
  } finally {
    suppressHistory = false;
  }
}

async function loadLibrary() {
  try {
    const response = await fetch('media/library.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    library = data && typeof data === 'object' ? data : { chapters: [] };
  } catch (error) {
    console.error('Could not load media/library.json', error);
    library = { chapters: [] };
    showToast('The chapter library could not be loaded.');
  }

  renderClassSelection();
  renderStudyDashboard();
  await applyRouteFromUrl();
}

homeBtn.addEventListener('click', () => goHome());
changeTextbookBtn.addEventListener('click', changeTextbook);
changeSubjectBtn.addEventListener('click', changeSubject);
changeClassBtn.addEventListener('click', changeClass);
backToChaptersBtn.addEventListener('click', () => backToChapters());
searchInput.addEventListener('input', renderCatalog);

readerBack.addEventListener('click', () => closeReader());
readerPrint.addEventListener('click', () => window.print());
readerPdf.addEventListener('click', () => {
  if (activeReaderId) generatePdfFromId(activeReaderId, activeReaderType || 'notes');
});
shareBtn.addEventListener('click', shareCurrentPage);
prevChapterBtn.addEventListener('click', () => openAdjacentReader(-1));
nextChapterBtn.addEventListener('click', () => openAdjacentReader(1));

decreaseFontBtn.addEventListener('click', () => {
  const preferences = getPreferences();
  updatePreference({ fontSize: Math.max(15, preferences.fontSize - 1) });
});

increaseFontBtn.addEventListener('click', () => {
  const preferences = getPreferences();
  updatePreference({ fontSize: Math.min(24, preferences.fontSize + 1) });
});

lineSpacingBtn.addEventListener('click', () => {
  const preferences = getPreferences();
  const values = [1.55, 1.75, 2];
  const index = values.findIndex(value => Math.abs(value - preferences.lineHeight) < 0.01);
  updatePreference({ lineHeight: values[(index + 1) % values.length] });
  showToast(`Line spacing: ${getPreferences().lineHeight}`);
});

readerThemeBtn.addEventListener('click', () => {
  const preferences = getPreferences();
  const themes = ['paper', 'sepia', 'dark'];
  const index = themes.indexOf(preferences.theme);
  updatePreference({ theme: themes[(index + 1) % themes.length] });
});

bookmarkBtn.addEventListener('click', () => {
  if (!activeReaderId) return;
  const added = toggleIdInStorage(STORAGE_KEYS.bookmarks, activeReaderId);
  updateProgressButtons();
  renderStudyDashboard();
  showToast(added ? 'Chapter bookmarked.' : 'Bookmark removed.');
});

completeBtn.addEventListener('click', () => {
  if (!activeReaderId) return;
  const added = toggleIdInStorage(STORAGE_KEYS.completed, activeReaderId);
  updateProgressButtons();
  renderStudyDashboard();
  showToast(added ? 'Chapter marked complete.' : 'Completion removed.');
});

clearProgressBtn.addEventListener('click', () => {
  const confirmed = window.confirm('Clear reading history, bookmarks and completed chapters on this device?');
  if (!confirmed) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.lastRead);
    localStorage.removeItem(STORAGE_KEYS.bookmarks);
    localStorage.removeItem(STORAGE_KEYS.completed);
  } catch {}
  renderStudyDashboard();
  showToast('Saved study progress cleared.');
});

globalSearchInput.addEventListener('input', renderGlobalSearch);
globalSearchInput.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    globalSearchInput.value = '';
    closeGlobalSearch();
  }
  if (event.key === 'ArrowDown') {
    const first = globalSearchResults.querySelector('button');
    if (first) {
      event.preventDefault();
      first.focus();
    }
  }
});

globalSearchResults.addEventListener('keydown', event => {
  const buttons = [...globalSearchResults.querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  if (event.key === 'ArrowDown' && buttons[index + 1]) {
    event.preventDefault();
    buttons[index + 1].focus();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (buttons[index - 1]) buttons[index - 1].focus();
    else globalSearchInput.focus();
  }
  if (event.key === 'Escape') {
    globalSearchInput.focus();
    closeGlobalSearch();
  }
});

document.addEventListener('click', event => {
  if (!globalSearchWrap.contains(event.target)) closeGlobalSearch();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !readerView.hidden) closeReader();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    globalSearchInput.focus();
  }
});

window.addEventListener('popstate', applyRouteFromUrl);

window.openReader = openReader;
window.openContentTypeSelection = openContentTypeSelection;
window.generatePdfFromId = generatePdfFromId;

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(error => {
      console.warn('Service worker registration failed.', error);
    });
  });
}

loadLibrary();
