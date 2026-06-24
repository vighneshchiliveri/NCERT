// ========================================
// NCERT COMPANION - GEIST INSPIRED JAVASCRIPT
// ========================================

const sampleContent = {
    'photosynthesis': {
        type: 'notes',
        subject: 'Science',
        title: 'Photosynthesis: Process & Mechanism',
        content: 'Photosynthesis is the process by which plants convert sunlight, water, and CO2 into glucose and oxygen. It occurs in two stages: light-dependent reactions in the thylakoids and the Calvin cycle in the stroma.'
    },
    'algebra': {
        type: 'summary',
        subject: 'Mathematics',
        title: 'Algebra Fundamentals',
        content: 'Algebra deals with mathematical symbols and rules. Key concepts include linear equations, quadratic equations, systems of equations, and polynomial functions.'
    },
    'democracy': {
        type: 'qa',
        subject: 'Social Studies',
        question: 'What is democracy?',
        answer: 'Democracy is a system of government where power rests with the people through elected representatives or direct participation. Features include free elections, protection of rights, and rule of law.'
    }
};

// ========================================
// MODAL FUNCTIONS
// ========================================

function openSearchModal() {
    const modal = document.getElementById('searchModal');
    modal.classList.add('show');
    document.getElementById('modalSearchInput').focus();
}

function closeSearchModal() {
    document.getElementById('searchModal').classList.remove('show');
}

function openSubject(subjectId) {
    const modal = document.getElementById('subjectModal');
    const subjectDetail = document.getElementById('subjectDetail');
    
    const subjects = {
        'math-6': {
            name: 'Mathematics (Classes 6–8)',
            chapters: ['Number System', 'Fractions & Decimals', 'Algebra Basics', 'Geometry Fundamentals', 'Statistics & Probability'],
            topics: 45,
            qa: 250
        },
        'science-6': {
            name: 'Science (Classes 6–8)',
            chapters: ['Living Organisms', 'Matter & Materials', 'Forces & Motion', 'Energy', 'Our Universe'],
            topics: 52,
            qa: 280
        },
        'math-9': {
            name: 'Mathematics (Classes 9–10)',
            chapters: ['Linear Equations', 'Quadratic Equations', 'Geometry', 'Trigonometry', 'Statistics'],
            topics: 62,
            qa: 420
        },
        'math-11': {
            name: 'Mathematics (Classes 11–12)',
            chapters: ['Calculus', 'Linear Algebra', 'Sequences & Series', 'Matrices', 'Statistics'],
            topics: 95,
            qa: 650
        }
    };

    const subject = subjects[subjectId] || {
        name: 'Subject Details',
        chapters: [],
        topics: 0,
        qa: 0
    };

    subjectDetail.innerHTML = `
        <h3 style="margin-bottom: 1rem; color: #000;">${subject.name}</h3>
        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Chapters Covered</h4>
            <div style="display: grid; gap: 0.5rem;">
                ${subject.chapters.map(ch => `<p style="color: #666; font-size: 0.95rem;">• ${ch}</p>`).join('')}
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
            <div>
                <p style="font-size: 2rem; font-weight: 700; color: #000;">${subject.topics}</p>
                <p style="font-size: 0.85rem; color: #888;">Topics</p>
            </div>
            <div>
                <p style="font-size: 2rem; font-weight: 700; color: #000;">${subject.qa}+</p>
                <p style="font-size: 0.85rem; color: #888;">Q&A Pairs</p>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeSubjectModal() {
    document.getElementById('subjectModal').classList.remove('show');
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function performSearch() {
    const searchInput = document.getElementById('searchInput') || document.getElementById('modalSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.length === 0) {
        clearSearchResults();
        return;
    }

    const results = [];
    
    for (const [key, content] of Object.entries(sampleContent)) {
        if (key.includes(query) || JSON.stringify(content).toLowerCase().includes(query)) {
            results.push(content);
        }
    }

    displaySearchResults(results);
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults') || document.getElementById('modalSearchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;">No results found. Try searching for \"photosynthesis\", \"algebra\", or \"democracy\"</div>`;
        return;
    }

    resultsContainer.innerHTML = results.map((result) => `
        <div class="search-result-card">
            <span class="result-type">${result.type}</span>
            <h4>${result.title || result.question}</h4>
            <p>${result.content || result.answer}</p>
            <p style="color: #888; font-size: 0.9rem; margin-top: 0.5rem;">${result.subject}</p>
        </div>
    `).join('');
}

function clearSearchResults() {
    document.querySelectorAll('.search-results').forEach(container => {
        container.innerHTML = '';
    });
}

// ========================================
// FILTER FUNCTIONALITY
// ========================================

function filterSubjects(classLevel) {
    const subjects = document.querySelectorAll('.subject-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    subjects.forEach(subject => {
        if (classLevel === 'all') {
            subject.classList.remove('hidden');
        } else {
            subject.classList.toggle('hidden', subject.dataset.class !== classLevel);
        }
    });
}

// ========================================
// MODAL CLOSE ON BACKGROUND CLICK
// ========================================

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearchModal();
    }
    
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// ========================================
// ACTIVE LINK HIGHLIGHTING
// ========================================

window.addEventListener('scroll', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NCERT Companion loaded successfully!');
    console.log('Tip: Use Ctrl+K (Cmd+K on Mac) to open quick search');
});
