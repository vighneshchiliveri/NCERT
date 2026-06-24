// ========================================
// MAXIMALIST NCERT COMPANION JAVASCRIPT
// Dynamic Content & Interactivity
// ========================================

// Sample Data - In production, this would come from a database
const sampleContent = {
    'photosynthesis': {
        type: 'notes',
        subject: 'Science',
        title: 'Photosynthesis - Complete Guide',
        content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of glucose. It occurs primarily in the leaves and involves two main stages: light-dependent reactions (in the thylakoids) and light-independent reactions or Calvin cycle (in the stroma).'
    },
    'algebra': {
        type: 'summary',
        subject: 'Mathematics',
        title: 'Algebra Fundamentals Summary',
        content: 'Algebra is the study of mathematical symbols and the rules for manipulating these symbols. It includes solving equations, understanding variables, working with polynomials, and analyzing functions. Key concepts include linear equations, quadratic equations, systems of equations, and inequalities.'
    },
    'democracy': {
        type: 'qa',
        subject: 'Social Studies',
        question: 'What is democracy and how does it work?',
        answer: 'Democracy is a form of government where power rests with the people. It operates on the principle that sovereignty resides with the people. In a democratic system, decisions are made by majority vote through elected representatives or direct participation. Key features include free and fair elections, protection of rights, rule of law, and separation of powers.'
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
    const modal = document.getElementById('searchModal');
    modal.classList.remove('show');
}

function openSubject(subjectId) {
    const modal = document.getElementById('subjectModal');
    const subjectDetail = document.getElementById('subjectDetail');
    
    // Sample subject details
    const subjects = {
        'mathematics-6': {
            name: 'Mathematics Class 6-8',
            chapters: [
                { title: 'Number System', topics: 15 },
                { title: 'Fractions & Decimals', topics: 12 },
                { title: 'Algebra Basics', topics: 10 },
                { title: 'Geometry Fundamentals', topics: 18 },
                { title: 'Statistics & Probability', topics: 8 }
            ],
            questionBank: 250,
            summary: 'Comprehensive mathematics notes covering fundamental concepts'
        },
        'science-6': {
            name: 'Science Class 6-8',
            chapters: [
                { title: 'Living Organisms', topics: 14 },
                { title: 'Matter & Materials', topics: 16 },
                { title: 'Forces & Motion', topics: 12 },
                { title: 'Energy', topics: 11 },
                { title: 'Our Universe', topics: 9 }
            ],
            questionBank: 280,
            summary: 'Detailed science notes with concepts and Q&A'
        },
        'english-6': {
            name: 'English Class 6-8',
            chapters: [
                { title: 'Grammar Basics', topics: 20 },
                { title: 'Literature & Stories', topics: 15 },
                { title: 'Poetry Appreciation', topics: 12 },
                { title: 'Writing Skills', topics: 10 }
            ],
            questionBank: 200,
            summary: 'English grammar, literature analysis, and composition guide'
        },
        'social-6': {
            name: 'Social Studies Class 6-8',
            chapters: [
                { title: 'History - Ancient Era', topics: 18 },
                { title: 'Geography Basics', topics: 20 },
                { title: 'Civics & Governance', topics: 15 },
                { title: 'Economics Introduction', topics: 12 }
            ],
            questionBank: 240,
            summary: 'Complete social studies guide'
        }
    };

    const subject = subjects[subjectId] || {
        name: 'Subject Not Found',
        chapters: [],
        questionBank: 0,
        summary: 'Content coming soon'
    };

    subjectDetail.innerHTML = `
        <h2>${subject.name}</h2>
        <p style="color: #666; margin: 1rem 0;">${subject.summary}</p>
        <h3 style="margin-top: 2rem; margin-bottom: 1rem; color: #FF6B6B;">📚 Chapters & Topics</h3>
        <div style="display: grid; gap: 1rem;">
            ${subject.chapters.map(chapter => `
                <div style="padding: 1rem; background: #f9f9f9; border-radius: 10px; border-left: 4px solid #FF6B6B;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">${chapter.title}</h4>
                    <p style="color: #777; margin: 0;">📝 ${chapter.topics} topics covered</p>
                </div>
            `).join('')}
        </div>
        <h3 style="margin-top: 2rem; margin-bottom: 1rem; color: #4ECDC4;">❓ Question Bank</h3>
        <div style="padding: 1.5rem; background: linear-gradient(135deg, #4ECDC4 0%, #44A4A8 100%); border-radius: 10px; color: white;">
            <div style="font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem;">${subject.questionBank}+</div>
            <p style="margin: 0;">Questions & Answers with detailed explanations</p>
        </div>
    `;
    
    modal.classList.add('show');
}

function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    modal.classList.remove('show');
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
    
    // Search in sample content
    for (const [key, content] of Object.entries(sampleContent)) {
        if (key.includes(query) || 
            JSON.stringify(content).toLowerCase().includes(query)) {
            results.push(content);
        }
    }

    displaySearchResults(results);
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults') || 
                            document.getElementById('modalSearchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p style="font-size: 1.2rem; color: white;">🔍 No results found</p>
                <p style="color: rgba(255,255,255,0.8);">Try searching for 'photosynthesis', 'algebra', or 'democracy'</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map((result) => `
        <div class="search-result-card">
            <span class="result-type">${result.type.toUpperCase()}</span>
            <h4>${result.title || result.question}</h4>
            <p>${result.content || result.answer}</p>
            <p style="color: #999; font-size: 0.9rem; margin-top: 0.5rem;">📚 ${result.subject}</p>
            <button class="btn btn-primary" style="margin-top: 1rem; font-size: 0.9rem;" onclick="alert('Opening detailed view')">
                📖 Read More
            </button>
        </div>
    `).join('');
}

function clearSearchResults() {
    const resultsContainers = document.querySelectorAll('.search-results');
    resultsContainers.forEach(container => {
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
            if (subject.dataset.class === classLevel) {
                subject.classList.remove('hidden');
            } else {
                subject.classList.add('hidden');
            }
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
// SCROLL ANIMATIONS
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease-out';
    observer.observe(card);
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
// PAGE LOAD
// ========================================

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.style.opacity = '1';
            box.style.transform = 'scale(1)';
        }, index * 100);
    });
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 NCERT Companion loaded successfully!');
    console.log('💡 Tip: Use Ctrl+K (or Cmd+K) to quickly open the search!');
});

console.log('%c🎓 Welcome to NCERT Companion! ', 'font-size: 16px; font-weight: bold; color: #FF6B6B;');
console.log('%cYour complete study companion for NCERT textbooks', 'font-size: 12px; color: #666;');
