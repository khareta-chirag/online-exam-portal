const express = require("express");

const {
    submitAttempt,
    getMyResults,
    getResultById,
    adminGetResults
} = require("../controllers/attemptController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// STUDENT - MY RESULTS
// =====================================================

router.get(
    "/results/me",
    protect,
    getMyResults
);


// =====================================================
// ADMIN - ALL RESULTS
// =====================================================

router.get(
    "/admin/results",
    protect,
    adminOnly,
    adminGetResults
);


// =====================================================
// RESULT DETAIL
// =====================================================

router.get(
    "/results/:id",
    protect,
    getResultById
);


// =====================================================
// COMPATIBILITY RESULT DETAIL
// =====================================================

router.get(
    "/:id",
    protect,
    getResultById
);


// =====================================================
// SUBMIT EXAM
// =====================================================

router.post(
    "/:id/submit",
    protect,
    submitAttempt
);


module.exports = router;