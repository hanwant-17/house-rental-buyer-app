// ==========================================================
// 🏠 HouseHub - Property Controller (Frontend <-> Backend)
// Connected with Spring Boot REST API
// ==========================================================

const propertyGrid = document.getElementById("propertyGrid");
const propertyCount = document.getElementById("propertyCount");
const noProperties = document.getElementById("noProperties");

// ==========================================
// 1. RENDER PROPERTY CARDS
// ==========================================
function displayProperties(propertyList) {
    if (!propertyGrid) return;

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

        const card = document.createElement("div");
        card.className = "property-card";
        card.innerHTML = `
            <div class="property-card-image">
                <img src="${imageUrl}" alt="${title}">
                <span class="property-purpose ${purpose === 'BUY' ? 'buy' : ''}">
                    ${purpose === 'BUY' ? 'For Sale' : 'For Rent'}
                </span>
            </div>

            <div class="property-card-content">
                <h3>${title}</h3>
                <p class="property-location">📍 ${locationStr}</p>

                <div class="property-info">
                    <span>🛏 ${bhk} BHK</span>
                    <span>🚿 ${bathrooms} Bath</span>
                    <span>📐 ${area}</span>
                </div>

                <div class="property-card-bottom">
                    <div class="property-price">${priceDisplay}</div>
                    <button class="view-button" onclick="viewProperty(${id})">
                        View Details
                    </button>
                </div>
            </div>
        `;

        propertyGrid.appendChild(card);
    });
}

// ==========================================
// 2. LOAD PROPERTIES FROM BACKEND (RULE 2: ONLY APPROVED)
// ==========================================
async function loadPublicProperties() {
    if (!propertyGrid) return;

    // 1. Check URL parameters for ?purpose=BUY or ?purpose=RENT
    const urlParams = new URLSearchParams(window.location.search);
    const urlPurpose = urlParams.get("purpose");

    const headerTitle = document.querySelector(".header-content h1");
    const headerCategory = document.querySelector(".header-content p");
    const headerSpan = document.querySelector(".header-content span");
    const purposeSelect = document.getElementById("purposeFilter");

    // Dynamic navbar active state
    const navBuy = document.getElementById("navBuy") || document.querySelector("a[href*='purpose=BUY']");
    const navRent = document.getElementById("navRent") || document.querySelector("a[href*='purpose=RENT']");

    if (urlPurpose) {
        const cleanPurpose = urlPurpose.toUpperCase();
        if (purposeSelect) purposeSelect.value = cleanPurpose.toLowerCase();

        if (cleanPurpose === "BUY") {
            if (navBuy) navBuy.classList.add("active");
            if (navRent) navRent.classList.remove("active");
            if (headerCategory) headerCategory.textContent = "PROPERTIES FOR SALE";
            if (headerTitle) headerTitle.textContent = "Buy Your Dream Home";
            if (headerSpan) headerSpan.textContent = "Explore verified houses, villas, and apartments available for immediate purchase.";
        } else if (cleanPurpose === "RENT") {
            if (navRent) navRent.classList.add("active");
            if (navBuy) navBuy.classList.remove("active");
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
async function filterProperties() {
    const locationInput = document.getElementById("locationFilter");
    const purposeSelect = document.getElementById("purposeFilter");
    const typeSelect = document.getElementById("typeFilter");
    const bhkSelect = document.getElementById("bhkFilter");

    const filters = {};
    if (locationInput && locationInput.value.trim()) filters.city = locationInput.value.trim();
    if (purposeSelect && purposeSelect.value) filters.purpose = purposeSelect.value;
    if (typeSelect && typeSelect.value) filters.propertyType = typeSelect.value;
    if (bhkSelect && bhkSelect.value) filters.bhk = bhkSelect.value;

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

// View property action
function viewProperty(id) {
    localStorage.setItem("selectedPropertyId", id);
    window.location.href = "property-details.html";
}

// ==========================================
// 4. PROPERTY DETAILS PAGE
// ==========================================
const propertyDetails = document.getElementById("propertyDetails");

async function loadPropertyDetails() {
    if (!propertyDetails) return;

    const selectedId = localStorage.getItem("selectedPropertyId");
    if (!selectedId) {
        propertyDetails.innerHTML = `<p style="padding:40px; text-align:center;">No property selected. <a href="properties.html">Back to properties</a></p>`;
        return;
    }

    try {
        propertyDetails.innerHTML = `<p style="padding:40px; text-align:center; color:#667085;">Loading property specifications...</p>`;
        const response = await window.api.getPropertyById(selectedId);
        const prop = response.data;

        if (!prop) {
            propertyDetails.innerHTML = `<p style="padding:40px; text-align:center;">Property details not found.</p>`;
            return;
        }

        const currentUser = window.api ? window.api.getCurrentUser() : null;
        const userRole = (currentUser && currentUser.role) ? currentUser.role.toUpperCase() : "";
        const isBroker = userRole === "BROKER";
        const isAdmin = userRole === "ADMIN";

        const brokerUser = (prop.broker && prop.broker.user) ? prop.broker.user : {};
        const brokerName = brokerUser.name || "Verified Broker";
        const brokerCode = prop.broker ? (prop.broker.brokerCode || "BRK-VERIFIED") : "";
        const purpose = (prop.purpose || "RENT").toUpperCase();
        const price = Number(prop.price || 0).toLocaleString();
        const priceDisplay = purpose === "RENT" ? `₹${price} / month` : `₹${price}`;

        let primaryImage = "../images/home-banner.jpg";
        if (prop.images && prop.images.length > 0) {
            primaryImage = prop.images[0].imageUrl;
        }

        propertyDetails.innerHTML = `
            <div class="details-container" style="max-width:1100px; margin:0 auto; padding:40px 20px;">
                <a href="${isBroker ? 'broker-dashboard.html' : 'properties.html'}" style="color:#1d4ed8; text-decoration:none; font-weight:600; display:inline-block; margin-bottom:20px;">
                    ← ${isBroker ? 'Back to Broker Dashboard' : 'Back to All Properties'}
                </a>

                <div style="background:#fff; border-radius:12px; overflow:hidden; border:1px solid #eaecf0; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
                    <div style="height:380px; overflow:hidden; background:#111;">
                        <img src="${primaryImage}" alt="${prop.title}" style="width:100%; height:100%; object-fit:cover;">
                    </div>

                    <div style="padding:30px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:15px; margin-bottom:20px;">
                            <div>
                                <span style="background:#eff6ff; color:#1d4ed8; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:bold; text-transform:uppercase;">
                                    For ${purpose}
                                </span>
                                <h1 style="font-size:26px; margin:10px 0 5px;">${prop.title}</h1>
                                <p style="color:#667085; font-size:15px;">📍 ${prop.address}, ${prop.city}, ${prop.state || ''}</p>
                            </div>
                            <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                                <div style="font-size:26px; font-weight:bold; color:#1d4ed8;">${priceDisplay}</div>
                                <span style="font-size:13px; color:#16a34a; font-weight:600;">✓ Verified Listing</span>
                                ${!isBroker && !isAdmin ? `
                                <button onclick="toggleWishlist(${prop.propertyId}, this)" style="background:#fff; border:1px solid #f43f5e; color:#f43f5e; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-top:4px;">
                                    ❤️ Add to Wishlist
                                </button>
                                ` : ''}
                            </div>
                        </div>

                        <hr style="border:none; border-top:1px solid #eaecf0; margin:20px 0;">

                        <h3 style="margin-bottom:15px;">Property Specifications</h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-bottom:25px;">
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">BHK</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.bhk} BHK</div>
                            </div>
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">Bathrooms</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.bathrooms || 1} Baths</div>
                            </div>
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">Area</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.areaSqft || "N/A"} sq.ft</div>
                            </div>
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">Furnished Status</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.furnishedStatus || "Unfurnished"}</div>
                            </div>
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">Parking</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.parking ? "Available" : "No"}</div>
                            </div>
                            <div style="background:#f8fafc; padding:15px; border-radius:8px;">
                                <span style="color:#667085; font-size:12px;">Property Type</span>
                                <div style="font-size:16px; font-weight:bold;">${prop.propertyType}</div>
                            </div>
                        </div>

                        <h3 style="margin-bottom:10px;">Description & Amenities</h3>
                        <p style="color:#475467; line-height:1.7; margin-bottom:15px;">${prop.description || "No detailed description provided."}</p>
                        <p style="font-size:14px; color:#667085; margin-bottom:30px;">
                            <strong>Amenities:</strong> ${prop.amenities || "Water, Electricity"}
                        </p>

                        ${isBroker ? `
                        <!-- Broker Owner Control Panel (RULE 1, 2 & 5) -->
                        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:24px; margin-top:20px;">
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
                                    <a href="property-status.html" style="background:#2563eb; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                                        ✏️ Update Status
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
                        ` : `
                        <!-- Broker Contact Box (RULE 3: In-App Chat Only, No Phone Expose) -->
                        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:25px;">
                            <div>
                                <div style="font-size:13px; color:#166534; font-weight:600;">LISTED BY VERIFIED BROKER</div>
                                <h4 style="margin:4px 0; font-size:18px;">${brokerName} (${brokerCode})</h4>
                                <p style="font-size:13px; color:#166534;">🔒 Personal contact details protected. Chat securely through HouseHub.</p>
                            </div>
                            <button onclick="startChatWithBroker(${prop.propertyId})" style="background:#16a34a; color:#fff; border:none; padding:12px 24px; border-radius:8px; font-size:15px; font-weight:bold; cursor:pointer;">
                                💬 In-App Chat with Broker
                            </button>
                        </div>

                        <!-- Customer Actions: Inquiry & Visit Scheduling Grid -->
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-top:20px;">
                            <!-- Send Quick Inquiry -->
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                                <h4 style="margin-bottom:6px; font-size:17px; color:#1e293b;">📩 Send an Inquiry</h4>
                                <p style="font-size:13px; color:#64748b; margin-bottom:12px;">Have questions about price or agreement? Ask the broker directly.</p>
                                <form onsubmit="submitInquiry(event, ${prop.propertyId})">
                                    <textarea id="inquiryMessageInput" placeholder="Hi, I am interested in this property. Is the rent negotiable?" required rows="3" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; margin-bottom:10px; resize:vertical; outline:none; box-sizing:border-box;"></textarea>
                                    <button type="submit" style="background:#2563eb; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer;">
                                        Send Inquiry
                                    </button>
                                </form>
                            </div>

                            <!-- Schedule Site Visit -->
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                                <h4 style="margin-bottom:6px; font-size:17px; color:#1e293b;">📅 Schedule a Site Visit</h4>
                                <p style="font-size:13px; color:#64748b; margin-bottom:12px;">Pick a convenient date and time to physically inspect the property.</p>
                                <form id="visitScheduleForm" onsubmit="submitVisit(event, ${prop.propertyId})">
                                    <div style="display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
                                        <div style="flex:1; min-width:140px;">
                                            <label style="font-size:12px; color:#64748b; display:block; margin-bottom:4px;">Visit Date</label>
                                            <input type="date" id="visitDateInput" required style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; box-sizing:border-box;">
                                        </div>
                                        <div style="flex:1; min-width:140px;">
                                            <label style="font-size:12px; color:#64748b; display:block; margin-bottom:4px;">Time Slot</label>
                                            <select id="visitTimeSlot" required style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; box-sizing:border-box;">
                                                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                                <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                                            </select>
                                        </div>
                                    </div>
                                    <input type="text" id="visitNotesInput" placeholder="Optional notes (e.g. Coming with family)" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; margin-bottom:10px; box-sizing:border-box;">
                                    <button type="submit" style="background:#0f172a; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer;">
                                        Schedule Visit
                                    </button>
                                </form>
                            </div>
                        </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        propertyDetails.innerHTML = `<p style="padding:40px; text-align:center; color:#b91c1c;">Error loading details: ${err.message}</p>`;
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
        await window.api.scheduleVisit(propertyId, visitDate, timeSlot, notes);
        alert("✅ Site visit scheduled successfully! The broker will confirm your slot. Track it in 'My Inquiries & Visits'.");
        document.getElementById("visitScheduleForm").reset();
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
// 5. BROKER: ADD PROPERTY FORM (RULE 2: STATUS PENDING)
// ==========================================
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
        const bathrooms = document.getElementById("bathrooms") || { value: 1 };
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

        const submitBtn = addPropertyForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting for Admin Verification...";

        try {
            const propertyPayload = {
                title: title.value.trim(),
                description: description ? description.value.trim() : "",
                propertyType: (propertyType.value || "APARTMENT").toUpperCase().replace("FLAT", "APARTMENT").replace("HOUSE", "INDEPENDENT_HOUSE"),
                purpose: (purpose.value || "RENT").toUpperCase(),
                price: parseFloat(price.value),
                address: address ? address.value.trim() : "Main Road",
                city: city.value.trim(),
                state: state ? state.value.trim() : "Rajasthan",
                bhk: parseInt(bhk.value) || 2,
                bathrooms: parseInt(bathrooms.value) || 1,
                areaSqft: area ? parseFloat(area.value) || 1000 : 1000,
                furnishedStatus: furnishedStatus.value || "Semi-Furnished",
                parking: parking.checked !== undefined ? parking.checked : true,
                amenities: amenities.value || "Lift, Security, Power Backup",
                imageUrls: [
                    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"
                ]
            };

            await window.api.addProperty(propertyPayload);

            alert(
                "✅ Property submitted successfully!\n\n" +
                "Status: PENDING ADMIN VERIFICATION (RULE 2)\n\n" +
                "Your property details and documents have been sent to Admin for review. Once approved, it will be published LIVE for customers."
            );

            addPropertyForm.reset();
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
document.addEventListener("DOMContentLoaded", function () {
    if (propertyGrid) {
        loadPublicProperties();
    }
    if (propertyDetails) {
        loadPropertyDetails();
    }
});