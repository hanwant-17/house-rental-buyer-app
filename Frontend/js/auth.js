// ==========================================
// CUSTOMER REGISTRATION VALIDATION
// ==========================================

const customerRegisterForm =
    document.getElementById("customerRegisterForm");

if (customerRegisterForm) {

    customerRegisterForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            let isValid = true;


            // GET VALUES

            const name =
                document.getElementById("name");

            const mobile =
                document.getElementById("mobile");

            const email =
                document.getElementById("email");

            const password =
                document.getElementById("password");

            const confirmPassword =
                document.getElementById("confirmPassword");

            const city =
                document.getElementById("city");

            const userType =
                document.getElementById("userType");


            // CLEAR OLD ERRORS

            document
                .querySelectorAll(".error-message")
                .forEach(error => {
                    error.textContent = "";
                });

            document
                .querySelectorAll("input, select")
                .forEach(field => {
                    field.classList.remove("invalid");
                });


            // NAME VALIDATION

            if (name.value.trim() === "") {

                showError(
                    name,
                    "Please enter your full name."
                );

                isValid = false;
            }


            // MOBILE VALIDATION

            const mobilePattern = /^[0-9]{10}$/;

            if (!mobilePattern.test(mobile.value.trim())) {

                showError(
                    mobile,
                    "Please enter a valid 10 digit mobile number."
                );

                isValid = false;
            }


            // EMAIL VALIDATION

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email.value.trim())) {

                showError(
                    email,
                    "Please enter a valid email address."
                );

                isValid = false;
            }


            // PASSWORD VALIDATION

            if (password.value.length < 6) {

                showError(
                    password,
                    "Password must contain at least 6 characters."
                );

                isValid = false;
            }


            // CONFIRM PASSWORD

            if (
                confirmPassword.value !==
                password.value
            ) {

                showError(
                    confirmPassword,
                    "Passwords do not match."
                );

                isValid = false;
            }


            // CITY

            if (city.value.trim() === "") {

                showError(
                    city,
                    "Please enter your city."
                );

                isValid = false;
            }


            // USER TYPE

            if (userType.value === "") {

                showError(
                    userType,
                    "Please select Rent or Buy."
                );

                isValid = false;
            }


            // SUCCESS

            if (isValid) {

                alert(
                    "Registration successful!"
                );

                customerRegisterForm.reset();

            }

        }
    );
}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(field, message) {

    field.classList.add("invalid");

    const error =
        field.parentElement
        .querySelector(".error-message");

    if (error) {
        error.textContent = message;
    }
}

// ==========================================
// LOGIN VALIDATION
// ==========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const email =
                document.getElementById("loginEmail");

            const password =
                document.getElementById("loginPassword");

            const role =
                document.getElementById("loginRole");

            let isValid = true;


            // CLEAR OLD ERRORS

            document
                .querySelectorAll(".error-message")
                .forEach(error => {
                    error.textContent = "";
                });

            document
                .querySelectorAll("input, select")
                .forEach(field => {
                    field.classList.remove("invalid");
                });


            // EMAIL

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email.value.trim())) {

                showError(
                    email,
                    "Please enter a valid email address."
                );

                isValid = false;
            }


            // PASSWORD

            if (password.value.length < 6) {

                showError(
                    password,
                    "Password must contain at least 6 characters."
                );

                isValid = false;
            }


            // ROLE

            if (role.value === "") {

                showError(
                    role,
                    "Please select your role."
                );

                isValid = false;
            }


            // LOGIN SUCCESS

            if (isValid) {

                localStorage.setItem(
                    "userRole",
                    role.value
                );

                localStorage.setItem(
                    "userEmail",
                    email.value.trim()
                );


                // ROLE BASED PAGE

                if (role.value === "customer") {

                    window.location.href =
                        "customer-dashboard.html";

                }

                else if (role.value === "broker") {

                    window.location.href =
                        "broker-dashboard.html";

                }

                else if (role.value === "admin") {

                    window.location.href =
                        "admin-dashboard.html";

                }

            }

        }
    );
}

// Logout functionality
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {

        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("selectedPropertyId");

        window.location.href = "login.html";
    });
}

// Broker Registration Validation
const brokerRegisterForm = document.getElementById("brokerRegisterForm");

if (brokerRegisterForm) {

    brokerRegisterForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("brokerName");
        const mobile = document.getElementById("brokerMobile");
        const email = document.getElementById("brokerEmail");
        const password = document.getElementById("brokerPassword");
        const city = document.getElementById("brokerCity");
        const idProof = document.getElementById("idProof");
        const addressProof = document.getElementById("addressProof");

        // Clear previous errors
        const fields = [
            name,
            mobile,
            email,
            password,
            city,
            idProof,
            addressProof
        ];

        fields.forEach(function (field) {
            field.classList.remove("invalid");

            const error = field.parentElement.querySelector(".error-message");

            if (error) {
                error.textContent = "";
            }
        });

        let isValid = true;

        // Name
        if (name.value.trim() === "") {
            showError(name, "Full name is required.");
            isValid = false;
        }

        // Mobile
        if (!/^[0-9]{10}$/.test(mobile.value.trim())) {
            showError(mobile, "Enter a valid 10-digit mobile number.");
            isValid = false;
        }

        // Email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showError(email, "Enter a valid email address.");
            isValid = false;
        }

        // Password
        if (password.value.length < 6) {
            showError(password, "Password must be at least 6 characters.");
            isValid = false;
        }

        // City
        if (city.value.trim() === "") {
            showError(city, "City is required.");
            isValid = false;
        }

        // ID Proof
        if (idProof.files.length === 0) {
            showError(idProof, "Please upload your ID proof.");
            isValid = false;
        }

        // Address Proof
        if (addressProof.files.length === 0) {
            showError(addressProof, "Please upload your address proof.");
            isValid = false;
        }

        // If everything is valid
        if (isValid) {

            alert(
                "Broker registration submitted successfully. " +
                "Your details have been sent for Admin verification."
            );

            brokerRegisterForm.reset();
        }
    });
}