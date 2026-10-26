
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pool = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const categoriesRoutes = require("./routes/categories.routes");
const transactionsRoutes = require("./routes/transactions.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Cabeçalhos HTTP de segurança.
app.use(helmet());

// Permite requisições do frontend autorizado.
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5500",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Limita o tamanho do corpo das requisições.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// Limita a frequência de requisições para reduzir abusos.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Muitas requisições. Tente novamente mais tarde.",
    },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Rota inicial para verificar se a API está funcionando.
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        status: "success",
        message: "Finance Manager API funcionando!",
        environment: process.env.NODE_ENV || "development",
    });
});



app.get("/api/health/db", async (req, res, next) => {
    try {
        await pool.query("SELECT 1 AS connected");

        return res.status(200).json({
            status: "success",
            message: "Conexão com o banco de dados funcionando!",
            database: "connected",
        });
    } catch (error) {
        console.error("Erro original na conexão MySQL:", error);

        const dbError = new Error(
            "Não foi possível conectar ao banco de dados."
        );

        dbError.status = 503;

        return next(dbError);
    }
});



// Resposta para rotas inexistentes.
app.use((req, res, next) => {
    const error = new Error(
        `Rota não encontrada: ${req.method} ${req.originalUrl}`
    );

    error.status = 404;

    next(error);
});

// Middleware centralizado de tratamento de erros.
app.use(errorMiddleware);

module.exports = app;
