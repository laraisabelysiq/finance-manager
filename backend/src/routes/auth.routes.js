
const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");

const {
    registerValidator,
    loginValidator,
} = require("../validators/auth.validators");

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Muitas tentativas. Tente novamente mais tarde.",
    },
});

// Cadastro
router.post(
    "/register",
    authLimiter,
    registerValidator,
    validateMiddleware,
    authController.register
);

// Login
router.post(
    "/login",
    authLimiter,
    loginValidator,
    validateMiddleware,
    authController.login
);

// Dados do usuário autenticado
router.get(
    "/me",
    authMiddleware,
    authController.me
);

module.exports = router;
