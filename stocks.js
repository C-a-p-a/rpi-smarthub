// Stock ticker - horizontal scrolling marquee
const STOCKS_API_URL = 'http://localhost:5000/stocks';
const STOCKS_UPDATE_INTERVAL = 60000; // Update data every 60 seconds

let allStocks = [];

async function fetchStocks(retryCount = 0) {
    const maxRetries = 3;
    
    try {
        console.log('Fetching stocks...');
        
        const response = await fetch(STOCKS_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            allStocks = data;
            console.log(`✓ Loaded ${allStocks.length} stocks`);
            renderStocksTicker();
        } else {
            throw new Error('No stocks received');
        }
        
    } catch (error) {
        console.error('Error fetching stocks:', error.message);
        
        if (retryCount < maxRetries) {
            console.log(`Retrying stocks... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => fetchStocks(retryCount + 1), 3000);
        } else {
            const container = document.getElementById('stocks-display');
            if (container && allStocks.length === 0) {
                container.innerHTML = '<span class="ticker-error">Kunne ikke laste aksjer</span>';
            }
        }
    }
}

function renderStocksTicker() {
    const container = document.getElementById('stocks-display');
    const labelEl = document.getElementById('stocks-label');
    
    if (!container || allStocks.length === 0) return;
    
    // Update label
    if (labelEl) {
        labelEl.textContent = 'AKSJER';
        labelEl.style.backgroundColor = '#00c853';
    }
    
    // Build ticker content - duplicate for seamless loop
    let tickerContent = '';
    
    for (const stock of allStocks) {
        const changeClass = stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : 'neutral';
        const changePrefix = stock.change > 0 ? '+' : '';
        const arrow = stock.change > 0 ? '▲' : stock.change < 0 ? '▼' : '';
        
        // Session badge
        let sessionBadge = '';
        if (stock.session === 'PM') {
            sessionBadge = '<span class="session-badge premarket">PM</span>';
        } else if (stock.session === 'AH') {
            sessionBadge = '<span class="session-badge afterhours">AH</span>';
        }
        
        // Price display
        let priceHtml = '';
        if (!stock.is_index) {
            const currencySymbol = stock.currency === 'CAD' ? 'C$' : '$';
            priceHtml = `<span class="stock-price">${currencySymbol}${stock.price.toFixed(2)}</span>`;
        }
        
        // Category color dot
        let categoryColor = '#888';
        if (stock.category === 'index') categoryColor = '#2196F3';
        else if (stock.category === 'mine') categoryColor = '#FF9800';
        else if (stock.category === 'mag7') categoryColor = '#9C27B0';
        else if (stock.category === 'fund') categoryColor = '#00BCD4';
        
        tickerContent += `
            <div class="stock-ticker-item">
                <span class="stock-category-dot" style="background: ${categoryColor}"></span>
                <span class="stock-symbol">${stock.symbol}${sessionBadge}</span>
                ${priceHtml}
                <span class="stock-change ${changeClass}">${arrow}${changePrefix}${stock.change.toFixed(2)}%</span>
            </div>
        `;
    }
    
    // Create scrolling wrapper with duplicated content for seamless loop
    container.innerHTML = `
        <div class="stocks-ticker-wrapper">
            <div class="stocks-ticker-content">
                ${tickerContent}
                ${tickerContent}
            </div>
        </div>
    `;
}

// Initial load
fetchStocks();

// Update stock data periodically
setInterval(() => fetchStocks(), STOCKS_UPDATE_INTERVAL);
