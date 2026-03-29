# Flight Radar Finland 🇫🇮

A premium, real-time flight tracking application built specifically for the Finland region. It uses the OpenSky Network API to fetch live aircraft positions and Leaflet for a high-performance, dark-themed map.

## 🚀 Experience the App

![Flight Radar UI](https://raw.githubusercontent.com/hinagullimran/Flight-Radar/main/assets/readme_preview.png)

### Key Features
- **Real-time Updates**: Data is refreshed every 15 seconds from the OpenSky Network.
- **Finland Specific**: The map is restricted to a bounding box covering the entire Finnish territory.
- **Glassmorphism UI**: A modern, translucent side panel displays detailed flight information on selection.
- **Live Flight Info**: View altitude, velocity (km/h), heading, origin country, and callsign for every active aircraft.
- **Premium Aesthetics**: Dark theme with "CartoDB Dark Matter" tiles and custom airplane markers with glow effects.

## 📁 Project Structure

```text
flight-radar-finland/
├── index.html     # Main structure & Leaflet initialization
├── style.css      # Custom styling & glassmorphism effects
├── app.js         # Core logic & API integration
└── README.md      # Project documentation
```

## 🛠️ How it Works

1. **Leaflet Map**: The app initializes a Leaflet map centered on `65.0, 26.0` (Finland) and applies a dark tile layer for a "radar" feel.
2. **OpenSky Data**: The `app.js` script makes requests to the OpenSky REST API using a custom bounding box for Finland.
3. **Marker Logic**: Each flight is assigned a marker. The orientation of the airplane icon is dynamically calculated based on the flight's "true_track" (heading).
4. **Info Selection**: Clicking a marker updates the side panel with specific flight data filtered from the API state vector.

## 🚦 Getting Started

To run the application locally:

1. Clone or download the repository: `git clone https://github.com/hinagullimran/Flight-Radar.git`
2. Open `index.html` in any modern browser.

> [!NOTE]
> The OpenSky Network API is community-driven. If you encounter rate-limiting errors, wait a few seconds as anonymous requests are limited to a certain number per hour.

---
*Created by Muhammad Musa*
