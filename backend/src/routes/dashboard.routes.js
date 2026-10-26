
"use strict";

const express = require("express");
const authenticateToken = require("../middlewares/auth.middleware");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/summary", dashboardController.getSummary);
router.get("/monthly", dashboardController.getMonthlyHistory);
router.get(
    "/expenses-by-category",
    dashboardController.getExpensesByCategory
);

module.exports = router;
