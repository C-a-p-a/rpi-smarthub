// Detail page common functionality
// Auto-redirect to home after 3 minutes, with visible countdown

const REDIRECT_TIMEOUT = 3 * 60 * 1000; // 3 minutes in ms
let timeRemaining = REDIRECT_TIMEOUT;
let countdownInterval;

// Norwegian weekday and month names for clock
const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 
                'juli', 'august', 'september', 'oktober', 'november', 'desember'];

// Get ISO week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('detail-clock');
    if (clockEl) {
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function updateDate() {
    const now = new Date();
    const weekday = weekdays[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const week = getWeekNumber(now);
    const dateEl = document.getElementById('detail-date');
    if (dateEl) {
        dateEl.textContent = `${weekday} ${day}. ${month}  ·  Uke ${week}`;
    }
}

function initDetailPage() {
    // Start clock
    updateClock();
    updateDate();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 60000);
    
    // Start countdown
    updateCountdown();
    countdownInterval = setInterval(() => {
        timeRemaining -= 1000;
        updateCountdown();
        
        if (timeRemaining <= 0) {
            goHome();
        }
    }, 1000);
    
    // Reset timer on any interaction
    document.addEventListener('click', resetTimer);
    document.addEventListener('touchstart', resetTimer);
    document.addEventListener('scroll', resetTimer);
}

function resetTimer() {
    timeRemaining = REDIRECT_TIMEOUT;
    updateCountdown();
}

function updateCountdown() {
    const countdown = document.getElementById('countdown');
    if (countdown) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        countdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function goHome() {
    window.location.href = '/';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDetailPage);
