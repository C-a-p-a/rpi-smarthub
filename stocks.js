// Stock ticker - fetches data from Flask backend
const STOCKS_API_URL = 'http://localhost:5000/stocks';
const STOCKS_UPDATE_INTERVAL = 60000; // Update every 60 seconds

async function fetchStocks() {
    try {
        const response = await fetch(STOCKS_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stocks = await response.json();
        renderStocks(stocks);
        
    } catch (error) {
        console.error('Error fetching stocks:', error);
        document.getElementById('stocks-display').innerHTML = 
            '<span style="color: var(--text-muted)">Kunne ikke laste aksjer</span>';
    }
}

function renderStocks(stocks) {
    const container = document.getElementById('stocks-display');
    
    if (!stocks || stocks.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted)">Ingen aksjedata</span>';
        return;
    }
    
    let html = '';
    
    for (const stock of stocks) {
        const changeClass = stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : 'neutral';
        const changePrefix = stock.change > 0 ? '+' : '';
        const arrow = stock.change > 0 ? '▲' : stock.change < 0 ? '▼' : '';
        
        // Session badge for pre-market/after-hours
        let sessionBadge = '';
        if (stock.session === 'PM') {
            sessionBadge = '<span class="session-badge premarket">PM</span>';
        } else if (stock.session === 'AH') {
            sessionBadge = '<span class="session-badge afterhours">AH</span>';
        }
        
        // Price display: hide for indices, show currency for others
        let priceHtml = '';
        if (!stock.is_index) {
            const currencySymbol = stock.currency === 'CAD' ? 'C$' : '$';
            priceHtml = `<span class="stock-price">${currencySymbol}${stock.price.toFixed(2)}</span>`;
        }
        
        html += `
            <div class="stock-item">
                <span class="stock-symbol">${stock.symbol}${sessionBadge}</span>
                ${priceHtml}
                <span class="stock-change ${changeClass}">${arrow}${changePrefix}${stock.change.toFixed(2)}%</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Initial load
fetchStocks();

// Update stocks periodically
setInterval(fetchStocks, STOCKS_UPDATE_INTERVAL);
