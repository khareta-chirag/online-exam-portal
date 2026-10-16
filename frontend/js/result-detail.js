document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // ELEMENT
        // =================================================

        const resultContainer =
            document.getElementById(
                "resultContainer"
            );


        if (!resultContainer) {

            console.error(
                "resultContainer not found."
            );

            return;
        }


        // =================================================
        // TOKEN
        // =================================================

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


        // =================================================
        // GET RESULT ID
        // =================================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const resultId =
            params.get("id");


        console.log(
            "Result ID:",
            resultId
        );


        if (!resultId) {

            showError(
                "Result ID is missing."
            );

            return;
        }


        // =================================================
        // LOAD RESULT
        // =================================================

        loadResult();


        // =================================================
        // LOAD RESULT
        // =================================================

        async function loadResult() {

            try {

                showLoading();


                console.log(
                    "Loading result details..."
                );


                // =================================================
                // PRIMARY ROUTE
                // =================================================

                let response =
                    await fetch(
                        `/api/attempts/results/${encodeURIComponent(resultId)}`,
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
                    "Result detail API:",
                    response.status
                );


                // =================================================
                // FALLBACK FOR OLD ROUTE
                // =================================================

                if (
                    response.status === 404
                ) {

                    console.log(
                        "Trying compatibility result route..."
                    );


                    response =
                        await fetch(
                            `/api/attempts/${encodeURIComponent(resultId)}`,
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
                        "Fallback API:",
                        response.status
                    );
                }


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
                // RESPONSE
                // =================================================

                const data =
                    await safeJson(
                        response
                    );


                console.log(
                    "Result detail response:",
                    data
                );


                if (
                    !response.ok
                ) {

                    throw new Error(

                        data.message ||
                        "Unable to load result."

                    );
                }


                // =================================================
                // RESULT
                // =================================================

                if (
                    !data.result
                ) {

                    throw new Error(
                        "Result data not found."
                    );
                }


                renderResult(
                    data.result
                );


            } catch (error) {

                console.error(
                    "RESULT DETAIL ERROR:",
                    error
                );


                showError(
                    error.message ||
                    "Unable to load result."
                );
            }
        }


        // =================================================
        // RENDER RESULT
        // =================================================

        function renderResult(
            result
        ) {

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


            const title =
                result.examTitle ||
                "Examination";


            const submittedAt =
                formatDate(
                    result.submittedAt
                );


            const details =
                Array.isArray(
                    result.details
                )
                    ? result.details
                    : [];


            resultContainer.innerHTML = `

                <div class="result-summary">

                    <div class="result-summary-header">

                        <div>

                            <h2>
                                ${escapeHTML(title)}
                            </h2>

                            <p>
                                Submitted:
                                ${escapeHTML(submittedAt)}
                            </p>

                        </div>

                    </div>


                    <div class="result-summary-grid">

                        <div class="summary-box">

                            <span>
                                Score
                            </span>

                            <strong>
                                ${score} / ${totalMarks}
                            </strong>

                        </div>


                        <div class="summary-box">

                            <span>
                                Percentage
                            </span>

                            <strong>
                                ${percentage.toFixed(2)}%
                            </strong>

                        </div>


                        <div class="summary-box">

                            <span>
                                Status
                            </span>

                            <strong>
                                Submitted
                            </strong>

                        </div>

                    </div>

                </div>


                <div class="answers-section">

                    <h2>
                        Answer Review
                    </h2>

                    <p class="section-description">
                        Review your answers and correct answers.
                    </p>

                    <div id="questionReview"></div>

                </div>

            `;


            const questionReview =
                document.getElementById(
                    "questionReview"
                );


            details.forEach(
                function (
                    question,
                    index
                ) {

                    const selected =
                        question.selectedAnswer;


                    const correct =
                        question.correctAnswer;


                    const isCorrect =
                        selected !== null &&
                        selected !== undefined &&
                        Number(selected) ===
                        Number(correct);


                    let selectedText =
                        "Not Answered";


                    if (
                        selected !== null &&
                        selected !== undefined &&
                        question.options &&
                        question.options[selected]
                    ) {

                        selectedText =
                            question.options[selected];
                    }


                    let correctText =
                        "Not Available";


                    if (
                        question.options &&
                        question.options[correct]
                    ) {

                        correctText =
                            question.options[correct];
                    }


                    const questionCard =
                        document.createElement(
                            "div"
                        );


                    questionCard.className =
                        "question-review-card";


                    questionCard.innerHTML = `

                        <div class="question-number">

                            QUESTION ${index + 1}

                        </div>


                        <h3>

                            ${escapeHTML(
                                question.text
                            )}

                        </h3>


                        <div class="review-answer">

                            <div>

                                <span>
                                    Your Answer
                                </span>

                                <strong
                                    class="${
                                        isCorrect
                                            ? "answer-correct"
                                            : "answer-wrong"
                                    }"
                                >

                                    ${escapeHTML(
                                        selectedText
                                    )}

                                </strong>

                            </div>


                            <div>

                                <span>
                                    Correct Answer
                                </span>

                                <strong class="answer-correct">

                                    ${escapeHTML(
                                        correctText
                                    )}

                                </strong>

                            </div>

                        </div>


                        <div class="question-status">

                            ${
                                isCorrect
                                    ? "✓ Correct"
                                    : "✗ Incorrect"
                            }

                        </div>

                    `;


                    questionReview.appendChild(
                        questionCard
                    );

                }
            );

        }


        // =================================================
        // LOADING
        // =================================================

        function showLoading() {

            resultContainer.innerHTML = `

                <div class="empty-state">

                    <div class="loading">

                        <div class="spinner"></div>

                        Loading result...

                    </div>

                </div>

            `;
        }


        // =================================================
        // ERROR
        // =================================================

        function showError(
            message
        ) {

            resultContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-state-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable to load result
                    </h3>

                    <p>
                        ${escapeHTML(message)}
                    </p>


                    <div
                        style="
                            display:flex;
                            gap:12px;
                            justify-content:center;
                            margin-top:20px;
                        "
                    >

                        <button
                            id="retryButton"
                            class="btn btn-primary"
                        >
                            Try Again
                        </button>


                        <a
                            href="results.html"
                            class="btn btn-secondary"
                        >
                            My Results
                        </a>

                    </div>

                </div>

            `;


            const retry =
                document.getElementById(
                    "retryButton"
                );


            if (retry) {

                retry.addEventListener(
                    "click",
                    loadResult
                );

            }
        }


        // =================================================
        // SAFE JSON
        // =================================================

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


        // =================================================
        // FORMAT DATE
        // =================================================

        function formatDate(
            value
        ) {

            if (!value) {

                return "N/A";

            }


            const date =
                new Date(value);


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


        // =================================================
        // LOGOUT
        // =================================================

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


        // =================================================
        // ESCAPE HTML
        // =================================================

        function escapeHTML(
            value
        ) {

            return String(value)
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

    }
);