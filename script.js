document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const searchInput = document.getElementById('search');
    const classFilter = document.getElementById('class-level');
    const grid = document.getElementById('media-grid');

    let currentCategory = 'textbooks';

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            filterContent();
        });
    });

    // Handle search and dropdown filters
    searchInput.addEventListener('input', filterContent);
    classFilter.addEventListener('change', filterContent);

    function filterContent() {
        const query = searchInput.value.toLowerCase();
        const selectedClass = classFilter.value;
        
        // This is where you will eventually link your NCERT data.
        // For now, it defaults to the sleek empty state to match the theme.
        grid.innerHTML = `<div class="empty-state">No resources match your search criteria.</div>`;
    }
});
