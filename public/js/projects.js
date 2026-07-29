let currentProject = "all";
let allFeatures = [];

// 1. CALL loadProjects() AUTOMATICALLY ON PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
});

async function loadProjects() {
    try {
        const response = await fetch('http://localhost:3000/projects');
        const projects = await response.json();

        const select = document.getElementById("projectSelect");
        if (!select) return;

        select.innerHTML = `
            <option value="all">🌍 All Projects</option>
        `;

        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = `${project.project_code || ''} • ${project.project_name}`;
            select.appendChild(option);
        });

        select.onchange = function () {
            currentProject = this.value;
            if (currentProject === "all") {
                loadAllProjects();
            } else {
                loadProject(currentProject);
            }
        };

        // Load all projects by default on initial page load
        loadAllProjects();

    } catch (err) {
        console.error("Error loading projects:", err);
    }
}

async function loadProject(projectId) {
    try {
        const projectResponse = await fetch(`http://localhost:3000/projects/${projectId}`);
        const project = await projectResponse.json();

        // Safe update for project card IF element exists in DOM
        const projectCard = document.getElementById("projectCard");
        if (projectCard) {
            projectCard.innerHTML = `
                <div class="dashboardCard">
                    <div class="dashboardTitle">📊 Development Overview</div>
                    <div class="projectHeading">${project.project_name || project.name}</div>
                    <div class="projectSubheading">📍 ${project.location || "-"}</div>
                    <div class="projectTag">${project.title_status || "Ready Titles"}</div>
                    <div class="dashboardGrid">
                        <div class="dashboardStat">
                            <span>💰 Price From</span>
                            <h3>KSh ${Number(project.price_from || 0).toLocaleString()}</h3>
                        </div>
                        <div class="dashboardStat">
                            <span>📐 Plot Size</span>
                            <h3>${project.plot_size || "-"}</h3>
                        </div>
                        <div class="dashboardStat">
                            <span>🟢 Available</span>
                            <h3>${project.available || "-"}</h3>
                        </div>
                        <div class="dashboardStat">
                            <span>🔴 Sold</span>
                            <h3>${project.sold || "-"}</h3>
                        </div>
                    </div>
                </div>
            `;
        }

        const parcelsResponse = await fetch(`http://localhost:3000/projects/${projectId}/parcels`);
        const geojson = await parcelsResponse.json();

        allFeatures = geojson.features || [];

        // Safe element assignment for sidebar stats
        const parcelCountEl = document.getElementById("parcelCount");
        const availCountEl = document.getElementById("availableCount");
        const soldCountEl = document.getElementById("soldCount");

        if (parcelCountEl) parcelCountEl.textContent = allFeatures.length;
        if (availCountEl) availCountEl.textContent = allFeatures.filter(f =>
            (f.properties.status || "").toLowerCase().includes("available")
        ).length;
        if (soldCountEl) soldCountEl.textContent = allFeatures.filter(f =>
            (f.properties.status || "").toLowerCase().includes("sold")
        ).length;

        if (typeof renderList === "function") renderList(allFeatures);
        if (typeof drawMap === "function") drawMap(allFeatures);

    } catch (err) {
        console.error("Error loading project data:", err);
    }
}

async function loadAllProjects() {
    try {
        const response = await fetch("http://localhost:3000/parcels/geojson");
        const geojson = await response.json();

        allFeatures = geojson.features || [];

        // Calculate global stats across all projects
        const parcelCountEl = document.getElementById("parcelCount");
        const availCountEl = document.getElementById("availableCount");
        const soldCountEl = document.getElementById("soldCount");

        if (parcelCountEl) parcelCountEl.textContent = allFeatures.length;
        if (availCountEl) availCountEl.textContent = allFeatures.filter(f =>
            (f.properties.status || "").toLowerCase().includes("available")
        ).length;
        if (soldCountEl) soldCountEl.textContent = allFeatures.filter(f =>
            (f.properties.status || "").toLowerCase().includes("sold")
        ).length;

        if (typeof renderList === "function") renderList(allFeatures);
        if (typeof drawMap === "function") drawMap(allFeatures);

        const propCardSection = document.getElementById("propertyCardSection");
        if (propCardSection) propCardSection.style.display = "none";

        const details = document.getElementById("details");
        if (details) details.innerHTML = "";

    } catch (err) {
        console.error("Error loading all projects GeoJSON:", err);
    }
}