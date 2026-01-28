// Football widget - PL and CL matches TODAY only
const FOOTBALL_API_URL = 'http://localhost:5000/football';
const FOOTBALL_UPDATE_INTERVAL = 60000; // Update every 60 seconds

async function fetchFootball() {
    try {
        const response = await fetch(FOOTBALL_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Show or hide widget based on data
        const widget = document.querySelector('.widget-football');
        
        if (data.show) {
            widget.classList.add('visible');
            updateTitle(data);
            renderDeadline(data.deadline);
            renderFixtures(data.fixtures);
        } else {
            widget.classList.remove('visible');
        }
        
    } catch (error) {
        console.error('Error fetching football data:', error);
        document.querySelector('.widget-football')?.classList.remove('visible');
    }
}

function updateTitle(data) {
    const title = document.getElementById('football-title');
    const competitions = new Set(data.fixtures?.map(f => f.competition) || []);
    
    if (competitions.has('PL') && competitions.has('CL')) {
        title.textContent = 'PL & CL';
    } else if (competitions.has('CL')) {
        title.textContent = 'Champions League';
    } else {
        title.textContent = 'Premier League';
    }
}

function renderDeadline(deadline) {
    const container = document.getElementById('fpl-deadline');
    
    if (!deadline) {
        container.textContent = '';
        return;
    }
    
    const deadlineTime = new Date(deadline.time);
    const now = new Date();
    const diff = deadlineTime - now;
    
    if (diff <= 0) {
        container.textContent = `${deadline.name} passert`;
        return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const timeStr = hours > 0 ? `${hours}t ${minutes}m` : `${minutes}m`;
    
    container.innerHTML = `⏱ ${deadline.name}: ${timeStr}`;
}

function renderFixtures(fixtures) {
    const container = document.getElementById('football-fixtures');
    
    if (!fixtures || fixtures.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    for (const fixture of fixtures) {
        const kickoff = new Date(fixture.kickoff);
        
        let statusClass = '';
        let timeDisplay = '';
        
        if (fixture.finished) {
            statusClass = 'finished';
            timeDisplay = 'FT';
        } else if (fixture.started) {
            statusClass = 'live';
            // Show minute if available, otherwise just LIVE
            if (fixture.minute && fixture.minute !== '-1') {
                timeDisplay = `${fixture.minute}'`;
            } else {
                timeDisplay = 'LIVE';
            }
        } else {
            timeDisplay = kickoff.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
        }
        
        let scoreDisplay = '-';
        if (fixture.started || fixture.finished) {
            scoreDisplay = `${fixture.home_score ?? 0}-${fixture.away_score ?? 0}`;
        }
        
        // Competition badge
        const compClass = fixture.competition === 'CL' ? 'comp-cl' : 'comp-pl';
        
        html += `
            <div class="fixture-item ${statusClass}">
                <span class="fixture-comp ${compClass}">${fixture.competition}</span>
                <span class="fixture-home">${fixture.home}</span>
                <span class="fixture-score">${scoreDisplay}</span>
                <span class="fixture-away">${fixture.away}</span>
                <span class="fixture-time">${timeDisplay}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Initial load
fetchFootball();

// Update periodically
setInterval(fetchFootball, FOOTBALL_UPDATE_INTERVAL);
