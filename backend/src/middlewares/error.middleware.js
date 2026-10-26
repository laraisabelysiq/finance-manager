
function errorMiddleware(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number.isInteger(err.status)
        && err.status >= 400
        && err.status <= 599
        ? err.status
        : 500;

    if (statusCode >= 500) {
        console.error("Erro interno da aplicação:", err);
    }

    const response = {
        status: "error",
        message: statusCode >= 500
            ? "Ocorreu um erro interno. Tente novamente mais tarde."
            : err.message || "Não foi possível processar a requisição.",
    };

    if (process.env.NODE_ENV === "development" && statusCode >= 500) {
        response.details = err.message;
    }

    return res.status(statusCode).json(response);
}

module.exports = errorMiddleware;
