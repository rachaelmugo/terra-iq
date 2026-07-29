/* ==========================================================================
   🏢 TERRA-IQ - GIS INFRASTRUCTURE LAYERS MODULE (gis-layers.js)
   ========================================================================== */

let layerControl = null;

// Layer Groups
const hospitalsLayer = L.layerGroup();
const schoolsLayer = L.layerGroup();
const roadsLayer = L.layerGroup();

// Custom Marker Icons
const hospitalIcon = L.divIcon({
    className: 'gis-marker-hospital',
    html: `<div style="background:#EF4444;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏥</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const schoolIcon = L.divIcon({
    className: 'gis-marker-school',
    html: `<div style="background:#3B82F6;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏫</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

/**
 * Main Initialization for Infrastructure Layers
 */
async function initInfrastructureLayers(mapInstance) {
    if (!mapInstance) return;

    // 1. Basemap Layers (Standard vs Satellite)
    const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    });

    const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    const baseMaps = {
        "🗺️ Street Map": streetMap,
        "🛰️ Satellite": satelliteMap
    };

    // 2. Fetch and Load Infrastructure Data
    await loadHospitalsData();
    await loadSchoolsData();

    // 3. Define Overlay Layers for Toggle Control
    const overlays = {
        "🏥 Hospitals & Health": hospitalsLayer,
        "🏫 Schools & Education": schoolsLayer
    };

    // 4. Add Control to Map (Top Right)
    if (layerControl) {
        mapInstance.removeControl(layerControl);
    }

    layerControl = L.control.layers(baseMaps, overlays, { position: 'topright' }).addTo(mapInstance);
}

// Helper: Fetch & render Hospitals
async function loadHospitalsData() {
    try {
        const res = await fetch("data/hospitals.json");
        const data = await res.json();

        hospitalsLayer.clearLayers();
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.marker(latlng, { icon: hospitalIcon }),
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`<b>🏥 ${p.name}</b><br><small>${p.type || 'Facility'}</small>`);
            }
        }).addTo(hospitalsLayer);
    } catch (err) {
        console.warn("Hospitals layer not loaded:", err);
    }
}

// Helper: Fetch & render Schools
async function loadSchoolsData() {
    try {
        const res = await fetch("data/schools.json");
        const data = await res.json();

        schoolsLayer.clearLayers();
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.marker(latlng, { icon: schoolIcon }),
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`<b>🏫 ${p.name}</b><br><small>${p.type || 'School'}</small>`);
            }
        }).addTo(schoolsLayer);
    } catch (err) {
        console.warn("Schools layer not loaded:", err);
    }
}