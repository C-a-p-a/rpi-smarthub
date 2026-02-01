document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('departures');

    // Sørgående destinasjoner (bort fra sentrum) - disse filtreres BORT
    const SOUTHBOUND_DESTINATIONS = [
        'vadmyra',
        'fyllingsdalen',
        'løvstakk',
        'hesjaholtet',
        'skogsskiftet',
        'sletten',
        'fana',
        'nesttun',
        'birkelund',
        'støbotn',
        'laksevåg',
        'loddefjord',
        'storavatnet',
        'mathopen',
        'alvøen',
        'bønes',
        'olsvik',
        'søndre skogveien',
        'ravnanger terminal',
        'barliveien',
        'ågotnes terminal',
        'lyngbø',
        'wergeland',
        'straume terminal',
        'anglevik',
        'birkelandsskiftet',
        'hjelteryggen',
        'steinrusten',
        'brattholmen'

    ];

    function isNorthbound(destination) {
        const dest = destination.toLowerCase();
        // Returner true hvis destinasjonen IKKE matcher noen sørgående
        return !SOUTHBOUND_DESTINATIONS.some(south => dest.includes(south));
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function getMinutesUntil(isoString) {
        const now = new Date();
        const departure = new Date(isoString);
        const diffMs = departure - now;
        const diffMin = Math.round(diffMs / 60000);
        return diffMin;
    }

    function formatMinutes(min) {
        if (min <= 0) return 'nå';
        if (min === 1) return '1 min';
        return `${min} min`;
    }

    async function fetchDepartures() {
        try {
            const res = await fetch('http://localhost:5000/departures');
            const data = await res.json();

            container.innerHTML = '';

            if (data.error) {
                container.innerHTML = `
                    <div class="error-state error-danger">
                        <span class="error-state-icon">⚠️</span>
                        <span class="error-state-message">Kunne ikke hente avganger</span>
                        <span class="error-state-hint">Sjekk nettverkstilkobling</span>
                    </div>`;
                return;
            }

            const stopPlace = data.data?.stopPlace;
            if (!stopPlace) {
                container.innerHTML = `
                    <div class="error-state error-warning">
                        <span class="error-state-icon">📡</span>
                        <span class="error-state-message">Ingen data fra Entur</span>
                        <span class="error-state-hint">Prøver igjen snart...</span>
                    </div>`;
                return;
            }

            const departures = stopPlace.estimatedCalls || [];

            if (departures.length === 0) {
                container.innerHTML = `
                    <div class="error-state">
                        <span class="error-state-icon">🚌</span>
                        <span class="error-state-message">Ingen avganger funnet</span>
                    </div>`;
                return;
            }

            // Filter for northbound departures only
            const northboundDepartures = departures.filter(dep => {
                const dest = dep.destinationDisplay?.frontText || '';
                return isNorthbound(dest);
            });

            if (northboundDepartures.length === 0) {
                container.innerHTML = `
                    <div class="error-state">
                        <span class="error-state-icon">🚌</span>
                        <span class="error-state-message">Ingen avganger mot sentrum</span>
                    </div>`;
                return;
            }

            let count = 0;
            for (const dep of northboundDepartures) {
                if (count >= 6) break;

                const line = dep.serviceJourney?.line?.publicCode || '?';
                const dest = dep.destinationDisplay?.frontText || 'Ukjent';
                const time = dep.expectedDepartureTime || dep.aimedDepartureTime;
                const minutesUntil = getMinutesUntil(time);

                // Skip departures with 2 min or less (not enough time to reach stop)
                if (minutesUntil <= 2) continue;

                // Determine time urgency class
                let timeClass = 'departure-time';
                if (minutesUntil <= 5) {
                    timeClass += ' time-soon';
                }

                const item = document.createElement('div');
                item.className = 'departure-item';
                item.innerHTML = `
                    <span class="departure-line">${line}</span>
                    <span class="departure-dest">${dest}</span>
                    <span class="${timeClass}">${formatMinutes(minutesUntil)}</span>
                `;
                container.appendChild(item);
                count++;
            }

            if (count === 0) {
                container.innerHTML = `
                    <div class="error-state">
                        <span class="error-state-icon">⏰</span>
                        <span class="error-state-message">Ingen avganger snart</span>
                        <span class="error-state-hint">Neste avgang om en stund</span>
                    </div>`;
            }

        } catch (err) {
            console.error('Kunne ikke hente avganger:', err);
            container.innerHTML = `
                <div class="error-state error-danger">
                    <span class="error-state-icon">❌</span>
                    <span class="error-state-message">Tilkoblingsfeil</span>
                    <span class="error-state-hint">Prøver igjen om 30 sek</span>
                </div>`;
        }
    }

    fetchDepartures();
    setInterval(fetchDepartures, 30000); // Oppdater hvert 30. sekund
});
