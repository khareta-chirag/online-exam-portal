const Attempt = require("../models/Attempt");


// =====================================================
// SUBMIT ATTEMPT
// =====================================================

const submitAttempt = async (
    req,
    res,
    next
) => {

    try {

        const {
            answers = [],
            autoSubmit = false
        } = req.body;


        console.log(
            "========================================"
        );

        console.log(
            "SUBMIT ATTEMPT"
        );

        console.log(
            "Attempt ID:",
            req.params.id
        );

        console.log(
            "Student:",
            req.user._id
        );

        console.log(
            "Auto Submit:",
            autoSubmit
        );

        console.log(
            "========================================"
        );


        // =================================================
        // FIND ACTIVE ATTEMPT
        // =================================================

        const attempt =
            await Attempt.findOne({

                _id:
                    req.params.id,

                student:
                    req.user._id,

                status:
                    "in-progress"

            });


        if (!attempt) {

            return res.status(404).json({

                message:
                    "Active attempt not found."

            });
        }


        // =================================================
        // CALCULATE DEADLINE
        // =================================================

        const startedTime =
            new Date(
                attempt.startedAt
            ).getTime();


        const durationMilliseconds =
            Number(
                attempt.durationMinutesSnapshot
            ) *
            60 *
            1000;


        const deadline =
            startedTime +
            durationMilliseconds;


        const now =
            Date.now();


        const lateBy =
            now -
            deadline;


        console.log(
            "Started:",
            new Date(startedTime)
        );


        console.log(
            "Deadline:",
            new Date(deadline)
        );


        console.log(
            "Current:",
            new Date(now)
        );


        console.log(
            "Late by:",
            lateBy,
            "ms"
        );


        // =================================================
        // AUTOMATIC SUBMISSION GRACE
        // =================================================

        const AUTO_SUBMIT_GRACE_MS =
            15000;


        // =================================================
        // TIME VALIDATION
        // =================================================

        if (
            now > deadline
        ) {

            if (
                autoSubmit === true &&
                lateBy <=
                    AUTO_SUBMIT_GRACE_MS
            ) {

                console.log(
                    "Auto submission accepted within grace period."
                );

            } else {

                return res.status(400).json({

                    message:
                        "Exam time has expired. Submission rejected."

                });
            }
        }


        // =================================================
        // BUILD ANSWER LOOKUP
        // =================================================

        const answerLookup =
            new Map();


        if (
            Array.isArray(
                answers
            )
        ) {

            answers.forEach(
                (answer) => {

                    if (
                        !answer ||
                        !answer.questionId
                    ) {

                        return;
                    }


                    let selectedAnswer =
                        null;


                    if (
                        answer.selectedAnswer !==
                            null &&
                        answer.selectedAnswer !==
                            undefined &&
                        answer.selectedAnswer !==
                            ""
                    ) {

                        const value =
                            Number(
                                answer.selectedAnswer
                            );


                        if (
                            Number.isInteger(
                                value
                            ) &&
                            value >= 0 &&
                            value <= 3
                        ) {

                            selectedAnswer =
                                value;
                        }
                    }


                    answerLookup.set(

                        String(
                            answer.questionId
                        ),

                        selectedAnswer
                    );
                }
            );
        }


        // =================================================
        // TOTAL MARKS
        // =================================================

        const totalMarks =
            attempt.questionsSnapshot.reduce(
                (
                    total,
                    question
                ) => {

                    return (
                        total +
                        Number(
                            question.marks
                        )
                    );

                },
                0
            );


        // =================================================
        // CALCULATE SCORE
        // =================================================

        let score =
            0;


        attempt.questionsSnapshot.forEach(
            (question) => {

                const questionId =
                    String(
                        question.questionId
                    );


                const selectedAnswer =
                    answerLookup.has(
                        questionId
                    )
                        ? answerLookup.get(
                            questionId
                        )
                        : null;


                if (
                    selectedAnswer !== null &&
                    Number(
                        selectedAnswer
                    ) ===
                    Number(
                        question.correctAnswer
                    )
                ) {

                    score +=
                        Number(
                            question.marks
                        );
                }
            }
        );


        // =================================================
        // PERCENTAGE
        // =================================================

        const percentage =
            totalMarks > 0
                ? Number(
                    (
                        (
                            score /
                            totalMarks
                        ) *
                        100
                    ).toFixed(2)
                )
                : 0;


        // =================================================
        // SAVE ALL ANSWERS
        // =================================================

        const finalAnswers =
            attempt.questionsSnapshot.map(
                (question) => {

                    const questionId =
                        String(
                            question.questionId
                        );


                    return {

                        questionId:
                            question.questionId,

                        selectedAnswer:
                            answerLookup.has(
                                questionId
                            )
                                ? answerLookup.get(
                                    questionId
                                )
                                : null

                    };
                }
            );


        // =================================================
        // UPDATE ATTEMPT
        // =================================================

        attempt.answers =
            finalAnswers;


        attempt.score =
            score;


        attempt.totalMarks =
            totalMarks;


        attempt.percentage =
            percentage;


        attempt.status =
            "submitted";


        attempt.submittedAt =
            new Date();


        // =================================================
        // SAVE
        // =================================================

        await attempt.save();


        console.log(
            "========================================"
        );

        console.log(
            "EXAM SUBMITTED SUCCESSFULLY"
        );

        console.log(
            "Attempt:",
            attempt._id
        );

        console.log(
            "Score:",
            score
        );

        console.log(
            "Total:",
            totalMarks
        );

        console.log(
            "Percentage:",
            percentage
        );

        console.log(
            "Automatic:",
            autoSubmit
        );

        console.log(
            "========================================"
        );


        return res.status(200).json({

            message:
                autoSubmit === true
                    ? "Examination automatically submitted successfully."
                    : "Examination submitted successfully.",

            result: {

                attemptId:
                    attempt._id,

                score:
                    attempt.score,

                totalMarks:
                    attempt.totalMarks,

                percentage:
                    attempt.percentage,

                submittedAt:
                    attempt.submittedAt

            }
        });


    } catch (error) {

        console.error(
            "SUBMIT ATTEMPT ERROR:",
            error
        );


        next(error);

    }
};


// =====================================================
// ADMIN - GET ALL RESULTS
// =====================================================

const adminGetResults = async (req, res, next) => {
    try {

        const attempts = await Attempt.find({
            status: "submitted"
        })
            .populate(
                "student",
                "name email"
            )
            .populate(
                "exam",
                "title durationMinutes"
            )
            .sort({
                submittedAt: -1
            });


        const results = attempts.map(
            (attempt) => ({

                id: attempt._id,

                student: {
                    id: attempt.student?._id || null,

                    name:
                        attempt.student?.name ||
                        "Unknown Student",

                    email:
                        attempt.student?.email ||
                        "N/A"
                },

                exam: {
                    id: attempt.exam?._id || null,

                    title:
                        attempt.exam?.title ||
                        "Unknown Exam"
                },

                score: attempt.score,

                totalMarks:
                    attempt.totalMarks,

                percentage:
                    attempt.percentage,

                submittedAt:
                    attempt.submittedAt,

                status:
                    attempt.status
            })
        );


        return res.status(200).json({
            results
        });


    } catch (error) {

        next(error);

    }
};


// =====================================================
// GET MY RESULTS
// =====================================================

const getMyResults = async (
    req,
    res,
    next
) => {

    try {

        const attempts =
            await Attempt.find({

                student:
                    req.user._id,

                status:
                    "submitted"

            })
            .populate(
                "exam",
                "title durationMinutes"
            )
            .sort({
                submittedAt:
                    -1
            });


        const results =
            attempts.map(
                (attempt) => ({

                    id:
                        attempt._id,

                    examId:
                        attempt.exam
                            ? attempt.exam._id
                            : null,

                    examTitle:
                        attempt.exam
                            ? attempt.exam.title
                            : "Exam",

                    score:
                        attempt.score,

                    totalMarks:
                        attempt.totalMarks,

                    percentage:
                        attempt.percentage,

                    submittedAt:
                        attempt.submittedAt

                })
            );


        return res.status(200).json({

            results:
                results

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// GET RESULT BY ID
// =====================================================

const getResultById = async (
    req,
    res,
    next
) => {

    try {

        const attempt =
            await Attempt.findOne({

                _id:
                    req.params.id,

                student:
                    req.user._id,

                status:
                    "submitted"

            })
            .populate(
                "exam",
                "title durationMinutes"
            );


        if (!attempt) {

            return res.status(404).json({

                message:
                    "Result not found."

            });
        }


        // =================================================
        // ANSWER LOOKUP
        // =================================================

        const answerLookup =
            new Map(

                attempt.answers.map(
                    (answer) => [

                        String(
                            answer.questionId
                        ),

                        answer.selectedAnswer

                    ]
                )

            );


        // =================================================
        // QUESTION DETAILS
        // =================================================

        const details =
            attempt.questionsSnapshot.map(
                (question) => {

                    const questionId =
                        String(
                            question.questionId
                        );


                    return {

                        questionId:
                            question.questionId,

                        text:
                            question.text,

                        options:
                            question.options,

                        correctAnswer:
                            question.correctAnswer,

                        selectedAnswer:
                            answerLookup.has(
                                questionId
                            )
                                ? answerLookup.get(
                                    questionId
                                )
                                : null,

                        marks:
                            question.marks

                    };
                }
            );


        return res.status(200).json({

            result: {

                id:
                    attempt._id,

                examTitle:
                    attempt.exam
                        ? attempt.exam.title
                        : "Exam",

                durationMinutes:
                    attempt.exam
                        ? attempt.exam.durationMinutes
                        : attempt.durationMinutesSnapshot,

                score:
                    attempt.score,

                totalMarks:
                    attempt.totalMarks,

                percentage:
                    attempt.percentage,

                submittedAt:
                    attempt.submittedAt,

                details:
                    details

            }
        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// EXPORT
// =====================================================

module.exports = {
    submitAttempt,
    getMyResults,
    getResultById,
    adminGetResults
};