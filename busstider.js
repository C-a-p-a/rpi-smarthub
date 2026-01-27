document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('departures');
	
	async function fetchDepartures() {
		try{
			const res = await fetch('http://localhost:5000/departures');
			const data = await res.json();
			
			container.innerHTML = "";
			
			if(data.error){
				container.innerHTML = "Feil ved henting av avganger";
				return;
			}
			
			const departures = data.data[0]?.serviceJourneys || [];
			
			departures.slice(0,5).forEach(dep => {
				const line = dep.publicCode || "";
				const dest = dep.destinationDisplayFrontText || "";
				const time = dep.aimedDepartureTime || "";
				container.innerHTML += `<div>${time} - ${line} mot {dest}</div>`;
			});
			
			if(departures.length === 0){
				container.innerHTML = "Ingen avganger funnet";
			}
			
		} catch (err) {
			console.error("kunne ikke hente avganger", err);
			container.innerHTML = "kunne ikke hente avganger";
		}
	}
	
	fetchDepartures();
	setInterval(fetchDepartures, 60000);
			
});
