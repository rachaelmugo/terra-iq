/* ==========================================================================
   🏢 TERRA-IQ - APP ENGINE (app.js)
   ========================================================================== */

// Shared Global State
window.currentProject = "all";
window.allFeatures = window.allFeatures || [];
window.selectedParcelId = window.selectedParcelId || null;

document.addEventListener("DOMContentLoaded", () => {
    initNavigationRouter();
});

// --------------------------------------------------------------------------
// 1. PAGE ROUTER & DYNAMIC CONTENT LOADER
// --------------------------------------------------------------------------
async function loadPage(page) {
    const contentEl = document.getElementById("content");
    if (!contentEl) return;

    try {
        const response = await fetch(`pages/${page}`);
        const html = await response.text();
        contentEl.innerHTML = html;

        const titles = {
            "dashboard.html": "Dashboard",
            "portfolio.html": "Portfolio",
            "projects.html": "Projects",
            "project.html": "Project Management",
            "parcel.html": "Parcel Explorer",
            "parcel-management.html": "Parcel Management",
            "customers.html": "Customers",
            "reservation.html": "Reservations",
            "admin.html": "Administration"
        };

        const titleEl = document.getElementById("pageTitle");
        if (titleEl) {
            titleEl.textContent = titles[page] || "TerraIQ";
        }

        if (page === "portfolio.html" || page === "parcel.html" || document.getElementById("projectSelect")) {
            if (typeof initPortfolioModule === "function") {
                initPortfolioModule();
            }
        }
    } catch (err) {
        console.error(`Error loading page ${page}:`, err);
    }
}

function initNavigationRouter() {
    document.querySelectorAll(".navItem").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".navItem")
                .forEach(btn => btn.classList.remove("active"));

            this.classList.add("active");
            loadPage(this.dataset.page);
        });
    });
} 

// =========================================================
// 📱 GOOGLE EARTH MOBILE MENU SHEET LOGIC
// =========================================================
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const closeMobileSidebarBtn = document.getElementById("closeMobileSidebar");
const sidebar = document.getElementById("sidebar");

// Safely obtain or create backdrop overlay
let overlay = document.querySelector(".mobile-overlay");
if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "mobile-overlay hidden";
    document.body.appendChild(overlay);
}

function openMobileMenu(e) {
    if (e) e.stopPropagation();
    sidebar?.classList.add("mobile-open", "open");
    overlay.classList.remove("hidden");
    
    // Force Leaflet map tile recalculation when drawer opens
    setTimeout(() => {
        if (typeof map !== "undefined" && map?.invalidateSize) map.invalidateSize();
    }, 300);
}

function closeMobileMenu(e) {
    if (e) e.stopPropagation();
    sidebar?.classList.remove("mobile-open", "open");
    overlay.classList.add("hidden");

    // Recalculate Leaflet view when drawer closes
    setTimeout(() => {
        if (typeof map !== "undefined" && map?.invalidateSize) map.invalidateSize();
    }, 300);
}

// Attach Event Listeners
if (mobileMenuBtn) {
    mobileMenuBtn.onclick = openMobileMenu;
}

if (closeMobileSidebarBtn) {
    closeMobileSidebarBtn.onclick = closeMobileMenu;
}

overlay.onclick = closeMobileMenu;

if (sidebar) {
    sidebar.onclick = (e) => e.stopPropagation();
}

// Close bottom sheet when selecting a item from list
const parcelList = document.getElementById("list");
if (parcelList) {
    parcelList.addEventListener("click", closeMobileMenu);
}

// Expose globally so map click handlers can trigger the sheet
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// --- INITIALIZATION ---
initInfrastructureLayers();

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

// --------------------------------------------------------------------------
// 7LAYERS MANAGER POPUP CONTROLLER
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const layersBtn = document.getElementById("layersBtn");
    const layerPanel = document.getElementById("layerPanel");
    const closeLayersBtn = document.getElementById("closeLayersBtn");

    if (layersBtn && layerPanel) {
      layersBtn.addEventListener("click", (e) => {
    console.log("Toggle function running");
            e.stopPropagation();
            layerPanel.classList.toggle("hidden");
            layersBtn.classList.toggle("active", !layerPanel.classList.contains("hidden"));
        });
    }

    if (closeLayersBtn && layerPanel) {
        closeLayersBtn.addEventListener("click", () => {
            layerPanel.classList.add("hidden");
            if (layersBtn) layersBtn.classList.remove("active");
        });
    }

    // Close panel when clicking anywhere outside on the map
    document.addEventListener("click", (e) => {
        if (layerPanel && !layerPanel.classList.contains("hidden")) {
            if (!layerPanel.contains(e.target) && !layersBtn.contains(e.target)) {
                layerPanel.classList.add("hidden");
                if (layersBtn) layersBtn.classList.remove("active");
            }
        }
    });
});