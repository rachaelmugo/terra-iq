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

document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

});