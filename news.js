// NRK News RSS Feed via local Flask proxy
const NEWS_API_URL = 'http://localhost:5000/news';
const NEWS_ROTATE_INTERVAL = 10000; // Rotate every 10 seconds
const NEWS_FETCH_INTERVAL = 5 * 60 * 1000; // Fetch new headlines every 5 minutes

let newsHeadlines = [];
let currentHeadlineIndex = 0;

// Parse RSS XML to extract headlines
function parseRSS(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    const headlines = [];
    items.forEach((item, index) => {
        if (index < 15) { // Limit to 15 headlines
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const category = item.querySelector('category')?.textContent || '';
            
            if (title) {
                headlines.push({
                    title: title,
                    link: link,
                    category: category
                });
            }
        }
    });
    
    return headlines;
}

// Fetch news from NRK RSS via Flask proxy
async function fetchNews() {
    try {
        const response = await fetch(NEWS_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        newsHeadlines = parseRSS(xmlText);
        
        if (newsHeadlines.length > 0) {
            console.log(`Loaded ${newsHeadlines.length} headlines from NRK`);
        }
        
        return newsHeadlines;
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}

// Display a headline with animation
function displayHeadline(index) {
    const headlineEl = document.getElementById('news-headline');
    if (!headlineEl || newsHeadlines.length === 0) return;
    
    const headline = newsHeadlines[index];
    
    // Fade out
    headlineEl.classList.remove('fade-in');
    headlineEl.classList.add('fade-out');
    
    // After fade out, update text and fade in
    setTimeout(() => {
        headlineEl.textContent = headline.title;
        headlineEl.classList.remove('fade-out');
        headlineEl.classList.add('fade-in');
    }, 300);
}

// Rotate to next headline
function rotateHeadline() {
    if (newsHeadlines.length === 0) return;
    
    currentHeadlineIndex = (currentHeadlineIndex + 1) % newsHeadlines.length;
    displayHeadline(currentHeadlineIndex);
}

// Initialize news ticker
async function initNews() {
    const headlines = await fetchNews();
    
    if (headlines.length > 0) {
        // Show first headline immediately
        const headlineEl = document.getElementById('news-headline');
        if (headlineEl) {
            headlineEl.textContent = headlines[0].title;
        }
        
        // Start rotation
        setInterval(rotateHeadline, NEWS_ROTATE_INTERVAL);
    } else {
        // Show error message
        const headlineEl = document.getElementById('news-headline');
        if (headlineEl) {
            headlineEl.textContent = 'Kunne ikke laste nyheter';
        }
    }
}

// Initial load
initNews();

// Refresh news periodically
setInterval(fetchNews, NEWS_FETCH_INTERVAL);
