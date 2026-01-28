// Shopping list widget for main dashboard
const SHOPPING_API_URL = 'http://localhost:5000/shopping';

async function fetchShoppingList() {
    try {
        const response = await fetch(SHOPPING_API_URL);
        const data = await response.json();
        renderShoppingWidget(data);
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        const container = document.getElementById('shopping-list');
        if (container) {
            container.innerHTML = '<div class="shopping-empty">Kunne ikke laste</div>';
        }
    }
}

function renderShoppingWidget(data) {
    const container = document.getElementById('shopping-list');
    if (!container) return;
    
    if (!data.items || data.items.length === 0) {
        container.innerHTML = '<div class="shopping-empty">Listen er tom!</div>';
        return;
    }
    
    // Show unchecked items first, max 5
    const unchecked = data.items.filter(i => !i.checked);
    const toShow = unchecked.slice(0, 5);
    
    let html = '';
    
    for (const item of toShow) {
        html += `
            <div class="shopping-widget-item">
                <span class="shopping-bullet">•</span>
                <span class="shopping-text">${item.text}</span>
            </div>
        `;
    }
    
    if (unchecked.length > 5) {
        html += `<div class="shopping-more">+${unchecked.length - 5} til...</div>`;
    }
    
    container.innerHTML = html;
}

// Initial fetch
fetchShoppingList();

// Update every 30 seconds
setInterval(fetchShoppingList, 30000);
