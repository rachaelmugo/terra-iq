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

/* ==========================================================================
   📱 MOBILE SIDEBAR & NAVIGATION CONTROLLER
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const closeBtn = document.getElementById("closeMobileSidebar");

    function toggleSidebar() {
        if (!sidebar) return;
        sidebar.classList.toggle("open");
        sidebar.classList.toggle("mobile-open");
    }

    if (menuBtn) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", toggleSidebar);
    }

    // Auto-close drawer on mobile when clicking a parcel card or menu item
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove("open", "mobile-open");
            }
        }
    });
}); 

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