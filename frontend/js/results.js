document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const resultsContainer =
        document.getElementById("resultsContainer");


    // =====================================================
    // AUTH
    // =====================================================

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");


    if (!token) {

        window.location.replace(
            "login.html"
        );

        return;
    }


    // =====================================================
    // LOAD RESULTS
    // =====================================================

    loadResults();


    // =====================================================
    // LOAD RESULTS FUNCTION
    // =====================================================

    async function loadResults() {

        try {

            showLoading();


            console.log(
                "Loading student results..."
            );


            // =================================================
            // CORRECT API ROUTE
            // =================================================

            const response =
                await fetch(
                    "/api/attempts/results/me",
                    {
                        method: "GET",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        }
                    }
                );


            console.log(
                "Results API status:",
                response.status
            );


            // =================================================
            // AUTH ERROR
            // =================================================

            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            // =================================================
            // READ RESPONSE
            // =================================================

            const data =
                await safeJson(
                    response
                );


            console.log(
                "Results API response:",
                data
            );


            // =================================================
            // API ERROR
            // =================================================

            if (
                !response.ok
            ) {

                throw new Error(

                    data.message ||
                    "Unable to load results."

                );
            }


            // =================================================
            // GET RESULTS
            // =================================================

            const results =
                Array.isArray(
                    data.results
                )
                    ? data.results
                    : [];


            console.log(
                "Student results:",
                results
            );


            // =================================================
            // NO RESULTS
            // =================================================

            if (
                results.length === 0
            ) {

                showEmpty();

                return;
            }


            // =================================================
            // RENDER RESULTS
            // =================================================

            renderResults(
                results
            );


        } catch (error) {

            console.error(
                "RESULTS ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load results."
            );

        }

    }


    // =====================================================
    // RENDER RESULTS
    // =====================================================

    function renderResults(
        results
    ) {

        resultsContainer.innerHTML = "";


        results.forEach(
            function (result) {

                const score =
                    Number(
                        result.score || 0
                    );


                const totalMarks =
                    Number(
                        result.totalMarks || 0
                    );


                const percentage =
                    Number(
                        result.percentage || 0
                    );


                const examTitle =
                    result.examTitle ||
                    "Examination";


                const submittedAt =
                    formatDate(
                        result.submittedAt
                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "result-card";


                card.innerHTML = `

                    <div class="result-card-header">

                        <div>

                            <h3>
                                ${escapeHTML(
                                    examTitle
                                )}
                            </h3>

                            <p class="result-date">
                                Submitted:
                                ${escapeHTML(
                                    submittedAt
                                )}
                            </p>

                        </div>


                        <div class="result-percentage">

                            ${percentage.toFixed(2)}%

                        </div>

                    </div>


                    <div class="result-card-body">

                        <div class="result-stat">

                            <span class="stat-label">
                                Score
                            </span>

                            <strong>
                                ${score}
                                /
                                ${totalMarks}
                            </strong>

                        </div>


                        <div class="result-stat">

                            <span class="stat-label">
                                Percentage
                            </span>

                            <strong>
                                ${percentage.toFixed(2)}%
                            </strong>

                        </div>


                        <div class="result-stat">

                            <span class="stat-label">
                                Status
                            </span>

                            <strong class="status-success">
                                Submitted
                            </strong>

                        </div>

                    </div>


                    <div class="result-card-footer">

                        <button
                            class="btn btn-primary view-result-btn"
                            data-id="${escapeHTML(
                                result.id
                            )}"
                        >

                            View Result

                        </button>

                    </div>

                `;


                resultsContainer.appendChild(
                    card
                );

            }
        );


        // =================================================
        // VIEW RESULT BUTTONS
        // =================================================

        const buttons =
            resultsContainer.querySelectorAll(
                ".view-result-btn"
            );


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const resultId =
                            this.dataset.id;


                        if (!resultId) {

                            return;
                        }


                        window.location.href =
                            `result-detail.html?id=${encodeURIComponent(
                                resultId
                            )}`;

                    }
                );

            }
        );

    }


    // =====================================================
    // LOADING
    // =====================================================

    function showLoading() {

        resultsContainer.innerHTML = `

            <div class="empty-state">

                <div class="loading">

                    <div class="spinner"></div>

                    Loading your results...

                </div>

            </div>

        `;

    }


    // =====================================================
    // EMPTY
    // =====================================================

    function showEmpty() {

        resultsContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📊
                </div>

                <h3>
                    No Results Yet
                </h3>

                <p>
                    You have not completed any examination yet.
                </p>

                <a
                    href="dashboard.html"
                    class="btn btn-primary"
                    style="margin-top:20px;"
                >
                    Go to Dashboard
                </a>

            </div>

        `;

    }


    // =====================================================
    // ERROR
    // =====================================================

    function showError(
        message
    ) {

        resultsContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to Load Results
                </h3>

                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>

                <button
                    class="btn btn-primary"
                    id="retryResults"
                    style="margin-top:20px;"
                >
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryResults"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                function () {

                    loadResults();

                }
            );

        }

    }


    // =====================================================
    // SAFE JSON
    // =====================================================

    async function safeJson(
        response
    ) {

        const text =
            await response.text();


        if (!text) {

            return {};

        }


        try {

            return JSON.parse(
                text
            );

        } catch (error) {

            console.error(
                "JSON parse error:",
                error
            );


            return {

                message:
                    "Invalid server response."

            };

        }

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(
        value
    ) {

        if (!value) {

            return "N/A";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "N/A";

        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    function logout() {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "authToken"
        );

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "user"
        );


        window.location.replace(
            "login.html"
        );

    }


    // =====================================================
    // HTML ESCAPE
    // =====================================================

    function escapeHTML(
        value
    ) {

        return String(
            value
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }

});