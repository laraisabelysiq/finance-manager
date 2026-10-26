
const authService = require("../services/auth.service");

async function register(req, res, next) {
    try {
        const result = await authService.register({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });

        return res.status(201).json({
            status: "success",
            message: "Conta criada com sucesso.",
            data: result,
        });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const result = await authService.login({
            email: req.body.email,
            password: req.body.password,
        });

        return res.status(200).json({
            status: "success",
            message: "Login realizado com sucesso.",
            data: result,
        });
    } catch (error) {
        return next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = await authService.getUserById(req.user.id);

        return res.status(200).json({
            status: "success",
            data: { user },
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    register,
    login,
    me,
};
