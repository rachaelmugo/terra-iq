
function formatDistance(meters) {

    if (meters === null || meters === undefined || isNaN(meters)) {
        return "N/A";
    }

    meters = Number(meters);

    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
}

/* ==========================================================================
   🏢 TERRA-IQ - UI RENDERER (ui.js)
   ========================================================================== */
function showDetails(p, metrics = null) {
    // 📱 1. MOBILE DRAWER TRIGGER: Automatically open sidebar when parcel is clicked
// 📱 1. Safely open mobile menu via your global helper
    // 📱 MOBILE DRAWER OPEN
if(window.innerWidth <= 768){

    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".mobile-overlay");

    if(sidebar){
        sidebar.classList.add("mobile-open");
        sidebar.classList.add("open");
        sidebar.scrollTop = 0;
    }

    if(overlay){
        overlay.classList.remove("hidden");
    }
    
    // Disable Leaflet gestures while drawer is active
    if(typeof map !== "undefined" && map){
        if(map.dragging) map.dragging.disable();
        if(map.touchZoom) map.touchZoom.disable();
        if(map.doubleClickZoom) map.doubleClickZoom.disable();
        if(map.scrollWheelZoom) map.scrollWheelZoom.disable();
        if(map.boxZoom) map.boxZoom.disable();
    }
}
    // -------------------------------------------------------------
    // EXISTING LOGIC STARTS HERE
    // -------------------------------------------------------------
    let statusColor = "#16a34a";
    const statusLower = (p.status || "").toLowerCase();

    if (statusLower.includes("sold")) statusColor = "#ef4444";
    if (statusLower.includes("reserved") || statusLower.includes("booked")) statusColor = "#D4A017";

    const propCardSection = document.getElementById("propertyCardSection");
    if (propCardSection) propCardSection.style.display = "block";

    const detailsEl = document.getElementById("details");
    if (!detailsEl) return;

    const lat = p.lat || p.latitude || "";
    const lng = p.lng || p.longitude || "";

    detailsEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-size:22px;font-weight:700;color:#0F2D52;">
                📍 Parcel ${p.parcel_no}
            </div>
            <div style="font-size:13px;color:#6B7280;margin-top:4px;">
                Property ID: ${p.property_id || "N/A"}
            </div>
        </div>
        <div style="background:${statusColor};color:white;padding:8px 14px;border-radius:25px;font-weight:bold;font-size:13px;text-transform:uppercase;">
            ${p.status || 'Available'}
        </div>
    </div>

    <hr style="margin:18px 0;border:none;border-top:1px solid #E5E7EB;">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:#ffffff;padding:14px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);">
            <div style="font-size:12px;color:#6B7280;">💰 Price</div>
            <div style="font-size:18px;font-weight:bold;color:#0F2D52;margin-top:5px;">
                KSh ${Number(p.price || 0).toLocaleString()}
            </div>
        </div>
        <div style="background:#ffffff;padding:14px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);">
            <div style="font-size:12px;color:#6B7280;">📐 Size</div>
            <div style="font-size:18px;font-weight:bold;color:#0F2D52;margin-top:5px;">
                ${p.size || 'N/A'}
            </div>
        </div>
        <div style="background:#ffffff;padding:14px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);">
            <div style="font-size:12px;color:#6B7280;">🗺 Area</div>
            <div style="font-size:18px;font-weight:bold;color:#0F2D52;margin-top:5px;">
                ${p.area || 'N/A'} m²
            </div>
        </div>
        <div style="background:#ffffff;padding:14px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);">
            <div style="font-size:12px;color:#6B7280;">📄 Title</div>
            <div style="font-size:18px;font-weight:bold;color:#0F2D52;margin-top:5px;">
                Ready
            </div>
        </div>
    </div>

    
<!-- 🌟 LIVE PROPERTY INTELLIGENCE -->

<div style="
    margin-top:20px;
    padding:18px;
    border-radius:14px;
    background:linear-gradient(135deg,#0F2D52,#1E4E8C);
    color:white;">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
            <div style="font-size:16px;font-weight:bold;">
                🧠 Parcel Intelligence
            </div>
            <div style="font-size:11px;color:#CBD5E1;margin-top:3px;">
                Spatial analysis based on nearby infrastructure & amenities
            </div>
        </div>

        <div style="text-align:right;">
            <div style="font-size:10px;color:#CBD5E1;">
                OVERALL
            </div>
            <strong style="color:#FFD54A;font-size:24px;">
                ${Number(p.overall_intelligence_score || 0).toFixed(1)}%
            </strong>
        </div>
    </div>

    <!-- SCORE GRID -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

        <!-- ROAD -->
        <div style="background:rgba(255,255,255,0.10);padding:12px;border-radius:10px;">
            <div style="font-size:11px;color:#CBD5E1;">
                🛣️ Road Accessibility
            </div>
            <div style="font-size:20px;font-weight:800;color:#FFD54A;margin-top:4px;">
                ${Number(p.road_accessibility_score || 0).toFixed(1)}%
            </div>
        </div>

        <!-- AMENITIES -->
        <div style="background:rgba(255,255,255,0.10);padding:12px;border-radius:10px;">
            <div style="font-size:11px;color:#CBD5E1;">
                🏫 Amenity Access
            </div>
            <div style="font-size:20px;font-weight:800;color:#FFD54A;margin-top:4px;">
                ${Number(p.amenity_access_score || 0).toFixed(1)}%
            </div>
        </div>


        <!-- TRANSPORT -->
        <div style="background:rgba(255,255,255,0.10);padding:12px;border-radius:10px;">
            <div style="font-size:11px;color:#CBD5E1;">
                🚌 Public Transport
            </div>
            <div style="font-size:20px;font-weight:800;color:#FFD54A;margin-top:4px;">
                ${Number(p.public_transport_score || 0).toFixed(1)}%
            </div>
        </div>


        <!-- DEVELOPMENT -->
        <div style="background:rgba(255,255,255,0.10);padding:12px;border-radius:10px;">
            <div style="font-size:11px;color:#CBD5E1;">
                🏭 Development Context
            </div>
            <div style="font-size:20px;font-weight:800;color:#FFD54A;margin-top:4px;">
                ${Number(p.development_context_score || 0).toFixed(1)}%
            </div>
        </div>

    </div>


    <!-- GREEN -->
    <div style="margin-top:10px;background:rgba(255,255,255,0.10);padding:12px;border-radius:10px;">

        <div style="display:flex;justify-content:space-between;align-items:center;">

            <div>
                <div style="font-size:11px;color:#CBD5E1;">
                    🌳 Green & Recreation
                </div>

                <div style="font-size:13px;margin-top:4px;">
                    Nearest park:
                    <strong>
                        ${formatDistance(p.nearest_park_m)}
                    </strong>
                </div>
            </div>

            <strong style="font-size:20px;color:#FFD54A;">
                ${Number(p.green_recreation_score || 0).toFixed(1)}%
            </strong>

        </div>

    </div> 
</div>


   <!-- ACCESSIBILITY EVIDENCE -->
<div style=" margin-top:20px; padding:14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; "> <div style=" font-size:14px; font-weight:800; color:#0F2D52; letter-spacing:.4px; margin-bottom:12px; "> 📍 Accessibility Evidence </div>

<div style="
    display:flex;
    flex-direction:column;
    gap:8px;
    font-size:12px;
    color:#475569;
">

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <span>🛣️ Nearest road</span>
        <strong style="color:#0F2D52;font-weight:800;">
            ${formatDistance(p.nearest_road_m)}
        </strong>
    </div>

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <span>🚌 Nearest bus stop</span>
        <strong style="color:#0F2D52;font-weight:800;">
            ${formatDistance(p.nearest_bus_stop_m)}
        </strong>
    </div>

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <span>🚆 Nearest railway</span>
        <strong style="color:#0F2D52;font-weight:800;">
            ${formatDistance(p.nearest_railway_m)}
        </strong>
    </div>

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <span>🌊 Nearest waterway</span>
        <strong style="color:#0F2D52;font-weight:800;">
            ${formatDistance(p.nearest_waterway_m)}
        </strong>
    </div>

    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <span>🏙️ Nearest town</span>
        <strong style="color:#0F2D52;font-weight:800;">
            ${p.nearest_town || "N/A"} — ${formatDistance(p.town_distance_m)}
        </strong>
    </div>

</div>


<hr style="
    border:none;
    border-top:1px solid #E2E8F0;
    margin:16px 0;
">


<!-- AMENITIES -->
<div style="
    font-size:12px;
    font-weight:800;
    color:#0F2D52;
    letter-spacing:.5px;
    text-transform:uppercase;
    margin-bottom:10px;
">
    🏫 Nearby Amenities
</div>

<div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    font-size:12px;
    color:#475569;
">

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>🏫 Schools</span>
        <strong style="color:#0F2D52;">
            ${p.schools_within_1km || 0}
        </strong>
    </div>

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>🧒 Kindergartens</span>
        <strong style="color:#0F2D52;">
            ${p.kindergartens_within_1km || 0}
        </strong>
    </div>

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>🏥 Hospitals</span>
        <strong style="color:#0F2D52;">
            ${p.hospitals_within_5km || 0}
        </strong>
    </div>

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>🛒 Marketplaces</span>
        <strong style="color:#0F2D52;">
            ${p.marketplaces_within_3km || 0}
        </strong>
    </div>

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>💳 Financial services</span>
        <strong style="color:#0F2D52;">
            ${p.financial_services_within_3km || 0}
        </strong>
    </div>

    <div style="
        padding:9px 10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        <span>🍽️ Restaurants</span>
        <strong style="color:#0F2D52;">
            ${p.restaurants_food_within_3km || 0}
        </strong>
    </div>

</div>


<hr style="
    border:none;
    border-top:1px solid #E2E8F0;
    margin:16px 0;
">


<!-- DEVELOPMENT CONTEXT -->
<div style="
    font-size:12px;
    font-weight:800;
    color:#0F2D52;
    letter-spacing:.5px;
    text-transform:uppercase;
    margin-bottom:10px;
">
    🏭 Development Context
</div>

<div style="
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    font-size:12px;
    color:#475569;
">

    <div style="
        padding:10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <div style="font-size:10px;color:#64748B;">
            🏘️ Residential
        </div>
        <strong style="
            display:block;
            margin-top:4px;
            color:#0F2D52;
        ">
            ${formatDistance(p.nearest_residential_m)}
        </strong>
    </div>

    <div style="
        padding:10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <div style="font-size:10px;color:#64748B;">
            🏢 Commercial
        </div>
        <strong style="
            display:block;
            margin-top:4px;
            color:#0F2D52;
        ">
            ${formatDistance(p.nearest_commercial_m)}
        </strong>
    </div>

    <div style="
        padding:10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <div style="font-size:10px;color:#64748B;">
            🛍️ Retail
        </div>
        <strong style="
            display:block;
            margin-top:4px;
            color:#0F2D52;
        ">
            ${formatDistance(p.nearest_retail_m)}
        </strong>
    </div>

    <div style="
        padding:10px;
        background:#F8FAFC;
        border:1px solid #E2E8F0;
        border-radius:7px;
    ">
        <div style="font-size:10px;color:#64748B;">
            🏭 Industrial
        </div>
        <strong style="
            display:block;
            margin-top:4px;
            color:#0F2D52;
        ">
            ${formatDistance(p.nearest_industrial_m)}
        </strong>
    </div>

</div>


<!-- INTERPRETATION -->
<div style="
    margin-top:16px;
    padding:12px;
    border-radius:8px;
    background:#F8FAFC;
    border:1px solid #E2E8F0;
    border-left:3px solid #D4A017;
    font-size:11px;
    line-height:1.5;
    color:#64748B;
">

    <div style="
        font-size:11px;
        font-weight:800;
        color:#0F2D52;
        margin-bottom:4px;
    ">
        🧠 Terra-IQ Analysis
    </div>

    This parcel's intelligence score is based on
    accessibility, nearby amenities, transportation,
    development context and green-space proximity.

</div> 

    <h3 style="margin-top:25px;color:#0F2D52;">Reserve Parcel</h3>

    <button id="openReservationForm" style="width:100%;background:#D4A017;color:white;border:none;padding:14px;border-radius:12px;font-weight:bold;cursor:pointer;">
        Reserve Now
    </button>

    <div id="reservationForm" style="display:none;margin-top:18px;">
        <input id="customerName" placeholder="Customer Name" style="width:100%;margin-bottom:8px;padding:8px;border-radius:6px;border:1px solid #CCC;">
        <input id="customerPhone" placeholder="Phone Number" style="width:100%;margin-bottom:8px;padding:8px;border-radius:6px;border:1px solid #CCC;">
        <input id="customerEmail" placeholder="Email Address" style="width:100%;margin-bottom:8px;padding:8px;border-radius:6px;border:1px solid #CCC;">
        <input id="customerID" placeholder="National ID" style="width:100%;margin-bottom:8px;padding:8px;border-radius:6px;border:1px solid #CCC;">
        <button onclick="reserveParcel('${p.id || p.parcel_no}')" style="width:100%;background:#16a34a;color:white;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:bold;">
            Confirm Reservation
        </button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px;">
        <button onclick="openParcelDocuments('${p.parcel_no || p.id}')" style="background:#0F2D52;color:white;border:none;padding:12px;border-radius:10px;cursor:pointer;font-weight:bold;">
            📄 Documents
        </button>
        <button onclick="navigateToParcel('${lat}', '${lng}')" style="background:#D4A017;color:white;border:none;padding:12px;border-radius:10px;cursor:pointer;font-weight:bold;">
            🧭 Navigate
        </button>
    </div>
    `;

    const reserveBtn = document.getElementById("openReservationForm");
    if (reserveBtn) {
        reserveBtn.onclick = function() {
            document.getElementById("reservationForm").style.display = "block";
            this.style.display = "none";
        };
    }
}

function renderList(features) {
    const list = document.getElementById("list");
    if (!list) return;

    list.innerHTML = "";

    if (!features || features.length === 0) {
        list.innerHTML = `<div style="padding:12px; color:#64748B; font-size:12px; text-align:center;">No matching parcels found.</div>`;
        return;
    }

    features.forEach(f => {
        const p = f.properties || {};
        const div = document.createElement("div");

        const statusLower = (p.status || "").toLowerCase();
        let badgeClass = "badge-available";
        let borderColor = "#16a34a";

        if (statusLower.includes("sold")) {
            badgeClass = "badge-sold";
            borderColor = "#ef4444";
        } else if (statusLower.includes("reserved")) {
            badgeClass = "badge-reserved";
            borderColor = "#facc15";
        }

        div.className = "card";
        div.style.borderLeft = `5px solid ${borderColor}`;

        div.innerHTML = `
            <div class="card-header-row">
                <span class="card-parcel-title">Parcel ${p.parcel_no}</span>
                <span class="card-status-badge ${badgeClass}">${p.status || 'Available'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                <span class="card-price">KSh ${Number(p.price || 0).toLocaleString()}</span>
                <span style="font-size:11px; font-weight:600; color:#64748B;">📐 ${p.size || 'N/A'}</span>
            </div>
        `;

        div.onclick = () => {
    window.selectedParcelId = p.parcel_no;
    
    if (typeof map !== "undefined" && typeof L !== "undefined") {
        map.fitBounds(L.geoJSON(f).getBounds());
    }
    
    // 1. Render detail view template
console.log("🧠 CLICKED PARCEL DATA:", p);
showDetails(p);

    // 2. Perform spatial calculations
    let roadDist = null;
    let amenityDist = null;
    let riparianDist = null;
    let ketracoDist = null;

    if (typeof turf !== "undefined" && f) {
        try {
            const parcelCentroid = turf.centroid(f);

            // Access global layers safely via window
            const roadsFC = typeof getGeoJSONFromLayerGroup === "function" 
                ? getGeoJSONFromLayerGroup(window.roadsLayer) 
                : turf.featureCollection([]);
                
            if (roadsFC.features.length > 0) {
                const nearestRoad = turf.nearestPointOnLine(roadsFC, parcelCentroid);
                roadDist = Math.round(turf.distance(parcelCentroid, nearestRoad, { units: 'kilometers' }) * 1000);
            }

            const hFC = typeof getGeoJSONFromLayerGroup === "function" ? getGeoJSONFromLayerGroup(window.hospitalsLayer) : turf.featureCollection([]);
            const sFC = typeof getGeoJSONFromLayerGroup === "function" ? getGeoJSONFromLayerGroup(window.schoolsLayer) : turf.featureCollection([]);
            const combined = [...hFC.features, ...sFC.features];

            if (combined.length > 0) {
                const amenityFC = turf.featureCollection(combined);
                const nearestAmenity = turf.nearestPoint(parcelCentroid, amenityFC);
                amenityDist = Math.round(turf.distance(parcelCentroid, nearestAmenity, { units: 'kilometers' }) * 1000);
            }

            const powerFC = typeof getGeoJSONFromLayerGroup === "function" ? getGeoJSONFromLayerGroup(window.ketracoLayer) : turf.featureCollection([]);
            if (powerFC.features.length > 0) {
                const nearestLine = turf.nearestPointOnLine(powerFC, parcelCentroid);
                ketracoDist = Math.round(turf.distance(parcelCentroid, nearestLine, { units: 'kilometers' }) * 1000);
            }

            if (p.riparian_distance !== undefined) {
                riparianDist = parseFloat(p.riparian_distance);
            }
        } catch (err) {
            console.warn("Turf error on list click:", err);
        }
    }

    // 3. Update dynamic intelligence display
    if (typeof updateParcelIntelligenceCard === "function") {
        updateParcelIntelligenceCard(p, roadDist, amenityDist, riparianDist, null, ketracoDist);
    }

    if (typeof drawMap === "function") {
        drawMap(window.allFeatures);
    }
};

        list.appendChild(div);
    });
}

async function reserveParcel(parcelId) {
    const customer_name = document.getElementById("customerName")?.value;
    const phone = document.getElementById("customerPhone")?.value;
    const email = document.getElementById("customerEmail")?.value;
    const national_id = document.getElementById("customerID")?.value;

    if (!customer_name || !phone) {
        alert("Please enter customer name and phone.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                parcel_id: parcelId,
                customer_name,
                phone,
                email,
                national_id
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("Reservation Successful!\n\nReservation No: " + result.reservationNo);

            if (window.currentProject === "all") {
                if (typeof loadAllProjects === "function") loadAllProjects();
            } else {
                if (typeof loadProject === "function") loadProject(window.currentProject);
            }
        } else {
            alert("Reservation failed: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Error submitting reservation:", err);
    }
}

/* ==========================================================================
   DOCUMENT VIEWER & NAVIGATION ACTION HANDLERS
   ========================================================================== */

function openParcelDocuments(parcelNo) {
    const activeParcel = parcelNo || window.selectedParcelId || "Selected Parcel";
    
    // Path to your document in public/documents/
    const documentPath = "documents/official_land_search.doc";

    let docModal = document.getElementById("docModal");
    if (!docModal) {
        docModal = document.createElement("div");
        docModal.id = "docModal";
        docModal.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            width: 480px; 
            max-width: 90vw; 
            background: #FFFFFF; 
            z-index: 99999;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
            border-radius: 12px; 
            padding: 22px;
            border: 1px solid #CBD5E1;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        document.body.appendChild(docModal);
    }

    docModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px;">
            <h3 style="font-size: 15px; font-weight: 800; color: #0F2D52; margin: 0;">📁 Cadastral Documents — Parcel ${activeParcel}</h3>
            <button onclick="document.getElementById('docModal').style.display='none'" style="background:none; border:none; font-size: 22px; cursor:pointer; color: #64748B; line-height: 1;">&times;</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                <div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F2D52;">📜 Official Land Title Search</div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 2px;">DOC File • Verified Search Certificate</div>
                </div>
                <a href="${documentPath}" download="Official_Land_Search_Parcel_${activeParcel}.doc" style="padding: 7px 14px; background: #2563EB; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Download
                </a>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                <div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F2D52;">📐 Cadastral Mutation Form & Beacon Plan</div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Survey Map • Beacon Coordinates</div>
                </div>
                <a href="${documentPath}" download="Mutation_Plan_Parcel_${activeParcel}.doc" style="padding: 7px 14px; background: #0F2D52; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Download
                </a>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                <div>
                    <div style="font-size: 13px; font-weight: 700; color: #0F2D52;">🛡️ Legal Clearance & NEMA Compliance</div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Environmental Clearance Cert</div>
                </div>
                <a href="${documentPath}" download="NEMA_Clearance_Parcel_${activeParcel}.doc" style="padding: 7px 14px; background: #0F2D52; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-block;">
                    Download
                </a>
            </div>
        </div>
    `;

    docModal.style.display = "block";
}

/**
 * Launches turn-by-turn navigation in Google Maps starting from the user's current location.
 * @param {number|string} [lat] 
 * @param {number|string} [lng] 
 */
function navigateToParcel(lat, lng) {
    if (!lat || !lng || lat === "" || lng === "") {
        if (window.selectedParcelCentroid) {
            lat = window.selectedParcelCentroid.lat;
            lng = window.selectedParcelCentroid.lng;
        } else if (typeof map !== "undefined" && map.getCenter) {
            const center = map.getCenter();
            lat = center.lat;
            lng = center.lng;
        }
    }

    if (!lat || !lng) {
        alert("Please select a parcel on the map first to get directions.");
        return;
    }

    const openMaps = (originLat = null, originLng = null) => {
        let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        if (originLat && originLng) {
            url += `&origin=${originLat},${originLng}`;
        }
        window.open(url, "_blank");
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                openMaps(userLat, userLng);
            },
            (error) => {
                console.warn("Geolocation permission denied or failed:", error.message);
                openMaps();
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        openMaps();
    }
}