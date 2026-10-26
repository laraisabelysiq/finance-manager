
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Autenticação necessária.",
        });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Token de autenticação não informado.",
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        return next(new Error("JWT_SECRET ausente ou inválido."));
    }

    try {
        const payload = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });

        if (
            typeof payload.sub !== "string" ||
            !/^[1-9]\d*$/.test(payload.sub)
        ) {
            return res.status(401).json({
                status: "error",
                message: "Token de autenticação inválido.",
            });
        }

        req.user = {
            id: payload.sub,
        };

        return next();
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Token inválido ou expirado.",
            });
        }

        return next(error);
    }
}

module.exports = authMiddleware;
