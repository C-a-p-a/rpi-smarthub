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
        'birkelandsskiftet'

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
                container.innerHTML = '<div class="departure-error">Feil ved henting av avganger</div>';
                return;
            }

            const stopPlace = data.data?.stopPlace;
            if (!stopPlace) {
                container.innerHTML = '<div class="departure-error">Ingen data fra stoppested</div>';
                return;
            }

            const departures = stopPlace.estimatedCalls || [];

            if (departures.length === 0) {
                container.innerHTML = '<div class="departure-error">Ingen avganger funnet</div>';
                return;
            }

            // Filter for northbound departures only
            const northboundDepartures = departures.filter(dep => {
                const dest = dep.destinationDisplay?.frontText || '';
                return isNorthbound(dest);
            });

            if (northboundDepartures.length === 0) {
                container.innerHTML = '<div class="departure-error">Ingen nordgående avganger funnet</div>';
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
                container.innerHTML = '<div class="departure-error">Ingen avganger de neste minuttene</div>';
            }

        } catch (err) {
            console.error('Kunne ikke hente avganger:', err);
            container.innerHTML = '<div class="departure-error">Kunne ikke hente avganger</div>';
        }
    }

    fetchDepartures();
    setInterval(fetchDepartures, 30000); // Oppdater hvert 30. sekund
});
