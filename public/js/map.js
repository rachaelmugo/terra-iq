/* ==========================================================================
   🗺️ TERRA-IQ MAP MODULE (map.js)
   ========================================================================== */

/* =========================
   🛰️ BASEMAPS & MAP INIT
   ========================= */
const imagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles © Esri', maxNativeZoom: 19, maxZoom: 19 }
);

const labels = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Labels © Esri', maxNativeZoom: 19, maxZoom: 25 }
);

const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '© OpenStreetMap'
});

const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenTopoMap'
});

// Initialize Map centered on Kenya
const map = L.map("map", {
    center: [0.0236, 37.9062],
    zoom: 6,
    zoomControl: false
});

imagery.addTo(map);
labels.addTo(map); 

/* ======================================
   ⏳ HIDE MAP LOADER OVERLAY
====================================== */
imagery.once('load', () => {
    const loader = document.getElementById('mapLoader');
    if (loader) loader.classList.add('hidden');
});

setTimeout(() => {
    const loader = document.getElementById('mapLoader');
    if (loader) loader.classList.add('hidden');
}, 3500);

L.control.zoom({ position: 'bottomleft' }).addTo(map); 
setTimeout(() => { map.invalidateSize(); }, 250);

const basemapSelect = document.getElementById("basemapSelect");
if (basemapSelect) {
    basemapSelect.onchange = function() {
        const loader = document.getElementById('mapLoader');
        if (loader) loader.classList.remove('hidden');

        map.removeLayer(imagery);
        map.removeLayer(labels);
        map.removeLayer(streets);
        map.removeLayer(terrain);

        switch(this.value) {
            case "satellite":
            case "hybrid":
                imagery.addTo(map);
                labels.addTo(map);
                imagery.once('load', () => loader && loader.classList.add('hidden'));
                break;
            case "street":
                streets.addTo(map);
                streets.once('load', () => loader && loader.classList.add('hidden'));
                break;
            case "terrain":
                terrain.addTo(map);
                terrain.once('load', () => loader && loader.classList.add('hidden'));
                break;
        }
        setTimeout(() => { if (loader) loader.classList.add('hidden'); }, 3000);
    };
}

/* ======================================
   🏥 INFRASTRUCTURE LAYERS & ICONS
====================================== */
let layerControl = null;

const hospitalsLayer = L.layerGroup();
const schoolsLayer = L.layerGroup();
const roadsLayer = L.layerGroup();
const townsLayer = L.layerGroup();
const ketracoLayer = L.layerGroup();

// 🌐 Expose layers globally so ui.js can access them
window.hospitalsLayer = hospitalsLayer;
window.schoolsLayer = schoolsLayer;
window.roadsLayer = roadsLayer;
window.townsLayer = townsLayer;
window.ketracoLayer = ketracoLayer;

/**
 * Safely extracts GeoJSON features from Leaflet LayerGroup instances
 */
function getGeoJSONFromLayerGroup(layerGroup) {
    const features = [];
    if (!layerGroup || typeof layerGroup.eachLayer !== "function") {
        return turf.featureCollection([]);
    }
    
    layerGroup.eachLayer(layer => {
        if (typeof layer.toGeoJSON === "function") {
            const geoData = layer.toGeoJSON();
            if (geoData.type === "FeatureCollection") {
                features.push(...geoData.features);
            } else if (geoData.type === "Feature") {
                features.push(geoData);
            }
        }
    });
    return turf.featureCollection(features);
}

const hospitalIcon = L.divIcon({
    className: 'gis-marker-hospital',
    html: `<div style="background:#EF4444;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;border:2px solid #FFFFFF;">🏥</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const schoolIcon = L.divIcon({
    className: 'gis-marker-school',
    html: `<div style="background:#3B82F6;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;border:2px solid #FFFFFF;">🏫</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

async function initInfrastructureLayers() {
    if (layerControl) {
        try { map.removeControl(layerControl); } catch(e) {}
    }

    await Promise.all([
        loadHospitalsData(),
        loadSchoolsData(),
        loadRoadsData(),
        loadTownsData(),
        loadKetracoData()
    ]);

    // Clear any active infrastructure layers first
    map.removeLayer(hospitalsLayer);
    map.removeLayer(schoolsLayer);
    map.removeLayer(roadsLayer);
    map.removeLayer(ketracoLayer);

    // Add only checked layers based on HTML checkboxes:
    if (document.getElementById("chkTowns")?.checked) townsLayer.addTo(map);
    if (document.getElementById("roadsLayer")?.checked) roadsLayer.addTo(map);
    if (document.getElementById("schoolsLayer")?.checked) schoolsLayer.addTo(map);
    if (document.getElementById("hospitalsLayer")?.checked) hospitalsLayer.addTo(map);
    if (document.getElementById("ketracoLayer")?.checked) ketracoLayer.addTo(map);
}

async function loadHospitalsData() {
    try {
        const res = await fetch("data/hospitals.json");
        if (!res.ok) return;
        const data = await res.json();
        
        hospitalsLayer.clearLayers();
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const marker = L.marker(latlng, { icon: hospitalIcon });
                const name = feature.properties.name || "Hospital";
                // Set permanent: false so mobile screens don't get cluttered with text labels
                marker.bindTooltip("🏥 " + name, {
                    permanent: false,
                    direction: "right",
                    offset: [12, 0],
                    className: "facility-label hospital-label"
                });
                return marker;
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`
                    <div style="text-align: center; padding: 4px;">
                        <b style="font-size: 13px; color: #0F2D52;">🏥 ${p.name || 'Hospital'}</b><br>
                        <small style="color: #64748B;">${p.type || 'Healthcare Facility'}</small>
                    </div>
                `);
            }
        }).addTo(hospitalsLayer);
    } catch (err) {
        console.warn("Hospitals dataset issue:", err);
    }
}

async function loadSchoolsData() {
    try {
        const res = await fetch("data/schools.json");
        if (!res.ok) return;
        const data = await res.json();
        
        schoolsLayer.clearLayers();
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const marker = L.marker(latlng, { icon: schoolIcon });
                const name = feature.properties.name || "School";
                // Set permanent: false so mobile screens don't get cluttered with text labels
                marker.bindTooltip("🏫 " + name, {
                    permanent: false,
                    direction: "right",
                    offset: [12, 0],
                    className: "facility-label school-label"
                });
                return marker;
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`
                    <div style="text-align: center; padding: 4px;">
                        <b style="font-size: 13px; color: #0F2D52;">🏫 ${p.name || 'School'}</b><br>
                        <small style="color: #64748B;">${p.type || 'Educational Institution'}</small>
                    </div>
                `);
            }
        }).addTo(schoolsLayer);
    } catch (err) {
        console.warn("Schools dataset issue:", err);
    }
}

async function loadRoadsData() {
    try {
        const res = await fetch("data/roads.json");
        if (!res.ok) return;
        const data = await res.json();

        roadsLayer.clearLayers();
        L.geoJSON(data, {
            style: (feature) => {
                const p = feature.properties || {};
                const name = (p.name || "").toLowerCase();
                const ref = (p.ref || "").toUpperCase();
                const type = (p.type || p.highway || "").toLowerCase();

                const isMajorHighway = 
                    type.includes("motorway") || 
                    type.includes("trunk") || 
                    ref.startsWith("A") || 
                    name.includes("mombasa") || 
                    name.includes("nakuru") || 
                    name.includes("kisumu") || 
                    name.includes("highway") || 
                    name.includes("expressway") || 
                    name.includes("bypass");

                const isSubMajorRoad = 
                    type.includes("primary") || 
                    type.includes("secondary") || 
                    ref.startsWith("B") || 
                    ref.startsWith("C") || 
                    name.includes("road") || 
                    name.includes("way");

                if (isMajorHighway) {
                    return { color: "#DC2626", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" };
                } else if (isSubMajorRoad) {
                    return { color: "#2563EB", weight: 4, opacity: 0.85, lineCap: "round", lineJoin: "round" };
                } else {
                    return { color: "#64748B", weight: 2, opacity: 0.7, dashArray: "4, 4" };
                }
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties || {};
                const roadName = p.name || p.ref || 'Connecting Road';
                const roadType = p.type || p.highway || 'Transport Corridor';
                
                layer.bindTooltip(`🛣️ <b>${roadName}</b>`, {
                    permanent: false,
                    direction: "center",
                    className: "facility-label road-label"
                });

                layer.bindPopup(`
                    <div style="padding: 2px 4px; text-align: left;">
                        <b style="font-size:14px; color:#0F2D52;">🛣️ ${roadName}</b><br>
                        <small style="color:#64748B; text-transform:capitalize;">Classification: ${roadType}</small>
                    </div>
                `);
            }
        }).addTo(roadsLayer);

        console.log("Roads network layer updated successfully.");
    } catch (err) {
        console.warn("Roads dataset issue:", err);
    }
}

async function loadTownsData() {
    try {
        const res = await fetch("data/towns.json");
        if (!res.ok) return;
        const data = await res.json();
        
        townsLayer.clearLayers();

        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const name = feature.properties.name || "Town";
                const smallLocationIcon = L.divIcon({
                    className: 'gis-marker-small-town-pin',
                    html: `
                        <div style="position: relative; width: 20px; height: 20px; background: #EF4444; border: 2px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 50%;"></div>
                        </div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 20],
                    popupAnchor: [0, -20]
                });

                const marker = L.marker(latlng, { icon: smallLocationIcon });
                marker.bindTooltip(`<b>📍 ${name}</b>`, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -18],
                    className: 'town-hover-tooltip'
                });

                return marker;
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`
                    <div style="text-align:center; padding:4px;">
                        <b style="font-size:14px; color:#0F2D52;">📍 ${p.name}</b><br>
                        <small style="color:#64748B;">${p.type || 'Urban Center'}</small><br>
                        ${p.population ? `<span style="font-size:11px; color:#EF4444; font-weight:700;">Pop: ${Number(p.population).toLocaleString()}</span>` : ''}
                    </div>
                `);
            }
        }).addTo(townsLayer);
    } catch (err) {
        console.error("Towns dataset error:", err);
    }
}

async function loadKetracoData() {
    try {
        const res = await fetch("data/ketraco_powerlines.json");
        if (!res.ok) return;
        const data = await res.json();

        ketracoLayer.clearLayers();
        L.geoJSON(data, {
            style: {
                color: "#EAB308", // Yellow Line
                weight: 3,
                dashArray: "6, 6",
                opacity: 0.9
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties || {};
                layer.bindPopup(`⚡ <b>KETRACO Power Line</b><br><small>Voltage: ${p.voltage || '132kV/220kV'}</small>`);
            }
        }).addTo(ketracoLayer);
    } catch (err) {
        console.warn("KETRACO powerline dataset issue:", err);
    }
} 

/* ======================================
   📍 PROJECT PLACEMARKERS (ALL & SINGLE)
====================================== */
let projectMarkersGroup = L.layerGroup();
let singleMarkerGroup = L.layerGroup();

const projectIcon = L.divIcon({
    className: 'custom-project-pin',
    html: `
        <div style="position: relative; width: 36px; height: 36px; background: #0F2D52; border: 3px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; background: #D4A017; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

function drawProjectMarkers(projects) {
    if (typeof geoLayer !== "undefined" && geoLayer) map.removeLayer(geoLayer);
    if (typeof singleMarkerGroup !== "undefined" && singleMarkerGroup) singleMarkerGroup.clearLayers();
    projectMarkersGroup.clearLayers();

    if (!projects || projects.length === 0) return;

    const bounds = L.latLngBounds();

    projects.forEach(project => {
        const lat = parseFloat(project.latitude) || 1.3733; 
        const lng = parseFloat(project.longitude) || 32.2903;

        const marker = L.marker([lat, lng], { icon: projectIcon });

        // Show information popup on tap/click
        marker.bindPopup(`
            <div style="font-family: inherit; font-size: 13px; font-weight: 700; color: #0F2D52; text-align: center; padding: 4px;">
                ${project.project_name}
                <div style="margin-top: 6px;">
                    <button onclick="selectProjectFromMap('${project.id}')" style="background:#0F2D52; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">
                        View Project Parcels
                    </button>
                </div>
            </div>
        `);

        marker.bindTooltip(`
            <div style="font-family: inherit; font-size: 13px; font-weight: 700; color: #0F2D52; padding: 2px 4px;">
                ${project.project_name}
            </div>
        `, {
            permanent: false,
            direction: 'top',
            offset: [0, -34],
            className: 'project-hover-tooltip'
        });

        marker.on('click', () => {
            selectProjectFromMap(project.id);
        });

        projectMarkersGroup.addLayer(marker);
        bounds.extend([lat, lng]);
    });

    projectMarkersGroup.addTo(map);

    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
    }
}

function drawSingleProjectMarker(project) {
    if (typeof projectMarkersGroup !== "undefined" && projectMarkersGroup) {
        projectMarkersGroup.clearLayers();
    }
    if (typeof singleMarkerGroup !== "undefined" && singleMarkerGroup) {
        singleMarkerGroup.clearLayers();
    }

    if (!project) return;

    const lat = parseFloat(project.latitude);
    const lng = parseFloat(project.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng], { icon: projectIcon });

    marker.bindPopup(`
        <div style="font-size:13px; text-align:center; padding:4px;">
            <b style="color:#0F2D52;">${project.project_name}</b><br>
            <small style="color:#2563eb;">Selected Project</small>
        </div>
    `);

    marker.bindTooltip(`
        <div style="font-family: inherit; font-size: 12px; font-weight: 600; color: #0F2D52; padding: 2px 4px;">
            ${project.project_name}<br>
            <span style="color: #2563eb; font-weight: 500;">💡 Click to zoom to parcels</span>
        </div>
    `, {
        permanent: false,
        direction: 'top',
        offset: [0, -32],
        className: 'marker-hover-tooltip'
    });

    marker.on('click', () => {
        singleMarkerGroup.clearLayers();

        if (typeof geoLayer !== "undefined" && geoLayer && geoLayer.getBounds().isValid()) {
            map.flyToBounds(geoLayer.getBounds(), { padding: [50, 50], duration: 1.5 });
        } else {
            map.flyTo([lat, lng], 18, { duration: 1.2 });
        }
    });

    singleMarkerGroup.addLayer(marker);
    singleMarkerGroup.addTo(map);

    map.panTo([lat, lng]);
}

function selectProjectFromMap(projectId) {
    const select = document.getElementById("projectSelect");
    if (select) {
        select.value = projectId;
        select.dispatchEvent(new Event("change"));
    }

    // 📱 Open sidebar drawer and show overlay on mobile marker selection
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".mobile-overlay");
    
    if (sidebar) sidebar.classList.add("mobile-open");
    if (overlay) overlay.classList.remove("hidden");

    setTimeout(() => {
        if (typeof map !== "undefined" && map?.invalidateSize) map.invalidateSize();
    }, 300);
}

/* ==========================================================================
   🗺️ TURF.JS SPATIAL ANALYSIS & DYNAMIC PARCEL SCORING SYSTEM
   ========================================================================== */

function formatDistance(meters) {
    if (meters === null || isNaN(meters)) return "N/A";
    if (meters >= 1000) {
        return (meters / 1000).toFixed(2) + " km";
    }
    return Math.round(meters) + " m";
}

/**
 * Calculates dynamic spatial scores (Total: 100 Points)
 * - Accessibility & Road Network: 35 Points
 * - Infrastructure & Amenity Proximity: 25 Points
 * - Environmental & Wayleave Safety (Riparian/Power/Road Reserve): 40 Points
 */
function calculateComprehensiveScore(roadDist, amenityDist, riparianDist, kenhaDist, ketracoDist) {
    let riskFlags = [];
    let breakdown = {
        roadScore: 35,
        amenityScore: 25,
        safetyScore: 40
    };

    // --- 1. ROAD ACCESSIBILITY (Max 35 Points) ---
    if (roadDist !== null && !isNaN(roadDist)) {
        if (roadDist <= 200) breakdown.roadScore = 35;
        else if (roadDist <= 500) breakdown.roadScore = 30;
        else if (roadDist <= 1500) breakdown.roadScore = 22;
        else if (roadDist <= 5000) breakdown.roadScore = 12;
        else {
            breakdown.roadScore = 5;
            riskFlags.push(`Remote access (${formatDistance(roadDist)} from road network)`);
        }
    } else {
        breakdown.roadScore = 15; // Neutral baseline if unknown
    }

    // --- 2. AMENITIES PROXIMITY - Hospitals/Schools (Max 25 Points) ---
    if (amenityDist !== null && !isNaN(amenityDist)) {
        if (amenityDist <= 1000) breakdown.amenityScore = 25;
        else if (amenityDist <= 3000) breakdown.amenityScore = 20;
        else if (amenityDist <= 7000) breakdown.amenityScore = 12;
        else breakdown.amenityScore = 5;
    } else {
        breakdown.amenityScore = 10;
    }

    // --- 3. SAFETY & ENVIRONMENTAL BUFFER CHECKS (Max 40 Points) ---
    // A. Riparian Reserve Buffer (< 30m is high risk)
    if (riparianDist !== null && !isNaN(riparianDist) && riparianDist < 30) {
        breakdown.safetyScore -= 20;
        riskFlags.push(`Inside 30m Riparian Reserve (${formatDistance(riparianDist)})`);
    }

    // B. KeNHA Highway Reserve (< 15m dedicated encroachment)
    if (kenhaDist !== null && !isNaN(kenhaDist) && kenhaDist < 15) {
        breakdown.safetyScore -= 15;
        riskFlags.push(`Encroaching Major Road Reserve (${formatDistance(kenhaDist)})`);
    }

    // C. KETRACO / OSM Power Line Wayleave Corridor (< 20m)
    const powerLineDist = ketracoDist;
    if (powerLineDist !== null && !isNaN(powerLineDist) && powerLineDist < 20) {
        breakdown.safetyScore -= 20;
        riskFlags.push(`Inside High Voltage Wayleave Corridor (${formatDistance(powerLineDist)})`);
    }

    // Ensure safety score stays between 0 and 40
    breakdown.safetyScore = Math.max(0, Math.min(40, breakdown.safetyScore));

    // Compute Total Score
    const totalScore = breakdown.roadScore + breakdown.amenityScore + breakdown.safetyScore;

    // Star Rating based on road accessibility
    let stars = "★☆☆☆☆";
    if (breakdown.roadScore >= 30) stars = "★★★★★";
    else if (breakdown.roadScore >= 20) stars = "★★★★☆";
    else if (breakdown.roadScore >= 12) stars = "★★★☆☆";
    else if (breakdown.roadScore >= 5) stars = "★★☆☆☆";

    return {
        totalScore: Math.min(100, Math.max(0, totalScore)),
        breakdown,
        stars,
        status: totalScore >= 80 ? 'EXCELLENT' : totalScore >= 55 ? 'MODERATE' : 'HIGH RISK',
        colorClass: totalScore >= 80 ? '#16a34a' : totalScore >= 55 ? '#d97706' : '#dc2626',
        riskFlags
    };
} 

/**
 * Updates the HTML elements inside #parcelIntelligenceCard with the latest GIS spatial analysis results.
 */
function updateParcelIntelligenceCard(parcelData, roadDist, amenityDist, riparianDist, kenhaDist, ketracoDist) {
    // 1. Calculate the score and risk breakdown
    const analysis = calculateComprehensiveScore(roadDist, amenityDist, riparianDist, kenhaDist, ketracoDist);

    // 2. DOM Element Selectors
    const titleBox = document.getElementById("intelParcelTitle");
    const scoreBox = document.getElementById("intelScore");
    const statusBadge = document.getElementById("intelRiskBadge");
    const roadStarsEl = document.getElementById("roadAccessStars");
    const highwayDistLabel = document.getElementById("intelHighwayDist");
    const amenityDistLabel = document.getElementById("intelAmenityDist");
    const riparianDistLabel = document.getElementById("intelRiparianStatus");
    const powerDistLabel = document.getElementById("intelPowerStatus");
    const recommendationEl = document.getElementById("intelRecommendation");

    // Helper: Formats meters into clean human-readable text (e.g. 150m or 1.2 km)
    const formatDistance = (meters) => {
        if (meters === null || meters === undefined || isNaN(meters)) return "N/A";
        return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
    };

    // 3. Update Title & Badges
    if (titleBox && parcelData) {
        titleBox.textContent = `Plot #${parcelData.parcel_no || 'Selected'} Analysis`;
    }

    if (scoreBox) {
        scoreBox.textContent = `${analysis.totalScore} /100`;
        scoreBox.style.color = analysis.colorClass;
    }

    if (statusBadge) {
        statusBadge.textContent = analysis.status;
        statusBadge.style.backgroundColor = analysis.colorClass;
        statusBadge.style.color = "#ffffff";
        statusBadge.style.padding = "2px 8px";
        statusBadge.style.borderRadius = "4px";
        statusBadge.style.fontSize = "11px";
        statusBadge.style.fontWeight = "600";
    }

    if (roadStarsEl) {
        roadStarsEl.textContent = analysis.stars;
    }

    // 4. Update Metric Rows
    if (highwayDistLabel) {
        highwayDistLabel.innerHTML = `🛣️ Highway: <b>${formatDistance(roadDist)}</b> (${analysis.breakdown.roadScore}/35 pts)`;
    }

    if (amenityDistLabel) {
        amenityDistLabel.innerHTML = `🏥 Amenities: <b>${formatDistance(amenityDist)}</b> (${analysis.breakdown.amenityScore}/25 pts)`;
    }

    if (riparianDistLabel) {
        const riparianText = riparianDist !== null ? formatDistance(riparianDist) : "Clear (>30m)";
        riparianDistLabel.innerHTML = `🌊 Riparian: <b>${riparianText}</b>`;
    }

    if (powerDistLabel) {
        const powerText = ketracoDist !== null ? formatDistance(ketracoDist) : "Clear";
        powerDistLabel.innerHTML = `⚡ Power Line: <b>${powerText}</b>`;
    }

    // 5. Update Recommendation Banner & Risk Warning Flags
    if (recommendationEl) {
        if (analysis.riskFlags && analysis.riskFlags.length > 0) {
            recommendationEl.innerHTML = `<b>⚠️ Risk Flags:</b> ${analysis.riskFlags.join(' • ')}`;
            recommendationEl.style.borderLeft = "4px solid #ef4444";
            recommendationEl.style.backgroundColor = "#fef2f2";
            recommendationEl.style.color = "#991b1b";
            recommendationEl.style.padding = "8px 12px";
            recommendationEl.style.marginTop = "10px";
            recommendationEl.style.borderRadius = "4px";
            recommendationEl.style.fontSize = "12px";
        } else {
            recommendationEl.innerHTML = `<b>✅ Excellent Investment:</b> Optimal access to road networks and clear of riparian or high-voltage wayleaves.`;
            recommendationEl.style.borderLeft = "4px solid #16a34a";
            recommendationEl.style.backgroundColor = "#f0fdf4";
            recommendationEl.style.color = "#166534";
            recommendationEl.style.padding = "8px 12px";
            recommendationEl.style.marginTop = "10px";
            recommendationEl.style.borderRadius = "4px";
            recommendationEl.style.fontSize = "12px";
        }
    }
}

/* ==========================================================================
   🌐 DYNAMIC SPATIAL ANALYSIS (Live OpenStreetMap / Overpass Engine)
   ========================================================================== */
async function calculateSpatialMetrics(feature) {
    if (!feature || !feature.geometry) return {};

    const properties = feature.properties || {};
    const parcelCentroid = turf.centroid(feature);
    const [lng, lat] = parcelCentroid.geometry.coordinates;

    let roadDist = null;
    let amenityDist = null;
    let powerDist = null;

    try {
        // Query 5km radius around parcel centroid using Overpass 'around'
        const radius = 5000;
        const query = `
            [out:json][timeout:10];
            (
              way["highway"~"primary|secondary|tertiary|unclassified|residential|trunk"](around:${radius},${lat},${lng});
              way["power"="line"](around:${radius},${lat},${lng});
              node["amenity"~"school|hospital|clinic|marketplace|bank|pharmacy"](around:${radius},${lat},${lng});
              way["amenity"~"school|hospital|clinic|marketplace|bank|pharmacy"](around:${radius},${lat},${lng});
            );
            out body;
            >;
            out skel qt;
        `;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            
            const nodesMap = new Map();
            data.elements.forEach(el => {
                if (el.type === 'node') {
                    nodesMap.set(el.id, [el.lon, el.lat]);
                }
            });

            const roadLines = [];
            const powerLines = [];
            const amenityPoints = [];

            data.elements.forEach(el => {
                if (el.type === 'way' && el.nodes && el.nodes.length > 1) {
                    const coords = el.nodes.map(nodeId => nodesMap.get(nodeId)).filter(Boolean);
                    if (coords.length > 1) {
                        const line = turf.lineString(coords, el.tags || {});
                        if (el.tags && el.tags.highway) roadLines.push(line);
                        else if (el.tags && el.tags.power) powerLines.push(line);
                        else if (el.tags && el.tags.amenity) amenityPoints.push(turf.centroid(line));
                    }
                } else if (el.type === 'node' && el.tags && el.tags.amenity) {
                    amenityPoints.push(turf.point([el.lon, el.lat], el.tags));
                }
            });

            // 🛣️ Distance to nearest Road (meters)
            if (roadLines.length > 0) {
                const nearestRoad = turf.nearestPointOnLine(turf.featureCollection(roadLines), parcelCentroid);
                roadDist = Math.round(turf.distance(parcelCentroid, nearestRoad, { units: 'kilometers' }) * 1000);
            }

            // 🏥 Distance to nearest Amenity (meters)
            if (amenityPoints.length > 0) {
                const nearestAmenity = turf.nearestPoint(parcelCentroid, turf.featureCollection(amenityPoints));
                amenityDist = Math.round(turf.distance(parcelCentroid, nearestAmenity, { units: 'kilometers' }) * 1000);
            }

            // ⚡ Distance to nearest Power Line (meters)
            if (powerLines.length > 0) {
                const nearestPower = turf.nearestPointOnLine(turf.featureCollection(powerLines), parcelCentroid);
                powerDist = Math.round(turf.distance(parcelCentroid, nearestPower, { units: 'kilometers' }) * 1000);
            }
        }
    } catch (err) {
        console.warn("Live OSM Overpass query failed:", err);
    }

    // Fallbacks from Feature Properties if OSM API is empty/blocked
    if (roadDist === null) roadDist = properties.distance_to_road ?? properties.road_distance ?? null;
    if (amenityDist === null) amenityDist = properties.distance_to_amenities ?? properties.amenity_distance ?? null;
    if (powerDist === null) powerDist = properties.distance_to_power ?? properties.power_distance ?? null;

    return { roadDist, amenityDist, powerDist };
} 
/* =========================
   MAP PARCEL DRAWING LOGIC
   ========================= */
let geoLayer = null;
let hoverLayer = null;

function drawMap(features, shouldZoom = false) {
    if (typeof map !== "undefined" && map.invalidateSize) {
        map.invalidateSize();
    }

    if (typeof projectMarkersGroup !== "undefined" && projectMarkersGroup) {
        projectMarkersGroup.clearLayers();
    }

    if (geoLayer) geoLayer.remove();
    if (!features || features.length === 0) return;

    geoLayer = L.geoJSON(features, {
        style: function(feature) {
            const status = feature.properties.status ? feature.properties.status.toLowerCase() : "";
            let fillColor = "#22c55e";

            if (status.includes("sold")) fillColor = "#ef4444";
            else if (status.includes("reserved")) fillColor = "#facc15";

            const isSelected = window.selectedParcelId === feature.properties.parcel_no;

            return {
                color: isSelected ? "#00b7ff" : "#333333",
                weight: isSelected ? 5 : 2,
                opacity: 1,
                fillColor: fillColor,
                fillOpacity: isSelected ? 0.7 : 0.45
            };
        },

        onEachFeature: (feature, layer) => {
            layer.bindTooltip(String(feature.properties.parcel_no), {
                permanent: false,
                direction: 'center',
                className: 'parcel-label'
            });

            layer.on('mouseover', (e) => {
                const p = feature.properties;
                if (hoverLayer) map.removeLayer(hoverLayer);

                hoverLayer = L.popup({
                    closeButton: false,
                    offset: [0, -8],
                    className: "hover-popup",
                    autoPan: false
                })
                .setLatLng(e.latlng)
                .setContent(`
                    <div style="font-size:13px; font-weight:600; color:#111; line-height:1.4;">
                        <div style="font-size:12px; opacity:0.7;">Parcel</div>
                        <div style="font-size:15px; font-weight:700;">${p.parcel_no}</div>
                        <div style="margin-top:6px; font-size:11px;">${p.status}</div>
                        <div style="margin-top:4px; font-size:12px; color:#1d4ed8;">
                            KSh ${Number(p.price || 0).toLocaleString()}
                        </div>
                    </div>
                `)
                .openOn(map);
            });

            layer.on('mouseout', () => {
                if (hoverLayer) {
                    map.closePopup(hoverLayer);
                    hoverLayer = null;
                }
            });

            // 📍 PARCEL CLICK HANDLER
            layer.on('click', async () => {
                window.selectedParcelId = feature.properties.parcel_no;
                
                // 1. Render base sidebar UI immediately in Loading state
                if (typeof showDetails === "function") {
                    showDetails(feature.properties, null);
                }

                // 2. Extract Riparian Distance from feature properties
                const riparianDist = (feature.properties?.riparian_distance !== undefined && feature.properties?.riparian_distance !== null)
                    ? parseFloat(feature.properties.riparian_distance) 
                    : null;

                // 3. Perform Live OpenStreetMap Calculation
                let metrics = { roadDist: null, amenityDist: null, powerDist: null };
                try {
                    metrics = await calculateSpatialMetrics(feature);
                } catch (e) {
                    console.warn("Failed to calculate live OSM metrics:", e);
                }

                const roadDist = metrics.roadDist;
                const amenityDist = metrics.amenityDist;
                const ketracoDist = metrics.powerDist;
                const kenhaDist = roadDist; 

                // 4. Update UI Card with Real OSM Numbers & Comprehensive Score
                if (typeof updateParcelIntelligenceCard === "function") {
                    updateParcelIntelligenceCard(
                        feature.properties, 
                        roadDist, 
                        amenityDist, 
                        riparianDist, 
                        kenhaDist, 
                        ketracoDist
                    );
                }

                // 5. Highlight & Camera Fly
                if (geoLayer) {
                    geoLayer.resetStyle();
                    layer.setStyle({
                        color: "#00b7ff",
                        weight: 5,
                        fillOpacity: 0.7
                    });
                }
                
                if (layer.getBounds && layer.getBounds().isValid()) {
                    map.flyToBounds(layer.getBounds(), { duration: 0.8 });
                }

                // 📱 6. SLIDE UP MOBILE SHEET (Only runs on phones <= 768px)
                if (window.innerWidth <= 768 && typeof window.openMobileMenu === "function") {
                    window.openMobileMenu();
                }
            });
        }
    }).addTo(map);

    if (shouldZoom && geoLayer.getBounds().isValid()) {
        map.fitBounds(geoLayer.getBounds(), { padding: [50, 50] });
    }

    const zoom = map.getZoom();
    geoLayer.eachLayer(layer => {
        if (zoom >= 18) layer.openTooltip();
    });
}

map.on("zoomend", function () {
    const zoom = map.getZoom();

    if (geoLayer) {
        geoLayer.eachLayer(layer => {
            if (zoom >= 18) layer.openTooltip();
            else layer.closeTooltip();
        });
    }

    if (typeof singleMarkerGroup !== "undefined" && singleMarkerGroup) {
        if (zoom >= 16) {
            if (map.hasLayer(singleMarkerGroup)) map.removeLayer(singleMarkerGroup);
        } else {
            if (!map.hasLayer(singleMarkerGroup) && singleMarkerGroup.getLayers().length > 0) {
                map.addLayer(singleMarkerGroup);
            }
        }
    }
});

/* ======================================
   🏠 HOME BUTTON & DISCARD OVERLAYS
====================================== */
function handleHomeClick() {
    discardAllOverlays();

    const projectSelect = document.getElementById("projectSelect");
    if (projectSelect) {
        projectSelect.value = "all";
        projectSelect.dispatchEvent(new Event("change"));
    } else if (typeof loadAllProjects === "function") {
        loadAllProjects();
    }
}

/* ======================================
   📍 LOCATE ME
====================================== */
let userLocationMarker = null;
let userAccuracyCircle = null;

function handleLocateMe() {
    if (userLocationMarker || userAccuracyCircle) {
        discardLocationOverlay();
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            discardLocationOverlay();

            userAccuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.1,
                weight: 1
            }).addTo(map);

            const redLocationIcon = L.divIcon({
                className: 'red-user-pin',
                html: `
                    <div style="position: relative; width: 30px; height: 30px; background: #ef4444; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center;">
                        <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
                    </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });

            userLocationMarker = L.marker([lat, lng], { icon: redLocationIcon })
                .bindPopup("<b style='color:#ef4444;'>📍 Your Location</b><br>Accuracy: " + Math.round(accuracy) + " m")
                .addTo(map);

            map.flyTo([lat, lng], 16, { duration: 1.5 });
        },
        (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to retrieve location.");
        },
        { enableHighAccuracy: true }
    );
}

function discardLocationOverlay() {
    if (userLocationMarker) map.removeLayer(userLocationMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
    userLocationMarker = null;
    userAccuracyCircle = null;
}

/* ======================================
   📏 DUAL MEASUREMENT TOOLS
====================================== */
let activeTool = null;
let measurePath = [];
let measurePolyline = null;
let measurePolygon = null;
let measureMarkers = [];
let measurePopup = null;

function calculatePolygonArea(latlngs) {
    if (latlngs.length < 3) return 0;
    let area = 0;
    const RADIUS = 6378137;

    for (let i = 0; i < latlngs.length; i++) {
        const p1 = latlngs[i];
        const p2 = latlngs[(i + 1) % latlngs.length];

        const radLat1 = (p1.lat * Math.PI) / 180;
        const radLat2 = (p2.lat * Math.PI) / 180;
        const radLng1 = (p1.lng * Math.PI) / 180;
        const radLng2 = (p2.lng * Math.PI) / 180;

        area += (radLng2 - radLng1) * (2 + Math.sin(radLat1) + Math.sin(radLat2));
    }

    area = (area * RADIUS * RADIUS) / 2;
    return Math.abs(area);
}

function toggleDistanceTool() {
    if (activeTool === 'distance') {
        stopMeasurement();
        clearMeasurementLayers();
        return;
    }
    startMeasurement('distance');
}

function toggleAreaTool() {
    if (activeTool === 'area') {
        stopMeasurement();
        clearMeasurementLayers();
        return;
    }
    startMeasurement('area');
}

function startMeasurement(toolType) {
    clearMeasurementLayers();
    activeTool = toolType;

    const distBtn = document.getElementById("measureBtn") || document.getElementById("measureDistanceBtn");
    const areaBtn = document.getElementById("measureAreaBtn");

    if (distBtn) {
        distBtn.style.background = toolType === 'distance' ? "#0F2D52" : "white";
        distBtn.style.color = toolType === 'distance' ? "#ffffff" : "#0F2D52";
    }
    if (areaBtn) {
        areaBtn.style.background = toolType === 'area' ? "#0F2D52" : "white";
        areaBtn.style.color = toolType === 'area' ? "#ffffff" : "#0F2D52";
    }

    map.getContainer().style.cursor = "crosshair";
    map.doubleClickZoom.disable();
}

function clearMeasurementLayers() {
    if (measurePolyline) {
        map.removeLayer(measurePolyline);
        measurePolyline = null;
    }
    if (measurePolygon) {
        map.removeLayer(measurePolygon);
        measurePolygon = null;
    }

    measureMarkers.forEach(marker => map.removeLayer(marker));
    measureMarkers = [];

    if (measurePopup) {
        map.removeLayer(measurePopup);
        measurePopup = null;
    }

    measurePath = [];
}

function stopMeasurement() {
    activeTool = null;

    const distBtn = document.getElementById("measureBtn") || document.getElementById("measureDistanceBtn");
    const areaBtn = document.getElementById("measureAreaBtn");

    if (distBtn) {
        distBtn.style.background = "white";
        distBtn.style.color = "#0F2D52";
    }
    if (areaBtn) {
        areaBtn.style.background = "white";
        areaBtn.style.color = "#0F2D52";
    }

    if (map) {
        map.getContainer().style.cursor = "";
        map.doubleClickZoom.enable();
    }
}

function discardAllOverlays() {
    discardLocationOverlay();
    clearMeasurementLayers();
    stopMeasurement();
}

map.on("click", function (e) {
    if (typeof layerControl !== 'undefined' && layerControl && layerControl.collapse) {
        layerControl.collapse();
    }

    if (!activeTool) return;

    measurePath.push(e.latlng);

    const pointMarker = L.circleMarker(e.latlng, {
        radius: 5,
        color: "#0F2D52",
        fillColor: "#FFFFFF",
        fillOpacity: 1,
        weight: 2
    }).addTo(map);
    measureMarkers.push(pointMarker);

    let popupHTML = "";

    if (activeTool === 'distance') {
        if (measurePath.length >= 2) {
            if (!measurePolyline) {
                measurePolyline = L.polyline(measurePath, {
                    color: "#2563eb",
                    weight: 4,
                    dashArray: "6,6"
                }).addTo(map);
            } else {
                measurePolyline.setLatLngs(measurePath);
            }
        }

        let totalDistance = 0;
        for (let i = 0; i < measurePath.length - 1; i++) {
            totalDistance += measurePath[i].distanceTo(measurePath[i + 1]);
        }

        const displayDistance = totalDistance >= 1000 
            ? (totalDistance / 1000).toFixed(2) + " km" 
            : totalDistance.toFixed(1) + " m";

        popupHTML = `
            <div style="font-size:11px; color:#64748B; font-weight:600;">📏 Distance</div>
            <div style="font-size:16px; color:#0F2D52; font-weight:bold; margin-top:2px;">
                ${displayDistance}
            </div>
            <div style="font-size:10px; color:#94A3B8; margin-top:2px;">Points: ${measurePath.length}</div>
        `;

    } else if (activeTool === 'area') {
        if (measurePath.length === 2) {
            if (!measurePolyline) {
                measurePolyline = L.polyline(measurePath, {
                    color: "#0F2D52",
                    weight: 3,
                    dashArray: "6,6"
                }).addTo(map);
            } else {
                measurePolyline.setLatLngs(measurePath);
            }
        } else if (measurePath.length >= 3) {
            if (measurePolyline) {
                map.removeLayer(measurePolyline);
                measurePolyline = null;
            }

            if (!measurePolygon) {
                measurePolygon = L.polygon(measurePath, {
                    color: "#0F2D52",
                    weight: 3,
                    dashArray: "6,6",
                    fillColor: "#2563eb",
                    fillOpacity: 0.25
                }).addTo(map);
            } else {
                measurePolygon.setLatLngs(measurePath);
            }
        }

        let totalPerimeter = 0;
        for (let i = 0; i < measurePath.length - 1; i++) {
            totalPerimeter += measurePath[i].distanceTo(measurePath[i + 1]);
        }
        if (measurePath.length >= 3) {
            totalPerimeter += measurePath[measurePath.length - 1].distanceTo(measurePath[0]);
        }

        const displayPerimeter = totalPerimeter >= 1000 
            ? (totalPerimeter / 1000).toFixed(2) + " km" 
            : totalPerimeter.toFixed(1) + " m";

        let areaDisplay = "Click 3+ points for Area";
        if (measurePath.length >= 3) {
            const areaSqM = calculatePolygonArea(measurePath);
            areaDisplay = areaSqM >= 10000 
                ? (areaSqM / 10000).toFixed(2) + " ha" 
                : areaSqM.toFixed(1) + " m²";
        }

        popupHTML = `
            <div style="font-size:11px; color:#64748B; font-weight:600;">📐 Area</div>
            <div style="font-size:15px; color:#2563eb; font-weight:bold; margin-top:2px;">${areaDisplay}</div>
            <div style="font-size:11px; color:#64748B; font-weight:600; margin-top:4px;">🔄 Perimeter</div>
            <div style="font-size:13px; color:#0F2D52; font-weight:bold;">${displayPerimeter}</div>
        `;
    }

    const popupContent = document.createElement("div");
    popupContent.style.textAlign = "center";
    popupContent.style.padding = "4px 6px";
    popupContent.style.fontFamily = "inherit";

    popupContent.innerHTML = `
        ${popupHTML}
        <div style="margin-top:8px; display:flex; gap:6px; justify-content:center;">
            <button id="finishMeasureBtn" style="background: #10B981; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Done ✔</button>
            <button id="resetMeasureBtn" style="background: #EF4444; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Reset 🗑️</button>
        </div>
    `;

    const finishBtn = popupContent.querySelector("#finishMeasureBtn");
    const resetBtn = popupContent.querySelector("#resetMeasureBtn");

    if (finishBtn) {
        finishBtn.onclick = function (event) {
            event.stopPropagation();
            stopMeasurement();
            if (measurePopup) map.closePopup(measurePopup);
        };
    }

    if (resetBtn) {
        resetBtn.onclick = function (event) {
            event.stopPropagation();
            clearMeasurementLayers();
            stopMeasurement();
        };
    }

    if (measurePopup) map.removeLayer(measurePopup);

    measurePopup = L.popup({ closeButton: false, offset: [0, -10] })
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
});

map.on("dblclick contextmenu", function (e) {
    if (activeTool) {
        L.DomEvent.stopPropagation(e);
        stopMeasurement();
        clearMeasurementLayers();
    }
});

/* ======================================
   🖱️ MOUSE MOVE COORDINATES
====================================== */
map.on("mousemove", function(e) {
    const coordsEl = document.getElementById("coords");
    if (coordsEl) {
        coordsEl.innerHTML = `Lat: ${e.latlng.lat.toFixed(6)} | Lng: ${e.latlng.lng.toFixed(6)} | Zoom: ${map.getZoom()}`;
    }
});

/* ======================================
   🔗 INITIALIZE TOOLBAR & LAYERS
====================================== */
document.addEventListener("DOMContentLoaded", () => {
    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn) homeBtn.onclick = handleHomeClick;

    const locateBtn = document.getElementById("locateBtn");
    if (locateBtn) locateBtn.onclick = handleLocateMe;

    const measureDistBtn = document.getElementById("measureBtn") || document.getElementById("measureDistanceBtn");
    if (measureDistBtn) measureDistBtn.onclick = toggleDistanceTool;

    const measureAreaBtn = document.getElementById("measureAreaBtn");
    if (measureAreaBtn) measureAreaBtn.onclick = toggleAreaTool;

    const printBtn = document.getElementById("printBtn");
    if (printBtn) {
        printBtn.onclick = function () {
            window.print();
        };
    }

    // --- 🗺️ LAYER MANAGER MODAL CONTROLS ---
    const layersBtn = document.getElementById("layersBtn");
    const closeLayersBtn = document.getElementById("closeLayersBtn");
    const layerPanel = document.getElementById("layerPanel");

    if (layersBtn) {
        layersBtn.title = "Layers Manager";
        layersBtn.setAttribute("aria-label", "Layers Manager");

        layersBtn.onclick = function() {
            if (layerPanel) {
                layerPanel.classList.toggle("hidden");
            }
        };
    }

    if (closeLayersBtn && layerPanel) {
        closeLayersBtn.onclick = function() {
            layerPanel.classList.add("hidden");
        };
    }

// =========================================================
    // 📱 FIXED MOBILE MENU DRAWER LOGIC
    // =========================================================
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const closeMobileSidebarBtn = document.getElementById("closeMobileSidebar");
    const sidebar = document.getElementById("sidebar");

    // Create backdrop overlay safely
    let overlay = document.querySelector(".mobile-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "mobile-overlay hidden";
        document.body.appendChild(overlay);
    }

    // Attach to window so js/map.js can trigger it on parcel click
    window.openMobileMenu = function(e) {
        if (e) e.stopPropagation();
        if (sidebar) sidebar.classList.add("mobile-open");
        if (overlay) overlay.classList.remove("hidden");
        
        setTimeout(() => {
            if (typeof map !== "undefined" && map?.invalidateSize) map.invalidateSize();
        }, 300);
    };

    window.closeMobileMenu = function(e) {
        if (e) e.stopPropagation();
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (overlay) overlay.classList.add("hidden");

        setTimeout(() => {
            if (typeof map !== "undefined" && map?.invalidateSize) map.invalidateSize();
        }, 300);
    };

    // 1. Tapping the hamburger button opens the menu
    if (mobileMenuBtn) {
        mobileMenuBtn.onclick = window.openMobileMenu;
    }

    // 2. Tapping the 'X' button closes the menu
    if (closeMobileSidebarBtn) {
        closeMobileSidebarBtn.onclick = window.closeMobileMenu;
    }

    // 3. Tapping outside on the overlay backdrop closes the menu
    overlay.onclick = window.closeMobileMenu;

    // 4. Handle clicks inside the sidebar smartly
    if (sidebar) {
        sidebar.addEventListener("click", (e) => {
            // Close drawer if clicking on close button or parcel list item
            if (e.target.closest("#closeMobileSidebar") || e.target.closest("#list .item")) {
                window.closeMobileMenu(e);
            } else {
                e.stopPropagation(); // Keep drawer open when interacting inside
            }
        });
    }

    // --- INITIALIZATION ---
    if (typeof initInfrastructureLayers === "function") {
        initInfrastructureLayers();
    }

    // Checkbox Toggles Setup
    const setupLayerToggle = (elementId, layer) => {
        const checkbox = document.getElementById(elementId);
        if (checkbox) {
            checkbox.onchange = function() {
                if (this.checked) {
                    layer.addTo(map);
                } else {
                    map.removeLayer(layer);
                }
            };
        }
    }; 
    
    setupLayerToggle("roadsLayer", roadsLayer);
    setupLayerToggle("schoolsLayer", schoolsLayer);
    setupLayerToggle("hospitalsLayer", hospitalsLayer);
    setupLayerToggle("ketracoLayer", ketracoLayer);
    setupLayerToggle("imageryLayer", imagery);
    setupLayerToggle("labelsLayer", labels);
    setupLayerToggle("chkTowns", townsLayer);
});