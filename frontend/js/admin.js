document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const createExamForm =
        document.getElementById("createExamForm");

    const examsContainer =
        document.getElementById("examsContainer");

    const messageBox =
        document.getElementById("message");

    const logoutBtn =
        document.getElementById("logoutBtn");


    // =====================================================
    // AUTH
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
    // LOGOUT
    // =====================================================

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");

            window.location.replace("login.html");

        });

    }


    // =====================================================
    // LOAD ADMIN EXAMS
    // =====================================================

    loadExams();
    loadAdminResults();


    async function loadExams() {

        examsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading examinations...
            </div>
        `;


        try {

            const response =
                await fetch("/api/exams/admin/all", {
                    method: "GET",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });


            const data =
                await safeJson(response);


            console.log(
                "Admin exams response:",
                data
            );


            if (response.status === 401) {

                logout();
                return;

            }


            if (response.status === 403) {

                showError(
                    "Admin access required."
                );

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load examinations."
                );

            }


            const exams =
                Array.isArray(data.exams)
                    ? data.exams
                    : [];


            renderExams(exams);


        } catch (error) {

            console.error(
                "ADMIN LOAD ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load examinations."
            );

        }

    }


    // =====================================================
    // CREATE EXAM
    // =====================================================

    if (createExamForm) {

        createExamForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const title =
                    document
                        .getElementById("title")
                        .value
                        .trim();


                const description =
                    document
                        .getElementById("description")
                        .value
                        .trim();


                const durationMinutes =
                    Number(
                        document
                            .getElementById(
                                "durationMinutes"
                            )
                            .value
                    );


                if (!title) {

                    showError(
                        "Please enter an exam title."
                    );

                    return;
                }


                if (
                    !durationMinutes ||
                    durationMinutes < 1
                ) {

                    showError(
                        "Duration must be at least 1 minute."
                    );

                    return;
                }


                const button =
                    createExamForm.querySelector(
                        'button[type="submit"]'
                    );


                if (button) {

                    button.disabled = true;
                    button.textContent =
                        "Creating...";

                }


                try {

                    const response =
                        await fetch(
                            "/api/exams",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
                                    title,
                                    description,
                                    durationMinutes,
                                    questions: [],
                                    isPublished: false
                                })
                            }
                        );


                    const data =
                        await safeJson(response);


                    if (
                        response.status === 401
                    ) {

                        logout();
                        return;

                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to create exam."
                        );

                    }


                    showSuccess(
                        "Exam created successfully."
                    );


                    createExamForm.reset();


                    await loadExams();


                } catch (error) {

                    console.error(
                        "CREATE EXAM ERROR:",
                        error
                    );


                    showError(
                        error.message ||
                        "Unable to create exam."
                    );


                } finally {

                    if (button) {

                        button.disabled = false;

                        button.textContent =
                            "+ Create Exam";

                    }

                }

            }
        );

    }


    // =====================================================
    // RENDER EXAMS
    // =====================================================

    function renderExams(exams) {

        if (!exams.length) {

            examsContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-state-icon">
                        📝
                    </div>

                    <h3>
                        No Examinations Yet
                    </h3>

                    <p>
                        Create your first examination
                        using the form.
                    </p>

                </div>

            `;

            return;
        }


        examsContainer.innerHTML = "";


        exams.forEach(function (exam) {

            const card =
                document.createElement("div");


            card.className =
                "exam-admin-card";


            const published =
                Boolean(
                    exam.isPublished
                );


            const questions =
                Array.isArray(
                    exam.questions
                )
                    ? exam.questions
                    : [];


            card.innerHTML = `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        gap:15px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <h3>
                            ${escapeHTML(
                                exam.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                exam.description ||
                                "No description"
                            )}
                        </p>

                    </div>


                    <span
                        class="badge ${
                            published
                                ? "badge-success"
                                : "badge-warning"
                        }"
                    >
                        ${
                            published
                                ? "Published"
                                : "Draft"
                        }
                    </span>

                </div>


                <div class="exam-meta">

                    <span class="badge badge-primary">
                        ⏱ ${exam.durationMinutes} Minutes
                    </span>

                    <span class="badge badge-primary">
                        📝 ${questions.length} Questions
                    </span>

                </div>


                <div class="admin-actions">

                    <button
                        class="btn btn-primary manage-btn"
                        data-id="${exam._id}"
                    >
                        Manage Questions
                    </button>


                    <button
                        class="btn ${
                            published
                                ? "btn-warning"
                                : "btn-success"
                        } publish-btn"
                        data-id="${exam._id}"
                        data-published="${published}"
                    >
                        ${
                            published
                                ? "Unpublish"
                                : "Publish"
                        }
                    </button>


                    <button
                        class="btn btn-danger delete-btn"
                        data-id="${exam._id}"
                    >
                        Delete
                    </button>

                </div>


                <div
                    class="question-manager"
                    id="manager-${exam._id}"
                    style="
                        display:none;
                        margin-top:20px;
                    "
                ></div>

            `;


            examsContainer.appendChild(card);


            // =========================================
            // MANAGE QUESTIONS
            // =========================================

            const manageBtn =
                card.querySelector(
                    ".manage-btn"
                );


            manageBtn.addEventListener(
                "click",
                function () {

                    const manager =
                        card.querySelector(
                            ".question-manager"
                        );


                    if (
                        manager.style.display ===
                        "none"
                    ) {

                        manager.style.display =
                            "block";

                        renderQuestionManager(
                            exam,
                            manager
                        );

                    } else {

                        manager.style.display =
                            "none";

                    }

                }
            );


            // =========================================
            // PUBLISH
            // =========================================

            const publishBtn =
                card.querySelector(
                    ".publish-btn"
                );


            publishBtn.addEventListener(
                "click",
                function () {

                    togglePublish(
                        exam
                    );

                }
            );


            // =========================================
            // DELETE
            // =========================================

            const deleteBtn =
                card.querySelector(
                    ".delete-btn"
                );


            deleteBtn.addEventListener(
                "click",
                function () {

                    deleteExam(
                        exam._id
                    );

                }
            );

        });

    }


    // =====================================================
    // QUESTION MANAGER
    // =====================================================

    function renderQuestionManager(
        exam,
        container
    ) {

        const questions =
            Array.isArray(exam.questions)
                ? exam.questions
                : [];


        container.innerHTML = `

            <div class="admin-panel">

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        margin-bottom:20px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <h3>
                            Question Manager
                        </h3>

                        <p
                            style="
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            Add or edit questions for
                            this examination.
                        </p>

                    </div>


                    <button
                        class="btn btn-primary add-question-btn"
                    >
                        + Add Question
                    </button>

                </div>


                <div class="questions-list"></div>


                <button
                    class="btn btn-success save-questions-btn"
                    style="
                        width:100%;
                        margin-top:15px;
                    "
                >
                    Save All Questions
                </button>

            </div>

        `;


        const questionsList =
            container.querySelector(
                ".questions-list"
            );


        // ==========================================
        // EXISTING QUESTIONS
        // ==========================================

        questions.forEach(
            function (question, index) {

                addQuestionEditor(
                    questionsList,
                    question,
                    index + 1
                );

            }
        );


        // ==========================================
        // ADD QUESTION
        // ==========================================

        container
            .querySelector(
                ".add-question-btn"
            )
            .addEventListener(
                "click",
                function () {

                    const number =
                        questionsList
                            .children
                            .length + 1;


                    addQuestionEditor(
                        questionsList,
                        null,
                        number
                    );

                }
            );


        // ==========================================
        // SAVE QUESTIONS
        // ==========================================

        container
            .querySelector(
                ".save-questions-btn"
            )
            .addEventListener(
                "click",
                async function () {

                    await saveQuestions(
                        exam,
                        container
                    );

                }
            );

    }


    // =====================================================
    // ADD QUESTION EDITOR
    // =====================================================

    function addQuestionEditor(
        container,
        question,
        number
    ) {

        const editor =
            document.createElement("div");


        editor.className =
            "question-editor";


        editor.innerHTML = `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:15px;
                "
            >

                <h4>
                    Question ${number}
                </h4>


                <button
                    type="button"
                    class="btn btn-danger remove-question-btn"
                    style="
                        min-height:36px;
                        padding:7px 12px;
                    "
                >
                    Remove
                </button>

            </div>


            <div class="form-group">

                <label>
                    Question
                </label>

                <textarea
                    class="question-text-input"
                    placeholder="Enter question..."
                    required
                >${escapeHTML(
                    question?.text || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label>
                    Option A
                </label>

                <input
                    type="text"
                    class="option-input"
                    value="${escapeAttribute(
                        question?.options?.[0] || ""
                    )}"
                    placeholder="Option A"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Option B
                </label>

                <input
                    type="text"
                    class="option-input"
                    value="${escapeAttribute(
                        question?.options?.[1] || ""
                    )}"
                    placeholder="Option B"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Option C
                </label>

                <input
                    type="text"
                    class="option-input"
                    value="${escapeAttribute(
                        question?.options?.[2] || ""
                    )}"
                    placeholder="Option C"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Option D
                </label>

                <input
                    type="text"
                    class="option-input"
                    value="${escapeAttribute(
                        question?.options?.[3] || ""
                    )}"
                    placeholder="Option D"
                    required
                >

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        1fr 1fr;
                    gap:12px;
                "
            >

                <div class="form-group">

                    <label>
                        Correct Answer
                    </label>

                    <select
                        class="correct-answer-input"
                    >

                        <option
                            value="0"
                            ${
                                question?.correctAnswer === 0
                                    ? "selected"
                                    : ""
                            }
                        >
                            A
                        </option>

                        <option
                            value="1"
                            ${
                                question?.correctAnswer === 1
                                    ? "selected"
                                    : ""
                            }
                        >
                            B
                        </option>

                        <option
                            value="2"
                            ${
                                question?.correctAnswer === 2
                                    ? "selected"
                                    : ""
                            }
                        >
                            C
                        </option>

                        <option
                            value="3"
                            ${
                                question?.correctAnswer === 3
                                    ? "selected"
                                    : ""
                            }
                        >
                            D
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Marks
                    </label>

                    <input
                        type="number"
                        class="marks-input"
                        min="1"
                        value="${
                            question?.marks || 1
                        }"
                    >

                </div>

            </div>

        `;


        container.appendChild(
            editor
        );


        // ==========================================
        // REMOVE QUESTION
        // ==========================================

        editor
            .querySelector(
                ".remove-question-btn"
            )
            .addEventListener(
                "click",
                function () {

                    editor.remove();

                    renumberQuestions(
                        container
                    );

                }
            );

    }


    // =====================================================
    // RENUMBER QUESTIONS
    // =====================================================

    function renumberQuestions(
        container
    ) {

        const editors =
            container.querySelectorAll(
                ".question-editor"
            );


        editors.forEach(
            function (editor, index) {

                const heading =
                    editor.querySelector("h4");


                if (heading) {

                    heading.textContent =
                        `Question ${index + 1}`;

                }

            }
        );

    }


    // =====================================================
    // SAVE QUESTIONS
    // =====================================================

    async function saveQuestions(
        exam,
        managerContainer
    ) {

        const editors =
            managerContainer.querySelectorAll(
                ".question-editor"
            );


        const questions = [];


        // ==========================================
        // READ QUESTIONS
        // ==========================================

        for (
            let i = 0;
            i < editors.length;
            i++
        ) {

            const editor =
                editors[i];


            const text =
                editor
                    .querySelector(
                        ".question-text-input"
                    )
                    .value
                    .trim();


            const optionInputs =
                editor.querySelectorAll(
                    ".option-input"
                );


            const options =
                Array.from(
                    optionInputs
                ).map(
                    input =>
                        input.value.trim()
                );


            const correctAnswer =
                Number(
                    editor
                        .querySelector(
                            ".correct-answer-input"
                        )
                        .value
                );


            const marks =
                Number(
                    editor
                        .querySelector(
                            ".marks-input"
                        )
                        .value
                );


            // ======================================
            // VALIDATION
            // ======================================

            if (!text) {

                showError(
                    `Question ${i + 1} is empty.`
                );

                return;

            }


            if (
                options.length !== 4 ||
                options.some(
                    option => !option
                )
            ) {

                showError(
                    `Question ${i + 1} must have all 4 options.`
                );

                return;

            }


            if (
                correctAnswer < 0 ||
                correctAnswer > 3
            ) {

                showError(
                    `Invalid correct answer for Question ${i + 1}.`
                );

                return;

            }


            if (
                !marks ||
                marks < 1
            ) {

                showError(
                    `Marks for Question ${i + 1} must be at least 1.`
                );

                return;

            }


            questions.push({

                text,

                options,

                correctAnswer,

                marks

            });

        }


        const saveButton =
            managerContainer.querySelector(
                ".save-questions-btn"
            );


        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving Questions...";

        }


        try {

            // ======================================
            // UPDATE EXAM
            // ======================================

            const response =
                await fetch(
                    `/api/exams/${encodeURIComponent(
                        exam._id
                    )}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            questions
                        })
                    }
                );


            const data =
                await safeJson(response);


            if (
                response.status === 401
            ) {

                logout();
                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to save questions."
                );

            }


            showSuccess(
                "Questions saved successfully."
            );


            await loadExams();


        } catch (error) {

            console.error(
                "SAVE QUESTIONS ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to save questions."
            );


        } finally {

            if (saveButton) {

                saveButton.disabled = false;

                saveButton.textContent =
                    "Save All Questions";

            }

        }

    }


    // =====================================================
    // PUBLISH / UNPUBLISH
    // =====================================================

    async function togglePublish(
        exam
    ) {

        const questions =
            Array.isArray(exam.questions)
                ? exam.questions
                : [];


        // Don't publish empty exam

        if (
            !exam.isPublished &&
            questions.length === 0
        ) {

            showError(
                "Add at least one question before publishing the exam."
            );

            return;

        }


        const action =
            exam.isPublished
                ? "unpublish"
                : "publish";


        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} "${exam.title}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/exams/${encodeURIComponent(
                        exam._id
                    )}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            isPublished:
                                !exam.isPublished
                        })
                    }
                );


            const data =
                await safeJson(response);


            if (
                response.status === 401
            ) {

                logout();
                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Unable to ${action} exam.`
                );

            }


            showSuccess(
                exam.isPublished
                    ? "Exam unpublished successfully."
                    : "Exam published successfully."
            );


            await loadExams();


        } catch (error) {

            console.error(
                "PUBLISH ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to update exam."
            );

        }

    }


    // =====================================================
    // DELETE EXAM
    // =====================================================

    async function deleteExam(
        examId
    ) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this examination?\n\nThis action will also delete its attempts/results."
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/exams/${encodeURIComponent(
                        examId
                    )}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await safeJson(response);


            if (
                response.status === 401
            ) {

                logout();
                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete exam."
                );

            }


            showSuccess(
                "Examination deleted successfully."
            );


            await loadExams();


        } catch (error) {

            console.error(
                "DELETE EXAM ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to delete examination."
            );

        }

    }


    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    function showSuccess(
        message
    ) {

        if (!messageBox) {
            return;
        }


        messageBox.innerHTML = `

            <div class="alert alert-success">

                ${escapeHTML(message)}

            </div>

        `;


        setTimeout(
            function () {

                if (messageBox) {
                    messageBox.innerHTML = "";
                }

            },
            3500
        );

    }


    // =====================================================
    // ERROR MESSAGE
    // =====================================================

    function showError(
        message
    ) {

        if (!messageBox) {
            return;
        }


        messageBox.innerHTML = `

            <div class="alert alert-error">

                ${escapeHTML(message)}

            </div>

        `;

    }



    // =====================================================
// ADMIN RESULT DASHBOARD
// =====================================================

async function loadAdminResults() {

    const container =
        document.getElementById(
            "resultsTableContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading results...
        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/attempts/admin/results",
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


        const data =
            await safeJson(response);


        console.log(
            "Admin results:",
            data
        );


        if (response.status === 401) {

            logout();

            return;
        }


        if (response.status === 403) {

            throw new Error(
                "Admin access required."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load results."
            );
        }


        const results =
            Array.isArray(data.results)
                ? data.results
                : [];


        updateResultStatistics(
            results
        );


        renderAdminResults(
            results
        );


    } catch (error) {

        console.error(
            "ADMIN RESULTS ERROR:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load results
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
}


// =====================================================
// RESULT STATISTICS
// =====================================================

function updateResultStatistics(
    results
) {

    const totalStudents =
        new Set(
            results
                .map(
                    result =>
                        result.student?.id
                )
                .filter(Boolean)
        ).size;


    const totalAttempts =
        results.length;


    const totalExams =
        new Set(
            results
                .map(
                    result =>
                        result.exam?.id
                )
                .filter(Boolean)
        ).size;


    let average =
        0;


    if (results.length > 0) {

        const totalPercentage =
            results.reduce(
                (
                    sum,
                    result
                ) =>
                    sum +
                    Number(
                        result.percentage || 0
                    ),
                0
            );


        average =
            totalPercentage /
            results.length;
    }


    const studentsElement =
        document.getElementById(
            "totalStudents"
        );


    const attemptsElement =
        document.getElementById(
            "totalAttempts"
        );


    const examsElement =
        document.getElementById(
            "totalExamsAttempted"
        );


    const averageElement =
        document.getElementById(
            "averagePercentage"
        );


    if (studentsElement) {

        studentsElement.textContent =
            totalStudents;
    }


    if (attemptsElement) {

        attemptsElement.textContent =
            totalAttempts;
    }


    if (examsElement) {

        examsElement.textContent =
            totalExams;
    }


    if (averageElement) {

        averageElement.textContent =
            `${average.toFixed(1)}%`;
    }
}


// =====================================================
// RENDER ADMIN RESULTS
// =====================================================

function renderAdminResults(
    results
) {

    const container =
        document.getElementById(
            "resultsTableContainer"
        );


    if (!container) {
        return;
    }


    if (!results.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📊
                </div>

                <h3>
                    No Results Yet
                </h3>

                <p>
                    Student results will appear here
                    after an examination is submitted.
                </p>

            </div>

        `;

        return;
    }


    const table =
        document.createElement(
            "table"
        );


    table.className =
        "admin-results-table";


    table.innerHTML = `

        <thead>

            <tr>

                <th>
                    #
                </th>

                <th>
                    Student
                </th>

                <th>
                    Email
                </th>

                <th>
                    Examination
                </th>

                <th>
                    Score
                </th>

                <th>
                    Percentage
                </th>

                <th>
                    Submitted
                </th>

            </tr>

        </thead>


        <tbody></tbody>

    `;


    const tbody =
        table.querySelector(
            "tbody"
        );


    results.forEach(
        function (
            result,
            index
        ) {

            const row =
                document.createElement(
                    "tr"
                );


            const percentage =
                Number(
                    result.percentage || 0
                );


            let percentageClass =
                "result-average";


            if (
                percentage >= 75
            ) {

                percentageClass =
                    "result-excellent";

            } else if (
                percentage < 40
            ) {

                percentageClass =
                    "result-poor";
            }


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>

                    <strong>
                        ${escapeHTML(
                            result.student?.name ||
                            "Unknown"
                        )}
                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        result.student?.email ||
                        "N/A"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        result.exam?.title ||
                        "Unknown Exam"
                    )}

                </td>


                <td>

                    <strong>

                        ${Number(
                            result.score || 0
                        )}

                        /

                        ${Number(
                            result.totalMarks || 0
                        )}

                    </strong>

                </td>


                <td>

                    <span
                        class="result-percentage ${percentageClass}"
                    >

                        ${percentage.toFixed(2)}%

                    </span>

                </td>


                <td>

                    ${formatAdminDate(
                        result.submittedAt
                    )}

                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );


    container.innerHTML = "";


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.overflowX =
        "auto";


    wrapper.appendChild(
        table
    );


    container.appendChild(
        wrapper
    );
}


// =====================================================
// FORMAT ADMIN DATE
// =====================================================

function formatAdminDate(
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

// =====================================================
// REFRESH RESULTS
// =====================================================

const refreshResultsBtn =
    document.getElementById(
        "refreshResultsBtn"
    );


if (refreshResultsBtn) {

    refreshResultsBtn.addEventListener(
        "click",
        function () {

            loadAdminResults();

        }
    );
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

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

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


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );

    }

});

