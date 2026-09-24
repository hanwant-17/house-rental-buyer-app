// ===============================
// 🏠 HouseHub - Main Landing Page Script
// ===============================

// Dynamic Navbar for Logged In Users
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("jwtToken");
    const role = (localStorage.getItem("userRole") || "").toUpperCase();
    const name = localStorage.getItem("userName") || "User";

    const navButtons = document.querySelector(".nav-buttons");
    if (navButtons && token) {
        let dashboardPage = "pages/customer-dashboard.html";
        if (role.includes("ADMIN")) {
            dashboardPage = "pages/admin-dashboard.html";
        } else if (role.includes("BROKER")) {
            dashboardPage = "pages/broker-dashboard.html";
        }

        navButtons.innerHTML = `
            <a href="${dashboardPage}" class="login-btn" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; text-decoration:none;">
                Dashboard (${name.split(" ")[0]})
            </a>
            <a href="#" id="homeLogoutBtn" class="register-btn" style="background:#f1f5f9; color:#475467; border:1px solid #cbd5e1; padding:8px 16px; border-radius:6px; font-weight:600; text-decoration:none;">
                Logout
            </a>
        `;

        document.getElementById("homeLogoutBtn")?.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.clear();
            window.location.reload();
        });
    }
});

// ===============================
// HOME PAGE SEARCH
// ===============================

const searchButton = document.querySelector(".search-btn");

if (searchButton) {
    searchButton.addEventListener("click", function () {
        const locationInput = document.querySelector(".search-field input");
        const purposeSelect = document.querySelector(".search-field select");

        const location = locationInput.value.trim();
        const purpose = purposeSelect.value;

        // Check location
        if (location === "") {
            alert("Please enter a location.");
            locationInput.focus();
            return;
        }

        // Check purpose
        if (purpose === "") {
            alert("Please select Buy or Rent.");
            purposeSelect.focus();
            return;
        }

        // Save search data
        localStorage.setItem("searchLocation", location);
        localStorage.setItem("searchPurpose", purpose);

        // Open properties page
        window.location.href = "pages/properties.html";
    });
}