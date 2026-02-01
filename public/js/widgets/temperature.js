// Raspberry Pi CPU temperature display
const TEMP_API_URL = 'http://localhost:5000/temperature';

async function fetchTemperature() {
    try {
        const response = await fetch(TEMP_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching temperature:', error);
        return null;
    }
}

function renderTemperature(data) {
    const tempElement = document.getElementById('cpu-temp');

    if (!tempElement) {
        return;
    }

    if (!data || data.error) {
        tempElement.textContent = '--°C';
        return;
    }

    const temp = data.temperature;
    const unit = data.unit || 'C';

    tempElement.textContent = `${temp}°${unit}`;

    // Optional: Add color coding based on temperature
    if (temp >= 70) {
        tempElement.style.color = '#ef4444'; // Red for hot
    } else if (temp >= 60) {
        tempElement.style.color = '#f59e0b'; // Orange for warm
    } else {
        tempElement.style.color = '#10b981'; // Green for normal
    }
}

async function updateTemperature() {
    const data = await fetchTemperature();
    if (data) {
        renderTemperature(data);
    }
}

// Initial load
updateTemperature();

// Update temperature every 30 seconds
setInterval(updateTemperature, 30 * 1000);
