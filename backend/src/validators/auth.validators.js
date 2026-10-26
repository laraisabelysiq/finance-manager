
const { body } = require("express-validator");

const registerValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("O nome é obrigatório.")
        .bail()
        .isLength({ max: 100 })
        .withMessage("O nome deve ter no máximo 100 caracteres."),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("O e-mail é obrigatório.")
        .bail()
        .isEmail()
        .withMessage("Informe um e-mail válido.")
        .bail()
        .isLength({ max: 254 })
        .withMessage("O e-mail é muito longo.")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("A senha deve ser um texto.")
        .bail()
        .custom((password) => {
            if (password.length < 8) {
                throw new Error("A senha deve ter pelo menos 8 caracteres.");
            }

            if (Buffer.byteLength(password, "utf8") > 72) {
                throw new Error("A senha não pode ultrapassar 72 bytes.");
            }

            return true;
        }),
];

const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("O e-mail é obrigatório.")
        .bail()
        .isEmail()
        .withMessage("Informe um e-mail válido.")
        .bail()
        .isLength({ max: 254 })
        .withMessage("O e-mail é muito longo.")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("A senha deve ser informada.")
        .bail()
        .notEmpty()
        .withMessage("A senha é obrigatória.")
        .bail()
        .custom((password) => {
            if (Buffer.byteLength(password, "utf8") > 72) {
                throw new Error("Credenciais inválidas.");
            }

            return true;
        }),
];

module.exports = {
    registerValidator,
    loginValidator,
};
