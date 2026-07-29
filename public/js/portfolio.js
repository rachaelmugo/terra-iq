/* ==========================================================================
   🏢 TERRA-IQ - PORTFOLIO MODULE (portfolio.js)
   ========================================================================== */

window.allFeatures = window.allFeatures || []; 
window.selectedParcelId = window.selectedParcelId || null;
window.currentProject = window.currentProject || "all";

document.addEventListener("DOMContentLoaded", () => {
    initPortfolioModule();
});

// Master Init function callable across routing events
function initPortfolioModule() {
    loadProjects();
    setupSearchListener();
}

// Attach Search Listener
function setupSearchListener() {
    const searchInput = document.getElementById("search");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = (window.allFeatures || []).filter(f => {
            const p = f.properties || {};
            return (
                String(p.parcel_no || '').toLowerCase().includes(query) ||
                String(p.price || '').includes(query) ||
                String(p.status || '').toLowerCase().includes(query) ||
                String(p.property_id || '').toLowerCase().includes(query)
            );
        });

        if (typeof renderList === "function") renderList(filtered);
        if (typeof drawMap === "function") drawMap(filtered);
    });
}

// Fetch projects and populate select dropdown
async function loadProjects() {
    try {
        const response = await fetch("http://localhost:3000/projects");
        const projects = await response.json();

        const select = document.getElementById("projectSelect");
        if (!select) return;

        select.innerHTML = `
            <option value="" disabled selected hidden>Select Development...</option>
            <option value="all">🌍 All Projects</option>
        `;

        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = `${project.project_code || ''} • ${project.project_name}`;
            select.appendChild(option);
        });

        select.onchange = function () {
            window.currentProject = this.value;

            if (!window.currentProject) return;

            if (window.currentProject === "all") {
                loadAllProjects();
            } else {
                loadProject(window.currentProject);
            }
        };

        // Default run on startup
        loadAllProjects();

    } catch (err) {
        console.error("Error loading project list:", err);
    }
}

// Load individual project data
async function loadProject(projectId) {
    try {
        const projectResp = await fetch(`http://localhost:3000/projects/${projectId}`);
        const project = await projectResp.json();

        if (typeof drawSingleProjectMarker === "function") {
            drawSingleProjectMarker(project);
        }

        const parcelsResponse = await fetch(`http://localhost:3000/projects/${projectId}/parcels`);
        const geojson = await parcelsResponse.json();

        window.allFeatures = geojson.features || [];
        updateSidebarStats(window.allFeatures);

        if (typeof renderList === "function") renderList(window.allFeatures);

        if (typeof drawMap === "function") {
            drawMap(window.allFeatures, false);
        }

    } catch (err) {
        console.error("Error loading single project data:", err);
    }
}

// Load all projects data
async function loadAllProjects() {
    try {
        if (typeof singleMarkerGroup !== "undefined" && singleMarkerGroup) {
            singleMarkerGroup.clearLayers();
        }

        const response = await fetch("http://localhost:3000/parcels/geojson");
        const geojson = await response.json();

        window.allFeatures = geojson.features || [];
        updateSidebarStats(window.allFeatures);

        if (typeof renderList === "function") renderList(window.allFeatures);

        const projectsResp = await fetch("http://localhost:3000/projects");
        const projects = await projectsResp.json();

        if (typeof drawProjectMarkers === "function") {
            drawProjectMarkers(projects);
        }

        const propCardSection = document.getElementById("propertyCardSection");
        if (propCardSection) propCardSection.style.display = "none";

    } catch (err) {
        console.error("Error loading GeoJSON parcels or projects:", err);
    }
}

// Sidebar counter updater
function updateSidebarStats(features) {
    const parcelCountEl = document.getElementById("parcelCount");
    const availCountEl = document.getElementById("availableCount");
    const soldCountEl = document.getElementById("soldCount");

    if (parcelCountEl) parcelCountEl.textContent = features.length;
    if (availCountEl) {
        availCountEl.textContent = features.filter(f =>
            (f.properties.status || "").toLowerCase().includes("available")
        ).length;
    }
    if (soldCountEl) {
        soldCountEl.textContent = features.filter(f =>
            (f.properties.status || "").toLowerCase().includes("sold")
        ).length;
    }
}