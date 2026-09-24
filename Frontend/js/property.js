// ==========================================
// TEMPORARY PROPERTY DATA
// ==========================================

const properties = [

    {
        id: 1,
        title: "Modern 3 BHK House",
        purpose: "rent",
        type: "house",
        location: "Jodhpur, Rajasthan",
        bhk: 3,
        bathrooms: 2,
        area: "1500 sq.ft",
        price: "₹25,000 / month",
        image: "../images/house1.jpg"
    },

    {
        id: 2,
        title: "Premium 2 BHK Flat",
        purpose: "buy",
        type: "flat",
        location: "Jaipur, Rajasthan",
        bhk: 2,
        bathrooms: 2,
        area: "1200 sq.ft",
        price: "₹45 Lakh",
        image: "../images/flat-banner.jpg"
    },

    {
        id: 3,
        title: "Luxury 4 BHK Villa",
        purpose: "rent",
        type: "villa",
        location: "Udaipur, Rajasthan",
        bhk: 4,
        bathrooms: 3,
        area: "2200 sq.ft",
        price: "₹40,000 / month",
        image: "../images/home-banner.jpg"
    }

];


// ==========================================
// GET PROPERTY GRID
// ==========================================

const propertyGrid =
    document.getElementById("propertyGrid");

const propertyCount =
    document.getElementById("propertyCount");

const noProperties =
    document.getElementById("noProperties");


// ==========================================
// DISPLAY PROPERTIES
// ==========================================

function displayProperties(propertyList) {

    if (!propertyGrid) {
        return;
    }

    propertyGrid.innerHTML = "";

    if (propertyList.length === 0) {

        noProperties.style.display = "block";

        propertyCount.textContent =
            "0 Properties";

        return;
    }

    noProperties.style.display = "none";

    propertyCount.textContent =
        propertyList.length + " Properties";


    propertyList.forEach(property => {

        const card = document.createElement("div");

        card.className = "property-card";


        card.innerHTML = `

            <div class="property-card-image">

                <img
                    src="${property.image}"
                    alt="${property.title}"
                >

                <span class="property-purpose
                    ${property.purpose === "buy" ? "buy" : ""}">
                    ${property.purpose === "buy"
                        ? "For Sale"
                        : "For Rent"}
                </span>

            </div>


            <div class="property-card-content">

                <h3>
                    ${property.title}
                </h3>

                <p class="property-location">
                    📍 ${property.location}
                </p>


                <div class="property-info">

                    <span>
                        🛏 ${property.bhk} BHK
                    </span>

                    <span>
                        🚿 ${property.bathrooms} Bath
                    </span>

                    <span>
                        📐 ${property.area}
                    </span>

                </div>


                <div class="property-card-bottom">

                    <div class="property-price">
                        ${property.price}
                    </div>

                    <button
                        class="view-button"
                        onclick="viewProperty(${property.id})">
                        View Details
                    </button>

                </div>

            </div>

        `;

        propertyGrid.appendChild(card);

    });

}


// ==========================================
// FILTER PROPERTIES
// ==========================================

function filterProperties() {

    const location =
        document
        .getElementById("locationFilter")
        .value
        .toLowerCase()
        .trim();

    const purpose =
        document
        .getElementById("purposeFilter")
        .value;

    const type =
        document
        .getElementById("typeFilter")
        .value;

    const bhk =
        document
        .getElementById("bhkFilter")
        .value;


    const filteredProperties =
        properties.filter(property => {

            const locationMatch =
                location === "" ||
                property.location
                .toLowerCase()
                .includes(location);


            const purposeMatch =
                purpose === "" ||
                property.purpose === purpose;


            const typeMatch =
                type === "" ||
                property.type === type;


            const bhkMatch =
                bhk === "" ||
                (
                    bhk === "4"
                    ? property.bhk >= 4
                    : property.bhk == bhk
                );


            return (
                locationMatch &&
                purposeMatch &&
                typeMatch &&
                bhkMatch
            );

        });


    displayProperties(filteredProperties);

}


// ==========================================
// SEARCH BUTTON
// ==========================================

const filterButton =
    document.getElementById("filterButton");

if (filterButton) {

    filterButton.addEventListener(
        "click",
        filterProperties
    );

}


// ==========================================
// VIEW PROPERTY
// ==========================================

function viewProperty(id) {

    localStorage.setItem(
        "selectedPropertyId",
        id
    );

    window.location.href =
        "property-details.html";

}


// ==========================================
// INITIAL DISPLAY
// ==========================================

if (propertyGrid) {
    displayProperties(properties);
}

// ==========================================
// PROPERTY DETAILS PAGE
// ==========================================

const propertyDetails =
    document.getElementById("propertyDetails");

if (propertyDetails) {

    const selectedId =
        localStorage.getItem("selectedPropertyId");

    const selectedProperty =
        properties.find(
            property => property.id == selectedId
        );

    if (!selectedProperty) {

        propertyDetails.innerHTML = `
            <div class="no-property">
                <h2>Property Not Found</h2>
                <p>
                    The selected property is not available.
                </p>

                <a href="properties.html">
                    Back to Properties
                </a>
            </div>
        `;

    } else {

        propertyDetails.innerHTML = `

            <div class="property-details-container">

                <div class="property-details-image">

                    <img
                        src="${selectedProperty.image}"
                        alt="${selectedProperty.title}"
                    >

                </div>


                <div class="property-details-content">

                    <span class="details-purpose">

                        ${
                            selectedProperty.purpose === "buy"
                            ? "For Sale"
                            : "For Rent"
                        }

                    </span>


                    <h1>
                        ${selectedProperty.title}
                    </h1>


                    <p class="details-location">
                        📍 ${selectedProperty.location}
                    </p>


                    <div class="details-info">

                        <div>
                            <strong>
                                🛏 BHK
                            </strong>

                            <span>
                                ${selectedProperty.bhk}
                            </span>
                        </div>


                        <div>
                            <strong>
                                🚿 Bathrooms
                            </strong>

                            <span>
                                ${selectedProperty.bathrooms}
                            </span>
                        </div>


                        <div>
                            <strong>
                                📐 Area
                            </strong>

                            <span>
                                ${selectedProperty.area}
                            </span>
                        </div>


                        <div>
                            <strong>
                                🏠 Type
                            </strong>

                            <span>
                                ${selectedProperty.type}
                            </span>
                        </div>

                    </div>


                    <div class="details-price">

                        ${selectedProperty.price}

                    </div>


                    <p class="details-description">

                        This property is suitable for
                        comfortable living and is available
                        for ${
                            selectedProperty.purpose === "buy"
                            ? "purchase"
                            : "rent"
                        }.

                    </p>


                    <div class="details-actions">

                        <button
                            class="chat-broker-btn"
                            onclick="chatWithBroker()">

                            💬 Chat with Broker

                        </button>


                        <a
                            href="properties.html"
                            class="back-properties-btn">

                            ← Back to Properties

                        </a>

                    </div>

                </div>

            </div>

        `;
    }
}


// ==========================================
// CHAT WITH BROKER
// ==========================================

function chatWithBroker() {
    window.location.href = "chat.html";
}

// Add Property Form Validation
const addPropertyForm = document.getElementById("addPropertyForm");

if (addPropertyForm) {

    addPropertyForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const title = document.getElementById("propertyTitle");
        const type = document.getElementById("propertyType");
        const purpose = document.getElementById("propertyPurpose");
        const price = document.getElementById("propertyPrice");

        const address = document.getElementById("propertyAddress");
        const city = document.getElementById("propertyCity");
        const state = document.getElementById("propertyState");
        const pincode = document.getElementById("propertyPincode");

        const bhk = document.getElementById("propertyBhk");
        const bathrooms = document.getElementById("bathrooms");
        const area = document.getElementById("propertyArea");

        const description =
            document.getElementById("propertyDescription");

        const images =
            document.getElementById("propertyImages");

        const documents =
            document.getElementById("propertyDocuments");


        const fields = [
            title,
            type,
            purpose,
            price,
            address,
            city,
            state,
            pincode,
            bhk,
            bathrooms,
            area,
            description,
            images,
            documents
        ];


        // Clear old errors
        fields.forEach(function (field) {

            field.classList.remove("invalid");

            const error =
                field.parentElement.querySelector(".error-message");

            if (error) {
                error.textContent = "";
            }

        });


        let isValid = true;


        // Required field validation
        fields.forEach(function (field) {

            if (
                field.type === "file"
                    ? field.files.length === 0
                    : field.value.trim() === ""
            ) {

                showPropertyError(
                    field,
                    "This field is required."
                );

                isValid = false;
            }

        });


        // Pincode validation
        if (
            pincode.value.trim() !== "" &&
            !/^[0-9]{6}$/.test(pincode.value.trim())
        ) {

            showPropertyError(
                pincode,
                "Enter a valid 6-digit pincode."
            );

            isValid = false;
        }


        // Submit property
        if (isValid) {

            localStorage.setItem(
                "propertyVerificationStatus",
                "Pending Verification"
            );

            alert(
                "Property submitted successfully!\n\n" +
                "Status: Pending Admin Verification"
            );

            addPropertyForm.reset();
        }

    });

}


// Show property validation error
function showPropertyError(field, message) {

    field.classList.add("invalid");

    const error =
        field.parentElement.querySelector(".error-message");

    if (error) {
        error.textContent = message;
    }
}