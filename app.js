// Flight Radar Finland Logic
const FINLAND_BOUNDS = {
    lamin: 59.8,
    lomin: 19.1,
    lamax: 70.1,
    lomax: 31.6
};

// Initial state
let map;
let markers = {}; // Store markers by icao24
let flightData = [];
let refreshInterval;

// DOM Elements
const flightCountEl = document.getElementById('flight-count');
const lastUpdateEl = document.getElementById('last-update');
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

    // Refresh every 15 seconds (OpenSky limitations for anonymous users)
    refreshInterval = setInterval(fetchFlights, 15000);

    // Event Listeners
    closePanelBtn.onclick = () => infoPanelEl.classList.add('hidden');
}

// Fetch Flight Data from OpenSky
async function fetchFlights() {
    try {
        const url = `https://opensky-network.org/api/states/all?lamin=${FINLAND_BOUNDS.lamin}&lomin=${FINLAND_BOUNDS.lomin}&lamax=${FINLAND_BOUNDS.lamax}&lomax=${FINLAND_BOUNDS.lomax}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        updateMarkers(data.states || []);
        
        // Hide loading on first success
        loadingOverlay.classList.add('fade-out');
        
        // Update stats
        lastUpdateEl.innerText = new Date().toLocaleTimeString();
        flightCountEl.innerText = data.states ? data.states.length : 0;
        
    } catch (error) {
        console.error('Error fetching flight data:', error);
        // On error, still hide loading if it's visible but show status
        loadingOverlay.classList.add('fade-out');
    }
}

// Update Map Markers
function updateMarkers(states) {
    const currentIcaos = new Set();

    states.forEach(state => {
        const [
            icao24,
            callsign,
            origin_country,
            time_position,
            last_contact,
            longitude,
            latitude,
            baro_altitude,
            on_ground,
            velocity,
            true_track,
            vertical_rate,
            sensors,
            geo_altitude,
            squawk,
            spi,
            position_source
        ] = state;

        if (latitude && longitude) {
            currentIcaos.add(icao24);

            const position = [latitude, longitude];
            const heading = true_track || 0;

            if (markers[icao24]) {
                // Update position and icon rotation
                markers[icao24].setLatLng(position);
                markers[icao24].setIcon(createPlaneIcon(heading));
                // Update marker metadata
                markers[icao24].flightData = state;
            } else {
                // Create new marker
                const marker = L.marker(position, {
                    icon: createPlaneIcon(heading)
                }).addTo(map);

                marker.flightData = state;
                marker.on('click', () => showFlightDetails(state));
                
                markers[icao24] = marker;
            }
        }
    });

    // Remove markers for flights no longer in range
    Object.keys(markers).forEach(icao24 => {
        if (!currentIcaos.has(icao24)) {
            map.removeLayer(markers[icao24]);
            delete markers[icao24];
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
function showFlightDetails(state) {
    const [
        icao24,
        callsign,
        origin_country,
        ,, 
        longitude,
        latitude,
        baro_altitude,
        on_ground,
        velocity,
        true_track,
        vertical_rate,
        ,,
        geo_altitude
    ] = state;

    document.getElementById('flight-callsign').innerText = (callsign || 'N/A').trim();
    document.getElementById('flight-origin-dest').innerText = on_ground ? 'Status: Grounded' : 'Status: En-route';
    document.getElementById('flight-alt').innerText = baro_altitude ? `${Math.round(baro_altitude)} m` : '--';
    document.getElementById('flight-vel').innerText = velocity ? `${Math.round(velocity * 3.6)} km/h` : '--';
    document.getElementById('flight-heading').innerText = true_track ? `${Math.round(true_track)}°` : '--';
    document.getElementById('flight-country').innerText = origin_country || '--';
    document.getElementById('flight-icao').innerText = icao24.toUpperCase();

    infoPanelEl.classList.remove('hidden');
}

// Run init
document.addEventListener('DOMContentLoaded', init);
