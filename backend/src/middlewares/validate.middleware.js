
const { validationResult } = require("express-validator");

function validateMiddleware(req, res, next) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).json({
            status: "error",
            message: "Verifique os dados informados.",
            errors: result.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    return next();
}

module.exports = validateMiddleware;
