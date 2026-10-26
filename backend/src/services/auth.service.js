
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            "JWT_SECRET ausente ou inválido. Configure uma chave segura no .env."
        );
    }

    return secret;
}

function createToken(user) {
    return jwt.sign(
        {
            sub: String(user.id),
        },
        getJwtSecret(),
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
            algorithm: "HS256",
        }
    );
}

function publicUser(user) {
    return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
    };
}

async function register({ name, email, password }) {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash)
             VALUES (?, ?, ?)`,
            [normalizedName, normalizedEmail, passwordHash]
        );

        const [rows] = await pool.execute(
            `SELECT id, name, email, created_at
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [result.insertId]
        );

        const user = rows[0];

        return {
            user: publicUser(user),
            token: createToken(user),
        };
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const duplicateError = new Error(
                "Já existe uma conta cadastrada com esse e-mail."
            );

            duplicateError.status = 409;
            throw duplicateError;
        }

        throw error;
    }
}

async function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute(
        `SELECT id, name, email, password_hash, created_at
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [normalizedEmail]
    );

    const user = rows[0];

    if (!user) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatches) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    return {
        user: publicUser(user),
        token: createToken(user),
    };
}

async function getUserById(userId) {
    const [rows] = await pool.execute(
        `SELECT id, name, email, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    if (rows.length === 0) {
        const error = new Error("Usuário não encontrado.");
        error.status = 404;
        throw error;
    }

    return publicUser(rows[0]);
}

module.exports = {
    register,
    login,
    getUserById,
};
