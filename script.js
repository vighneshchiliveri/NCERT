document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const searchInput = document.getElementById('search');
    const grid = document.getElementById('media-grid');

    let currentCategory = 'music';

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            
            // Trigger a re-render/filter
            filterContent();
        });
    });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        filterContent();
    });

    // Mock filtering logic for the layout
    function filterContent() {
        const query = searchInput.value.toLowerCase();
        
        // In the real app, you would filter your library.json data here
        // Because there is no data populated yet, it defaults to the empty state.
        grid.innerHTML = `<div class="empty-state">No entries match your search.</div>`;
    }
});
