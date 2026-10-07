// ==========================================================
// 🏠 HouseHub - Property Controller (Frontend <-> Backend)
// Connected with Spring Boot REST API
// ==========================================================

const propertyGrid = document.getElementById("propertyGrid");
const propertyCount = document.getElementById("propertyCount");
const noProperties = document.getElementById("noProperties");

// Global Wishlist Cache for instantaneous heart status
let customerWishlistIds = new Set();

async function syncCustomerWishlistState() {
    if (!window.api) return;
    const user = window.api.getCurrentUser();
    if (user && user.role === "CUSTOMER") {
        try {
            const res = await window.api.getWishlist();
            if (res && res.data) {
                customerWishlistIds = new Set(res.data.map(p => p.propertyId || p.id));
                customerWishlistIds.forEach(id => {
                    const btn = document.getElementById(`wishlistBtn_${id}`);
                    if (btn) {
                        btn.textContent = "❤️";
                        btn.classList.add("active");
                    }
                });
            }
        } catch (e) {
            // Silently ignore
        }
    }
}

async function toggleWishlistQuick(event, propertyId) {
    if (event) event.stopPropagation();
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        if (confirm("Please sign in to save properties to your Wishlist. Proceed to login?")) {
            window.location.href = "login.html";
        }
        return;
    }
    if (user.role !== "CUSTOMER") {
        alert("Wishlist is available for Customer accounts.");
        return;
    }

    const btn = document.getElementById(`wishlistBtn_${propertyId}`);
    try {
        if (customerWishlistIds.has(propertyId)) {
            await window.api.removeFromWishlist(propertyId);
            customerWishlistIds.delete(propertyId);
            if (btn) {
                btn.textContent = "🤍";
                btn.classList.remove("active");
            }
        } else {
            await window.api.addToWishlist(propertyId);
            customerWishlistIds.add(propertyId);
            if (btn) {
                btn.textContent = "❤️";
                btn.classList.add("active");
            }
        }
    } catch (err) {
        alert("Wishlist update failed: " + err.message);
    }
}

// ==========================================
// 1. RENDER PROPERTY CARDS
// ==========================================
function displayProperties(propertyList) {
    if (!propertyGrid) return;

    // Cache currently rendered list for fast client-side sorting
    window.currentLoadedProperties = propertyList || [];

    propertyGrid.innerHTML = "";

    if (!propertyList || propertyList.length === 0) {
        if (noProperties) noProperties.style.display = "block";
        if (propertyCount) propertyCount.textContent = "0 Properties";
        return;
    }

    if (noProperties) noProperties.style.display = "none";
    if (propertyCount) propertyCount.textContent = `${propertyList.length} Properties`;

    propertyList.forEach(property => {
        const id = property.propertyId || property.id;
        const title = property.title || "Property Listing";
        const city = property.city || "";
        const address = property.address || "";
        const locationStr = address ? `${address}, ${city}` : city;
        const bhk = property.bhk || 1;
        const bathrooms = property.bathrooms || 1;
        const area = property.areaSqft ? `${property.areaSqft} sq.ft` : (property.area || "Spacious");
        const purpose = (property.purpose || "RENT").toUpperCase();
        const price = Number(property.price || 0).toLocaleString();
        const priceDisplay = purpose === "RENT" ? `₹${price} / month` : `₹${price}`;

        // Get primary image or placeholder
        let imageUrl = "../images/flat-banner.jpg";
        if (property.images && property.images.length > 0) {
            imageUrl = property.images[0].imageUrl;
        } else if (property.image) {
            imageUrl = property.image;
        }

        const isFavorited = customerWishlistIds.has(id);

        const card = document.createElement("div");
        card.className = "property-card";
        card.innerHTML = `
            <div class="property-card-image">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='../images/flat-banner.jpg'">
                <span class="property-purpose ${purpose === 'BUY' ? 'buy' : ''}">
                    ${purpose === 'BUY' ? 'For Sale' : 'For Rent'}
                </span>
                <button type="button" class="card-wishlist-btn ${isFavorited ? 'active' : ''}" onclick="toggleWishlistQuick(event, ${id})" id="wishlistBtn_${id}" title="Save to Wishlist">
                    ${isFavorited ? '❤️' : '🤍'}
                </button>
            </div>

            <div class="property-card-content">
                <h3>${title}</h3>
                <p class="property-location">📍 ${locationStr}</p>

                <div class="property-info" style="display:flex; flex-wrap:wrap; gap:8px 10px;">
                    <span>🛏️ ${property.rooms || bhk} Rooms</span>
                    <span>🚿 ${bathrooms} Bath</span>
                    <span>🏢 ${property.floorNo || 'Ground Flr'}</span>
                    <span>📐 ${area}</span>
                </div>

                <div class="property-card-bottom">
                    <div class="property-price">${priceDisplay}</div>
                    <button class="view-button" onclick="viewProperty(${id})">
                        View Details →
                    </button>
                </div>
            </div>
        `;

        propertyGrid.appendChild(card);
    });

    // Check customer wishlist state asynchronously
    syncCustomerWishlistState();
}

// ==========================================
// 2. LOAD PROPERTIES FROM BACKEND (RULE 2: ONLY APPROVED)
// ==========================================
async function loadPublicProperties() {
    if (!propertyGrid) return;

    // 1. Check URL parameters for ?purpose=BUY or ?purpose=RENT
    const urlParams = new URLSearchParams(window.location.search);
    const urlPurpose = urlParams.get("purpose");

    const headerTitle = document.querySelector(".header-content h1") || document.getElementById("heroTitle");
    const headerCategory = document.querySelector(".header-content p");
    const headerSpan = document.querySelector(".header-content span") || document.getElementById("heroDescription");
    const purposeSelect = document.getElementById("purposeFilter");

    // Dynamic navbar active state
    const navBuy = document.getElementById("navBuy") || document.querySelector("a[href*='purpose=BUY']");
    const navRent = document.getElementById("navRent") || document.querySelector("a[href*='purpose=RENT']");

    // Dynamic purpose tabs
    const tabAll = document.getElementById("tabPurposeAll");
    const tabBuy = document.getElementById("tabPurposeBuy");
    const tabRent = document.getElementById("tabPurposeRent");

    if (urlPurpose) {
        const cleanPurpose = urlPurpose.toUpperCase();
        if (purposeSelect) purposeSelect.value = cleanPurpose.toLowerCase();

        if (cleanPurpose === "BUY") {
            if (navBuy) navBuy.classList.add("active");
            if (navRent) navRent.classList.remove("active");
            if (tabBuy) tabBuy.classList.add("active");
            if (tabAll) tabAll.classList.remove("active");
            if (tabRent) tabRent.classList.remove("active");
            if (headerCategory) headerCategory.textContent = "PROPERTIES FOR SALE";
            if (headerTitle) headerTitle.textContent = "Buy Your Dream Home";
            if (headerSpan) headerSpan.textContent = "Explore verified houses, villas, and apartments available for immediate purchase.";
        } else if (cleanPurpose === "RENT") {
            if (navRent) navRent.classList.add("active");
            if (navBuy) navBuy.classList.remove("active");
            if (tabRent) tabRent.classList.add("active");
            if (tabAll) tabAll.classList.remove("active");
            if (tabBuy) tabBuy.classList.remove("active");
            if (headerCategory) headerCategory.textContent = "PROPERTIES FOR RENT";
            if (headerTitle) headerTitle.textContent = "Rent Your Ideal Space";
            if (headerSpan) headerSpan.textContent = "Explore verified apartments and houses available for monthly rental.";
        }

        await filterProperties();
        return;
    }

    // 2. Check if coming from Home page search box
    const savedLocation = localStorage.getItem("searchLocation");
    const savedPurpose = localStorage.getItem("searchPurpose");
    if (savedLocation || savedPurpose) {
        const locationInput = document.getElementById("locationFilter");
        if (locationInput && savedLocation) locationInput.value = savedLocation;
        if (purposeSelect && savedPurpose) purposeSelect.value = savedPurpose.toLowerCase();
        localStorage.removeItem("searchLocation");
        localStorage.removeItem("searchPurpose");
        await filterProperties();
        return;
    }

    try {
        propertyGrid.innerHTML = `<p style="text-align:center; color:#667085; padding:40px; grid-column: 1 / -1;">Loading verified properties...</p>`;
        
        if (window.api) {
            const response = await window.api.getPublicProperties();
            const list = response.data || [];
            displayProperties(list);
        } else {
            console.warn("api.js not loaded, cannot fetch properties.");
        }
    } catch (err) {
        console.error("Failed to load properties:", err);
        if (propertyGrid) {
            propertyGrid.innerHTML = `
                <div style="text-align:center; padding:40px; grid-column: 1 / -1; color:#b91c1c;">
                    <p>Could not connect to property server: ${err.message}</p>
                    <button onclick="loadPublicProperties()" style="margin-top:10px; padding:6px 14px; cursor:pointer;">Retry</button>
                </div>
            `;
        }
    }
}

// ==========================================
// 3. SEARCH & FILTER PROPERTIES
// ==========================================
function formatBudgetDisplay(val) {
    const num = Number(val);
    if (!num || num >= 10000000) return "Any Price";
    if (num >= 10000000) return "₹" + (num / 10000000).toFixed(1) + " Cr";
    if (num >= 100000) return "₹" + (num / 100000).toFixed(1) + " Lakh";
    if (num >= 1000) return "₹" + (num / 1000).toFixed(0) + "K";
    return "₹" + num.toLocaleString();
}

function handlePriceSliderInput(val) {
    const display = document.getElementById("priceDisplay");
    if (display) {
        display.textContent = formatBudgetDisplay(val);
    }
}

async function filterProperties() {
    const locationInput = document.getElementById("locationFilter");
    const purposeSelect = document.getElementById("purposeFilter");
    const typeSelect = document.getElementById("typeFilter");
    const bhkSelect = document.getElementById("bhkFilter");
    const priceRange = document.getElementById("priceRange");

    const filters = {};
    if (locationInput && locationInput.value.trim()) filters.city = locationInput.value.trim();
    if (purposeSelect && purposeSelect.value) filters.purpose = purposeSelect.value;
    if (typeSelect && typeSelect.value) filters.propertyType = typeSelect.value;
    if (bhkSelect && bhkSelect.value) filters.bhk = bhkSelect.value;
    if (priceRange && Number(priceRange.value) < 10000000) {
        filters.maxPrice = Number(priceRange.value);
    }

    try {
        if (window.api) {
            propertyGrid.innerHTML = `<p style="text-align:center; color:#667085; padding:40px; grid-column: 1 / -1;">Searching...</p>`;
            const response = await window.api.searchProperties(filters);
            displayProperties(response.data || []);
        }
    } catch (err) {
        console.error("Search failed:", err);
        alert("Search failed: " + err.message);
    }
}

const filterButton = document.getElementById("filterButton");
if (filterButton) {
    filterButton.addEventListener("click", filterProperties);
}

const priceRangeSlider = document.getElementById("priceRange");
if (priceRangeSlider) {
    priceRangeSlider.addEventListener("change", filterProperties);
}

// View property action
function viewProperty(id) {
    localStorage.setItem("selectedPropertyId", id);
    window.location.href = "property-details.html";
}

// ==========================================
// 4. PROPERTY DETAILS PAGE
// ==========================================
const propertyDetails = document.getElementById("propertyDetails");

let currentGalleryImages = [];
let currentGalleryIdx = 0;

function changeCarouselSlide(dir) {
    if (!currentGalleryImages || currentGalleryImages.length <= 1) return;
    currentGalleryIdx = (currentGalleryIdx + dir + currentGalleryImages.length) % currentGalleryImages.length;
    updateCarouselDisplay();
}

function setCarouselSlide(idx) {
    if (!currentGalleryImages || idx < 0 || idx >= currentGalleryImages.length) return;
    currentGalleryIdx = idx;
    updateCarouselDisplay();
}

function updateCarouselDisplay() {
    const imgEl = document.getElementById("carouselMainImg");
    const countEl = document.getElementById("carouselCounter");
    if (imgEl && currentGalleryImages[currentGalleryIdx]) {
        imgEl.style.opacity = "0.3";
        setTimeout(() => {
            imgEl.src = currentGalleryImages[currentGalleryIdx];
            imgEl.style.opacity = "1";
        }, 120);
    }
    if (countEl) {
        countEl.textContent = `${currentGalleryIdx + 1} / ${currentGalleryImages.length}`;
    }
    currentGalleryImages.forEach((_, i) => {
        const thumb = document.getElementById(`carouselThumb-${i}`);
        if (thumb) {
            thumb.style.borderColor = (i === currentGalleryIdx) ? "#2563eb" : "transparent";
            thumb.style.opacity = (i === currentGalleryIdx) ? "1" : "0.55";
        }
    });
}

async function loadPropertyDetails() {
    const propertyDetailsEl = document.getElementById("propertyDetails");
    if (!propertyDetailsEl) return;

    // Check URL parameters first (?id=...), then fallback to localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let selectedId = urlParams.get("id");
    if (!selectedId || selectedId === "undefined" || selectedId === "null" || selectedId === "NaN") {
        selectedId = localStorage.getItem("selectedPropertyId");
        if (selectedId === "undefined" || selectedId === "null" || selectedId === "NaN") {
            selectedId = null;
        }
    } else {
        localStorage.setItem("selectedPropertyId", selectedId);
    }

    if (!selectedId) {
        propertyDetailsEl.innerHTML = `<p style="padding:40px; text-align:center;">No property selected. <a href="properties.html">Back to properties</a></p>`;
        return;
    }

    try {
        propertyDetailsEl.innerHTML = `<p style="padding:40px; text-align:center; color:#667085;">Loading property specifications...</p>`;
        const response = await window.api.getPropertyById(selectedId);
        const prop = response.data;

        if (!prop) {
            propertyDetailsEl.innerHTML = `<p style="padding:40px; text-align:center;">Property details not found.</p>`;
            return;
        }

        const currentUser = window.api ? window.api.getCurrentUser() : null;
        const userRole = (currentUser && currentUser.role) ? currentUser.role.toUpperCase() : "";
        const isBroker = userRole === "BROKER";
        const isAdmin = userRole === "ADMIN";

        const urlFrom = urlParams.get("from");
        let backLinkHref = "properties.html";
        let backLinkText = "Back to All Properties";
        if (urlFrom === "chat" || (document.referrer && document.referrer.includes("chat.html"))) {
            backLinkHref = "chat.html";
            backLinkText = "Back to Chat";
        } else if (isBroker) {
            backLinkHref = "broker-dashboard.html";
            backLinkText = "Back to Broker Dashboard";
        } else if (isAdmin) {
            backLinkHref = "approved-properties.html";
            backLinkText = "Back to Approved Properties";
        }

        const brokerUser = (prop.broker && prop.broker.user) ? prop.broker.user : {};
        const brokerName = brokerUser.name || "Verified Broker";
        const brokerCode = prop.broker ? (prop.broker.brokerCode || "BRK-VERIFIED") : "";
        const purpose = (prop.purpose || "RENT").toUpperCase();
        const price = Number(prop.price || 0).toLocaleString();
        const priceDisplay = purpose === "RENT" ? `₹${price} / month` : `₹${price}`;

        let imagesList = [];
        if (prop.images && prop.images.length > 0) {
            imagesList = prop.images.map(img => img.imageUrl);
        } else if (prop.image) {
            imagesList = [prop.image];
        } else {
            imagesList = ["../images/home-banner.jpg"];
        }
        currentGalleryImages = imagesList;
        currentGalleryIdx = 0;

        const rawAmenities = prop.amenities ? prop.amenities.split(',') : ['24/7 Water Supply', 'Electricity Backup', 'Security / CCTV', 'Covered Parking'];
        const amenitiesChips = rawAmenities
            .map(a => a.trim())
            .filter(Boolean)
            .map(a => `<span class="amenity-chip">✓ ${a}</span>`)
            .join(' ');

        const todayDate = new Date().toISOString().split('T')[0];

        propertyDetailsEl.innerHTML = `
            <div class="details-topbar">
                <a href="${backLinkHref}" class="btn-back-pill">
                    ← ${backLinkText}
                </a>
                <div class="topbar-meta">
                    <span class="id-badge">Listing ID #${prop.propertyId}</span>
                    <span class="verified-pill">✓ Verified Platform Listing</span>
                </div>
            </div>

            <div class="property-main-card">
                <!-- Interactive Photo Showcase Carousel -->
                <div class="carousel-stage">
                    <span class="carousel-purpose-badge">FOR ${purpose}</span>
                    <img id="carouselMainImg" src="${imagesList[0]}" alt="${prop.title}">

                    ${imagesList.length > 1 ? `
                        <button type="button" class="carousel-nav-btn prev" onclick="changeCarouselSlide(-1)" aria-label="Previous Photo">
                            ❮
                        </button>
                        <button type="button" class="carousel-nav-btn next" onclick="changeCarouselSlide(1)" aria-label="Next Photo">
                            ❯
                        </button>
                        <div class="carousel-counter-badge">
                            📷 <span id="carouselCounter">1 / ${imagesList.length}</span> Photos
                        </div>
                    ` : ''}
                </div>

                ${imagesList.length > 1 ? `
                    <div class="carousel-thumbs-bar">
                        ${imagesList.map((url, i) => `
                            <img id="carouselThumb-${i}" src="${url}" class="carousel-thumb-item ${i === 0 ? 'active' : ''}" onclick="setCarouselSlide(${i})" alt="Thumbnail ${i + 1}">
                        `).join('')}
                    </div>
                ` : ''}

                <div class="details-body">
                    <div class="details-header-row">
                        <div class="title-area">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                                <span style="background:var(--primary-light, #eff6ff); color:var(--primary, #2563eb); padding:4px 12px; border-radius:20px; font-size:12px; font-weight:800; text-transform:uppercase;">
                                    For ${purpose}
                                </span>
                                <span class="verified-pill">✓ Verified Listing</span>
                            </div>
                            <h1>${prop.title}</h1>
                            <div class="location-line">
                                <span>📍</span>
                                <span>${prop.address}, ${prop.city}${prop.state ? ', ' + prop.state : ''}</span>
                            </div>
                        </div>

                        <div class="pricing-area">
                            <div class="price-text">${priceDisplay}</div>
                            <div class="actions-btn-group">
                                ${!isBroker && !isAdmin ? `
                                <button type="button" class="btn-wishlist" onclick="toggleWishlist(${prop.propertyId}, this)">
                                    ❤️ Add to Wishlist
                                </button>
                                ` : ''}
                                <button type="button" class="btn-share" onclick="window.copyPropertyLink ? window.copyPropertyLink() : copyPropertyLink()">
                                    🔗 Share Listing
                                </button>
                            </div>
                        </div>
                    </div>

                    <h3 class="section-subhead"><span>🏢</span> Property Specifications & Layout</h3>
                    <div class="specs-grid">
                        <div class="spec-card">
                            <span class="spec-label">ROOMS / BEDROOMS</span>
                            <div class="spec-val">🛏️ ${prop.rooms || prop.bhk} Rooms (${prop.bhk} BHK)</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">BATHROOMS</span>
                            <div class="spec-val">🚿 ${prop.bathrooms || 1} Baths</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">KITCHEN TYPE</span>
                            <div class="spec-val">🍳 ${prop.kitchen || 'Modular Kitchen'}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">FLOOR NUMBER</span>
                            <div class="spec-val">🏢 ${prop.floorNo ? prop.floorNo + (prop.totalFloors ? ' (of ' + prop.totalFloors + ')' : '') : 'Ground Floor'}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">LIVING AREA</span>
                            <div class="spec-val">🛋️ ${prop.hall || '1 Living Hall'}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">BALCONIES</span>
                            <div class="spec-val">🌅 ${prop.balconies !== undefined && prop.balconies !== null ? prop.balconies + ' Balcony' : '1 Balcony'}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">SUPER BUILT-UP AREA</span>
                            <div class="spec-val">📐 ${prop.areaSqft || "N/A"} sq.ft</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">FURNISHED STATUS</span>
                            <div class="spec-val">🛋️ ${prop.furnishedStatus || "Semi-Furnished"}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">PARKING SPACE</span>
                            <div class="spec-val">🚗 ${prop.parking ? "Dedicated Parking" : "Street Parking"}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">FACING DIRECTION</span>
                            <div class="spec-val">🧭 ${prop.facing || "East Facing"}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">PROPERTY AGE</span>
                            <div class="spec-val">⏳ ${prop.propertyAge || "New Construction"}</div>
                        </div>
                        <div class="spec-card">
                            <span class="spec-label">PROPERTY TYPE</span>
                            <div class="spec-val">🏷️ ${prop.propertyType || "Residential Flat"}</div>
                        </div>
                    </div>

                    <div class="desc-block">
                        <h3 class="section-subhead"><span>📝</span> Overview & Detailed Description</h3>
                        <p class="desc-text">${prop.description || "No detailed description provided by the broker."}</p>
                        
                        <h3 class="section-subhead" style="font-size:16px; margin-top:20px;"><span>✨</span> Key Amenities & Utilities</h3>
                        <div class="amenities-wrap">
                            ${amenitiesChips}
                        </div>
                    </div>

                    ${isBroker ? `
                    <!-- Broker Owner Control Panel -->
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:24px; margin-top:24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                            <div>
                                <span style="font-size:11px; background:#16a34a; color:#fff; padding:4px 10px; border-radius:12px; font-weight:bold; letter-spacing:0.5px;">BROKER CONTROL PANEL</span>
                                <h4 style="margin:8px 0 4px; font-size:18px; color:#14532d;">Property Management (Owner Actions)</h4>
                                <p style="font-size:13px; color:#166534; margin:0;">
                                    Listing Status: <strong>${prop.propertyStatus || 'AVAILABLE'}</strong> &nbsp;|&nbsp; 
                                    Admin Verification: <strong>${prop.verificationStatus || 'APPROVED'}</strong>
                                </p>
                            </div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                <a href="my-properties.html" style="background:#2563eb; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                    🏠 Manage in My Properties
                                </a>
                                <a href="my-inquiries.html" style="background:#0f172a; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                    📋 Client Inquiries & Visits
                                </a>
                                <a href="chat.html" style="background:#16a34a; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                    💬 Client Chats
                                </a>
                            </div>
                        </div>
                    </div>
                    ` : (isAdmin ? `
                    <!-- Admin Dossier & Audit Panel -->
                    <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:14px; padding:24px; margin-top:24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:18px;">
                            <div>
                                <span style="font-size:11px; background:#1e293b; color:#fff; padding:4px 10px; border-radius:12px; font-weight:bold; letter-spacing:0.5px;">ADMIN AUDIT PANEL</span>
                                <h4 style="margin:8px 0 4px; font-size:19px; color:#0f172a;">Official Listing & Verification Details</h4>
                                <p style="font-size:13px; color:#475467; margin:0;">
                                    Verification Status: <strong style="color:#16a34a;">${prop.verificationStatus || 'APPROVED'}</strong> &nbsp;|&nbsp; 
                                    Listing Status: <strong style="color:#2563eb;">${prop.propertyStatus || 'AVAILABLE'}</strong>
                                </p>
                            </div>
                            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                                <span style="font-size:12px; color:#16a34a; background:#ecfdf5; border:1px solid #a7f3d0; padding:6px 14px; border-radius:8px; font-weight:600;">
                                    ✓ Approved By Admin
                                </span>
                                ${prop.approvedAt ? `<span style="font-size:12px; color:#64748b; background:#fff; border:1px solid #e2e8f0; padding:6px 12px; border-radius:8px;">${new Date(prop.approvedAt).toLocaleDateString()}</span>` : ''}
                            </div>
                        </div>

                        <!-- Submitting Broker Dossier -->
                        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                                <h5 style="margin:0; font-size:15px; color:#1e293b;">🏢 Submitting Broker Dossier</h5>
                                <span style="font-size:12px; font-family:monospace; font-weight:700; background:#eff6ff; color:#1d4ed8; padding:3px 10px; border-radius:6px; border:1px solid #bfdbfe;">
                                    ${brokerCode}
                                </span>
                            </div>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; font-size:13px;">
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Broker Name</span><strong style="color:#0f172a; font-size:14px;">${brokerName}</strong></div>
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Agency Name</span><strong style="color:#0f172a; font-size:14px;">${prop.broker?.agencyName || 'Independent Broker'}</strong></div>
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Registered Email</span><strong style="color:#0f172a; font-size:14px; word-break:break-all;">✉️ ${brokerUser.email || 'N/A'}</strong></div>
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Phone Number</span><strong style="color:#0f172a; font-size:14px;">📞 ${brokerUser.mobile || 'N/A'}</strong></div>
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Operating City</span><strong style="color:#0f172a; font-size:14px;">📍 ${prop.broker?.city || prop.city}</strong></div>
                                <div><span style="color:#64748b; display:block; margin-bottom:2px;">Experience</span><strong style="color:#0f172a; font-size:14px;">⏳ ${prop.broker?.experience || 'Experienced'}</strong></div>
                            </div>
                        </div>

                        <div style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">
                            <a href="approved-properties.html" style="background:#2563eb; color:#fff; text-decoration:none; padding:10px 20px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                ← Back to Approved Properties
                            </a>
                            <a href="property-verification.html" style="background:#0f172a; color:#fff; text-decoration:none; padding:10px 20px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                Review Pending Properties →
                            </a>
                        </div>
                    </div>
                    ` : `
                    <!-- Listed by Verified Broker Trust Card -->
                    <div class="broker-trust-card">
                        <div class="broker-info-block">
                            <div class="broker-avatar">🏢</div>
                            <div class="broker-meta">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:11px; background:#16a34a; color:#ffffff; padding:3px 9px; border-radius:12px; font-weight:800; letter-spacing:0.5px;">VERIFIED BROKER</span>
                                    <span style="font-size:11.5px; font-family:monospace; background:rgba(22,163,74,0.15); color:#166534; padding:2px 8px; border-radius:6px; font-weight:700;">${brokerCode}</span>
                                </div>
                                <h4>${brokerName} ${prop.broker?.agencyName ? '• ' + prop.broker.agencyName : ''}</h4>
                                <p>🔒 Direct in-app messaging enabled. Personal contact details protected for mutual privacy.</p>
                            </div>
                        </div>
                        <button type="button" class="btn-broker-chat" onclick="startChatWithBroker(${prop.propertyId})">
                            💬 In-App Chat with Broker
                        </button>
                    </div>

                    <!-- Customer Actions: Inquiry & Visit Scheduling Grid -->
                    <div class="actions-dual-grid">
                        <!-- Send Quick Inquiry -->
                        <div class="action-card">
                            <div>
                                <h4><span>📩</span> Send Direct Inquiry</h4>
                                <p>Have questions about price, rent agreement or move-in timeline? Contact the broker directly.</p>
                                <form onsubmit="submitInquiry(event, ${prop.propertyId})">
                                    <textarea id="inquiryMessageInput" class="form-control-textarea" placeholder="Hi, I am interested in this property. Is the rent negotiable and when can I inspect?" required rows="4"></textarea>
                                    <button type="submit" class="btn-submit-action">
                                        Send Inquiry Now →
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Schedule Site Visit -->
                        <div class="action-card">
                            <div>
                                <h4><span>📅</span> Schedule a Site Visit</h4>
                                <p>Pick a date and convenient time window to inspect the property in person.</p>
                                <form id="visitScheduleForm" onsubmit="submitVisit(event, ${prop.propertyId})">
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                        <div>
                                            <label style="font-size:11.5px; font-weight:700; color:var(--slate-500, #64748b); display:block; margin-bottom:4px; text-transform:uppercase;">Visit Date</label>
                                            <input type="date" id="visitDateInput" class="form-control-input" required min="${todayDate}">
                                        </div>
                                        <div>
                                            <label style="font-size:11.5px; font-weight:700; color:var(--slate-500, #64748b); display:block; margin-bottom:4px; text-transform:uppercase;">Time Slot</label>
                                            <select id="visitTimeSlot" class="form-control-select" required>
                                                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                                <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                                            </select>
                                        </div>
                                    </div>
                                    <input type="text" id="visitNotesInput" class="form-control-input" placeholder="Optional notes (e.g. Coming with family on weekend)">
                                    <button type="submit" class="btn-submit-action dark">
                                        Confirm Site Visit Request
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    `)}
                </div>
            </div>
        `;
    } catch (err) {
        propertyDetailsEl.innerHTML = `<p style="padding:40px; text-align:center; color:#b91c1c;">Error loading details: ${err.message}</p>`;
    }
}

// Wishlist Action
async function toggleWishlist(propertyId, btn) {
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        alert("Please login first to save properties to your wishlist.");
        window.location.href = "login.html";
        return;
    }
    if (user.role !== "CUSTOMER") {
        alert("Only Customers can add properties to wishlist.");
        return;
    }

    try {
        await window.api.addToWishlist(propertyId);
        btn.textContent = "❤️ Saved in Wishlist";
        btn.style.background = "#fee2e2";
        btn.style.borderColor = "#fda4af";
        alert("Property added to your Wishlist!");
    } catch (err) {
        alert("Wishlist: " + err.message);
    }
}

// Direct Inquiry Action
async function submitInquiry(event, propertyId) {
    event.preventDefault();
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        alert("Please login as Customer to send an inquiry.");
        window.location.href = "login.html";
        return;
    }
    if (user.role !== "CUSTOMER") {
        alert("Only Customers can send inquiries.");
        return;
    }
    const messageInput = document.getElementById("inquiryMessageInput");
    if (!messageInput || !messageInput.value.trim()) return;

    try {
        await window.api.sendInquiry(propertyId, messageInput.value.trim());
        alert("✅ Inquiry sent successfully! The broker will respond soon. You can track it in 'My Inquiries'.");
        messageInput.value = "";
    } catch (err) {
        alert("Failed to send inquiry: " + err.message);
    }
}

// Schedule Site Visit Action
async function submitVisit(event, propertyId) {
    event.preventDefault();
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        alert("Please login as Customer to schedule a visit.");
        window.location.href = "login.html";
        return;
    }
    if (user.role !== "CUSTOMER") {
        alert("Only Customers can schedule site visits.");
        return;
    }
    const visitDate = document.getElementById("visitDateInput").value;
    const timeSlot = document.getElementById("visitTimeSlot").value;
    const notes = document.getElementById("visitNotesInput").value.trim();

    if (!visitDate) {
        alert("Please select a date for the visit.");
        return;
    }

    try {
        const res = await window.api.scheduleVisit(propertyId, visitDate, timeSlot, notes);
        const newVisit = (res && res.data) ? res.data : null;
        const passId = newVisit ? newVisit.visitId : "";

        if (confirm("✅ Site visit scheduled successfully!\n\nWould you like to view and print your Site Visit Pass / Slip now?")) {
            window.location.href = `my-inquiries.html?tab=visits${passId ? '&passId=' + passId : ''}`;
        } else {
            alert("Visit request recorded. You can view or print your Visit Pass anytime from 'My Inquiries & Visits'.");
            document.getElementById("visitScheduleForm").reset();
        }
    } catch (err) {
        alert("Failed to schedule visit: " + err.message);
    }
}

// Rule 3: Start In-App Chat without phone/email
function startChatWithBroker(propertyId) {
    const user = window.api ? window.api.getCurrentUser() : null;
    if (!user || !user.token) {
        alert("Please login first to chat with the broker.");
        window.location.href = "login.html";
        return;
    }

    localStorage.setItem("selectedPropertyId", propertyId);
    window.location.href = "chat.html";
}

// ==========================================
// 5. BROKER: ADD PROPERTY (MULTIPLE DEVICE PHOTOS SUPPORT)
// ==========================================
let uploadedPropertyPhotos = [];

function handlePropertyImagesSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxPhotos = 8;
    if (uploadedPropertyPhotos.length + files.length > maxPhotos) {
        alert(`You can upload at most ${maxPhotos} photos. Taking first available slots.`);
    }

    const availableSlots = maxPhotos - uploadedPropertyPhotos.length;
    const toProcess = Array.from(files).slice(0, availableSlots);

    toProcess.forEach(file => {
        if (!file.type.startsWith("image/")) {
            alert(`File "${file.name}" is not an image.`);
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            alert(`File "${file.name}" is too large (> 8MB). Please choose a smaller image.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // Compress with canvas to max 1280px resolution for high quality & fast payload
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 1280;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                const base64Data = canvas.toDataURL("image/jpeg", 0.85);

                uploadedPropertyPhotos.push(base64Data);
                renderPropertyImagePreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    event.target.value = "";
}

function removePropertyPhoto(idx) {
    uploadedPropertyPhotos.splice(idx, 1);
    renderPropertyImagePreviews();
}

function renderPropertyImagePreviews() {
    const container = document.getElementById("imagePreviewContainer");
    const countLabel = document.getElementById("propertyPhotosCountLabel");
    if (!container) return;

    if (countLabel) {
        countLabel.textContent = uploadedPropertyPhotos.length > 0 
            ? `✓ ${uploadedPropertyPhotos.length} photo(s) selected` 
            : "No photos selected yet";
        countLabel.style.color = uploadedPropertyPhotos.length > 0 ? "#16a34a" : "#64748b";
        countLabel.style.fontWeight = uploadedPropertyPhotos.length > 0 ? "600" : "normal";
    }

    container.innerHTML = "";
    uploadedPropertyPhotos.forEach((photoBase64, idx) => {
        const thumb = document.createElement("div");
        thumb.style.cssText = "position:relative; width:100px; height:80px; border-radius:8px; overflow:hidden; border:2px solid " + (idx === 0 ? "#2563eb" : "#cbd5e1") + "; box-shadow:0 2px 8px rgba(0,0,0,0.1); background:#0f172a;";
        thumb.innerHTML = `
            <img src="${photoBase64}" style="width:100%; height:100%; object-fit:cover;">
            ${idx === 0 ? '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(37,99,235,0.9); color:#fff; font-size:10px; font-weight:bold; text-align:center; padding:2px;">COVER</span>' : ''}
            <button type="button" onclick="removePropertyPhoto(${idx})" title="Remove photo" style="position:absolute; top:4px; right:4px; background:rgba(220,38,38,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; font-weight:bold;">✕</button>
        `;
        container.appendChild(thumb);
    });
}

const addPropertyForm = document.getElementById("addPropertyForm");

if (addPropertyForm) {
    addPropertyForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Broker Auth Guard
        const user = window.api ? window.api.getCurrentUser() : null;
        if (!user || user.role !== "BROKER") {
            alert("Only registered Brokers can list properties. Please login as Broker.");
            window.location.href = "login.html";
            return;
        }

        const title = document.getElementById("propertyTitle") || document.getElementById("title");
        const propertyType = document.getElementById("propertyType");
        const purpose = document.getElementById("propertyPurpose") || document.getElementById("purpose");
        const price = document.getElementById("propertyPrice") || document.getElementById("price");
        const address = document.getElementById("propertyAddress") || document.getElementById("address");
        const city = document.getElementById("propertyCity") || document.getElementById("city");
        const state = document.getElementById("propertyState") || document.getElementById("state");
        const bhk = document.getElementById("propertyBhk") || document.getElementById("bhk");
        const rooms = document.getElementById("rooms");
        const bathrooms = document.getElementById("bathrooms") || { value: 1 };
        const kitchen = document.getElementById("kitchen");
        const hall = document.getElementById("hall");
        const floor = document.getElementById("floor");
        const totalFloors = document.getElementById("totalFloors");
        const balconies = document.getElementById("balconies");
        const facing = document.getElementById("facing");
        const propertyAge = document.getElementById("propertyAge");
        const area = document.getElementById("propertyArea") || document.getElementById("area");
        const furnishedStatus = document.getElementById("furnishedStatus") || { value: "Semi-Furnished" };
        const parking = document.getElementById("parking") || { checked: true };
        const amenities = document.getElementById("amenities") || { value: "" };
        const description = document.getElementById("propertyDescription") || document.getElementById("description");

        const rulesAgreement = document.getElementById("propertyRulesAgreement");
        if (rulesAgreement && !rulesAgreement.checked) {
            alert("⚠️ Please review and accept the Property Listing Rules before submitting.");
            rulesAgreement.focus();
            return;
        }

        if (!title.value.trim() || !price.value || !city.value.trim() || !bhk.value) {
            alert("Please fill in all mandatory fields.");
            return;
        }

        if (!uploadedPropertyPhotos || uploadedPropertyPhotos.length === 0) {
            alert("⚠️ Please upload at least 1 real property photo from your device.");
            document.getElementById("propertyImages").focus();
            return;
        }

        const submitBtn = addPropertyForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting for Admin Verification...";

        try {
            const bhkCount = parseInt(bhk.value) || 2;
            const propertyPayload = {
                title: title.value.trim(),
                description: description ? description.value.trim() : "",
                propertyType: (propertyType.value || "APARTMENT").toUpperCase().replace("FLAT", "APARTMENT").replace("HOUSE", "INDEPENDENT_HOUSE"),
                purpose: (purpose.value || "RENT").toUpperCase(),
                price: parseFloat(price.value),
                address: address ? address.value.trim() : "Main Road",
                city: city.value.trim(),
                state: state ? state.value.trim() : "Rajasthan",
                bhk: bhkCount,
                rooms: (rooms && rooms.value) ? parseInt(rooms.value) : bhkCount,
                bathrooms: parseInt(bathrooms.value) || 1,
                kitchen: (kitchen && kitchen.value) ? kitchen.value : "Modular Kitchen",
                hall: (hall && hall.value) ? hall.value : "1 Living Hall",
                floorNo: (floor && floor.value.trim()) ? floor.value.trim() : "Ground Floor",
                totalFloors: (totalFloors && totalFloors.value) ? parseInt(totalFloors.value) : null,
                balconies: (balconies && balconies.value) ? parseInt(balconies.value) : 1,
                facing: (facing && facing.value) ? facing.value : "East Facing",
                propertyAge: (propertyAge && propertyAge.value) ? propertyAge.value : "New Construction",
                areaSqft: area ? parseFloat(area.value) || 1000 : 1000,
                furnishedStatus: (furnishedStatus.value === "fully" ? "Furnished" : (furnishedStatus.value === "unfurnished" ? "Unfurnished" : "Semi-Furnished")),
                parking: parking.value !== undefined ? (parking.value === "available" || parking.checked) : true,
                amenities: amenities.value || "Lift, Security, Power Backup",
                imageUrls: uploadedPropertyPhotos
            };

            await window.api.addProperty(propertyPayload);

            alert(
                "✅ Property submitted successfully with " + uploadedPropertyPhotos.length + " photo(s)!\n\n" +
                "Status: PENDING ADMIN VERIFICATION (RULE 2)\n\n" +
                "Your property details and photos have been sent to Admin for review. Once approved, it will be published LIVE for customers."
            );

            addPropertyForm.reset();
            uploadedPropertyPhotos = [];
            window.location.href = "broker-dashboard.html";
        } catch (error) {
            alert("Failed to submit property: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Initial triggers
function initPropertyModule() {
    if (document.getElementById("propertyGrid")) {
        loadPublicProperties();
    }
    if (document.getElementById("propertyDetails")) {
        loadPropertyDetails();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPropertyModule);
} else {
    initPropertyModule();
}