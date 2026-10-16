document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const messageBox = document.getElementById("message");

    // ============================================
    // CHECK LOGIN FORM
    // ============================================

    if (!loginForm) {
        console.error("Login form not found.");
        return;
    }


    // ============================================
    // LOGIN FORM SUBMIT
    // ============================================

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        // ========================================
        // GET INPUT VALUES
        // ========================================

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");


        if (!emailInput || !passwordInput) {

            showMessage(
                "Login form fields are missing.",
                "error"
            );

            return;
        }


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ========================================
        // VALIDATION
        // ========================================

        if (!email) {

            showMessage(
                "Please enter your email address.",
                "error"
            );

            emailInput.focus();

            return;
        }


        if (!password) {

            showMessage(
                "Please enter your password.",
                "error"
            );

            passwordInput.focus();

            return;
        }


        // ========================================
        // LOGIN BUTTON
        // ========================================

        const loginButton =
            loginForm.querySelector(
                'button[type="submit"]'
            );


        const originalButtonText =
            loginButton
                ? loginButton.textContent
                : "Login";


        if (loginButton) {

            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";

        }


        // Remove previous message

        clearMessage();


        try {

            console.log("================================");
            console.log("LOGIN REQUEST STARTED");
            console.log("Email:", email);
            console.log("================================");


            // ====================================
            // SEND LOGIN REQUEST
            // ====================================

            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            console.log(
                "Login HTTP Status:",
                response.status
            );


            // ====================================
            // READ RESPONSE
            // ====================================

            let data;

            try {

                data = await response.json();

            } catch (jsonError) {

                console.error(
                    "Invalid JSON response:",
                    jsonError
                );

                showMessage(
                    "Server returned an invalid response.",
                    "error"
                );

                return;
            }


            console.log(
                "Login API Response:",
                data
            );


            // ====================================
            // LOGIN FAILED
            // ====================================

            if (!response.ok) {

                showMessage(
                    data.message ||
                    "Invalid email or password.",
                    "error"
                );

                return;
            }


            // ====================================
            // GET JWT TOKEN
            // ====================================

            const token =
                data.token ||
                data.accessToken ||
                data.jwt;


            console.log(
                "Token received:",
                token ? "YES" : "NO"
            );


            // ====================================
            // TOKEN NOT FOUND
            // ====================================

            if (!token) {

                console.error(
                    "Login successful but JWT token missing.",
                    data
                );

                showMessage(
                    "Login successful, but authentication token was not received from the server.",
                    "error"
                );

                return;
            }


            // ====================================
            // SAVE TOKEN
            // ====================================

            localStorage.setItem(
                "token",
                token
            );


            /*
             * These additional keys keep compatibility
             * with the existing frontend code.
             */

            localStorage.setItem(
                "authToken",
                token
            );


            localStorage.setItem(
                "accessToken",
                token
            );


            console.log(
                "JWT token saved successfully."
            );


            // ====================================
            // SAVE USER DATA
            // ====================================

            if (data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                console.log(
                    "User saved:",
                    data.user
                );
            }


            // ====================================
            // DETERMINE USER ROLE
            // ====================================

            let role = "student";


            if (
                data.user &&
                data.user.role
            ) {

                role =
                    String(
                        data.user.role
                    ).toLowerCase();

            } else if (data.role) {

                role =
                    String(
                        data.role
                    ).toLowerCase();

            }


            console.log(
                "User role:",
                role
            );


            // ====================================
            // LOGIN SUCCESS
            // ====================================

            showMessage(
                "Login successful! Redirecting...",
                "success"
            );


            // ====================================
            // REDIRECT
            // ====================================

            setTimeout(function () {

                if (
                    role === "admin" ||
                    role === "administrator"
                ) {

                    console.log(
                        "Redirecting to admin dashboard..."
                    );

                    window.location.replace(
                        "admin.html"
                    );

                } else {

                    console.log(
                        "Redirecting to student dashboard..."
                    );

                    window.location.replace(
                        "dashboard.html"
                    );

                }

            }, 600);


        } catch (error) {

            // ====================================
            // NETWORK / SERVER ERROR
            // ====================================

            console.error(
                "LOGIN ERROR:",
                error
            );


            showMessage(
                "Unable to connect to the server. Please make sure the backend is running.",
                "error"
            );

        } finally {

            // ====================================
            // ENABLE BUTTON AGAIN
            // ====================================

            if (loginButton) {

                loginButton.disabled = false;

                loginButton.textContent =
                    originalButtonText;

            }

        }

    });


    // ============================================
    // SHOW MESSAGE
    // ============================================

    function showMessage(text, type) {

        if (!messageBox) {
            console.log(text);
            return;
        }


        if (type === "success") {

            messageBox.innerHTML = `
                <div class="alert alert-success">
                    ${escapeHTML(text)}
                </div>
            `;

        } else {

            messageBox.innerHTML = `
                <div class="alert alert-error">
                    ${escapeHTML(text)}
                </div>
            `;

        }

    }


    // ============================================
    // CLEAR MESSAGE
    // ============================================

    function clearMessage() {

        if (messageBox) {
            messageBox.innerHTML = "";
        }

    }


    // ============================================
    // HTML ESCAPE
    // ============================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});