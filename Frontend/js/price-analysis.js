// ==========================================================
// 🏠 HouseHub - Property Price Analytics & Market Trends
// Dynamic Chart.js Visualizations & Custom Dataset Uploader
// ==========================================================

// Global state
let rawMarketData = [];
let activeDataset = [];
let chartInstances = {};
let isCustomUploaded = false;

// Benchmark seed data to enrich initial charts alongside live platform properties
const benchmarkMarketSeed = [
    { title: "2 BHK Sunshine Residency", city: "Jodhpur", state: "Rajasthan", purpose: "RENT", propertyType: "APARTMENT", price: 18000, bhk: 2, areaSqft: 1100, locality: "Shastri Nagar" },
    { title: "3 BHK Royal Enclave", city: "Jodhpur", state: "Rajasthan", purpose: "RENT", propertyType: "APARTMENT", price: 25000, bhk: 3, areaSqft: 1650, locality: "C-Road" },
    { title: "4 BHK Luxury Villa", city: "Jodhpur", state: "Rajasthan", purpose: "BUY", propertyType: "VILLA", price: 8500000, bhk: 4, areaSqft: 2400, locality: "Pal Road" },
    { title: "3 BHK Independent Kothi", city: "Jodhpur", state: "Rajasthan", purpose: "BUY", propertyType: "INDEPENDENT_HOUSE", price: 6200000, bhk: 3, areaSqft: 2100, locality: "Ratanada" },
    { title: "2 BHK City Heights", city: "Jaipur", state: "Rajasthan", purpose: "RENT", propertyType: "APARTMENT", price: 22000, bhk: 2, areaSqft: 1200, locality: "Malviya Nagar" },
    { title: "3 BHK Duplex House", city: "Jaipur", state: "Rajasthan", purpose: "BUY", propertyType: "INDEPENDENT_HOUSE", price: 9500000, bhk: 3, areaSqft: 2500, locality: "Vaishali Nagar" },
    { title: "4 BHK Royal Palace Villa", city: "Jaipur", state: "Rajasthan", purpose: "BUY", propertyType: "VILLA", price: 14500000, bhk: 4, areaSqft: 3400, locality: "Jagatpura" },
    { title: "2 BHK Lake View Apartment", city: "Udaipur", state: "Rajasthan", purpose: "RENT", propertyType: "APARTMENT", price: 20000, bhk: 2, areaSqft: 1150, locality: "Fateh Sagar" },
    { title: "3 BHK Heritage Villa", city: "Udaipur", state: "Rajasthan", purpose: "BUY", propertyType: "VILLA", price: 11000000, bhk: 3, areaSqft: 2700, locality: "Hiran Magri" },
    { title: "3 BHK Metro Pearl", city: "Delhi", state: "Delhi", purpose: "RENT", propertyType: "APARTMENT", price: 45000, bhk: 3, areaSqft: 1550, locality: "Dwarka" },
    { title: "4 BHK Premium Builder Floor", city: "Delhi", state: "Delhi", purpose: "BUY", propertyType: "APARTMENT", price: 22000000, bhk: 4, areaSqft: 2200, locality: "Vasant Kunj" },
    { title: "2 BHK Sea Breeze", city: "Mumbai", state: "Maharashtra", purpose: "RENT", propertyType: "APARTMENT", price: 65000, bhk: 2, areaSqft: 950, locality: "Andheri West" },
    { title: "3 BHK Highrise Tower", city: "Mumbai", state: "Maharashtra", purpose: "BUY", propertyType: "APARTMENT", price: 31000000, bhk: 3, areaSqft: 1400, locality: "Bandra East" },
    { title: "3 BHK Silicon Valley Flat", city: "Bengaluru", state: "Karnataka", purpose: "RENT", propertyType: "APARTMENT", price: 38000, bhk: 3, areaSqft: 1600, locality: "Whitefield" },
    { title: "4 BHK Green Meadow Villa", city: "Bengaluru", state: "Karnataka", purpose: "BUY", propertyType: "VILLA", price: 18000000, bhk: 4, areaSqft: 3100, locality: "Sarjapur Road" }
];

// ==========================================
// 1. INITIALIZATION & LIVE DATA LOADER
// ==========================================
document.addEventListener("DOMContentLoaded", async function () {
    setupAuthNavbar();
    await loadInitialMarketData();
});

function setupAuthNavbar() {
    const user = window.api ? window.api.getCurrentUser() : null;
    const navArea = document.getElementById("navAuthArea");
    if (navArea && user && user.token) {
        let dashPage = "customer-dashboard.html";
        if (user.role === "BROKER") dashPage = "broker-dashboard.html";
        else if (user.role === "ADMIN") dashPage = "admin-dashboard.html";

        navArea.innerHTML = `
            <a href="${dashPage}" class="login-btn" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; text-decoration:none;">
                Dashboard (${user.name ? user.name.split(" ")[0] : "User"})
            </a>
            <a href="#" id="analyticsNavLogout" class="register-btn" style="background:#f1f5f9; color:#475467; border:1px solid #cbd5e1; padding:8px 16px; border-radius:6px; font-weight:600; text-decoration:none;">
                Logout
            </a>
        `;

        document.getElementById("analyticsNavLogout")?.addEventListener("click", function (e) {
            e.preventDefault();
            if (window.api) window.api.clearAuth();
            window.location.reload();
        });
    }
}

async function loadInitialMarketData() {
    try {
        let liveProperties = [];
        if (window.api) {
            const resp = await window.api.getPublicProperties();
            liveProperties = (resp && resp.data) ? resp.data : [];
        }

        // Standardize live properties
        const standardizedLive = liveProperties.map(p => ({
            title: p.title || "Platform Listing",
            city: p.city || "Jodhpur",
            state: p.state || "Rajasthan",
            purpose: (p.purpose || "RENT").toUpperCase(),
            propertyType: (p.propertyType || "APARTMENT").toUpperCase(),
            price: Number(p.price) || 0,
            bhk: Number(p.bhk) || 2,
            areaSqft: Number(p.areaSqft) || 1200,
            locality: p.address || p.city || ""
        }));

        // Combine live DB properties with benchmark seeds
        rawMarketData = [...standardizedLive, ...benchmarkMarketSeed];
        activeDataset = [...rawMarketData];
        isCustomUploaded = false;

        populateFilterDropdowns();
        refreshAllAnalytics();
    } catch (err) {
        console.error("Failed to load live properties, falling back to benchmark data:", err);
        rawMarketData = [...benchmarkMarketSeed];
        activeDataset = [...rawMarketData];
        populateFilterDropdowns();
        refreshAllAnalytics();
    }
}

// ==========================================
// 2. DATA FILTERING
// ==========================================
function populateFilterDropdowns() {
    const stateSelect = document.getElementById("filterState");
    const citySelect = document.getElementById("filterCity");

    // Extract unique states and cities
    const states = [...new Set(activeDataset.map(d => d.state).filter(Boolean))].sort();
    const cities = [...new Set(activeDataset.map(d => d.city).filter(Boolean))].sort();

    stateSelect.innerHTML = `<option value="">All States (${states.length})</option>`;
    states.forEach(s => {
        stateSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    citySelect.innerHTML = `<option value="">All Cities (${cities.length})</option>`;
    cities.forEach(c => {
        citySelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

function applyFilters() {
    const selectedState = document.getElementById("filterState").value;
    const selectedCity = document.getElementById("filterCity").value;
    const selectedPurpose = document.getElementById("filterPurpose").value;
    const selectedType = document.getElementById("filterType").value;

    let filtered = [...activeDataset];

    if (selectedState) {
        filtered = filtered.filter(d => d.state && d.state.toLowerCase() === selectedState.toLowerCase());
    }

    if (selectedCity) {
        filtered = filtered.filter(d => d.city && d.city.toLowerCase() === selectedCity.toLowerCase());
    }

    if (selectedPurpose) {
        filtered = filtered.filter(d => d.purpose && d.purpose.toUpperCase() === selectedPurpose.toUpperCase());
    }

    if (selectedType) {
        filtered = filtered.filter(d => d.propertyType && d.propertyType.toUpperCase() === selectedType.toUpperCase());
    }

    renderKPIs(filtered);
    renderCharts(filtered);
    renderSummaryTable(filtered);
}

function resetFilters() {
    document.getElementById("filterState").value = "";
    document.getElementById("filterCity").value = "";
    document.getElementById("filterPurpose").value = "";
    document.getElementById("filterType").value = "";
    applyFilters();
}

// ==========================================
// 3. FILE UPLOAD & PARSER (CSV / JSON)
// ==========================================
function handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;
        try {
            let parsedRows = [];
            if (fileName.endsWith(".json")) {
                parsedRows = parseJsonData(content);
            } else if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
                parsedRows = parseCsvData(content);
            } else {
                throw new Error("Unsupported file extension. Please upload a .csv or .json file.");
            }

            if (!parsedRows || parsedRows.length === 0) {
                throw new Error("No valid data rows found in the uploaded file.");
            }

            // Successfully parsed custom dataset!
            activeDataset = parsedRows;
            isCustomUploaded = true;

            // Update badge & buttons
            const badge = document.getElementById("activeSourceBadge");
            if (badge) {
                badge.textContent = `● Custom Dataset: ${file.name} (${parsedRows.length} properties)`;
                badge.style.background = "#eff6ff";
                badge.style.color = "#1d4ed8";
                badge.style.borderColor = "#93c5fd";
            }

            const resetBtn = document.getElementById("resetDataBtn");
            if (resetBtn) resetBtn.style.display = "inline-flex";

            populateFilterDropdowns();
            refreshAllAnalytics();

            alert(
                `✅ Data File Uploaded Successfully!\n\n` +
                `Loaded: ${parsedRows.length} property records from "${file.name}".\n` +
                `All graphs and market metrics have been updated.`
            );
        } catch (error) {
            alert(`❌ File Upload Error:\n\n${error.message}\n\nPlease check the "DATA FORMAT NOTICE" table above.`);
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

// CSV Parser with header verification
function parseCsvData(csvText) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        throw new Error("CSV file must have a header row and at least 1 record row.");
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[\"\'\s_]/g, ""));

    // Check mandatory headers: city, state, purpose, price, bhk, areasqft
    const requiredKeys = ["city", "state", "purpose", "price", "bhk"];
    const missingKeys = [];

    requiredKeys.forEach(k => {
        if (!headers.some(h => h.includes(k))) {
            missingKeys.push(k);
        }
    });

    if (missingKeys.length > 0) {
        throw new Error(`Missing mandatory column headers in CSV: [${missingKeys.join(", ")}].`);
    }

    // Find indices
    const idxCity = headers.findIndex(h => h.includes("city"));
    const idxState = headers.findIndex(h => h.includes("state"));
    const idxPurpose = headers.findIndex(h => h.includes("purpose"));
    const idxPrice = headers.findIndex(h => h.includes("price"));
    const idxBhk = headers.findIndex(h => h.includes("bhk"));
    const idxArea = headers.findIndex(h => h.includes("area") || h.includes("sqft"));
    const idxType = headers.findIndex(h => h.includes("type"));
    const idxTitle = headers.findIndex(h => h.includes("title") || h.includes("name"));
    const idxLocality = headers.findIndex(h => h.includes("local") || h.includes("address"));

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim().replace(/^["']|["']$/g, ""));
        if (parts.length < 5) continue;

        const city = parts[idxCity];
        const state = parts[idxState] || "India";
        const purpose = (parts[idxPurpose] || "RENT").toUpperCase().includes("BUY") || (parts[idxPurpose] || "").toUpperCase().includes("SALE") ? "BUY" : "RENT";
        const price = parseFloat(parts[idxPrice]) || 0;
        const bhk = parseInt(parts[idxBhk]) || 2;
        const areaSqft = (idxArea !== -1 && parseFloat(parts[idxArea])) ? parseFloat(parts[idxArea]) : 1200;
        const propertyType = (idxType !== -1 && parts[idxType]) ? parts[idxType].toUpperCase() : "APARTMENT";
        const title = (idxTitle !== -1 && parts[idxTitle]) ? parts[idxTitle] : `${bhk} BHK in ${city}`;
        const locality = (idxLocality !== -1 && parts[idxLocality]) ? parts[idxLocality] : city;

        if (city && price > 0) {
            records.push({
                title,
                city,
                state,
                purpose,
                propertyType,
                price,
                bhk,
                areaSqft,
                locality
            });
        }
    }

    return records;
}

// JSON Parser with validation
function parseJsonData(jsonText) {
    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        throw new Error("Invalid JSON syntax: " + e.message);
    }

    const items = Array.isArray(data) ? data : (data.properties || data.data || []);
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("JSON file must contain an array of property objects.");
    }

    const records = [];
    items.forEach(item => {
        const city = item.city || item.City;
        const state = item.state || item.State || "India";
        const price = Number(item.price || item.Price) || 0;
        const purpose = String(item.purpose || item.Purpose || "RENT").toUpperCase();
        const bhk = Number(item.bhk || item.BHK) || 2;
        const areaSqft = Number(item.areaSqft || item.area_sqft || item.area || 1200);
        const propertyType = String(item.propertyType || item.property_type || "APARTMENT").toUpperCase();
        const title = item.title || `${bhk} BHK in ${city}`;
        const locality = item.locality || item.address || city;

        if (city && price > 0) {
            records.push({
                title,
                city,
                state,
                purpose: purpose.includes("BUY") || purpose.includes("SALE") ? "BUY" : "RENT",
                propertyType,
                price,
                bhk,
                areaSqft,
                locality
            });
        }
    });

    return records;
}

// Reset custom dataset back to live DB
function resetToLiveDatabase() {
    activeDataset = [...rawMarketData];
    isCustomUploaded = false;

    const badge = document.getElementById("activeSourceBadge");
    if (badge) {
        badge.textContent = "● Live Platform Data";
        badge.style.background = "#ecfdf5";
        badge.style.color = "#047857";
        badge.style.borderColor = "#a7f3d0";
    }

    const resetBtn = document.getElementById("resetDataBtn");
    if (resetBtn) resetBtn.style.display = "none";

    resetFilters();
    populateFilterDropdowns();
    refreshAllAnalytics();
}

// Download Sample CSV Template
function downloadSampleCsv() {
    const csvContent =
        "title,city,state,purpose,property_type,price,bhk,area_sqft,locality\n" +
        "\"Luxury 3 BHK Flat\",Jodhpur,Rajasthan,RENT,APARTMENT,25000,3,1650,\"Shastri Nagar\"\n" +
        "\"Modern 4 BHK Villa\",Jodhpur,Rajasthan,BUY,VILLA,8500000,4,2400,\"Pal Road\"\n" +
        "\"Cozy 2 BHK Apartment\",Jaipur,Rajasthan,RENT,APARTMENT,22000,2,1100,\"Malviya Nagar\"\n" +
        "\"Independent Duplex Kothi\",Jaipur,Rajasthan,BUY,INDEPENDENT_HOUSE,9500000,3,2500,\"Vaishali Nagar\"\n" +
        "\"Lake View 2 BHK\",Udaipur,Rajasthan,RENT,APARTMENT,20000,2,1200,\"Fateh Sagar\"\n" +
        "\"Heritage Duplex Villa\",Udaipur,Rajasthan,BUY,VILLA,11000000,4,2800,\"Hiran Magri\"\n" +
        "\"3 BHK Highrise Apartment\",Delhi,Delhi,RENT,APARTMENT,45000,3,1550,\"Dwarka\"\n" +
        "\"4 BHK Luxury Floor\",Delhi,Delhi,BUY,APARTMENT,22000000,4,2200,\"Vasant Kunj\"\n" +
        "\"Sea Facing 2 BHK\",Mumbai,Maharashtra,RENT,APARTMENT,65000,2,950,\"Andheri West\"\n" +
        "\"3 BHK Penthouse\",Mumbai,Maharashtra,BUY,APARTMENT,31000000,3,1400,\"Bandra East\"\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "househub_sample_market_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// 4. METRICS & VISUALIZATIONS
// ==========================================
function refreshAllAnalytics() {
    renderKPIs(activeDataset);
    renderCharts(activeDataset);
    renderSummaryTable(activeDataset);
}

function renderKPIs(data) {
    const totalCount = data.length;
    const rentItems = data.filter(d => d.purpose === "RENT");
    const buyItems = data.filter(d => d.purpose === "BUY");

    const avgRent = rentItems.length > 0
        ? Math.round(rentItems.reduce((acc, cur) => acc + cur.price, 0) / rentItems.length)
        : 0;

    const avgBuy = buyItems.length > 0
        ? Math.round(buyItems.reduce((acc, cur) => acc + cur.price, 0) / buyItems.length)
        : 0;

    // Rate per sqft (for Buy properties)
    const validRateItems = buyItems.filter(d => d.areaSqft > 0 && d.price > 0);
    const avgRateSqft = validRateItems.length > 0
        ? Math.round(validRateItems.reduce((acc, cur) => acc + (cur.price / cur.areaSqft), 0) / validRateItems.length)
        : 0;

    const citiesCount = new Set(data.map(d => d.city)).size;

    document.getElementById("kpiTotalCount").textContent = totalCount.toLocaleString();
    document.getElementById("kpiLocationsCount").textContent = `Across ${citiesCount} Cities`;
    document.getElementById("kpiAvgRent").textContent = avgRent > 0 ? `₹${avgRent.toLocaleString()} / mo` : "N/A";
    document.getElementById("kpiAvgBuy").textContent = avgBuy > 0 ? formatIndianCurrency(avgBuy) : "N/A";
    document.getElementById("kpiAvgRate").textContent = avgRateSqft > 0 ? `₹${avgRateSqft.toLocaleString()} / sq.ft` : "N/A";
}

function formatIndianCurrency(num) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString()}`;
}

// ==========================================
// 5. CHART.JS GRAPH GENERATORS
// ==========================================
function renderCharts(data) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js library is not loaded.");
        return;
    }

    renderCityPriceChart(data);
    renderPurposeDoughnutChart(data);
    renderBhkChart(data);
    renderSqftRateChart(data);
}

// Chart 1: City-wise Average Buy & Rent Price (Bar Chart)
function renderCityPriceChart(data) {
    const ctx = document.getElementById("cityPriceChart");
    if (!ctx) return;

    if (chartInstances["cityPrice"]) {
        chartInstances["cityPrice"].destroy();
    }

    const cities = [...new Set(data.map(d => d.city))].slice(0, 7); // Top 7 cities

    const buyPrices = cities.map(city => {
        const items = data.filter(d => d.city === city && d.purpose === "BUY");
        return items.length > 0
            ? Math.round((items.reduce((sum, d) => sum + d.price, 0) / items.length) / 100000) // in Lakhs
            : 0;
    });

    const rentPrices = cities.map(city => {
        const items = data.filter(d => d.city === city && d.purpose === "RENT");
        return items.length > 0
            ? Math.round((items.reduce((sum, d) => sum + d.price, 0) / items.length) / 1000) // in Thousands
            : 0;
    });

    chartInstances["cityPrice"] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: cities,
            datasets: [
                {
                    label: "Avg. Buy Price (in ₹ Lakhs)",
                    data: buyPrices,
                    backgroundColor: "rgba(37, 99, 235, 0.85)",
                    borderRadius: 6
                },
                {
                    label: "Avg. Monthly Rent (in ₹ Thousands)",
                    data: rentPrices,
                    backgroundColor: "rgba(16, 185, 129, 0.85)",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            if (ctx.datasetIndex === 0) {
                                return ` Avg Buy: ₹${ctx.parsed.y} Lakhs`;
                            }
                            return ` Avg Rent: ₹${ctx.parsed.y * 1000} / mo`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Value Scale (₹ Lakhs / Thousands)" }
                }
            }
        }
    });
}

// Chart 2: Purpose Market Share (Doughnut)
function renderPurposeDoughnutChart(data) {
    const ctx = document.getElementById("purposeDoughnutChart");
    if (!ctx) return;

    if (chartInstances["purposeDoughnut"]) {
        chartInstances["purposeDoughnut"].destroy();
    }

    const rentCount = data.filter(d => d.purpose === "RENT").length;
    const buyCount = data.filter(d => d.purpose === "BUY").length;

    chartInstances["purposeDoughnut"] = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["For Rent", "For Sale / Purchase"],
            datasets: [
                {
                    data: [rentCount, buyCount],
                    backgroundColor: ["#10b981", "#2563eb"],
                    hoverOffset: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" }
            },
            cutout: "68%"
        }
    });
}

// Chart 3: BHK vs Average Price (Grouped Bar Chart)
function renderBhkChart(data) {
    const ctx = document.getElementById("bhkChart");
    if (!ctx) return;

    if (chartInstances["bhkChart"]) {
        chartInstances["bhkChart"].destroy();
    }

    const bhkCategories = [1, 2, 3, 4];
    const labels = ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"];

    const buyByBhk = bhkCategories.map(bhk => {
        const items = data.filter(d => d.bhk === bhk && d.purpose === "BUY");
        return items.length > 0
            ? Math.round((items.reduce((sum, d) => sum + d.price, 0) / items.length) / 100000)
            : 0;
    });

    const rentByBhk = bhkCategories.map(bhk => {
        const items = data.filter(d => d.bhk === bhk && d.purpose === "RENT");
        return items.length > 0
            ? Math.round(items.reduce((sum, d) => sum + d.price, 0) / items.length)
            : 0;
    });

    chartInstances["bhkChart"] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Avg. Buy (₹ Lakhs)",
                    data: buyByBhk,
                    backgroundColor: "rgba(99, 102, 241, 0.85)",
                    borderRadius: 6
                },
                {
                    label: "Avg. Rent (₹ / month)",
                    data: rentByBhk.map(p => Math.round(p / 1000)), // in thousands
                    backgroundColor: "rgba(245, 158, 11, 0.85)",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Value Index (₹ Lakhs / ₹ Thousands Rent)" }
                }
            }
        }
    });
}

// Chart 4: Rate per Sq.Ft by Property Type (Bar Chart)
function renderSqftRateChart(data) {
    const ctx = document.getElementById("sqftRateChart");
    if (!ctx) return;

    if (chartInstances["sqftRate"]) {
        chartInstances["sqftRate"].destroy();
    }

    const types = ["APARTMENT", "VILLA", "INDEPENDENT_HOUSE"];
    const labels = ["Apartments / Flats", "Villas", "Independent Houses"];

    const avgRates = types.map(type => {
        const items = data.filter(d => d.propertyType === type && d.purpose === "BUY" && d.areaSqft > 0);
        return items.length > 0
            ? Math.round(items.reduce((sum, d) => sum + (d.price / d.areaSqft), 0) / items.length)
            : 0;
    });

    chartInstances["sqftRate"] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Avg. Rate (₹ per Sq.Ft)",
                    data: avgRates,
                    backgroundColor: [
                        "rgba(37, 99, 235, 0.85)",
                        "rgba(217, 119, 6, 0.85)",
                        "rgba(147, 51, 234, 0.85)"
                    ],
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Rate (₹ / Sq.Ft)" }
                }
            }
        }
    });
}

// ==========================================
// 6. SUMMARY TABLE GENERATOR
// ==========================================
function renderSummaryTable(data) {
    const tableBody = document.getElementById("summaryTableBody");
    const countBadge = document.getElementById("tableRecordCount");
    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No matching properties found for the selected filters.</td></tr>`;
        if (countBadge) countBadge.textContent = "0 Records";
        return;
    }

    if (countBadge) countBadge.textContent = `${data.length} Records`;

    // Group by City
    const cityMap = {};
    data.forEach(d => {
        if (!cityMap[d.city]) {
            cityMap[d.city] = {
                city: d.city,
                state: d.state,
                items: []
            };
        }
        cityMap[d.city].items.push(d);
    });

    tableBody.innerHTML = "";
    Object.values(cityMap).forEach(group => {
        const items = group.items;
        const rentItems = items.filter(d => d.purpose === "RENT");
        const buyItems = items.filter(d => d.purpose === "BUY");

        const avgRent = rentItems.length > 0
            ? `₹${Math.round(rentItems.reduce((acc, c) => acc + c.price, 0) / rentItems.length).toLocaleString()}`
            : "-";

        const avgBuy = buyItems.length > 0
            ? formatIndianCurrency(Math.round(buyItems.reduce((acc, c) => acc + c.price, 0) / buyItems.length))
            : "-";

        const rateItems = buyItems.filter(d => d.areaSqft > 0);
        const avgRate = rateItems.length > 0
            ? `₹${Math.round(rateItems.reduce((acc, c) => acc + (c.price / c.areaSqft), 0) / rateItems.length).toLocaleString()}`
            : "-";

        const prices = items.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const rangeStr = `${formatIndianCurrency(minPrice)} - ${formatIndianCurrency(maxPrice)}`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>📍 ${group.city}</strong></td>
            <td>${group.state}</td>
            <td><span style="background:#eff6ff; color:#1d4ed8; font-weight:700; padding:2px 8px; border-radius:10px; font-size:12px;">${items.length}</span></td>
            <td style="color:#059669; font-weight:600;">${avgRent}</td>
            <td style="color:#2563eb; font-weight:600;">${avgBuy}</td>
            <td style="font-weight:600;">${avgRate}</td>
            <td style="font-size:12px; color:#475467;">${rangeStr}</td>
        `;
        tableBody.appendChild(tr);
    });
}
