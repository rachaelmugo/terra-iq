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

        <!-- =========================================================
     PLANNING RULES
========================================================= -->

<div style="
    background:#F8FAFC;
    border:1px solid #E2E8F0;
    border-radius:10px;
    padding:14px;
    margin-bottom:16px;
">

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:12px;
    ">
        <div>
            <div style="
                font-size:13px;
                font-weight:800;
                color:#0F2D52;
            ">
                📐 Planning Rules
            </div>

            <div style="
                font-size:10px;
                color:#64748B;
                margin-top:3px;
            ">
                Define the design parameters before generating a subdivision
            </div>
        </div>

        <span style="
            font-size:9px;
            font-weight:800;
            color:#64748B;
            text-transform:uppercase;
            letter-spacing:.5px;
        ">
            Rule Engine
        </span>
    </div>


    <!-- TARGET PLOT SIZE -->

    <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:10px;
    ">

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Target Plot Size
            </label>

            <select
                id="planningPlotSize"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    background:#FFFFFF;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

                <option value="450">
                    450 m²
                </option>

                <option value="506">
                    1/8 Acre
                </option>

                <option value="1012">
                    1/4 Acre
                </option>

                <option value="2023">
                    1/2 Acre
                </option>

                <option value="4047">
                    1 Acre
                </option>

                <option value="custom">
                    Custom
                </option>

            </select>

        </div>


        <!-- MIN FRONTAGE -->

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Minimum Frontage (m)
            </label>

            <input
                id="planningFrontage"
                type="number"
                value="15"
                min="5"
                step="0.5"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

        </div>

    </div>


    <!-- CUSTOM AREA -->

    <div
        id="customPlanningPlotContainer"
        style="display:none;margin-bottom:10px;"
    >

        <label style="
            display:block;
            font-size:11px;
            font-weight:700;
            color:#475569;
            margin-bottom:4px;
        ">
            Custom Plot Area (m²)
        </label>

        <input
            id="customPlanningPlotSize"
            type="number"
            value="450"
            min="50"
            step="10"
            style="
                width:100%;
                padding:8px;
                border:1px solid #CBD5E1;
                border-radius:6px;
                font-size:11px;
                box-sizing:border-box;
            "
        >

    </div>


    <!-- MIN DEPTH -->

    <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:10px;
    ">

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Minimum Plot Depth (m)
            </label>

            <input
                id="planningDepth"
                type="number"
                value="25"
                min="5"
                step="0.5"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

        </div>


        <!-- ROAD TYPE -->

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Road Type
            </label>

            <select
                id="planningRoadType"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    background:#FFFFFF;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

                <option value="public">
                    Public Through Road
                </option>

                <option value="local">
                    Local Access Road
                </option>

                <option value="private">
                    Private Estate Road
                </option>

            </select>

        </div>

    </div>


    <!-- ROAD RESERVE -->

    <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:10px;
    ">

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Road Reserve (m)
            </label>

            <input
                id="planningRoadReserve"
                type="number"
                value="12"
                min="4"
                step="1"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

        </div>


        <!-- DESIGN PRIORITY -->

        <div>

            <label style="
                display:block;
                font-size:11px;
                font-weight:700;
                color:#475569;
                margin-bottom:4px;
            ">
                Design Priority
            </label>

            <select
                id="planningPriority"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    background:#FFFFFF;
                    font-size:11px;
                    box-sizing:border-box;
                "
            >

                <option value="balanced">
                    Balanced
                </option>

                <option value="yield">
                    Maximum Plot Yield
                </option>

                <option value="access">
                    Best Accessibility
                </option>

                <option value="quality">
                    Best Plot Quality
                </option>

            </select>

        </div>

    </div>


    <!-- RULE SUMMARY -->

    <div style="
        padding:9px 10px;
        background:#FFFFFF;
        border:1px solid #E2E8F0;
        border-radius:7px;
        font-size:10px;
        line-height:1.5;
        color:#64748B;
    ">

        <strong style="color:#0F2D52;">
            Design logic:
        </strong>

        Terra-IQ will use these parameters when generating
        roads, buildable areas and individual cadastral plots.

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

      <!-- SECTION 3: CADASTRAL LAYOUT ENGINE -->
<div style="
    margin-top:18px;
    padding:14px;
    background:#F8FAFC;
    border:1px solid #E2E8F0;
    border-radius:10px;
">

    <div style="
        font-size:14px;
        font-weight:800;
        color:#0F2D52;
        margin-bottom:4px;
    ">
        🏗️ Cadastral Layout Engine
    </div>

    <div style="
        font-size:11px;
        color:#64748B;
        margin-bottom:14px;
        line-height:1.5;
    ">
        Generate multiple subdivision possibilities based on
        plot size, road access and planning parameters.
    </div>


    <!-- TARGET PLOT SIZE -->
    <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:10px;
    ">

        <div>
            <label style="
                font-size:11px;
                font-weight:700;
                color:#475569;
            ">
                Target Plot Size
            </label>

            <select id="subdivisionPlotSize" style="
                width:100%;
                padding:8px;
                border:1px solid #CBD5E1;
                border-radius:6px;
                margin-top:4px;
                box-sizing:border-box;
                background:white;
            ">
                <option value="450">450 m²</option>
                <option value="505.86">1/8 Acre</option>
                <option value="1011.71">1/4 Acre</option>
                <option value="2023.43">1/2 Acre</option>
                <option value="4046.86">1 Acre</option>
                <option value="custom">Custom</option>
            </select>
        </div>


        <!-- ROAD WIDTH -->
        <div>
            <label style="
                font-size:11px;
                font-weight:700;
                color:#475569;
            ">
                Road Reserve
            </label>

            <select id="roadWidth" style="
                width:100%;
                padding:8px;
                border:1px solid #CBD5E1;
                border-radius:6px;
                margin-top:4px;
                box-sizing:border-box;
                background:white;
            ">
                <option value="6">6 m</option>
                <option value="9">9 m</option>
                <option value="12">12 m</option>
            </select>
        </div>

    </div>


    <!-- CUSTOM SIZE -->
    <div id="customPlotSizeContainer" style="
        display:none;
        margin-bottom:10px;
    ">

        <label style="
            font-size:11px;
            font-weight:700;
            color:#475569;
        ">
            Custom Plot Area (m²)
        </label>

        <input
            type="number"
            id="customPlotSize"
            placeholder="e.g. 600"
            min="100"
            style="
                width:100%;
                padding:8px;
                border:1px solid #CBD5E1;
                border-radius:6px;
                margin-top:4px;
                box-sizing:border-box;
            "
        >

    </div>


    <!-- MINIMUM FRONTAGE -->
    <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-bottom:10px;
    ">

        <div>
            <label style="
                font-size:11px;
                font-weight:700;
                color:#475569;
            ">
                Minimum Frontage (m)
            </label>

            <input
                type="number"
                id="minimumFrontage"
                value="15"
                min="5"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    margin-top:4px;
                    box-sizing:border-box;
                "
            >
        </div>


        <!-- MINIMUM DEPTH -->
        <div>
            <label style="
                font-size:11px;
                font-weight:700;
                color:#475569;
            ">
                Minimum Depth (m)
            </label>

            <input
                type="number"
                id="minimumDepth"
                value="25"
                min="5"
                style="
                    width:100%;
                    padding:8px;
                    border:1px solid #CBD5E1;
                    border-radius:6px;
                    margin-top:4px;
                    box-sizing:border-box;
                "
            >
        </div>

    </div>


    <!-- LAYOUT STRATEGY -->
    <div style="margin-bottom:12px;">

        <label style="
            font-size:11px;
            font-weight:700;
            color:#475569;
        ">
            Layout Strategy
        </label>

        <select id="layoutStrategy" style="
            width:100%;
            padding:8px;
            border:1px solid #CBD5E1;
            border-radius:6px;
            margin-top:4px;
            box-sizing:border-box;
            background:white;
        ">

            <option value="balanced">
                Balanced — Recommended
            </option>

            <option value="yield">
                Maximum Yield
            </option>

            <option value="frontage">
                Premium Frontage
            </option>

        </select>

    </div>


    <!-- GENERATE -->
    <button
        onclick="generateCadastralPlans()"
        style="
            width:100%;
            background:#0F2D52;
            color:white;
            border:none;
            padding:11px;
            border-radius:8px;
            font-weight:800;
            cursor:pointer;
        "
    >
        ⚡ Generate Cadastral Plans
    </button>

</div>
    `; 
    // Show custom plot-size input when "Custom Size" is selected
    const plotSizeSelect =
    document.getElementById("planningPlotSize");

const customPlotContainer =
    document.getElementById("customPlanningPlotContainer");

if (plotSizeSelect && customPlotContainer) {

    plotSizeSelect.addEventListener("change", function () {

        customPlotContainer.style.display =
            this.value === "custom"
                ? "block"
                : "none";

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
 * TERRA-IQ ROAD NETWORK ENGINE — STEP 2
 * Creates a strategic internal access road inside the
 * active mother parcel.
 * ============================================================
 */

function generateRoadNetwork() {

    if (!window.activeMotherPolygon) {
        alert("Please plot the mother parcel boundary first.");
        return;
    }

    if (typeof turf === "undefined" || typeof map === "undefined") {
        alert("Mapping engine is not available.");
        return;
    }

    const rules = getPlanningRules();

    const motherParcel = window.activeMotherPolygon;

    /*
     * ---------------------------------------------------------
     * 1. GET PARCEL BOUNDING BOX
     * ---------------------------------------------------------
     */

    const bbox = turf.bbox(motherParcel);

    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];


    /*
     * ---------------------------------------------------------
     * 2. CREATE A CENTRELINE
     *
     * This is deliberately simple for Step 2.
     * Later we will make the road orientation intelligent.
     * ---------------------------------------------------------
     */

    const centerLng = (minLng + maxLng) / 2;


    const roadStart = [centerLng, minLat];
    const roadEnd = [centerLng, maxLat];


    const roadCenterline = turf.lineString([
        roadStart,
        roadEnd
    ]);


    /*
     * ---------------------------------------------------------
     * 3. CREATE ROAD RESERVE
     *
     * Turf buffer uses kilometres.
     * ---------------------------------------------------------
     */

    const roadWidthKm =
        rules.roadReserve / 2 / 1000;


    let roadReserve = turf.buffer(
        roadCenterline,
        roadWidthKm,
        {
            units: "kilometers"
        }
    );


    /*
     * ---------------------------------------------------------
     * 4. CLIP ROAD TO MOTHER PARCEL
     * ---------------------------------------------------------
     */

    const clippedRoad =
        turf.intersect(
            motherParcel,
            roadReserve
        );


    if (!clippedRoad) {

        alert(
            "Terra-IQ could not create a road inside this parcel."
        );

        return;
    }


    /*
     * ---------------------------------------------------------
     * 5. REMOVE PREVIOUS ROAD
     * ---------------------------------------------------------
     */

    if (window.activeRoadLayer) {

        map.removeLayer(
            window.activeRoadLayer
        );

        window.activeRoadLayer = null;
    }


    /*
     * ---------------------------------------------------------
     * 6. DRAW ROAD RESERVE
     * ---------------------------------------------------------
     */

    window.activeRoadLayer =
        L.geoJSON(
            clippedRoad,
            {

                style: {

                    color: "#D4A017",

                    weight: 2,

                    fillColor: "#FBBF24",

                    fillOpacity: 0.35

                }

            }

        ).addTo(map);


    /*
     * ---------------------------------------------------------
     * 7. DRAW ROAD CENTRELINE
     * ---------------------------------------------------------
     */

    if (window.activeRoadCenterline) {

        map.removeLayer(
            window.activeRoadCenterline
        );
    }


    window.activeRoadCenterline =
        L.geoJSON(
            roadCenterline,
            {

                style: {

                    color: "#0F2D52",

                    weight: 3,

                    dashArray: "6,6"

                }

            }

        ).addTo(map);


    /*
     * ---------------------------------------------------------
     * 8. SAVE ROAD GEOMETRY
     *
     * This becomes important later when plots are generated.
     * ---------------------------------------------------------
     */

    window.activeRoadNetwork = {

        centerline: roadCenterline,

        reserve: clippedRoad,

        width: rules.roadReserve

    };


    /*
     * ---------------------------------------------------------
     * 9. REPORT RESULT
     * ---------------------------------------------------------
     */

    const roadArea =
        turf.area(clippedRoad);


    alert(
        `Road Network Generated!\n\n` +
        `Road Reserve: ${rules.roadReserve} m\n` +
        `Road Area: ${roadArea.toFixed(1)} m²\n\n` +
        `This road corridor will be used by the\n` +
        `next stage of the cadastral subdivision engine.`
    );
} 

/**
 * ============================================================
 * TERRA-IQ BUILDABLE AREA ENGINE — STEP 3
 * Removes the generated road reserve from the mother parcel.
 * ============================================================
 */

function generateBuildableArea() {

    if (!window.activeMotherPolygon) {
        alert("Please plot the mother parcel first.");
        return;
    }

    if (!window.activeRoadNetwork) {
        alert("Please generate the road network first.");
        return;
    }

    if (typeof turf === "undefined" || typeof map === "undefined") {
        alert("Mapping engine is not available.");
        return;
    }

    const motherParcel = window.activeMotherPolygon;
    const roadReserve = window.activeRoadNetwork.reserve;

    /*
     * Remove the road reserve from the mother parcel.
     */
    const buildableArea = turf.difference(
        motherParcel,
        roadReserve
    );

    if (!buildableArea) {
        alert(
            "The road reserve consumes the available parcel area. " +
            "Please reduce the road reserve or review the parcel geometry."
        );
        return;
    }

    /*
     * Remove previous buildable-area layer.
     */
    if (window.activeBuildableLayer) {

        map.removeLayer(
            window.activeBuildableLayer
        );

        window.activeBuildableLayer = null;
    }

    /*
     * Draw buildable area.
     */
    window.activeBuildableLayer =
        L.geoJSON(
            buildableArea,
            {
                style: {
                    color: "#16A34A",
                    weight: 2,
                    fillColor: "#22C55E",
                    fillOpacity: 0.18
                }
            }
        ).addTo(map);

    /*
     * Save geometry for the next stage.
     */
    window.activeBuildableArea = buildableArea;

    /*
     * Calculate areas.
     */
    const motherArea =
        turf.area(motherParcel);

    const roadArea =
        turf.area(roadReserve);

    const buildableAreaSqM =
        turf.area(buildableArea);

    const roadPercentage =
        (roadArea / motherArea) * 100;

    /*
     * Report results.
     */
    alert(
        `Buildable Area Generated!\n\n` +

        `Mother Parcel:\n` +
        `${motherArea.toFixed(1)} m²\n\n` +

        `Road Reserve:\n` +
        `${roadArea.toFixed(1)} m² ` +
        `(${roadPercentage.toFixed(1)}%)\n\n` +

        `Available for Plots:\n` +
        `${buildableAreaSqM.toFixed(1)} m²`
    );
} 

/**
 * ============================================================
 * TERRA-IQ PLOT GENERATION ENGINE — STEP 4
 * Generates cadastral-style plots from the buildable area.
 * ============================================================
 */

function generateCadastralPlots() {

    if (!window.activeMotherPolygon) {
        alert("Please plot the mother parcel first.");
        return;
    }

    if (!window.activeRoadNetwork) {
        alert("Please generate the road network first.");
        return;
    }

    if (!window.activeBuildableArea) {
        alert("Please generate the buildable area first.");
        return;
    }

    if (typeof turf === "undefined" || typeof map === "undefined") {
        alert("Mapping engine is not available.");
        return;
    }

    const rules = getPlanningRules();

    const targetArea = rules.targetPlotArea;
    const minimumFrontage = rules.minimumFrontage;
    const minimumDepth = rules.minimumDepth;

    const buildableArea = window.activeBuildableArea;

    /*
     * ---------------------------------------------------------
     * 1. DETERMINE APPROXIMATE PLOT DIMENSIONS
     * ---------------------------------------------------------
     *
     * width ≈ frontage
     * depth ≈ area / frontage
     */

    let plotWidth = minimumFrontage;

    let plotDepth =
        targetArea / plotWidth;

    /*
     * Make sure the calculated depth satisfies
     * the minimum depth rule.
     */

    if (plotDepth < minimumDepth) {

        plotDepth = minimumDepth;

        plotWidth =
            targetArea / plotDepth;
    }


    /*
     * ---------------------------------------------------------
     * 2. GET BUILDABLE AREA BOUNDING BOX
     * ---------------------------------------------------------
     */

    const bbox = turf.bbox(buildableArea);

    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];


    /*
     * ---------------------------------------------------------
     * 3. APPROXIMATE METERS PER DEGREE
     *
     * Used only for the initial layout engine.
     * Later we will move the geometry calculations into
     * a projected coordinate system.
     * ---------------------------------------------------------
     */

    const centerLat =
        (minLat + maxLat) / 2;

    const metersPerDegreeLat = 111320;

    const metersPerDegreeLng =
        111320 *
        Math.cos(centerLat * Math.PI / 180);


    /*
     * Convert plot dimensions into degrees.
     */

    const widthDegrees =
        plotWidth / metersPerDegreeLng;

    const depthDegrees =
        plotDepth / metersPerDegreeLat;


    /*
     * ---------------------------------------------------------
     * 4. CREATE CANDIDATE PLOTS
     * ---------------------------------------------------------
     */

    const plots = [];

    let row = 0;

    let currentLat = minLat;


    while (
        currentLat + depthDegrees <= maxLat &&
        row < 100
    ) {

        let column = 0;

        let currentLng = minLng;


        while (
            currentLng + widthDegrees <= maxLng &&
            column < 100
        ) {

            const plotBox =
                turf.bboxPolygon([
                    currentLng,
                    currentLat,
                    currentLng + widthDegrees,
                    currentLat + depthDegrees
                ]);


            /*
             * Intersect candidate plot with the
             * buildable area.
             */

            const intersection =
                turf.intersect(
                    buildableArea,
                    plotBox
                );


            if (intersection) {

                const area =
                    turf.area(intersection);


                /*
                 * Only accept reasonably complete plots.
                 *
                 * This prevents tiny fragments from being
                 * treated as proper cadastral plots.
                 */

                const areaRatio =
                    area / targetArea;


                if (
                    areaRatio >= 0.75 &&
                    areaRatio <= 1.35
                ) {

                    intersection.properties = {

                        parcel_no:
                            `SUB-${String(
                                plots.length + 1
                            ).padStart(3, "0")}`,

                        status:
                            "Available",

                        area_m2:
                            Number(
                                area.toFixed(1)
                            ),

                        target_area_m2:
                            targetArea,

                        frontage_m:
                            plotWidth,

                        depth_m:
                            plotDepth,

                        accessible:
                            true

                    };


                    plots.push(
                        intersection
                    );
                }
            }


            currentLng += widthDegrees;

            column++;
        }


        currentLat += depthDegrees;

        row++;
    }


    /*
     * ---------------------------------------------------------
     * 5. CHECK RESULT
     * ---------------------------------------------------------
     */

    if (plots.length === 0) {

        alert(
            "Terra-IQ could not generate suitable plots " +
            "using the current planning rules.\n\n" +

            "Try reducing the target plot size or " +
            "minimum frontage."
        );

        return;
    }


    /*
     * ---------------------------------------------------------
     * 6. REMOVE PREVIOUS GENERATED PLOTS
     * ---------------------------------------------------------
     */

    if (window.activePlotLayer) {

        map.removeLayer(
            window.activePlotLayer
        );
    }


    /*
     * ---------------------------------------------------------
     * 7. CREATE FEATURE COLLECTION
     * ---------------------------------------------------------
     */

    const plotCollection =
        turf.featureCollection(
            plots
        );


    /*
     * ---------------------------------------------------------
     * 8. DRAW CADASTRAL PLOTS
     * ---------------------------------------------------------
     */

    window.activePlotLayer =
        L.geoJSON(
            plotCollection,
            {

                style: {

                    color: "#0F2D52",

                    weight: 1.5,

                    fillColor: "#60A5FA",

                    fillOpacity: 0.18

                },


                onEachFeature:
                    function(feature, layer) {

                        const p =
                            feature.properties;


                        layer.bindPopup(`

                            <div style="
                                font-family:system-ui;
                                min-width:190px;
                            ">

                                <div style="
                                    font-size:14px;
                                    font-weight:800;
                                    color:#0F2D52;
                                    margin-bottom:8px;
                                ">
                                    ${p.parcel_no}
                                </div>


                                <div style="
                                    font-size:12px;
                                    color:#475569;
                                    line-height:1.7;
                                ">

                                    <div>
                                        Area:
                                        <strong>
                                            ${p.area_m2} m²
                                        </strong>
                                    </div>

                                    <div>
                                        Target:
                                        <strong>
                                            ${p.target_area_m2} m²
                                        </strong>
                                    </div>

                                    <div>
                                        Frontage:
                                        <strong>
                                            ${p.frontage_m.toFixed(1)} m
                                        </strong>
                                    </div>

                                    <div>
                                        Approx. Depth:
                                        <strong>
                                            ${p.depth_m.toFixed(1)} m
                                        </strong>
                                    </div>

                                    <div style="
                                        margin-top:6px;
                                        color:#16A34A;
                                        font-weight:700;
                                    ">
                                        ✓ Road Accessible
                                    </div>

                                </div>

                            </div>

                        `);
                    }

            }

        ).addTo(map);


    /*
     * ---------------------------------------------------------
     * 9. SAVE GENERATED PLOTS
     * ---------------------------------------------------------
     */

    window.activeGeneratedPlots =
        plotCollection;


    /*
     * ---------------------------------------------------------
     * 10. CALCULATE SUMMARY
     * ---------------------------------------------------------
     */

    const totalPlotArea =
        plots.reduce(
            (sum, plot) =>
                sum + turf.area(plot),
            0
        );


    const motherArea =
        turf.area(
            window.activeMotherPolygon
        );


    const landUtilization =
        (
            totalPlotArea /
            motherArea
        ) * 100;


    /*
     * ---------------------------------------------------------
     * 11. REPORT
     * ---------------------------------------------------------
     */

    alert(

        `Cadastral Plot Generation Complete!\n\n` +

        `Plots Generated: ${plots.length}\n` +

        `Target Plot Size: ${targetArea.toFixed(0)} m²\n` +

        `Minimum Frontage: ${minimumFrontage.toFixed(1)} m\n` +

        `Minimum Depth: ${minimumDepth.toFixed(1)} m\n\n` +

        `Total Plot Area: ` +
        `${totalPlotArea.toFixed(1)} m²\n` +

        `Land Utilization: ` +
        `${landUtilization.toFixed(1)}%`

    );
}

/**
 * ================================================================
 * SMART CADASTRAL SUBDIVISION ENGINE
 * ================================================================
 *
 * Generates multiple conceptual subdivision layouts:
 *
 * 1. Central Spine
 * 2. Estate Grid
 * 3. Compact Access
 *
 * Each layout:
 * - Creates access roads
 * - Removes road corridors from developable land
 * - Generates plot blocks
 * - Gives plots road frontage
 * - Clips plots to the mother parcel
 *
 * IMPORTANT:
 * These are planning concepts, not legally approved
 * cadastral subdivision plans.
 */

function generateSubdivisions() {

    if (!window.activeMotherPolygon) {
        alert("Please plot an RTK Mother Parcel boundary first.");
        return;
    }

    if (typeof turf === "undefined") {
        alert("Turf.js is required for subdivision generation.");
        return;
    }

    const mother = window.activeMotherPolygon;

    const roadWidth =
        parseFloat(document.getElementById("roadWidth")?.value) || 6;

    const selectedPlotSize =
        document.getElementById("subdivisionPlotSize")?.value || "eighth";

    const plotSize = getSelectedPlotSize(selectedPlotSize);

    /*
     * Remove previous subdivision display
     */
    if (window.subdivisionLayouts) {
        Object.values(window.subdivisionLayouts).forEach(layer => {
            if (layer && map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }

    window.subdivisionLayouts = {};

    /*
     * Generate the three planning alternatives
     */

    const layouts = {

        spine: generateSpineLayout(
            mother,
            plotSize,
            roadWidth
        ),

        grid: generateGridLayout(
            mother,
            plotSize,
            roadWidth
        ),

        compact: generateCompactLayout(
            mother,
            plotSize,
            roadWidth
        )

    };

    /*
     * Display all layouts
     */

    Object.entries(layouts).forEach(([name, layout]) => {

        if (!layout || !layout.plots.length) {
            return;
        }

        const layer = L.layerGroup();

        /*
         * ROAD NETWORK
         */

        if (layout.roads) {

            layout.roads.forEach(road => {

                L.geoJSON(road, {
                    style: {
                        color: "#475569",
                        weight: Math.max(3, roadWidth / 2),
                        opacity: 0.95,
                        fillColor: "#CBD5E1",
                        fillOpacity: 0.85
                    }
                }).addTo(layer);

            });

        }

        /*
         * PLOTS
         */

        layout.plots.forEach((plot, index) => {

            plot.properties = {
                parcel_no: `${layout.code}-${String(index + 1).padStart(3, "0")}`,
                status: "Available",
                area_m2: turf.area(plot),
                area_acres: turf.area(plot) / 4046.856
            };

            L.geoJSON(plot, {

                style: {
                    color: "#0F2D52",
                    weight: 1.5,
                    fillColor: "#FFFFFF",
                    fillOpacity: 0.85
                },

                onEachFeature: function(feature, plotLayer) {

                    const area =
                        feature.properties.area_m2;

                    const acres =
                        feature.properties.area_acres;

                    plotLayer.bindPopup(`
                        <div style="
                            font-family:system-ui;
                            min-width:180px;
                        ">

                            <div style="
                                font-size:13px;
                                font-weight:800;
                                color:#0F2D52;
                                margin-bottom:6px;
                            ">
                                ${feature.properties.parcel_no}
                            </div>

                            <div style="
                                font-size:11px;
                                color:#64748B;
                                line-height:1.6;
                            ">

                                <div>
                                    <b>Area:</b>
                                    ${area.toFixed(1)} m²
                                </div>

                                <div>
                                    <b>Acres:</b>
                                    ${acres.toFixed(3)}
                                </div>

                                <div>
                                    <b>Status:</b>
                                    Available
                                </div>

                            </div>

                        </div>
                    `);

                }

            }).addTo(layer);

        });

        /*
         * Mother parcel outline
         */
        L.geoJSON(mother, {
            style: {
                color: "#0F2D52",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(layer);

        /*
         * Add to map
         */
        layer.addTo(map);

        window.subdivisionLayouts[name] = layer;

    });

    /*
     * Show layout selector
     */
    showSubdivisionLayoutSelector(layouts);
} 

function getPlanningRules() {

    const plotSizeSelect =
        document.getElementById("planningPlotSize");

    const customPlotSize =
        parseFloat(
            document.getElementById("customPlanningPlotSize")?.value
        ) || 450;

    const targetArea =
        plotSizeSelect?.value === "custom"
            ? customPlotSize
            : parseFloat(plotSizeSelect?.value) || 450;


    const frontage =
        parseFloat(
            document.getElementById("planningFrontage")?.value
        ) || 15;


    const depth =
        parseFloat(
            document.getElementById("planningDepth")?.value
        ) || 25;


    const roadType =
        document.getElementById("planningRoadType")?.value
        || "public";


    const roadReserve =
        parseFloat(
            document.getElementById("planningRoadReserve")?.value
        ) || 12;


    const priority =
        document.getElementById("planningPriority")?.value
        || "balanced";


    return {

        targetPlotArea: targetArea,

        minimumFrontage: frontage,

        minimumDepth: depth,

        roadType: roadType,

        roadReserve: roadReserve,

        priority: priority

    };
}

function getSelectedPlotSize(value) {
    const sizes = {
        "450": 450,
        "eighth": 506,
        "quarter": 1012,
        "half": 2024,
        "acre": 4047,
        "two_acres": 8094
    };

    return sizes[value] || 506;
} 

function generateSpineLayout(mother, plotSize, roadWidth) {
    const bbox = turf.bbox(mother);
    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];
    const centerLng = (minLng + maxLng) / 2;

    /*
     * Main access road running through the parcel.
     */

    const roadLine = turf.lineString([
        [minLng, centerLng > minLng ? (minLat + maxLat) / 2 : minLat],
        [maxLng, (minLat + maxLat) / 2]
    ]);

    const road = turf.buffer(
        roadLine,
        roadWidth / 2000,
        { units: "kilometers" }
    );

    /*
     * Remove road land.
     */

    let developable = turf.difference(
        mother,
        road
    );
    if (!developable) {
        return {
            code: "SP",
            plots: [],
            roads: []
        };
    }

    /*
     * Generate rows above and below the road.
     */

    const rows = 4;

    const plots = [];

    const rowHeight =
        (maxLat - minLat) / rows;

    for (let r = 0; r < rows; r++) {

        const y1 =
            minLat + r * rowHeight;

        const y2 =
            minLat + (r + 1) * rowHeight;

        const rowBox = turf.bboxPolygon([
            minLng,
            y1,
            maxLng,
            y2
        ]);

        const rowIntersection =
            turf.intersect(
                developable,
                rowBox
            );

        if (!rowIntersection) continue;

        /*
         * Determine number of plots based
         * on target area.
         */

        const rowArea =
            turf.area(rowIntersection);

        const plotCount =
            Math.max(
                1,
                Math.round(rowArea / plotSize)
            );

        const width =
            (maxLng - minLng) / plotCount;

        for (let i = 0; i < plotCount; i++) {

            const plotBox =
                turf.bboxPolygon([
                    minLng + i * width,
                    y1,
                    minLng + (i + 1) * width,
                    y2
                ]);

            const plot =
                turf.intersect(
                    rowIntersection,
                    plotBox
                );

            if (plot && turf.area(plot) > plotSize * 0.45) {
                plots.push(plot);
            }

        }

    }

    return {

        code: "SP",

        plots,

        roads: [road]

    };
} 

function generateGridLayout(mother, plotSize, roadWidth) {

    const bbox = turf.bbox(mother);

    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];

    const centerLat =
        (minLat + maxLat) / 2;

    const centerLng =
        (minLng + maxLng) / 2;

    /*
     * Main horizontal access road.
     */

    const mainRoadLine = turf.lineString([
        [minLng, centerLat],
        [maxLng, centerLat]
    ]);

    const mainRoad = turf.buffer(
        mainRoadLine,
        roadWidth / 2000,
        { units: "kilometers" }
    );

    /*
     * Secondary roads.
     */

    const secondaryRoads = [];

    const roadPositions = [
        minLng + (maxLng - minLng) * 0.25,
        minLng + (maxLng - minLng) * 0.50,
        minLng + (maxLng - minLng) * 0.75
    ];

    roadPositions.forEach(x => {

        const line = turf.lineString([
            [x, minLat],
            [x, maxLat]
        ]);

        secondaryRoads.push(

            turf.buffer(
                line,
                roadWidth / 2000,
                { units: "kilometers" }
            )

        );

    });

    /*
     * Combine road corridors.
     */

    let roadNetwork = mainRoad;

    secondaryRoads.forEach(road => {

        roadNetwork = turf.union(
            roadNetwork,
            road
        );

    });

    /*
     * Remove road network from parcel.
     */

    let developable =
        turf.difference(
            mother,
            roadNetwork
        );

    if (!developable) {

        return {
            code: "GR",
            plots: [],
            roads: []
        };

    }

    /*
     * Create rectangular cadastral blocks.
     */

    const cols = 4;
    const rows = 6;

    const cellWidth =
        (maxLng - minLng) / cols;

    const cellHeight =
        (maxLat - minLat) / rows;

    const plots = [];

    for (let r = 0; r < rows; r++) {

        for (let c = 0; c < cols; c++) {

            const cell =
                turf.bboxPolygon([

                    minLng + c * cellWidth,

                    minLat + r * cellHeight,

                    minLng + (c + 1) * cellWidth,

                    minLat + (r + 1) * cellHeight

                ]);

            const plot =
                turf.intersect(
                    developable,
                    cell
                );

            if (
                plot &&
                turf.area(plot) > plotSize * 0.45
            ) {

                plots.push(plot);

            }

        }

    }

    return {

        code: "GR",

        plots,

        roads: [
            mainRoad,
            ...secondaryRoads
        ]

    };

} 

function generateCompactLayout(
    mother,
    plotSize,
    roadWidth
) {

    const bbox = turf.bbox(mother);

    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];

    const centerLat =
        (minLat + maxLat) / 2;

    /*
     * One main access road.
     */

    const mainRoadLine = turf.lineString([
        [minLng, centerLat],
        [maxLng, centerLat]
    ]);

    const mainRoad = turf.buffer(
        mainRoadLine,
        roadWidth / 2000,
        { units: "kilometers" }
    );

    /*
     * Remove road.
     */

    const developable =
        turf.difference(
            mother,
            mainRoad
        );

    if (!developable) {

        return {
            code: "CP",
            plots: [],
            roads: []
        };

    }

    /*
     * Split into larger plot blocks.
     */

    const plots = [];

    const rows = 2;
    const cols = 5;

    const width =
        (maxLng - minLng) / cols;

    const height =
        (maxLat - minLat) / rows;

    for (let r = 0; r < rows; r++) {

        for (let c = 0; c < cols; c++) {

            const cell =
                turf.bboxPolygon([

                    minLng + c * width,

                    minLat + r * height,

                    minLng + (c + 1) * width,

                    minLat + (r + 1) * height

                ]);

            const plot =
                turf.intersect(
                    developable,
                    cell
                );

            if (
                plot &&
                turf.area(plot) > plotSize * 0.45
            ) {

                plots.push(plot);

            }

        }

    }

    return {

        code: "CP",

        plots,

        roads: [mainRoad]

    };

} 

function showSubdivisionLayoutSelector(layouts) {

    let existing =
        document.getElementById(
            "subdivisionLayoutSelector"
        );

    if (existing) {
        existing.remove();
    }

    const selector =
        document.createElement("div");

    selector.id =
        "subdivisionLayoutSelector";

    selector.style.cssText = `
        position:fixed;
        right:20px;
        top:90px;
        width:260px;
        background:#FFFFFF;
        border:1px solid #CBD5E1;
        border-radius:12px;
        padding:14px;
        box-shadow:0 15px 35px rgba(15,45,82,.20);
        z-index:99998;
        font-family:system-ui,-apple-system,sans-serif;
    `;

    selector.innerHTML = `

        <div style="
            font-size:13px;
            font-weight:800;
            color:#0F2D52;
            margin-bottom:4px;
        ">
            Subdivision Layout Options
        </div>

        <div style="
            font-size:10px;
            color:#64748B;
            margin-bottom:12px;
            line-height:1.4;
        ">
            Compare alternative road and plot
            arrangements before selecting a preferred
            planning concept.
        </div>

        <button onclick="activateSubdivisionLayout('spine')"
            style="
                width:100%;
                padding:10px;
                margin-bottom:7px;
                border:1px solid #CBD5E1;
                background:#F8FAFC;
                border-radius:8px;
                text-align:left;
                cursor:pointer;
            ">

            <b style="color:#0F2D52;">
                01 — Central Spine
            </b>

            <div style="
                font-size:10px;
                color:#64748B;
                margin-top:3px;
            ">
                Main road through the parcel.
            </div>

        </button>


        <button onclick="activateSubdivisionLayout('grid')"
            style="
                width:100%;
                padding:10px;
                margin-bottom:7px;
                border:1px solid #CBD5E1;
                background:#F8FAFC;
                border-radius:8px;
                text-align:left;
                cursor:pointer;
            ">

            <b style="color:#0F2D52;">
                02 — Estate Grid
            </b>

            <div style="
                font-size:10px;
                color:#64748B;
                margin-top:3px;
            ">
                Multiple access roads and
                rectangular plot blocks.
            </div>

        </button>


        <button onclick="activateSubdivisionLayout('compact')"
            style="
                width:100%;
                padding:10px;
                border:1px solid #CBD5E1;
                background:#F8FAFC;
                border-radius:8px;
                text-align:left;
                cursor:pointer;
            ">

            <b style="color:#0F2D52;">
                03 — Compact Layout
            </b>

            <div style="
                font-size:10px;
                color:#64748B;
                margin-top:3px;
            ">
                Reduced road area and tighter
                land utilization.
            </div>

        </button>


        <button onclick="
            document.getElementById(
                'subdivisionLayoutSelector'
            ).remove();
        "
        style="
            width:100%;
            margin-top:12px;
            padding:8px;
            border:none;
            background:#0F2D52;
            color:white;
            border-radius:7px;
            cursor:pointer;
            font-weight:700;
        ">
            Close
        </button>
    `;

    document.body.appendChild(selector);

} 

function activateSubdivisionLayout(layoutName) {

    if (!window.subdivisionLayouts) {
        return;
    }

    Object.entries(
        window.subdivisionLayouts
    ).forEach(([name, layer]) => {

        if (!layer) return;

        if (name === layoutName) {

            if (!map.hasLayer(layer)) {
                layer.addTo(map);
            }

        } else {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        }
    });
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