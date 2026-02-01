// Calendar widget - shows today's and tomorrow's events
const CALENDAR_API_URL = 'http://localhost:5000/calendar';
const CALENDAR_UPDATE_INTERVAL = 300000; // Update every 5 minutes

async function fetchCalendar() {
    try {
        const response = await fetch(CALENDAR_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        renderCalendar(data);
        
    } catch (error) {
        console.error('Error fetching calendar:', error);
        document.getElementById('calendar-events').innerHTML = `
            <div class="error-state error-danger">
                <span class="error-state-icon">📅</span>
                <span class="error-state-message">Kunne ikke laste kalender</span>
                <span class="error-state-hint">Prøver igjen snart</span>
            </div>`;
    }
}

function renderCalendar(data) {
    const container = document.getElementById('calendar-events');
    
    const todayEvents = data.today || [];
    const tomorrowEvents = data.tomorrow || [];
    
    if (todayEvents.length === 0 && tomorrowEvents.length === 0) {
        container.innerHTML = `
            <div class="error-state">
                <span class="error-state-icon">✨</span>
                <span class="error-state-message">Ingen hendelser</span>
                <span class="error-state-hint">Nyt fridagen!</span>
            </div>`;
        return;
    }
    
    let html = '';
    
    // Today's events
    if (todayEvents.length > 0) {
        html += '<div class="calendar-section">';
        html += '<div class="calendar-section-title">I dag</div>';
        
        for (const event of todayEvents) {
            html += renderEvent(event);
        }
        html += '</div>';
    }
    
    // Tomorrow's events (show fewer)
    if (tomorrowEvents.length > 0) {
        html += '<div class="calendar-section calendar-tomorrow">';
        html += '<div class="calendar-section-title">I morgen</div>';
        
        // Show max 3 events for tomorrow
        const maxTomorrow = tomorrowEvents.slice(0, 3);
        for (const event of maxTomorrow) {
            html += renderEvent(event);
        }
        
        if (tomorrowEvents.length > 3) {
            html += `<div class="calendar-more">+${tomorrowEvents.length - 3} flere</div>`;
        }
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function renderEvent(event) {
    const timeDisplay = event.all_day ? 'Hele dagen' : event.time;
    const endDisplay = event.end_time ? ` - ${event.end_time}` : '';
    
    // Truncate long summaries
    let summary = event.summary;
    if (summary.length > 35) {
        summary = summary.substring(0, 32) + '...';
    }
    
    return `
        <div class="calendar-event ${event.all_day ? 'all-day' : ''}">
            <span class="event-time">${timeDisplay}${endDisplay}</span>
            <span class="event-summary">${summary}</span>
        </div>
    `;
}

// Initial load
fetchCalendar();

// Update periodically
setInterval(fetchCalendar, CALENDAR_UPDATE_INTERVAL);
