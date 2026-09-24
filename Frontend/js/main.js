// ===============================
// HOME PAGE SEARCH
// ===============================

const searchButton = document.querySelector(".search-btn");

if (searchButton) {

    searchButton.addEventListener("click", function () {

        const locationInput = document.querySelector(
            ".search-field input"
        );

        const purposeSelect = document.querySelector(
            ".search-field select"
        );

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
        localStorage.setItem(
            "searchLocation",
            location
        );

        localStorage.setItem(
            "searchPurpose",
            purpose
        );

        // Open properties page
        window.location.href =
            "pages/properties.html";
    });

}