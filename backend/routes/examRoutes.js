const express = require("express");

const {
    getPublishedExams,
    getExamForAttempt,
    startAttempt,
    adminGetExams,
    createExam,
    updateExam,
    deleteExam
} = require("../controllers/examController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// STUDENT - GET PUBLISHED EXAMS
// =====================================================

router.get(
    "/",
    protect,
    getPublishedExams
);


// =====================================================
// ADMIN - GET ALL EXAMS
// =====================================================

router.get(
    "/admin/all",
    protect,
    adminOnly,
    adminGetExams
);


// =====================================================
// ADMIN - CREATE EXAM
// =====================================================

router.post(
    "/",
    protect,
    adminOnly,
    createExam
);


// =====================================================
// ADMIN - UPDATE EXAM
// =====================================================

router.put(
    "/:id",
    protect,
    adminOnly,
    updateExam
);


// =====================================================
// ADMIN - DELETE EXAM
// =====================================================

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteExam
);


// =====================================================
// STUDENT - START EXAM
// =====================================================

router.post(
    "/:id/start",
    protect,
    startAttempt
);


// =====================================================
// STUDENT - GET EXAM
// IMPORTANT: KEEP THIS LAST
// =====================================================

router.get(
    "/:id",
    protect,
    getExamForAttempt
);


module.exports = router;