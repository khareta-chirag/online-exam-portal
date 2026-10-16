document.addEventListener("DOMContentLoaded", () => {
    const examsContainer = document.getElementById("examsContainer");
    const message = document.getElementById("message");
    const logoutBtn = document.getElementById("logoutBtn");

    // ==========================================
    // AUTH CHECK
    // ==========================================

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("accessToken");

            window.location.href = "login.html";
        });
    }

    // ==========================================
    // LOAD EXAMS
    // ==========================================

    loadExams(token);


    async function loadExams(authToken) {

        examsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading examinations...
            </div>
        `;

        try {

            const response = await fetch("/api/exams", {
                method: "GET",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                }
            });


            // ==================================
            // AUTH ERROR
            // ==================================

            if (response.status === 401) {

                localStorage.removeItem("token");
                localStorage.removeItem("authToken");
                localStorage.removeItem("accessToken");

                window.location.href = "login.html";

                return;
            }


            // ==================================
            // FORBIDDEN
            // ==================================

            if (response.status === 403) {

                showError(
                    "You are not authorized to view examinations."
                );

                return;
            }


            // ==================================
            // OTHER HTTP ERROR
            // ==================================

            if (!response.ok) {

                const errorText = await response.text();

                console.error(
                    "Exam API Error:",
                    response.status,
                    errorText
                );

                showError(
                    `Unable to load examinations. Server returned ${response.status}.`
                );

                return;
            }


            // ==================================
            // PARSE RESPONSE
            // ==================================

            const data = await response.json();

            console.log("Exams API Response:", data);


            // ==================================
            // CHECK EXAMS
            // ==================================

            const exams = Array.isArray(data)
                ? data
                : data.exams;


            if (!Array.isArray(exams)) {

                console.error(
                    "Unexpected API response:",
                    data
                );

                showError(
                    "Invalid response received from server."
                );

                return;
            }


            // ==================================
            // NO EXAMS
            // ==================================

            if (exams.length === 0) {

                examsContainer.innerHTML = `
                    <div class="empty-state"
                         style="grid-column:1/-1;">

                        <div class="empty-state-icon">
                            📝
                        </div>

                        <h3>
                            No examinations available
                        </h3>

                        <p>
                            There are currently no published
                            examinations. Please check again later.
                        </p>

                    </div>
                `;

                return;
            }


            // ==================================
            // DISPLAY EXAMS
            // ==================================

            examsContainer.innerHTML = "";

            exams.forEach((exam) => {

                const examId =
                    exam.id ||
                    exam._id;

                const title =
                    exam.title ||
                    "Untitled Examination";

                const description =
                    exam.description ||
                    "No description available.";

                const duration =
                    exam.durationMinutes ||
                    0;

                const questionCount =
                    exam.questionCount ??
                    (Array.isArray(exam.questions)
                        ? exam.questions.length
                        : 0);


                const card =
                    document.createElement("div");

                card.className = "exam-card";


                card.innerHTML = `
                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(description)}
                    </p>

                    <div class="exam-meta">

                        <span class="badge badge-primary">
                            ⏱ ${duration} Minutes
                        </span>

                        <span class="badge badge-success">
                            📝 ${questionCount} Questions
                        </span>

                    </div>

                    <button
                        class="btn btn-primary start-exam-btn"
                        data-id="${examId}"
                    >
                        Start Examination →
                    </button>
                `;


                examsContainer.appendChild(card);
            });


            // ==================================
            // START EXAM BUTTONS
            // ==================================

            const startButtons =
                document.querySelectorAll(
                    ".start-exam-btn"
                );


            startButtons.forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const examId =
                            button.dataset.id;

                        if (!examId) {
                            alert(
                                "Invalid examination ID."
                            );
                            return;
                        }


                        window.location.href =
                            `exam.html?id=${encodeURIComponent(examId)}`;
                    }
                );

            });


        } catch (error) {

            console.error(
                "Dashboard Error:",
                error
            );


            showError(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        }
    }


    // ==========================================
    // ERROR UI
    // ==========================================

    function showError(text) {

        examsContainer.innerHTML = `
            <div class="empty-state"
                 style="grid-column:1/-1;">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(text)}
                </p>

                <button
                    id="retryBtn"
                    class="btn btn-primary"
                    style="margin-top:20px;"
                >
                    Try Again
                </button>

            </div>
        `;


        const retryBtn =
            document.getElementById("retryBtn");


        if (retryBtn) {

            retryBtn.addEventListener(
                "click",
                () => {
                    loadExams(token);
                }
            );

        }
    }


    // ==========================================
    // HTML SECURITY
    // ==========================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});