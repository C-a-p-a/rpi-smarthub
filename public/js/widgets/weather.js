// Weather data from MET Norway (Yr)
// Møhlenpris, Bergen coordinates
const WEATHER_LAT = 60.3897;
const WEATHER_LON = 5.3186;
const MET_API_URL = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${WEATHER_LAT}&lon=${WEATHER_LON}`;

// Weather symbol descriptions in Norwegian
const weatherDescriptions = {
    'clearsky': 'Klarvær',
    'fair': 'Lettskyet',
    'partlycloudy': 'Delvis skyet',
    'cloudy': 'Skyet',
    'lightrainshowers': 'Lette regnbyger',
    'rainshowers': 'Regnbyger',
    'heavyrainshowers': 'Kraftige regnbyger',
    'lightrainshowersandthunder': 'Lette regnbyger og torden',
    'rainshowersandthunder': 'Regnbyger og torden',
    'heavyrainshowersandthunder': 'Kraftige regnbyger og torden',
    'lightsleetshowers': 'Lette sluddbyger',
    'sleetshowers': 'Sluddbyger',
    'heavysleetshowers': 'Kraftige sluddbyger',
    'lightsnowshowers': 'Lette snøbyger',
    'snowshowers': 'Snøbyger',
    'heavysnowshowers': 'Kraftige snøbyger',
    'lightrain': 'Lett regn',
    'rain': 'Regn',
    'heavyrain': 'Kraftig regn',
    'lightrainandthunder': 'Lett regn og torden',
    'rainandthunder': 'Regn og torden',
    'heavyrainandthunder': 'Kraftig regn og torden',
    'lightsleet': 'Lett sludd',
    'sleet': 'Sludd',
    'heavysleet': 'Kraftig sludd',
    'lightsnow': 'Lett snø',
    'snow': 'Snø',
    'heavysnow': 'Kraftig snø',
    'fog': 'Tåke'
};

function getWeatherDescription(symbolCode) {
    // Remove _day or _night suffix
    const baseCode = symbolCode.replace(/_day|_night/g, '');
    return weatherDescriptions[baseCode] || symbolCode;
}

function getWeatherIconUrl(symbolCode) {
    // Use Yr's official weather symbols via jsDelivr CDN (reliable and fast)
    return `https://cdn.jsdelivr.net/gh/nrkno/yr-weather-symbols@main/dist/svg/${symbolCode}.svg`;
}

// SVG fallback icons for when images don't load
const weatherFallbackIcons = {
    'sun': `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="#FBBF24"/><g stroke="#FBBF24" stroke-width="4" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="90"/><line x1="10" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="90" y2="50"/><line x1="21.7" y1="21.7" x2="30.2" y2="30.2"/><line x1="69.8" y1="69.8" x2="78.3" y2="78.3"/><line x1="21.7" y1="78.3" x2="30.2" y2="69.8"/><line x1="69.8" y1="30.2" x2="78.3" y2="21.7"/></g></svg>`,
    'cloud': `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25 65c-8.3 0-15-6.7-15-15 0-7.5 5.5-13.7 12.7-14.8C24.5 25.5 33.5 18 44 18c10.2 0 18.9 6.9 21.5 16.3C67.2 34.1 69 34 71 34c11 0 20 9 20 20s-9 20-20 20H25z" fill="#94A1B2"/></svg>`,
    'rain': `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25 55c-8.3 0-15-6.7-15-15 0-7.5 5.5-13.7 12.7-14.8C24.5 15.5 33.5 8 44 8c10.2 0 18.9 6.9 21.5 16.3C67.2 24.1 69 24 71 24c11 0 20 9 20 20s-9 20-20 20H25z" fill="#94A1B2"/><g stroke="#7F9CF5" stroke-width="3" stroke-linecap="round"><line x1="30" y1="65" x2="25" y2="80"/><line x1="50" y1="65" x2="45" y2="80"/><line x1="70" y1="65" x2="65" y2="80"/><line x1="40" y1="75" x2="35" y2="90"/><line x1="60" y1="75" x2="55" y2="90"/></g></svg>`,
    'snow': `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25 55c-8.3 0-15-6.7-15-15 0-7.5 5.5-13.7 12.7-14.8C24.5 15.5 33.5 8 44 8c10.2 0 18.9 6.9 21.5 16.3C67.2 24.1 69 24 71 24c11 0 20 9 20 20s-9 20-20 20H25z" fill="#94A1B2"/><g fill="#E5E7EB"><circle cx="30" cy="70" r="3"/><circle cx="50" cy="75" r="3"/><circle cx="70" cy="70" r="3"/><circle cx="40" cy="85" r="3"/><circle cx="60" cy="85" r="3"/></g></svg>`
};

function getFallbackIcon(symbolCode) {
    if (symbolCode.includes('snow')) return weatherFallbackIcons.snow;
    if (symbolCode.includes('rain') || symbolCode.includes('sleet')) return weatherFallbackIcons.rain;
    if (symbolCode.includes('cloud') || symbolCode.includes('fog')) return weatherFallbackIcons.cloud;
    return weatherFallbackIcons.sun;
}

// Classify symbol code into a weather theme category
function getWeatherTheme(symbolCode) {
    const base = symbolCode.replace(/_day|_night/g, '');
    if (base.includes('snow')) return 'snowy';
    if (base.includes('thunder')) return 'thunder';
    if (base.includes('rain') || base.includes('sleet')) return 'rainy';
    if (base === 'cloudy' || base === 'fog') return 'cloudy';
    if (base === 'partlycloudy') return 'partlycloudy';
    return 'sunny';
}

// Decorative SVG elements for each weather theme
const weatherThemeDecor = {
    sunny: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="30" r="16" fill="#FBBF24"/>
        <g stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round">
            <line x1="50" y1="6" x2="50" y2="12"/>
            <line x1="50" y1="48" x2="50" y2="54"/>
            <line x1="26" y1="30" x2="32" y2="30"/>
            <line x1="68" y1="30" x2="74" y2="30"/>
            <line x1="33" y1="13" x2="37.2" y2="17.2"/>
            <line x1="62.8" y1="42.8" x2="67" y2="47"/>
            <line x1="33" y1="47" x2="37.2" y2="42.8"/>
            <line x1="62.8" y1="17.2" x2="67" y2="13"/>
        </g>
    </svg>`,
    partlycloudy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="58" cy="22" r="12" fill="#FBBF24"/>
        <g stroke="#FBBF24" stroke-width="2" stroke-linecap="round">
            <line x1="58" y1="4" x2="58" y2="8"/>
            <line x1="58" y1="36" x2="58" y2="40"/>
            <line x1="40" y1="22" x2="44" y2="22"/>
            <line x1="72" y1="22" x2="76" y2="22"/>
        </g>
        <path d="M18 52c-6 0-11-5-11-11 0-5.5 4-10 9.3-10.8C17.8 23.4 24.4 18 32.2 18c7.5 0 13.8 5 15.7 11.9 1.2-.1 2.5-.2 3.8-.2 8 0 14.6 6.5 14.6 14.6S59.7 58.8 51.7 58.8H18V52z" fill="#94A1B2"/>
    </svg>`,
    cloudy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 55c-7 0-12.5-5.5-12.5-12.5 0-6.2 4.5-11.4 10.5-12.3C19.5 22 27 16 36 16c8.5 0 15.7 5.7 17.9 13.5 1-.1 2.1-.2 3.1-.2 9.2 0 16.5 7.5 16.5 16.5S66.2 62.3 57 62.3H20V55z" fill="#94A1B2"/>
    </svg>`,
    rainy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 42c-6 0-11-5-11-11 0-5.5 4-10 9.3-10.8C19.8 13.4 26.4 8 34.2 8c7.5 0 13.8 5 15.7 11.9 1.2-.1 2.5-.2 3.8-.2 8 0 14.6 6.5 14.6 14.6S61.7 48.8 53.7 48.8H20V42z" fill="#94A1B2"/>
        <g stroke="#7F9CF5" stroke-width="2.5" stroke-linecap="round">
            <line x1="28" y1="54" x2="24" y2="66"/>
            <line x1="40" y1="54" x2="36" y2="66"/>
            <line x1="52" y1="54" x2="48" y2="66"/>
            <line x1="34" y1="62" x2="30" y2="74"/>
            <line x1="46" y1="62" x2="42" y2="74"/>
        </g>
    </svg>`,
    snowy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 42c-6 0-11-5-11-11 0-5.5 4-10 9.3-10.8C19.8 13.4 26.4 8 34.2 8c7.5 0 13.8 5 15.7 11.9 1.2-.1 2.5-.2 3.8-.2 8 0 14.6 6.5 14.6 14.6S61.7 48.8 53.7 48.8H20V42z" fill="#94A1B2"/>
        <g fill="#E5E7EB">
            <circle cx="26" cy="56" r="2.5"/>
            <circle cx="40" cy="60" r="2.5"/>
            <circle cx="54" cy="56" r="2.5"/>
            <circle cx="33" cy="68" r="2.5"/>
            <circle cx="47" cy="68" r="2.5"/>
        </g>
    </svg>`,
    thunder: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 42c-6 0-11-5-11-11 0-5.5 4-10 9.3-10.8C19.8 13.4 26.4 8 34.2 8c7.5 0 13.8 5 15.7 11.9 1.2-.1 2.5-.2 3.8-.2 8 0 14.6 6.5 14.6 14.6S61.7 48.8 53.7 48.8H20V42z" fill="#94A1B2"/>
        <polygon points="42,48 34,64 40,64 36,78 52,58 44,58 50,48" fill="#FBBF24"/>
    </svg>`
};

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatTimeRange(dateString) {
    const date = new Date(dateString);
    const hour = date.getHours();
    return `${String(hour).padStart(2, '0')}:00`;
}

function getWindDirection(degrees) {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

async function fetchWeather() {
    try {
        const response = await fetch(MET_API_URL, {
            headers: {
                'User-Agent': 'SmartHub-WH56/1.0 github.com/smarthub'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

function renderWeather(data) {
    const container = document.getElementById('weather');
    
    if (!data || !data.properties || !data.properties.timeseries) {
        container.innerHTML = '<div class="weather-loading">Kunne ikke laste værdata</div>';
        return;
    }

    const timeseries = data.properties.timeseries;
    const current = timeseries[0];
    const currentData = current.data.instant.details;
    const currentSymbol = current.data.next_1_hours?.summary?.symbol_code || 
                          current.data.next_6_hours?.summary?.symbol_code || 
                          'cloudy';

    // Get next 4 forecast periods (every 6 hours)
    const forecasts = [];
    const now = new Date();
    
    for (const entry of timeseries) {
        const entryTime = new Date(entry.time);
        const hoursDiff = (entryTime - now) / (1000 * 60 * 60);
        
        // Get entries at roughly 6-hour intervals
        if (hoursDiff >= 3 && entry.data.next_6_hours && forecasts.length < 4) {
            const lastForecast = forecasts[forecasts.length - 1];
            if (!lastForecast || (entryTime - new Date(lastForecast.time)) >= 5 * 60 * 60 * 1000) {
                forecasts.push(entry);
            }
        }
    }

    // Build HTML
    let html = `
        <div class="weather-current">
            <div class="weather-icon-wrapper">
                <img class="weather-icon" src="${getWeatherIconUrl(currentSymbol)}" alt="${getWeatherDescription(currentSymbol)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="weather-icon-fallback" style="display:none">${getFallbackIcon(currentSymbol)}</div>
            </div>
            <div class="weather-main">
                <div class="weather-temp">${Math.round(currentData.air_temperature)}°<span>C</span></div>
                <div class="weather-desc">${getWeatherDescription(currentSymbol)}</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <svg class="weather-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.05-6.95l-1.41 1.41m-9.19 9.19l-1.41 1.41m0-12.02l1.41 1.41m9.19 9.19l1.41 1.41"/>
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                    <span>Føles som <span class="weather-detail-value">${Math.round(currentData.air_temperature)}°</span></span>
                </div>
                <div class="weather-detail">
                    <svg class="weather-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                    </svg>
                    <span><span class="weather-detail-value">${currentData.wind_speed} m/s</span> ${getWindDirection(currentData.wind_from_direction)}</span>
                </div>
                <div class="weather-detail">
                    <svg class="weather-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                    <span><span class="weather-detail-value">${currentData.relative_humidity}%</span> fuktighet</span>
                </div>
            </div>
        </div>
        <div class="weather-forecast">
    `;

    for (const forecast of forecasts) {
        const fData = forecast.data.instant.details;
        const fSymbol = forecast.data.next_6_hours?.summary?.symbol_code || 
                        forecast.data.next_1_hours?.summary?.symbol_code || 
                        'cloudy';
        const fTime = new Date(forecast.time);
        const timeLabel = formatTimeRange(forecast.time);

        html += `
            <div class="forecast-item">
                <div class="forecast-time">${timeLabel}</div>
                <div class="forecast-icon-wrapper">
                    <img class="forecast-icon" src="${getWeatherIconUrl(fSymbol)}" alt="${getWeatherDescription(fSymbol)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="forecast-icon-fallback" style="display:none">${getFallbackIcon(fSymbol)}</div>
                </div>
                <div class="forecast-temp">${Math.round(fData.air_temperature)}°</div>
                <div class="forecast-wind">${fData.wind_speed} m/s</div>
            </div>
        `;
    }

    html += '</div>';

    container.innerHTML = html;

    // Apply weather theme to widget
    const widget = container.closest('.widget-weather');
    if (widget) {
        const theme = getWeatherTheme(currentSymbol);
        // Remove any existing theme classes
        widget.className = widget.className.replace(/weather-theme-\S+/g, '').trim();
        widget.classList.add(`weather-theme-${theme}`);

        // Add or replace decorative SVG
        let decor = widget.querySelector('.weather-theme-decor');
        if (!decor) {
            decor = document.createElement('div');
            decor.className = 'weather-theme-decor';
            widget.appendChild(decor);
        }
        decor.innerHTML = weatherThemeDecor[theme] || '';
    }
}

async function updateWeather() {
    const data = await fetchWeather();
    if (data) {
        renderWeather(data);
    }
}

// Initial load
updateWeather();

// Update weather every 30 minutes
setInterval(updateWeather, 30 * 60 * 1000);
