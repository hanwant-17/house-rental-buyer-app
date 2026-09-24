// ==========================================
// 🏠 HouseHub - Authentication Controller
// Connected with Spring Boot REST API
// ==========================================

// Helper: Show Error on Form Input
function showError(field, message) {
    if (!field) return;
    field.classList.add("invalid");
    const error = field.parentElement.querySelector(".error-message");
    if (error) {
        error.textContent = message;
    }
}

// Helper: Clear All Errors in Form
function clearErrors(form) {
    if (!form) return;
    form.querySelectorAll(".error-message").forEach(error => {
        error.textContent = "";
    });
    form.querySelectorAll("input, select").forEach(field => {
        field.classList.remove("invalid");
    });
}

// ==========================================
// 1. CUSTOMER REGISTRATION
// ==========================================
const customerRegisterForm = document.getElementById("customerRegisterForm");

if (customerRegisterForm) {
    customerRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearErrors(customerRegisterForm);

        const name = document.getElementById("name");
        const mobile = document.getElementById("mobile");
        const email = document.getElementById("email");
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirmPassword");
        const city = document.getElementById("city");
        const userType = document.getElementById("userType");

        let isValid = true;

        if (!name.value.trim()) {
            showError(name, "Please enter your full name.");
            isValid = false;
        }

        const mobilePattern = /^[0-9]{10}$/;
        if (!mobilePattern.test(mobile.value.trim())) {
            showError(mobile, "Please enter a valid 10 digit mobile number.");
            isValid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
            showError(email, "Please enter a valid email address.");
            isValid = false;
        }

        if (password.value.length < 6) {
            showError(password, "Password must be at least 6 characters.");
            isValid = false;
        }

        if (password.value !== confirmPassword.value) {
            showError(confirmPassword, "Passwords do not match.");
            isValid = false;
        }

        if (!city.value.trim()) {
            showError(city, "Please enter your city.");
            isValid = false;
        }

        if (!userType.value) {
            showError(userType, "Please select Rent or Buy.");
            isValid = false;
        }

        if (!isValid) return;

        const submitBtn = customerRegisterForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating Account...";

        try {
            const result = await window.api.registerCustomer({
                name: name.value.trim(),
                mobile: mobile.value.trim(),
                email: email.value.trim(),
                password: password.value,
                city: city.value.trim(),
                userType: userType.value.toUpperCase()
            });

            alert("Registration successful! Welcome to HouseHub, " + result.data.name + "!");
            window.location.href = "customer-dashboard.html";
        } catch (error) {
            alert("Registration failed: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ==========================================
// 2. BROKER REGISTRATION (RULE 1: PENDING VERIFICATION)
// ==========================================
const brokerRegisterForm = document.getElementById("brokerRegisterForm");

if (brokerRegisterForm) {
    brokerRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearErrors(brokerRegisterForm);

        const name = document.getElementById("brokerName");
        const mobile = document.getElementById("brokerMobile");
        const email = document.getElementById("brokerEmail");
        const password = document.getElementById("brokerPassword");
        const city = document.getElementById("brokerCity");
        const agencyName = document.getElementById("agencyName") || { value: "" };
        const experience = document.getElementById("experience") || { value: "1-3 Years" };
        const idProof = document.getElementById("idProof");
        const addressProof = document.getElementById("addressProof");

        let isValid = true;

        if (!name.value.trim()) {
            showError(name, "Full name is required.");
            isValid = false;
        }

        if (!/^[0-9]{10}$/.test(mobile.value.trim())) {
            showError(mobile, "Enter a valid 10-digit mobile number.");
            isValid = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showError(email, "Enter a valid email address.");
            isValid = false;
        }

        if (password.value.length < 6) {
            showError(password, "Password must be at least 6 characters.");
            isValid = false;
        }

        if (!city.value.trim()) {
            showError(city, "City is required.");
            isValid = false;
        }

        if (idProof && idProof.files && idProof.files.length === 0) {
            showError(idProof, "Please upload your ID proof.");
            isValid = false;
        }

        if (addressProof && addressProof.files && addressProof.files.length === 0) {
            showError(addressProof, "Please upload your address proof.");
            isValid = false;
        }

        if (!isValid) return;

        const submitBtn = brokerRegisterForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting for Verification...";

        try {
            const result = await window.api.registerBroker({
                name: name.value.trim(),
                mobile: mobile.value.trim(),
                email: email.value.trim(),
                password: password.value,
                city: city.value.trim(),
                agencyName: agencyName.value ? agencyName.value.trim() : "Independent Broker",
                experience: experience.value || "1-3 Years",
                idProofUrl: "https://househub.storage/id-proof.pdf",
                addressProofUrl: "https://househub.storage/address-proof.pdf"
            });

            alert(
                "✅ Broker registration submitted successfully!\n\n" +
                "Status: PENDING ADMIN VERIFICATION\n\n" +
                "Admin will review your submitted documents. Your Broker ID will be generated and account activated upon approval."
            );

            window.location.href = "login.html";
        } catch (error) {
            alert("Broker Registration failed: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ==========================================
// 3. LOGIN (CUSTOMER, BROKER, ADMIN)
// ==========================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearErrors(loginForm);

        const email = document.getElementById("loginEmail");
        const password = document.getElementById("loginPassword");
        const role = document.getElementById("loginRole");

        let isValid = true;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showError(email, "Please enter a valid email address.");
            isValid = false;
        }

        if (password.value.length < 6) {
            showError(password, "Password must contain at least 6 characters.");
            isValid = false;
        }

        if (!isValid) return;

        const submitBtn = loginForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        try {
            const response = await window.api.login(email.value.trim(), password.value);
            const user = response.data;

            // Route based on actual role returned by backend
            const userRole = (user.role || "").toUpperCase();

            if (userRole === "ADMIN") {
                window.location.href = "admin-dashboard.html";
            } else if (userRole === "BROKER") {
                window.location.href = "broker-dashboard.html";
            } else {
                window.location.href = "customer-dashboard.html";
            }
        } catch (error) {
            alert("Login Failed: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ==========================================
// 4. LOGOUT
// ==========================================
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        if (window.api) {
            window.api.clearAuth();
        }
        window.location.href = "login.html";
    });
}