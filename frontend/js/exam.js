document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const examTitle = document.getElementById("examTitle");
    const timerElement = document.getElementById("timer");
    const questionContainer = document.getElementById("questionContainer");

    const previousBtn = document.getElementById("previousBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const reviewBtn = document.getElementById("reviewBtn");

    const messageBox = document.getElementById("message");

    const questionPalette =
        document.getElementById("questionPalette");

    const answeredCountElement =
        document.getElementById("answeredCount");

    const unansweredCountElement =
        document.getElementById("unansweredCount");

    const reviewCountElement =
        document.getElementById("reviewCount");

    const progressText =
        document.getElementById("progressText");

    const progressFill =
        document.getElementById("progressFill");


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.replace("login.html");
        return;
    }


    // =====================================================
    // GET EXAM ID
    // =====================================================

    const urlParams =
        new URLSearchParams(window.location.search);

    const examId =
        urlParams.get("id");

    if (!examId) {

        showError(
            "Exam ID is missing from the URL."
        );

        return;
    }


    // =====================================================
    // VARIABLES
    // =====================================================

    let exam = null;

    let attemptId = null;

    let startedAt = null;

    let durationMinutes = 0;

    let questions = [];

    let currentQuestionIndex = 0;

    // Stores answers:
    // {
    //   questionId: selectedOptionIndex
    // }
    let answers = {};

    // Stores marked questions:
    // {
    //   questionId: true
    // }
    let markedForReview = {};

    let timerInterval = null;

    let submitting = false;

    let autoSubmitStarted = false;


    // =====================================================
    // START
    // =====================================================

    initializeExam();


    // =====================================================
    // INITIALIZE EXAM
    // =====================================================

    async function initializeExam() {

        try {

            setLoading(
                "Loading examination..."
            );


            // =================================================
            // STEP 1: GET EXAM
            // =================================================

            const examResponse =
                await fetch(
                    `/api/exams/${encodeURIComponent(examId)}`,
                    {
                        method: "GET",

                        headers: {
                            "Content-Type": "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            // Authentication error
            if (examResponse.status === 401) {

                logout();

                return;
            }


            if (!examResponse.ok) {

                const errorData =
                    await safeJson(examResponse);

                throw new Error(
                    errorData.message ||
                    "Unable to load examination."
                );
            }


            const examData =
                await safeJson(examResponse);


            exam =
                examData.exam ||
                examData;


            if (!exam) {

                throw new Error(
                    "Exam data was not received."
                );
            }


            // =================================================
            // SET EXAM INFORMATION
            // =================================================

            examTitle.textContent =
                exam.title ||
                "Online Examination";


            questions =
                Array.isArray(exam.questions)
                    ? exam.questions
                    : [];


            if (questions.length === 0) {

                throw new Error(
                    "This examination has no questions."
                );
            }


            // =================================================
            // STEP 2: START / RESUME ATTEMPT
            // =================================================

            setLoading(
                "Starting examination..."
            );


            const startResponse =
                await fetch(
                    `/api/exams/${encodeURIComponent(examId)}/start`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            if (startResponse.status === 401) {

                logout();

                return;
            }


            const startData =
                await safeJson(startResponse);


            if (!startResponse.ok) {

                throw new Error(
                    startData.message ||
                    "Unable to start examination."
                );
            }


            // =================================================
            // ATTEMPT INFORMATION
            // =================================================

            attemptId =
                startData.attemptId;

            startedAt =
                startData.startedAt;

            durationMinutes =
                Number(
                    startData.durationMinutes ||
                    exam.durationMinutes
                );


            if (!attemptId) {

                throw new Error(
                    "Attempt ID was not received from server."
                );
            }


            if (!startedAt) {

                throw new Error(
                    "Exam start time was not received."
                );
            }


            if (
                !durationMinutes ||
                durationMinutes <= 0
            ) {

                throw new Error(
                    "Invalid exam duration."
                );
            }


            // =================================================
            // PREPARE UI
            // =================================================

            renderQuestionPalette();

            currentQuestionIndex = 0;

            renderQuestion();

            startTimer();


        } catch (error) {

            console.error(
                "EXAM INITIALIZATION ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load examination."
            );
        }
    }


    // =====================================================
    // RENDER QUESTION
    // =====================================================

    function renderQuestion() {

        if (!questions.length) {

            showError(
                "No questions available."
            );

            return;
        }


        const question =
            questions[currentQuestionIndex];


        if (!question) {

            showError(
                "Question could not be loaded."
            );

            return;
        }


        const questionId =
            question._id ||
            question.id;


        const questionKey =
            String(questionId);


        const selectedAnswer =
            answers[questionKey];


        const isMarked =
            Boolean(
                markedForReview[questionKey]
            );


        // =================================================
        // CREATE OPTIONS
        // =================================================

        let optionsHTML = "";


        if (
            Array.isArray(question.options) &&
            question.options.length > 0
        ) {

            optionsHTML =
                question.options
                    .map(function (option, index) {

                        const isSelected =
                            Number(selectedAnswer) === index;


                        const letter =
                            String.fromCharCode(
                                65 + index
                            );


                        return `
                            <label
                                class="option ${
                                    isSelected
                                        ? "selected"
                                        : ""
                                }"
                            >

                                <input
                                    type="radio"
                                    name="question"
                                    value="${index}"
                                    ${
                                        isSelected
                                            ? "checked"
                                            : ""
                                    }
                                >

                                <span class="option-label">

                                    <strong>
                                        ${letter}.
                                    </strong>

                                    ${escapeHTML(option)}

                                </span>

                            </label>
                        `;
                    })
                    .join("");

        } else {

            optionsHTML = `
                <div class="alert alert-error">
                    No options available for this question.
                </div>
            `;
        }


        // =================================================
        // QUESTION HTML
        // =================================================

        questionContainer.innerHTML = `

            <div class="question-meta-bar">

                <div class="question-counter">

                    Question
                    ${currentQuestionIndex + 1}
                    of
                    ${questions.length}

                </div>

                ${
                    isMarked
                        ? `
                            <div class="review-status">
                                🔖 Marked for Review
                            </div>
                          `
                        : ""
                }

            </div>


            <div class="question-text">

                ${escapeHTML(
                    question.text ||
                    "Question text unavailable."
                )}

            </div>


            <div class="options">

                ${optionsHTML}

            </div>

        `;


        // =================================================
        // OPTION EVENTS
        // =================================================

        const optionInputs =
            questionContainer.querySelectorAll(
                'input[name="question"]'
            );


        optionInputs.forEach(function (input) {

            input.addEventListener(
                "change",
                function () {

                    answers[questionKey] =
                        Number(this.value);


                    const allOptions =
                        questionContainer.querySelectorAll(
                            ".option"
                        );


                    allOptions.forEach(function (option) {

                        option.classList.remove(
                            "selected"
                        );

                    });


                    const currentOption =
                        this.closest(".option");


                    if (currentOption) {

                        currentOption.classList.add(
                            "selected"
                        );
                    }


                    updateQuestionPalette();

                    updateStatistics();

                    updateProgress();
                }
            );

        });


        // =================================================
        // UPDATE UI
        // =================================================

        updateReviewButton();

        updateNavigationButtons();

        updateQuestionPalette();

        updateStatistics();

        updateProgress();
    }


    // =====================================================
    // QUESTION PALETTE
    // =====================================================

    function renderQuestionPalette() {

        if (!questionPalette) {
            return;
        }


        questionPalette.innerHTML = "";


        questions.forEach(function (question, index) {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.className =
                "palette-btn";


            button.textContent =
                index + 1;


            button.dataset.index =
                index;


            button.addEventListener(
                "click",
                function () {

                    if (submitting) {
                        return;
                    }


                    saveCurrentAnswer();


                    currentQuestionIndex =
                        index;


                    renderQuestion();
                }
            );


            questionPalette.appendChild(
                button
            );

        });


        updateQuestionPalette();
    }


    // =====================================================
    // UPDATE PALETTE
    // =====================================================

    function updateQuestionPalette() {

        if (!questionPalette) {
            return;
        }


        const buttons =
            questionPalette.querySelectorAll(
                ".palette-btn"
            );


        buttons.forEach(function (button, index) {

            const question =
                questions[index];


            if (!question) {
                return;
            }


            const questionId =
                question._id ||
                question.id;


            const key =
                String(questionId);


            const hasAnswer =
                Object.prototype.hasOwnProperty.call(
                    answers,
                    key
                );


            const isReview =
                Boolean(
                    markedForReview[key]
                );


            button.classList.remove(
                "current",
                "answered",
                "review"
            );


            if (
                index === currentQuestionIndex
            ) {

                button.classList.add(
                    "current"
                );
            }


            if (hasAnswer) {

                button.classList.add(
                    "answered"
                );
            }


            if (isReview) {

                button.classList.add(
                    "review"
                );
            }

        });
    }


    // =====================================================
    // MARK / UNMARK REVIEW
    // =====================================================

    if (reviewBtn) {

        reviewBtn.addEventListener(
            "click",
            function () {

                if (submitting) {
                    return;
                }


                const question =
                    questions[currentQuestionIndex];


                if (!question) {
                    return;
                }


                const questionId =
                    question._id ||
                    question.id;


                const key =
                    String(questionId);


                if (
                    markedForReview[key]
                ) {

                    delete markedForReview[key];

                } else {

                    markedForReview[key] =
                        true;
                }


                updateReviewButton();

                updateQuestionPalette();

                updateStatistics();

                // Re-render only the small status area
                // through normal question rendering.
                renderQuestion();
            }
        );

    }


    // =====================================================
    // UPDATE REVIEW BUTTON
    // =====================================================

    function updateReviewButton() {

        if (!reviewBtn) {
            return;
        }


        const question =
            questions[currentQuestionIndex];


        if (!question) {
            return;
        }


        const questionId =
            question._id ||
            question.id;


        const key =
            String(questionId);


        const isMarked =
            Boolean(
                markedForReview[key]
            );


        if (isMarked) {

            reviewBtn.classList.add(
                "active"
            );


            reviewBtn.innerHTML =
                "✓ Remove Review Mark";

        } else {

            reviewBtn.classList.remove(
                "active"
            );


            reviewBtn.innerHTML =
                "🔖 Mark for Review";
        }
    }


    // =====================================================
    // PREVIOUS BUTTON
    // =====================================================

    if (previousBtn) {

        previousBtn.addEventListener(
            "click",
            function () {

                if (submitting) {
                    return;
                }


                saveCurrentAnswer();


                if (
                    currentQuestionIndex > 0
                ) {

                    currentQuestionIndex--;

                    renderQuestion();
                }
            }
        );

    }


    // =====================================================
    // NEXT BUTTON
    // =====================================================

    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            function () {

                if (submitting) {
                    return;
                }


                saveCurrentAnswer();


                if (
                    currentQuestionIndex <
                    questions.length - 1
                ) {

                    currentQuestionIndex++;

                    renderQuestion();
                }
            }
        );

    }


    // =====================================================
    // SAVE CURRENT ANSWER
    // =====================================================

    function saveCurrentAnswer() {

        const question =
            questions[currentQuestionIndex];


        if (!question) {
            return;
        }


        const questionId =
            question._id ||
            question.id;


        const key =
            String(questionId);


        const selected =
            questionContainer.querySelector(
                'input[name="question"]:checked'
            );


        if (selected) {

            answers[key] =
                Number(selected.value);
        }
    }


    // =====================================================
    // NAVIGATION BUTTONS
    // =====================================================

    function updateNavigationButtons() {

        if (previousBtn) {

            if (
                currentQuestionIndex === 0
            ) {

                previousBtn.disabled =
                    true;

                previousBtn.style.opacity =
                    "0.5";

            } else {

                previousBtn.disabled =
                    false;

                previousBtn.style.opacity =
                    "1";
            }
        }


        if (nextBtn) {

            if (
                currentQuestionIndex ===
                questions.length - 1
            ) {

                nextBtn.style.display =
                    "none";

            } else {

                nextBtn.style.display =
                    "inline-flex";

                nextBtn.disabled =
                    false;
            }
        }
    }


    // =====================================================
    // STATISTICS
    // =====================================================

    function updateStatistics() {

        let answered = 0;

        let review = 0;


        questions.forEach(function (question) {

            const questionId =
                question._id ||
                question.id;


            const key =
                String(questionId);


            if (
                Object.prototype.hasOwnProperty.call(
                    answers,
                    key
                )
            ) {

                answered++;
            }


            if (
                markedForReview[key]
            ) {

                review++;
            }

        });


        const unanswered =
            questions.length - answered;


        if (answeredCountElement) {

            answeredCountElement.textContent =
                answered;
        }


        if (unansweredCountElement) {

            unansweredCountElement.textContent =
                unanswered;
        }


        if (reviewCountElement) {

            reviewCountElement.textContent =
                review;
        }
    }


    // =====================================================
    // PROGRESS
    // =====================================================

    function updateProgress() {

        if (
            !questions.length
        ) {
            return;
        }


        let answered = 0;


        questions.forEach(function (question) {

            const questionId =
                question._id ||
                question.id;


            const key =
                String(questionId);


            if (
                Object.prototype.hasOwnProperty.call(
                    answers,
                    key
                )
            ) {

                answered++;
            }

        });


        const percentage =
            Math.round(
                (
                    answered /
                    questions.length
                ) * 100
            );


        if (progressText) {

            progressText.textContent =
                `${answered} / ${questions.length}`;
        }


        if (progressFill) {

            progressFill.style.width =
                `${percentage}%`;
        }
    }


    // =====================================================
    // TIMER
    // =====================================================

    function startTimer() {

        if (timerInterval) {

            clearInterval(
                timerInterval
            );

            timerInterval = null;
        }


        autoSubmitStarted =
            false;


        const startTime =
            new Date(startedAt).getTime();


        if (
            Number.isNaN(startTime)
        ) {

            showError(
                "Invalid examination start time."
            );

            return;
        }


        const durationMilliseconds =
            Number(durationMinutes) *
            60 *
            1000;


        const deadline =
            startTime +
            durationMilliseconds;


        function updateTimer() {

            if (submitting) {
                return;
            }


            const now =
                Date.now();


            const remaining =
                deadline - now;


            // =================================================
            // TIME OVER
            // =================================================

            if (
                remaining <= 0
            ) {

                updateTimerDisplay(0);


                if (
                    autoSubmitStarted
                ) {
                    return;
                }


                autoSubmitStarted =
                    true;


                if (timerInterval) {

                    clearInterval(
                        timerInterval
                    );

                    timerInterval = null;
                }


                autoSubmit();

                return;
            }


            const totalSeconds =
                Math.ceil(
                    remaining / 1000
                );


            updateTimerDisplay(
                totalSeconds
            );
        }


        // Run immediately

        updateTimer();


        // Check frequently

        timerInterval =
            setInterval(
                updateTimer,
                250
            );
    }


    // =====================================================
    // TIMER DISPLAY
    // =====================================================

    function updateTimerDisplay(
        totalSeconds
    ) {

        const safeSeconds =
            Math.max(
                0,
                Number(totalSeconds) || 0
            );


        const minutes =
            Math.floor(
                safeSeconds / 60
            );


        const seconds =
            safeSeconds % 60;


        if (!timerElement) {
            return;
        }


        timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


        timerElement.classList.remove(
            "warning",
            "danger"
        );


        // Last 60 seconds

        if (
            safeSeconds <= 60
        ) {

            timerElement.classList.add(
                "danger"
            );

        }

        // Last 5 minutes

        else if (
            safeSeconds <= 300
        ) {

            timerElement.classList.add(
                "warning"
            );
        }
    }


    // =====================================================
    // MANUAL SUBMIT
    // =====================================================

    if (submitBtn) {

        submitBtn.addEventListener(
            "click",
            function () {

                if (submitting) {
                    return;
                }


                saveCurrentAnswer();


                const answeredCount =
                    Object.keys(
                        answers
                    ).length;


                const unansweredCount =
                    questions.length -
                    answeredCount;


                const reviewCount =
                    Object.keys(
                        markedForReview
                    ).length;


                let confirmationMessage =
                    "Are you sure you want to submit the examination?";


                if (
                    unansweredCount > 0 ||
                    reviewCount > 0
                ) {

                    confirmationMessage =
                        "Before submitting:\n\n" +
                        `Answered: ${answeredCount}\n` +
                        `Unanswered: ${unansweredCount}\n` +
                        `Marked for Review: ${reviewCount}\n\n` +
                        "Are you sure you want to submit the examination?";
                }


                const confirmed =
                    window.confirm(
                        confirmationMessage
                    );


                if (!confirmed) {
                    return;
                }


                submitExam(false);
            }
        );

    }


    // =====================================================
    // AUTO SUBMIT
    // =====================================================

    async function autoSubmit() {

        if (submitting) {
            return;
        }


        showSuccess(
            "Time is over. Your examination is being submitted automatically..."
        );


        await submitExam(true);
    }


    // =====================================================
    // SUBMIT EXAM
    // =====================================================

    async function submitExam(
        automatic = false
    ) {

        if (submitting) {
            return;
        }


        submitting = true;


        // Save current answer

        saveCurrentAnswer();


        // Stop timer

        if (timerInterval) {

            clearInterval(
                timerInterval
            );

            timerInterval = null;
        }


        // Disable controls

        if (submitBtn) {

            submitBtn.disabled =
                true;

            submitBtn.textContent =
                "Submitting...";
        }


        if (previousBtn) {
            previousBtn.disabled = true;
        }


        if (nextBtn) {
            nextBtn.disabled = true;
        }


        if (reviewBtn) {
            reviewBtn.disabled = true;
        }


        // =================================================
        // CREATE ANSWERS ARRAY
        // =================================================

        const answersArray =
            questions.map(function (question) {

                const questionId =
                    question._id ||
                    question.id;


                const key =
                    String(questionId);


                const hasAnswer =
                    Object.prototype.hasOwnProperty.call(
                        answers,
                        key
                    );


                const selectedAnswer =
                    hasAnswer
                        ? answers[key]
                        : null;


                return {
                    questionId: questionId,

                    selectedAnswer:
                        selectedAnswer
                };

            });


        try {

            // =================================================
            // SUBMIT TO SERVER
            // =================================================

            const response =
                await fetch(
                    `/api/attempts/${encodeURIComponent(
                        attemptId
                    )}/submit`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            answers:
                                answersArray,

                            autoSubmit:
                                Boolean(
                                    automatic
                                )
                        })
                    }
                );


            const data =
                await safeJson(response);


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
            // SUBMISSION ERROR
            // =================================================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to submit examination."
                );
            }


            // =================================================
            // SUCCESS
            // =================================================

            const result =
                data.result ||
                {};


            const submittedAttemptId =
                result.attemptId ||
                attemptId;


            if (automatic) {

                showSuccess(
                    "Time is over. Examination submitted automatically!"
                );

            } else {

                showSuccess(
                    "Examination submitted successfully!"
                );
            }


            // =================================================
            // REDIRECT TO RESULT
            // =================================================

            setTimeout(
                function () {

                    window.location.replace(
                        `result-detail.html?id=${encodeURIComponent(
                            submittedAttemptId
                        )}`
                    );

                },
                800
            );


        } catch (error) {

            console.error(
                "SUBMIT ERROR:",
                error
            );


            submitting = false;


            // Re-enable controls

            if (submitBtn) {

                submitBtn.disabled =
                    false;

                submitBtn.textContent =
                    "✓ Submit Exam";
            }


            if (previousBtn) {

                previousBtn.disabled =
                    currentQuestionIndex === 0;
            }


            if (nextBtn) {

                nextBtn.disabled =
                    currentQuestionIndex ===
                    questions.length - 1;
            }


            if (reviewBtn) {

                reviewBtn.disabled =
                    false;
            }


            showError(
                error.message ||
                "Unable to submit examination."
            );
        }
    }


    // =====================================================
    // LOADING
    // =====================================================

    function setLoading(text) {

        questionContainer.innerHTML = `

            <div class="exam-loading">

                <div class="spinner"></div>

                <strong>
                    ${escapeHTML(text)}
                </strong>

            </div>

        `;
    }


    // =====================================================
    // ERROR
    // =====================================================

    function showError(text) {

        questionContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load examination
                </h3>

                <p>
                    ${escapeHTML(text)}
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    style="margin-top:20px;"
                    onclick="location.reload()"
                >
                    Try Again
                </button>

            </div>

        `;


        showMessage(
            text,
            "error"
        );
    }


    // =====================================================
    // SUCCESS
    // =====================================================

    function showSuccess(text) {

        if (!messageBox) {
            return;
        }


        messageBox.innerHTML = `

            <div class="alert alert-success">

                ${escapeHTML(text)}

            </div>

        `;
    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(
        text,
        type
    ) {

        if (!messageBox) {
            return;
        }


        const className =
            type === "success"
                ? "alert-success"
                : "alert-error";


        messageBox.innerHTML = `

            <div class="alert ${className}">

                ${escapeHTML(text)}

            </div>

        `;
    }


    // =====================================================
    // SAFE JSON
    // =====================================================

    async function safeJson(response) {

        const text =
            await response.text();


        if (!text) {
            return {};
        }


        try {

            return JSON.parse(text);

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

    function escapeHTML(value) {

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

});