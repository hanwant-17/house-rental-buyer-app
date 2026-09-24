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
                <a href="properties.html" style="color:#1d4ed8; text-decoration:none; font-weight:600; display:inline-block; margin-bottom:20px;">
                    ← Back to All Properties
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
                            <div style="text-align:right;">
                                <div style="font-size:26px; font-weight:bold; color:#1d4ed8;">${priceDisplay}</div>
                                <span style="font-size:13px; color:#16a34a; font-weight:600;">✓ Verified Listing</span>
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

                        <!-- Broker Contact Box (RULE 3: In-App Chat Only, No Phone Expose) -->
                        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                            <div>
                                <div style="font-size:13px; color:#166534; font-weight:600;">LISTED BY VERIFIED BROKER</div>
                                <h4 style="margin:4px 0; font-size:18px;">${brokerName} (${brokerCode})</h4>
                                <p style="font-size:13px; color:#166534;">🔒 Personal contact details protected. Chat securely through HouseHub.</p>
                            </div>
                            <button onclick="startChatWithBroker(${prop.propertyId})" style="background:#16a34a; color:#fff; border:none; padding:12px 24px; border-radius:8px; font-size:15px; font-weight:bold; cursor:pointer;">
                                💬 In-App Chat with Broker
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        propertyDetails.innerHTML = `<p style="padding:40px; text-align:center; color:#b91c1c;">Error loading details: ${err.message}</p>`;
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