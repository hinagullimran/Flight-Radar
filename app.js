// Flight Radar Finland Logic
const FINLAND_BOUNDS = {
    lamin: 59.5,
    lomin: 19.5,
    lamax: 70.1,
    lomax: 31.5
};

// Initial state
let map;
let markers = {}; // Store markers by icao24
let flightData = [];
let refreshInterval;
let countdownInterval;
let timeLeft = 30;

// DOM Elements
const flightCountEl = document.getElementById('flight-count');
const lastUpdateEl = document.getElementById('last-update');
const countdownEl = document.getElementById('countdown');
const infoPanelEl = document.getElementById('info-panel');
const closePanelBtn = document.getElementById('close-panel');
const loadingOverlay = document.getElementById('loading-overlay');

// Map Icons
const planeSvg = (heading = 0) => `
    <div style="transform: rotate(${heading}deg);">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#38bdf8" xmlns="http://www.w3.org/2000/svg">
            <path d="M21,16L21,14L13,9L13,3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5L10,9L2,14L2,16L10,13.5L10,19L8,20.5L8,22L11.5,21L15,22L15,20.5L13,19L13,13.5L21,16Z" />
        </svg>
    </div>
`;

// Initialize App
function init() {
    console.log("Initializing FlightRadar Finland...");
    
    // Initialize Leaflet Map
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([65.0, 26.0], 5); // Center on Finland

    // Add Dark Matter Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add custom attribution
    L.control.attribution({
        position: 'bottomleft'
    }).addAttribution('OpenSky Network | Antigravity AI').addTo(map);

    // Initial Data Fetch
    fetchFlights();

    // Refresh every 30 seconds
    refreshInterval = setInterval(() => {
        fetchFlights();
        resetCountdown();
    }, 30000);

    // Initial countdown start
    startCountdown();

    // Event Listeners
    closePanelBtn.onclick = () => infoPanelEl.classList.add('hidden');
}

// Fetch Flight Data from adsb.fi (Community API)
async function fetchFlights() {
    try {
        // adsb.fi provides a global v2/all endpoint; we filter locally for Finland
        const url = `https://api.adsb.fi/v2/all`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        const finlandFlights = (data.aircraft || []).filter(ac => 
            ac.lat >= FINLAND_BOUNDS.lamin && 
            ac.lat <= FINLAND_BOUNDS.lamax && 
            ac.lon >= FINLAND_BOUNDS.lomin && 
            ac.lon <= FINLAND_BOUNDS.lomax
        );

        updateMarkers(finlandFlights);
        
        // Hide loading on first success
        loadingOverlay.classList.add('fade-out');
        
        // Update stats
        lastUpdateEl.innerText = new Date().toLocaleTimeString();
        flightCountEl.innerText = finlandFlights.length;
        
    } catch (error) {
        console.error('Error fetching flight data:', error);
        loadingOverlay.classList.add('fade-out');
    }
}

// Update Map Markers
function updateMarkers(aircrafts) {
    const currentHexes = new Set();

    aircrafts.forEach(ac => {
        const {
            hex,
            flight,
            lat,
            lon,
            alt_baro,
            gs,
            track,
            category
        } = ac;

        if (lat && lon) {
            currentHexes.add(hex);

            const position = [lat, lon];
            const heading = track || 0;

            if (markers[hex]) {
                // Update position and icon rotation
                markers[hex].setLatLng(position);
                markers[hex].setIcon(createPlaneIcon(heading));
                // Update marker metadata
                markers[hex].flightData = ac;
            } else {
                // Create new marker
                const marker = L.marker(position, {
                    icon: createPlaneIcon(heading)
                }).addTo(map);

                marker.flightData = ac;
                marker.on('click', () => showFlightDetails(ac));
                
                markers[hex] = marker;
            }
        }
    });

    // Remove markers for flights no longer in range
    Object.keys(markers).forEach(hex => {
        if (!currentHexes.has(hex)) {
            map.removeLayer(markers[hex]);
            delete markers[hex];
        }
    });
}

// Create Leaflet DivIcon with rotated SVG
function createPlaneIcon(heading) {
    return L.divIcon({
        html: planeSvg(heading),
        className: 'plane-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

// Display Details in Info Panel
function showFlightDetails(ac) {
    const {
        hex,
        flight,
        alt_baro,
        gs,
        track,
        desc,
        category,
        r // registration often available in r or reg
    } = ac;

    document.getElementById('flight-callsign').innerText = (flight || 'N/A').trim();
    document.getElementById('flight-origin-dest').innerText = desc ? `Type: ${desc}` : 'Status: En-route';
    document.getElementById('flight-alt').innerText = alt_baro ? `${Math.round(alt_baro / 3.28084)} m` : '--'; // adsb.fi is usually feet
    document.getElementById('flight-vel').innerText = gs ? `${Math.round(gs * 1.852)} km/h` : '--'; // adsb.fi is usually knots
    document.getElementById('flight-heading').innerText = track ? `${Math.round(track)}°` : '--';
    document.getElementById('flight-country').innerText = category || 'Unknown';
    document.getElementById('flight-icao').innerText = (hex || '').toUpperCase();

    infoPanelEl.classList.remove('hidden');
}


// Countdown Logic
function startCountdown() {
    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 30;
        countdownEl.innerText = `${timeLeft}s`;
    }, 1000);
}

function resetCountdown() {
    timeLeft = 30;
    countdownEl.innerText = `${timeLeft}s`;
}

// Run init
document.addEventListener('DOMContentLoaded', init);
