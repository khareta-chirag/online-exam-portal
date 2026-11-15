
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");


// =====================================================
// GET PUBLISHED EXAMS
// =====================================================

const getPublishedExams = async (req, res, next) => {

    try {

        const exams =
            await Exam.find({
                isPublished: true
            })
            .select(
                "title description durationMinutes questions createdAt"
            )
            .sort({
                createdAt: -1
            });


        const formattedExams =
            exams.map((exam) => ({

                _id:
                    exam._id,

                title:
                    exam.title,

                description:
                    exam.description,

                durationMinutes:
                    exam.durationMinutes,

                questionCount:
                    exam.questions
                        ? exam.questions.length
                        : 0,

                createdAt:
                    exam.createdAt

            }));


        return res.status(200).json({

            exams:
                formattedExams

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// GET EXAM FOR STUDENT
// =====================================================

const getExamForAttempt = async (
    req,
    res,
    next
) => {

    try {

        const exam =
            await Exam.findOne({

                _id:
                    req.params.id,

                isPublished:
                    true

            })
            .select(
                "-questions.correctAnswer"
            );


        if (!exam) {

            return res.status(404).json({

                message:
                    "Exam not found."

            });
        }


        if (
            !exam.questions ||
            exam.questions.length === 0
        ) {

            return res.status(400).json({

                message:
                    "This exam has no questions."

            });
        }


        return res.status(200).json({

            exam:
                exam

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// START EXAM / CREATE ATTEMPT
// =====================================================

const startAttempt = async (
    req,
    res,
    next
) => {

    try {

        const examId =
            req.params.id;


        // =================================================
        // FIND PUBLISHED EXAM
        // =================================================

        const exam =
            await Exam.findOne({

                _id:
                    examId,

                isPublished:
                    true

            });


        if (!exam) {

            return res.status(404).json({

                message:
                    "Exam not found."

            });
        }


        // =================================================
        // CHECK QUESTIONS
        // =================================================

        if (
            !exam.questions ||
            exam.questions.length === 0
        ) {

            return res.status(400).json({

                message:
                    "This exam has no questions."

            });
        }


        // =================================================
        // FIND EXISTING IN-PROGRESS ATTEMPT
        // =================================================

        const existingAttempt =
            await Attempt.findOne({

                student:
                    req.user._id,

                exam:
                    exam._id,

                status:
                    "in-progress"

            });


        // =================================================
        // IF EXISTING ATTEMPT EXISTS
        // =================================================

        if (existingAttempt) {

            const startedTime =
                new Date(
                    existingAttempt.startedAt
                ).getTime();


            const durationMilliseconds =
                Number(
                    existingAttempt
                        .durationMinutesSnapshot
                ) *
                60 *
                1000;


            const deadline =
                startedTime +
                durationMilliseconds;


            const now =
                Date.now();


            console.log(
                "Existing attempt found:",
                existingAttempt._id
            );


            console.log(
                "Existing attempt started:",
                new Date(startedTime)
            );


            console.log(
                "Existing attempt deadline:",
                new Date(deadline)
            );


            console.log(
                "Current time:",
                new Date(now)
            );


            // =================================================
            // EXISTING ATTEMPT IS STILL ACTIVE
            // =================================================

            if (
                now < deadline
            ) {

                console.log(
                    "Existing attempt is still active."
                );


                return res.status(200).json({

                    attemptId:
                        existingAttempt._id,

                    startedAt:
                        existingAttempt.startedAt,

                    durationMinutes:
                        existingAttempt
                            .durationMinutesSnapshot

                });
            }


            // =================================================
            // EXISTING ATTEMPT HAS EXPIRED
            // =================================================

            console.log(
                "Existing attempt has expired."
            );


            console.log(
                "Deleting expired attempt:",
                existingAttempt._id
            );


            await Attempt.deleteOne({

                _id:
                    existingAttempt._id,

                student:
                    req.user._id,

                exam:
                    exam._id,

                status:
                    "in-progress"

            });


            console.log(
                "Expired attempt deleted."
            );
        }


        // =================================================
        // CREATE SNAPSHOT
        // =================================================

        const questionsSnapshot =
            exam.questions.map(
                (question) => ({

                    questionId:
                        question._id,

                    text:
                        question.text,

                    options:
                        question.options,

                    correctAnswer:
                        question.correctAnswer,

                    marks:
                        question.marks

                })
            );


        // =================================================
        // CALCULATE TOTAL MARKS
        // =================================================

        const totalMarks =
            questionsSnapshot.reduce(
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
        // CREATE NEW ATTEMPT
        // =================================================

        const attempt =
            await Attempt.create({

                student:
                    req.user._id,

                exam:
                    exam._id,

                questionsSnapshot:
                    questionsSnapshot,

                durationMinutesSnapshot:
                    Number(
                        exam.durationMinutes
                    ),

                startedAt:
                    new Date(),

                submittedAt:
                    null,

                answers:
                    [],

                score:
                    0,

                totalMarks:
                    totalMarks,

                percentage:
                    0,

                status:
                    "in-progress"

            });


        console.log(
            "===================================="
        );

        console.log(
            "NEW ATTEMPT CREATED"
        );

        console.log(
            "Attempt ID:",
            attempt._id
        );

        console.log(
            "Exam:",
            exam.title
        );

        console.log(
            "Started:",
            attempt.startedAt
        );

        console.log(
            "Duration:",
            attempt.durationMinutesSnapshot,
            "minutes"
        );

        console.log(
            "===================================="
        );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(201).json({

            attemptId:
                attempt._id,

            startedAt:
                attempt.startedAt,

            durationMinutes:
                attempt.durationMinutesSnapshot

        });


    } catch (error) {

        console.error(
            "START ATTEMPT ERROR:",
            error
        );


        next(error);

    }
};



// =====================================================
// ADMIN - GET ALL EXAMS
// =====================================================

const adminGetExams = async (
    req,
    res,
    next
) => {

    try {

        const exams =
            await Exam.find({})
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            exams:
                exams

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// CREATE EXAM
// =====================================================

const createExam = async (
    req,
    res,
    next
) => {

    try {

        const {
            title,
            description = "",
            durationMinutes
        } = req.body;


        if (
            !title ||
            !String(title).trim()
        ) {

            return res.status(400).json({

                message:
                    "Exam title is required."

            });
        }


        const duration =
            Number(
                durationMinutes
            );


        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            return res.status(400).json({

                message:
                    "Duration must be greater than 0."

            });
        }


        const exam =
            await Exam.create({

                title:
                    String(title).trim(),

                description:
                    String(description).trim(),

                durationMinutes:
                    duration,

                isPublished:
                    false,

                questions:
                    [],

                createdBy:
                    req.user._id

            });


        return res.status(201).json({

            message:
                "Exam created successfully.",

            exam:
                exam

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// UPDATE EXAM
// =====================================================

const updateExam = async (
    req,
    res,
    next
) => {

    try {

        const exam =
            await Exam.findById(
                req.params.id
            );


        if (!exam) {

            return res.status(404).json({

                message:
                    "Exam not found."

            });
        }


        const {
            title,
            description,
            durationMinutes,
            isPublished,
            questions
        } = req.body;


        if (
            title !== undefined
        ) {

            exam.title =
                String(
                    title
                ).trim();

        }


        if (
            description !== undefined
        ) {

            exam.description =
                String(
                    description
                ).trim();

        }


        if (
            durationMinutes !== undefined
        ) {

            const duration =
                Number(
                    durationMinutes
                );


            if (
                !Number.isFinite(
                    duration
                ) ||
                duration <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Invalid duration."

                });
            }


            exam.durationMinutes =
                duration;
        }


        // SAVE QUESTIONS SENT BY ADMIN PANEL
        if (
            questions !== undefined
        ) {

            if (!Array.isArray(questions)) {

                return res.status(400).json({

                    message:
                        "Questions must be an array."

                });
            }

            exam.questions =
                questions;
        }


        if (
            isPublished !== undefined
        ) {

            const publishValue =
                isPublished === true ||
                isPublished === "true";

            if (
                publishValue &&
                (!exam.questions || exam.questions.length === 0)
            ) {

                return res.status(400).json({

                    message:
                        "Add at least one question before publishing this exam."

                });
            }

            exam.isPublished =
                publishValue;

        }


        await exam.save();


        return res.status(200).json({

            message:
                "Exam updated successfully.",

            exam:
                exam

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// DELETE EXAM
// =====================================================

const deleteExam = async (
    req,
    res,
    next
) => {

    try {

        const exam =
            await Exam.findById(
                req.params.id
            );


        if (!exam) {

            return res.status(404).json({

                message:
                    "Exam not found."

            });
        }


        // Delete related in-progress attempts
        await Attempt.deleteMany({

            exam:
                exam._id,

            status:
                "in-progress"

        });


        await Exam.deleteOne({

            _id:
                exam._id

        });


        return res.status(200).json({

            message:
                "Exam deleted successfully."

        });


    } catch (error) {

        next(error);

    }
};



// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getPublishedExams,

    getExamForAttempt,

    startAttempt,

    adminGetExams,

    createExam,

    updateExam,

    deleteExam

};
