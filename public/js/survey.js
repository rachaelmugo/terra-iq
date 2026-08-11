/* ==========================================================================
   🏢 TERRA-IQ - ADVANCED SURVEY & CADASTRAL CONVERSION ENGINE (js/survey.js)
   ========================================================================== */

let activeSurveyLayer = null;
let activeBeaconMarkers = [];

const FEET_TO_METERS = 0.3048;

/**
 * Open the RTK Survey & Subdivision Suite Modal
 */
function openSurveyToolModal() {
    let surveyModal = document.getElementById("surveyModal");
    if (!surveyModal) {
        surveyModal = document.createElement("div");
        surveyModal.id = "surveyModal";
        surveyModal.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            width: 560px; 
            max-width: 94vw; 
            max-height: 90vh;
            overflow-y: auto;
            background: #FFFFFF; 
            z-index: 99999;
            box-shadow: 0 25px 50px rgba(15, 45, 82, 0.35); 
            border-radius: 14px; 
            padding: 24px;
            font-family: system-ui, -apple-system, sans-serif; 
            border: 1px solid #CBD5E1;
        `;
        document.body.appendChild(surveyModal);
    }

    surveyModal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:12px; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px; font-weight:800; color:#0F2D52;">📐 RTK Cadastral Import & Subdivision Engine</h3>
            <button onclick="closeSurveyModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#64748B;">&times;</button>
        </div>

        <!-- Coordinate System & Units Selector -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:16px;">
            <div>
                <label style="display:block; font-size:11px; font-weight:700; color:#0F2D52; margin-bottom:4px;">Coordinate System</label>
                <select id="coordSystem" onchange="toggleCoordSystemUI()" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
                    <option value="LATLNG">Geodetic (Lat, Lng / WGS84)</option>
                    <option value="UTM">UTM (Easting, Northing / Zone 37S)</option>
                    <option value="CASSINI">Cassini-Soldner (Kenya Cadastral Grid)</option>
                </select>
            </div>
            <div>
                <label style="display:block; font-size:11px; font-weight:700; color:#0F2D52; margin-bottom:4px;">Units</label>
                <select id="coordUnits" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; background:#F8FAFC;">
                    <option value="METERS">Meters (m)</option>
                    <option value="FEET">Feet (ft)</option>
                </select>
            </div>
        </div>

        <!-- SECTION 1: POINT LOCATOR (1 TO 4 POINTS) -->
        <div style="background:#F1F5F9; border:1px solid #E2E8F0; border-radius:10px; padding:12px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="margin:0; font-size:13px; font-weight:800; color:#0F2D52;">
                    📍 Locate Points on Map (1 to 4 Beacons)
                </h4>
                <button onclick="addPointRow()" style="background:#E2E8F0; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">+ Add Row</button>
            </div>

            <div id="pointContainer">
                <div class="point-row" style="display:grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap:6px; margin-bottom:6px;">
                    <input type="text" class="ptX" placeholder="Lat / Easting" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
                    <input type="text" class="ptY" placeholder="Lng / Northing" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
                    <input type="text" class="ptID" placeholder="Beacon ID" value="P1" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
                </div>
            </div>

            <button onclick="locatePointsOnMap()" style="width:100%; background:#2563EB; color:white; border:none; padding:8px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; margin-top:6px;">
                📍 Locate Points on Map
            </button>
        </div>

        <!-- SECTION 2: MULTI-POINT BOUNDARY PLOTTER -->
        <div style="margin-bottom:16px;">
            <label style="display:block; font-size:12px; font-weight:700; color:#0F2D52; margin-bottom:6px;" id="inputFormatLabel">
                Paste Multiple RTK Beacon Coordinates (Lat, Lng):
            </label>
            <textarea id="rtkInput" rows="3" placeholder="-1.5156, 36.9565&#10;-1.5160, 36.9575&#10;-1.5170, 36.9570&#10;-1.5165, 36.9560" style="width:100%; border:1px solid #CBD5E1; border-radius:8px; padding:10px; font-family:monospace; font-size:12px; box-sizing:border-box;"></textarea>
            <div style="font-size:11px; color:#64748B; margin-top:4px;" id="inputFormatHint">Enter at least 3 points to form a parcel boundary polygon.</div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:16px;">
            <button onclick="processRTKInput()" style="flex:1; background:#0F2D52; color:white; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">
                🗺️ Plot Parcel Boundary
            </button>
            <button onclick="clearSurveyLayers()" style="background:#EF4444; color:white; border:none; padding:10px 14px; border-radius:8px; font-weight:bold; cursor:pointer;">
                🗑️ Clear Map
            </button>
        </div>

        <hr style="border:none; border-top:1px solid #E2E8F0; margin:16px 0;">

        <!-- SECTION 3: SUBDIVISION ENGINE -->
        <h4 style="margin:0 0 10px 0; font-size:14px; color:#0F2D52;">Parcel Subdivision Generator</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">

    <div>
        <label style="font-size:11px; font-weight:700; color:#64748B;">
            Standard Plot Size
        </label>

        <select id="subdivisionPlotSize"
            style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px; margin-top:4px; box-sizing:border-box; background:#F8FAFC;">

            <option value="450">450 m²</option>
            <option value="506">1/8 Acre</option>
            <option value="1012">1/4 Acre</option>
            <option value="2023">1/2 Acre</option>
            <option value="4047">1 Acre</option>
            <option value="custom">Custom Size</option>

        </select>
    </div>

    <div>
        <label style="font-size:11px; font-weight:700; color:#64748B;">
            Access Road Width (Meters)
        </label>

        <input
            type="number"
            id="roadWidth"
            value="6"
            min="0"
            step="0.5"
            style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px; margin-top:4px; box-sizing:border-box;"
        >
    </div>

</div>

<div id="customPlotSizeContainer"
    style="display:none; margin-bottom:14px;">

    <label style="font-size:11px; font-weight:700; color:#64748B;">
        Custom Plot Size (m²)
    </label>

    <input
        type="number"
        id="customPlotSize"
        value="450"
        min="50"
        step="10"
        style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:6px; margin-top:4px; box-sizing:border-box;"
    >

</div>

        <button onclick="generateSubdivisions()" style="width:100%; background:#D4A017; color:white; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">
            ✂️ Generate Sub-Plots
        </button>
    `; 
    // Show custom plot-size input when "Custom Size" is selected
    const plotSizeSelect = document.getElementById("subdivisionPlotSize");
    const customPlotSizeContainer = document.getElementById("customPlotSizeContainer");

    if (plotSizeSelect && customPlotSizeContainer) {
        plotSizeSelect.addEventListener("change", function () {
            customPlotSizeContainer.style.display =
                this.value === "custom" ? "block" : "none";
        });
    }

    surveyModal.style.display = "block";
}

/**
 * Closes modal and clears points from map
 */
function closeSurveyModal() {
    const surveyModal = document.getElementById("surveyModal");
    if (surveyModal) {
        surveyModal.style.display = "none";
    }
}

/**
 * Adds up to 4 rows for point location
 */
function addPointRow() {
    const container = document.getElementById("pointContainer");
    const currentRows = container.getElementsByClassName("point-row").length;

    if (currentRows >= 4) {
        alert("Maximum of 4 individual points allowed at once.");
        return;
    }

    const row = document.createElement("div");
    row.className = "point-row";
    row.style.cssText = "display:grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap:6px; margin-bottom:6px;";
    row.innerHTML = `
        <input type="text" class="ptX" placeholder="Lat / Easting" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
        <input type="text" class="ptY" placeholder="Lng / Northing" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
        <input type="text" class="ptID" placeholder="Beacon ID" value="P${currentRows + 1}" style="padding:6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px;">
    `;
    container.appendChild(row);
}

/**
 * Reads 1 to 4 point inputs, converts them dynamically, and plots markers on Leaflet
 */
function locatePointsOnMap() {
    const rows = document.querySelectorAll("#pointContainer .point-row");
    const system = document.getElementById("coordSystem").value;
    const unit = document.getElementById("coordUnits").value;

    let validPoints = [];

    rows.forEach(row => {
        const rawX = parseFloat(row.querySelector(".ptX").value);
        const rawY = parseFloat(row.querySelector(".ptY").value);
        const beaconId = row.querySelector(".ptID").value.trim() || "Beacon";

        if (!isNaN(rawX) && !isNaN(rawY)) {
            let x = rawX;
            let y = rawY;

            if (unit === "FEET" && system !== "LATLNG") {
                x *= FEET_TO_METERS;
                y *= FEET_TO_METERS;
            }

            let converted = null;
            if (system === "LATLNG") {
                converted = { lat: x, lng: y };
            } else if (system === "UTM") {
                converted = utmToWGS84(x, y, 37, 'S');
            } else if (system === "CASSINI") {
                converted = cassiniToLatLng(x, y);
            }

            if (converted) {
                validPoints.push({ coords: converted, id: beaconId });
            }
        }
    });

    if (validPoints.length === 0) {
        alert("Please enter valid numerical coordinates in at least one point row.");
        return;
    }

    if (typeof map !== "undefined" && typeof L !== "undefined") {
        const bounds = L.latLngBounds();

        validPoints.forEach(item => {
            const marker = L.circleMarker([item.coords.lat, item.coords.lng], {
                radius: 8,
                fillColor: "#2563EB",
                color: "#FFFFFF",
                weight: 2,
                fillOpacity: 0.9
            }).addTo(map);

            marker.bindPopup(`
                <div style="font-family:sans-serif;">
                    <b style="color:#0F2D52;">📍 ${item.id}</b><br>
                    <hr style="margin:4px 0; border:none; border-top:1px solid #E2E8F0;">
                    <b>WGS84 Lat:</b> ${item.coords.lat.toFixed(6)}<br>
                    <b>WGS84 Lng:</b> ${item.coords.lng.toFixed(6)}<br>
                    <small style="color:#64748B;">System: ${system}</small>
                </div>
            `);

            activeBeaconMarkers.push(marker);
            bounds.extend([item.coords.lat, item.coords.lng]);
        });

        if (validPoints.length === 1) {
            map.setView([validPoints[0].coords.lat, validPoints[0].coords.lng], 18);
        } else {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        closeSurveyModal();
    }
}

/**
 * Dynamic helper text depending on selected coordinate system
 */
function toggleCoordSystemUI() {
    const sys = document.getElementById("coordSystem").value;
    const label = document.getElementById("inputFormatLabel");
    const hint = document.getElementById("inputFormatHint");
    const textarea = document.getElementById("rtkInput");

    if (sys === "LATLNG") {
        label.innerText = "Paste Multiple RTK Beacon Coordinates (Lat, Lng):";
        hint.innerText = "Format: Latitude, Longitude (e.g., -1.5156, 36.9565)";
        textarea.placeholder = "-1.5156, 36.9565\n-1.5160, 36.9575\n-1.5170, 36.9570\n-1.5165, 36.9560";
    } else if (sys === "UTM") {
        label.innerText = "Paste Multiple UTM Coordinates (Easting, Northing, [Zone]):";
        hint.innerText = "Format: Easting, Northing, [Optional: Zone, e.g. 37S] (e.g., 272800, 9832400, 37S)";
        textarea.placeholder = "272800, 9832400\n272900, 9832400\n272900, 9832300\n272800, 9832300";
    } else if (sys === "CASSINI") {
        label.innerText = "Paste Multiple Cassini Coordinates (Y/Easting, X/Northing):";
        hint.innerText = "Converts Cassini Cadastral Grid -> Geodetic Network -> WGS84 Lat/Lng.";
        textarea.placeholder = "12450.5, -45000.2\n12550.5, -45000.2\n12550.5, -45100.2\n12450.5, -45100.2";
    }
}

/**
 * Processes inputs and performs unit conversions & WGS84 coordinate transformations
 */
function processRTKInput() {
    const rawText = document.getElementById("rtkInput").value.trim();
    const system = document.getElementById("coordSystem").value;
    const unit = document.getElementById("coordUnits").value;

    if (!rawText) {
        alert("Please paste coordinates into the box.");
        return;
    }

    const lines = rawText.split("\n");
    let parsedPoints = [];

    lines.forEach(line => {
        const parts = line.split(",").map(p => p.trim());
        if (parts.length >= 2) {
            let x = parseFloat(parts[0]);
            let y = parseFloat(parts[1]);

            if (isNaN(x) || isNaN(y)) return;

            if (unit === "FEET" && system !== "LATLNG") {
                x *= FEET_TO_METERS;
                y *= FEET_TO_METERS;
            }

            if (system === "LATLNG") {
                parsedPoints.push({ lat: x, lng: y });
            } else if (system === "UTM") {
                let zoneNum = 37;
                let hemi = 'S';
                if (parts[2]) {
                    const zMatch = parts[2].match(/^(\d+)([NSns]?)$/);
                    if (zMatch) {
                        zoneNum = parseInt(zMatch[1]);
                        if (zMatch[2]) hemi = zMatch[2].toUpperCase();
                    }
                }
                parsedPoints.push(utmToWGS84(x, y, zoneNum, hemi));
            } else if (system === "CASSINI") {
                parsedPoints.push(cassiniToLatLng(x, y));
            }
        }
    });

    if (parsedPoints.length < 3) {
        alert("At least 3 valid coordinate points are required to plot a boundary polygon.");
        return;
    }

    plotRTKPoints(parsedPoints);
}

/**
 * Converts UTM (Easting, Northing, Zone, Hemisphere) to WGS84 Geodetic Coordinates (Lat, Lng)
 */
function utmToWGS84(easting, northing, zone = 37, hemisphere = 'S') {
    const k0 = 0.9996;
    const a = 6378137.0; 
    const f = 1 / 298.257223563; 
    const b = a * (1 - f);
    const e2 = (a * a - b * b) / (a * a);
    const ePrime2 = (a * a - b * b) / (b * b);

    let x = easting - 500000.0;
    let y = (hemisphere.toUpperCase() === 'S') ? northing - 10000000.0 : northing;

    const M = y / k0;
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * Math.pow(e2, 3) / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

    const phi1Rad = mu 
        + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
        + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
        + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);

    const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad));
    const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
    const C1 = ePrime2 * Math.cos(phi1Rad) * Math.cos(phi1Rad);
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
    const D = x / (N1 * k0);

    let lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (
        D * D / 2 
        - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ePrime2) * Math.pow(D, 4) / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ePrime2 - 3 * C1 * C1) * Math.pow(D, 6) / 720
    );

    const centralMeridian = (zone - 1) * 6 - 180 + 3;
    let lng = (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 
        + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ePrime2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(phi1Rad);

    lat = lat * (180 / Math.PI);
    lng = centralMeridian + lng * (180 / Math.PI);

    return { lat, lng };
}

/**
 * Cassini-Soldner to Geodetic WGS84 Conversion Helper (Kenya Arc 1960 Origin)
 */
function cassiniToLatLng(yEast, xNorth) {
    const originLat = 0.0;
    const originLng = 37.0;
    
    const metersPerDegreeLat = 110574;
    const metersPerDegreeLng = 111320 * Math.cos(originLat * Math.PI / 180);

    const lat = originLat + (xNorth / metersPerDegreeLat);
    const lng = originLng + (yEast / metersPerDegreeLng);

    return { lat, lng };
}

/**
 * Plots WGS84 boundary points on Leaflet
 */
function plotRTKPoints(rtkCoordinates) {
    clearSurveyLayers();

    const coordinates = rtkCoordinates.map(pt => [pt.lng, pt.lat]);
    coordinates.push(coordinates[0]);

    const polygonGeoJSON = turf.polygon([coordinates]);
    const areaSqMeters = turf.area(polygonGeoJSON);
    const acres = (areaSqMeters / 4046.86).toFixed(2);
    const hectares = (areaSqMeters / 10000).toFixed(2);

    window.activeMotherPolygon = polygonGeoJSON;

    if (typeof map !== "undefined" && typeof L !== "undefined") {
        activeSurveyLayer = L.geoJSON(polygonGeoJSON, {
            style: {
                color: "#2563EB",
                weight: 3,
                dashArray: "5, 5",
                fillColor: "#3B82F6",
                fillOpacity: 0.25
            }
        }).addTo(map);

        map.fitBounds(activeSurveyLayer.getBounds());

        rtkCoordinates.forEach((pt, index) => {
            const marker = L.circleMarker([pt.lat, pt.lng], {
                radius: 6,
                fillColor: "#EF4444",
                color: "#FFFFFF",
                weight: 2,
                fillOpacity: 1
            }).addTo(map).bindPopup(`<b>Beacon B${index + 1}</b><br>Lat: ${pt.lat.toFixed(6)}<br>Lng: ${pt.lng.toFixed(6)}`);

            activeBeaconMarkers.push(marker);
        });

        alert(`Boundary Plotted Successfully!\n\nCalculated Area:\n• ${areaSqMeters.toFixed(1)} m²\n• ${acres} Acres\n• ${hectares} Ha`);
        closeSurveyModal();
    }
}

/**
 * ============================================================
 * SMART CADASTRAL SUBDIVISION ENGINE
 * ============================================================
 *
 * Creates:
 *  - Access road corridor
 *  - Rectangular development plots
 *  - Target plot sizes
 *  - Actual clipped plot areas
 *
 * The original mother polygon remains stored in:
 * window.activeMotherPolygon
 */

function generateSubdivisions() {

    // ---------------------------------------------------------
    // 1. VALIDATION
    // ---------------------------------------------------------

    if (!window.activeMotherPolygon) {
        alert("Please plot an RTK Mother Parcel boundary first.");
        return;
    }

    if (typeof turf === "undefined") {
        alert("Turf.js is required for subdivision generation.");
        return;
    }

    if (typeof map === "undefined" || typeof L === "undefined") {
        alert("Map is not available.");
        return;
    }


    // ---------------------------------------------------------
    // 2. READ USER SETTINGS
    // ---------------------------------------------------------

    const plotSizeSelect =
        document.getElementById("subdivisionPlotSize");

    const roadWidthInput =
        document.getElementById("roadWidth");

    const customPlotSizeInput =
        document.getElementById("customPlotSize");


    const selectedSize =
        plotSizeSelect ? plotSizeSelect.value : "450";


    const roadWidth =
        roadWidthInput
            ? parseFloat(roadWidthInput.value) || 6
            : 6;


    let targetPlotArea;


    if (selectedSize === "custom") {

        targetPlotArea =
            customPlotSizeInput
                ? parseFloat(customPlotSizeInput.value)
                : 450;

    } else {

        targetPlotArea =
            parseFloat(selectedSize);

    }


    if (!targetPlotArea || targetPlotArea <= 0) {
        alert("Please select a valid plot size.");
        return;
    }


    if (roadWidth <= 0) {
        alert("Please enter a valid road width.");
        return;
    }


    // ---------------------------------------------------------
    // 3. MOTHER PARCEL
    // ---------------------------------------------------------

    const motherPolygon =
        window.activeMotherPolygon;


    const motherArea =
        turf.area(motherPolygon);


    if (motherArea < targetPlotArea) {

        alert(
            "The mother parcel is smaller than the selected plot size.\n\n" +
            "Mother Parcel: " +
            motherArea.toFixed(1) +
            " m²\n" +
            "Selected Plot: " +
            targetPlotArea.toFixed(1) +
            " m²"
        );

        return;
    }


    // ---------------------------------------------------------
    // 4. CLEAR PREVIOUS SUBDIVISION DISPLAY
    // ---------------------------------------------------------

    if (activeSurveyLayer) {

        map.removeLayer(activeSurveyLayer);

        activeSurveyLayer = null;
    }


    if (window.activeSubdivisionLayer) {

        map.removeLayer(window.activeSubdivisionLayer);

        window.activeSubdivisionLayer = null;
    }


    if (window.activeRoadLayer) {

        map.removeLayer(window.activeRoadLayer);

        window.activeRoadLayer = null;
    }


    // ---------------------------------------------------------
    // 5. CREATE ACCESS ROAD
    // ---------------------------------------------------------
    //
    // The road is placed along the southern side of the
    // mother parcel. This gives the plots a common frontage.
    //
    // Later we can allow:
    // NORTH / SOUTH / EAST / WEST / INTERNAL
    //
    // ---------------------------------------------------------

    const bbox =
        turf.bbox(motherPolygon);


    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];


    const roadLine =
        turf.lineString([
            [minLng, minLat],
            [maxLng, minLat]
        ]);


    const roadBuffer =
        turf.buffer(
            roadLine,
            roadWidth / 2,
            {
                units: "meters"
            }
        );


    // Make sure road stays inside mother parcel

    const roadInside =
        turf.intersect(
            motherPolygon,
            roadBuffer
        );


    // ---------------------------------------------------------
    // 6. REMOVE ROAD FROM DEVELOPABLE AREA
    // ---------------------------------------------------------

    let developableArea =
        motherPolygon;


    if (roadInside) {

        try {

            developableArea =
                turf.difference(
                    motherPolygon,
                    roadInside
                );

        } catch (error) {

            console.warn(
                "Road difference failed. Continuing without road subtraction.",
                error
            );

            developableArea =
                motherPolygon;
        }
    }


    // ---------------------------------------------------------
    // 7. DRAW ROAD
    // ---------------------------------------------------------

    if (roadInside) {

        window.activeRoadLayer =
            L.geoJSON(
                roadInside,
                {
                    style: {
                        color: "#475569",
                        weight: 2,
                        fillColor: "#CBD5E1",
                        fillOpacity: 0.75
                    }
                }
            ).addTo(map);

    }


    // ---------------------------------------------------------
    // 8. DETERMINE APPROXIMATE PLOT DIMENSIONS
    // ---------------------------------------------------------
    //
    // We start with a square based on the selected area.
    //
    // Example:
    //
    // 450 m² ≈ 21.2m × 21.2m
    // 1/8 acre ≈ 22.5m × 22.5m
    // 1/4 acre ≈ 31.8m × 31.8m
    //
    // The actual shape is then clipped to the mother parcel.
    //
    // ---------------------------------------------------------

    const plotSide =
        Math.sqrt(targetPlotArea);


    // ---------------------------------------------------------
    // 9. GET DEVELOPABLE BOUNDING BOX
    // ---------------------------------------------------------

    const developableBbox =
        turf.bbox(developableArea);


    const dMinLng =
        developableBbox[0];

    const dMinLat =
        developableBbox[1];

    const dMaxLng =
        developableBbox[2];

    const dMaxLat =
        developableBbox[3];


    // ---------------------------------------------------------
    // 10. CONVERT WIDTH / HEIGHT TO METRES
    // ---------------------------------------------------------

    const widthMeters =
        turf.distance(
            [dMinLng, dMinLat],
            [dMaxLng, dMinLat],
            {
                units: "meters"
            }
        );


    const heightMeters =
        turf.distance(
            [dMinLng, dMinLat],
            [dMinLng, dMaxLat],
            {
                units: "meters"
            }
        );


    // ---------------------------------------------------------
    // 11. DETERMINE GRID
    // ---------------------------------------------------------

    const columns =
        Math.max(
            1,
            Math.floor(widthMeters / plotSide)
        );


    const rows =
        Math.max(
            1,
            Math.floor(heightMeters / plotSide)
        );


    // Safety limit

    const totalCells =
        columns * rows;


    if (totalCells > 500) {

        alert(
            "The selected plot size would create too many cells.\n\n" +
            "Please choose a larger plot size."
        );

        return;
    }


    // ---------------------------------------------------------
    // 12. GRID SPACING
    // ---------------------------------------------------------

    const lngStep =
        (dMaxLng - dMinLng) / columns;


    const latStep =
        (dMaxLat - dMinLat) / rows;


    const subPlots = [];

    let parcelIndex = 1;


    // ---------------------------------------------------------
    // 13. GENERATE PLOTS
    // ---------------------------------------------------------

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < columns;
            col++
        ) {

            const west =
                dMinLng +
                (col * lngStep);


            const east =
                dMinLng +
                ((col + 1) * lngStep);


            const south =
                dMinLat +
                (row * latStep);


            const north =
                dMinLat +
                ((row + 1) * latStep);


            const cell =
                turf.bboxPolygon([
                    west,
                    south,
                    east,
                    north
                ]);


            let intersection;


            try {

                intersection =
                    turf.intersect(
                        developableArea,
                        cell
                    );

            } catch (error) {

                console.warn(
                    "Intersection failed:",
                    error
                );

                continue;
            }


            if (!intersection) {
                continue;
            }


            const actualArea =
                turf.area(intersection);


            // -------------------------------------------------
            // IGNORE VERY SMALL EDGE SLIVERS
            // -------------------------------------------------

            if (
                actualArea <
                targetPlotArea * 0.55
            ) {
                continue;
            }


            // -------------------------------------------------
            // STORE PARCEL INFORMATION
            // -------------------------------------------------

            intersection.properties = {

                parcel_no:
                    `SUB-${String(parcelIndex).padStart(3, "0")}`,

                status:
                    "Available",

                target_area_m2:
                    targetPlotArea,

                actual_area_m2:
                    actualArea,

                actual_area_acres:
                    actualArea / 4046.856,

                road_frontage:
                    "Access Road",

                road_width_m:
                    roadWidth

            };


            subPlots.push(
                intersection
            );


            parcelIndex++;

        }

    }


    // ---------------------------------------------------------
    // 14. CHECK RESULT
    // ---------------------------------------------------------

    if (subPlots.length === 0) {

        alert(
            "No suitable plots could be generated inside the mother parcel."
        );

        return;
    }


    // ---------------------------------------------------------
    // 15. CREATE GEOJSON
    // ---------------------------------------------------------

    const subPlotCollection =
        turf.featureCollection(
            subPlots
        );


    // ---------------------------------------------------------
    // 16. DISPLAY SUBDIVISIONS
    // ---------------------------------------------------------

    window.activeSubdivisionLayer =
        L.geoJSON(
            subPlotCollection,
            {

                style: {

                    color: "#0F2D52",

                    weight: 2,

                    fillColor: "#3B82F6",

                    fillOpacity: 0.18

                },


                onEachFeature:
                    function (
                        feature,
                        layer
                    ) {

                        const p =
                            feature.properties;


                        layer.bindPopup(`

                            <div style="
                                font-family:system-ui,-apple-system,sans-serif;
                                min-width:190px;
                            ">

                                <div style="
                                    font-size:14px;
                                    font-weight:800;
                                    color:#0F2D52;
                                    margin-bottom:10px;
                                ">
                                    ${p.parcel_no}
                                </div>


                                <div style="
                                    display:grid;
                                    grid-template-columns:1fr 1fr;
                                    gap:8px;
                                    font-size:11px;
                                ">

                                    <div style="
                                        padding:8px;
                                        background:#F8FAFC;
                                        border-radius:6px;
                                    ">
                                        <div style="color:#64748B;">
                                            Target Area
                                        </div>

                                        <strong>
                                            ${Number(p.target_area_m2).toLocaleString()}
                                            m²
                                        </strong>
                                    </div>


                                    <div style="
                                        padding:8px;
                                        background:#F8FAFC;
                                        border-radius:6px;
                                    ">
                                        <div style="color:#64748B;">
                                            Actual Area
                                        </div>

                                        <strong>
                                            ${Number(p.actual_area_m2).toLocaleString(undefined,{
                                                maximumFractionDigits:1
                                            })}
                                            m²
                                        </strong>
                                    </div>

                                </div>


                                <div style="
                                    margin-top:9px;
                                    font-size:11px;
                                    color:#475569;
                                ">

                                    <strong>Status:</strong>
                                    ${p.status}

                                    <br>

                                    <strong>Access:</strong>
                                    ${p.road_frontage}

                                    <br>

                                    <strong>Road Width:</strong>
                                    ${p.road_width_m} m

                                </div>

                            </div>

                        `);


                        // Hover effect

                        layer.on({

                            mouseover:
                                function (e) {

                                    e.target.setStyle({

                                        weight: 3,

                                        fillOpacity: 0.35

                                    });

                                },

                            mouseout:
                                function (e) {

                                    window.activeSubdivisionLayer.resetStyle(
                                        e.target
                                    );

                                }

                        });

                    }

            }
        ).addTo(map);


    // ---------------------------------------------------------
    // 17. FIT MAP TO SUBDIVISIONS
    // ---------------------------------------------------------

    map.fitBounds(
        window.activeSubdivisionLayer.getBounds(),
        {
            padding: [40, 40]
        }
    );


    // ---------------------------------------------------------
    // 18. CALCULATE SUMMARY
    // ---------------------------------------------------------

    const totalSubdivisionArea =
        subPlots.reduce(
            function (
                total,
                feature
            ) {

                return total +
                    turf.area(feature);

            },
            0
        );


    const remainingArea =
        Math.max(
            0,
            motherArea -
            totalSubdivisionArea -
            (roadInside
                ? turf.area(roadInside)
                : 0)
        );


    // ---------------------------------------------------------
    // 19. REPORT
    // ---------------------------------------------------------

    alert(

        `SUBDIVISION COMPLETE\n\n` +

        `Mother Parcel:\n` +
        `${motherArea.toFixed(1)} m²\n\n` +

        `Target Plot Size:\n` +
        `${targetPlotArea.toFixed(1)} m²\n\n` +

        `Access Road:\n` +
        `${roadWidth} m\n\n` +

        `Plots Generated:\n` +
        `${subPlots.length}\n\n` +

        `Developable Area:\n` +
        `${totalSubdivisionArea.toFixed(1)} m²\n\n` +

        `Residual Area:\n` +
        `${remainingArea.toFixed(1)} m²`

    );

    closeSurveyModal();
}

/**
 * Clears layers and markers from map (Can also be called on Home button click)
 */
function clearSurveyLayers() {
    if (typeof map !== "undefined") {
        if (activeSurveyLayer) {
            map.removeLayer(activeSurveyLayer);
            activeSurveyLayer = null;
        }
        activeBeaconMarkers.forEach(m => map.removeLayer(m));
        activeBeaconMarkers = [];
    }
    window.activeMotherPolygon = null;
}

// Global hook: Attach to Home Button or Navigation Reset if present
document.addEventListener("DOMContentLoaded", () => {
    const homeBtn = document.getElementById("homeButton") || document.querySelector(".nav-home-btn");
    if (homeBtn) {
        homeBtn.addEventListener("click", clearSurveyLayers);
    }
}); 

/* ==========================================================================
   ENVIRONMENTAL & SPATIAL RISK ANALYSIS ENGINE (js/survey.js)
   ========================================================================== */

/**
 * Generates a Riparian / Setback Buffer Layer on the map
 */
function generateParcelBuffer(bufferDistanceMeters = 30) {
    let targetFeature = null;

    // 1. Try active survey polygon from RTK tool
    if (window.activeMotherPolygon) {
        targetFeature = window.activeMotherPolygon;
    } 
    // 2. Fall back to selected parcel from map click
    else if (window.selectedParcelId && window.allFeatures) {
        targetFeature = window.allFeatures.find(f => f.properties.parcel_no === window.selectedParcelId);
    }

    if (!targetFeature || typeof turf === "undefined") {
        alert("Please select a parcel or plot a boundary on the map first.");
        return;
    }

    // Convert meters to kilometers for Turf.js
    const buffered = turf.buffer(targetFeature, bufferDistanceMeters / 1000, { units: 'kilometers' });

    if (typeof map !== "undefined" && typeof L !== "undefined") {
        if (window.activeBufferLayer) {
            map.removeLayer(window.activeBufferLayer);
        }

        window.activeBufferLayer = L.geoJSON(buffered, {
            style: {
                color: "#DC2626",
                weight: 2,
                dashArray: "4, 4",
                fillColor: "#EF4444",
                fillOpacity: 0.18
            }
        }).addTo(map);

        const buildableArea = turf.area(targetFeature);
        const bufferedArea = turf.area(buffered);
        const restrictedZone = ((bufferedArea - buildableArea) / 4046.86).toFixed(2);

        alert(`Environmental Buffer Plotted!\n• Setback Distance: ${bufferDistanceMeters}m\n• Restricted Buffer Zone: ${restrictedZone} Acres`);
    }
}

/**
 * Draws a 30m buffer around the active selected parcel
 */
function generateParcelBuffer(bufferDistanceMeters = 30) {
    if (!window.selectedParcelId || !window.allFeatures) {
        alert("Please select a parcel on the map first.");
        return;
    }

    const selectedFeature = window.allFeatures.find(f => f.properties.parcel_no === window.selectedParcelId);
    if (!selectedFeature || typeof turf === "undefined") return;

    const buffered = turf.buffer(selectedFeature, bufferDistanceMeters / 1000, { units: 'kilometers' });

    if (typeof map !== "undefined" && typeof L !== "undefined") {
        if (window.activeBufferLayer) {
            map.removeLayer(window.activeBufferLayer);
        }

        window.activeBufferLayer = L.geoJSON(buffered, {
            style: {
                color: "#DC2626",
                weight: 2,
                dashArray: "4, 4",
                fillColor: "#EF4444",
                fillOpacity: 0.18
            }
        }).addTo(map);
    }
}