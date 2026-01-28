// Multi-source News via Flask proxy
const NEWS_API_URL = 'http://localhost:5000/news/all';
const NEWS_ROTATE_INTERVAL = 8000; // Rotate every 8 seconds
const NEWS_FETCH_INTERVAL = 5 * 60 * 1000; // Fetch new headlines every 5 minutes
const FETCH_TIMEOUT = 30000; // 30 second timeout for initial load

let newsHeadlines = [];
let currentHeadlineIndex = 0;
let rotationStarted = false;

// Fetch with timeout
async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Fetch news from all sources via Flask proxy
async function fetchNews(retryCount = 0) {
    const maxRetries = 3;
    
    try {
        console.log('Fetching news from:', NEWS_API_URL);
        showLoading();
        
        const response = await fetchWithTimeout(NEWS_API_URL, FETCH_TIMEOUT);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            newsHeadlines = data;
            console.log(`✓ Loaded ${newsHeadlines.length} headlines from multiple sources`);
            
            // Update display immediately with first headline
            updateNewsDisplay(newsHeadlines[0]);
            
            // Start rotation if not already started
            if (!rotationStarted) {
                rotationStarted = true;
                setInterval(rotateHeadline, NEWS_ROTATE_INTERVAL);
            }
        } else {
            console.warn('No headlines received');
            if (retryCount < maxRetries) {
                console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => fetchNews(retryCount + 1), 3000);
            } else {
                showError();
            }
        }
        
        return newsHeadlines;
    } catch (error) {
        console.error('Error fetching news:', error.message);
        
        if (retryCount < maxRetries) {
            console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => fetchNews(retryCount + 1), 3000);
        } else {
            showError();
        }
        return [];
    }
}

function showLoading() {
    const headlineEl = document.getElementById('news-headline');
    const sourceEl = document.getElementById('news-source');
    
    if (headlineEl && newsHeadlines.length === 0) {
        headlineEl.textContent = 'Laster nyheter...';
    }
    if (sourceEl && newsHeadlines.length === 0) {
        sourceEl.textContent = '...';
        sourceEl.style.backgroundColor = '#666';
    }
}

function showError() {
    const headlineEl = document.getElementById('news-headline');
    const sourceEl = document.getElementById('news-source');
    
    // Only show error if we don't have any cached headlines
    if (newsHeadlines.length === 0) {
        if (headlineEl) {
            headlineEl.textContent = 'Kunne ikke laste nyheter';
        }
        if (sourceEl) {
            sourceEl.textContent = 'FEIL';
            sourceEl.style.backgroundColor = '#666';
        }
    }
}

function updateNewsDisplay(headline) {
    const headlineEl = document.getElementById('news-headline');
    const sourceEl = document.getElementById('news-source');
    
    if (headlineEl && headline) {
        headlineEl.textContent = headline.title;
    }
    if (sourceEl && headline) {
        sourceEl.textContent = headline.source;
        sourceEl.style.backgroundColor = headline.sourceColor;
    }
}

// Display a headline with animation
function displayHeadline(index) {
    const headlineEl = document.getElementById('news-headline');
    const sourceEl = document.getElementById('news-source');
    if (!headlineEl || newsHeadlines.length === 0) return;
    
    const headline = newsHeadlines[index];
    if (!headline) return;
    
    // Fade out
    headlineEl.classList.remove('fade-in');
    headlineEl.classList.add('fade-out');
    if (sourceEl) {
        sourceEl.classList.remove('fade-in');
        sourceEl.classList.add('fade-out');
    }
    
    // After fade out, update text and fade in
    setTimeout(() => {
        headlineEl.textContent = headline.title;
        headlineEl.classList.remove('fade-out');
        headlineEl.classList.add('fade-in');
        
        if (sourceEl) {
            sourceEl.textContent = headline.source;
            sourceEl.style.backgroundColor = headline.sourceColor;
            sourceEl.classList.remove('fade-out');
            sourceEl.classList.add('fade-in');
        }
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
    await fetchNews();
}

// Initial load
initNews();

// Refresh news periodically
setInterval(() => fetchNews(), NEWS_FETCH_INTERVAL);
