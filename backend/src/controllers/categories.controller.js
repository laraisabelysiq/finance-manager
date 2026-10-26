
const pool = require("../config/database");

function getUserId(req) {
    return req.user?.id ?? req.user?.userId ?? req.user?.user_id;
}

function validateCategory({ name, type }) {
    const errors = [];

    if (typeof name !== "string" || !name.trim()) {
        errors.push({
            field: "name",
            message: "O nome da categoria é obrigatório.",
        });
    } else if (name.trim().length > 60) {
        errors.push({
            field: "name",
            message: "O nome deve ter no máximo 60 caracteres.",
        });
    }

    if (!["income", "expense"].includes(type)) {
        errors.push({
            field: "type",
            message: "O tipo deve ser income ou expense.",
        });
    }

    return errors;
}

async function list(req, res, next) {
    try {
        const userId = getUserId(req);

        const [categories] = await pool.execute(
            `SELECT id, name, type, created_at
             FROM categories
             WHERE user_id = ?
             ORDER BY type ASC, name ASC`,
            [userId]
        );

        return res.status(200).json({
            status: "success",
            data: { categories },
        });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        const userId = getUserId(req);
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                status: "error",
                message: "ID de categoria inválido.",
            });
        }

        const [categories] = await pool.execute(
            `SELECT id, name, type, created_at
             FROM categories
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Categoria não encontrada.",
            });
        }

        return res.status(200).json({
            status: "success",
            data: { category: categories[0] },
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const userId = getUserId(req);
        const { name, type } = req.body;

        const errors = validateCategory({ name, type });

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Verifique os dados informados.",
                errors,
            });
        }

        const normalizedName = name.trim();

        const [existing] = await pool.execute(
            `SELECT id FROM categories
             WHERE user_id = ? AND name = ? AND type = ?`,
            [userId, normalizedName, type]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "Já existe uma categoria com esse nome e tipo.",
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO categories (user_id, name, type)
             VALUES (?, ?, ?)`,
            [userId, normalizedName, type]
        );

        return res.status(201).json({
            status: "success",
            message: "Categoria criada com sucesso.",
            data: {
                category: {
                    id: result.insertId,
                    name: normalizedName,
                    type,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const userId = getUserId(req);
        const id = Number(req.params.id);
        const { name, type } = req.body;

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                status: "error",
                message: "ID de categoria inválido.",
            });
        }

        const errors = validateCategory({ name, type });

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Verifique os dados informados.",
                errors,
            });
        }

        const [current] = await pool.execute(
            `SELECT id FROM categories
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (current.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Categoria não encontrada.",
            });
        }

        const normalizedName = name.trim();

        const [existing] = await pool.execute(
            `SELECT id FROM categories
             WHERE user_id = ? AND name = ? AND type = ? AND id <> ?`,
            [userId, normalizedName, type, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "Já existe outra categoria com esse nome e tipo.",
            });
        }

        // Impede que uma categoria seja alterada para um tipo
        // incompatível com transações que já a utilizam.
        const [transactions] = await pool.execute(
            `SELECT id FROM transactions
             WHERE category_id = ? AND user_id = ?
               AND type <> ?
             LIMIT 1`,
            [id, userId, type]
        );

        if (transactions.length > 0) {
            return res.status(409).json({
                status: "error",
                message:
                    "Não é possível alterar o tipo: existem transações vinculadas a essa categoria.",
            });
        }

        await pool.execute(
            `UPDATE categories
             SET name = ?, type = ?
             WHERE id = ? AND user_id = ?`,
            [normalizedName, type, id, userId]
        );

        return res.status(200).json({
            status: "success",
            message: "Categoria atualizada com sucesso.",
            data: {
                category: {
                    id,
                    name: normalizedName,
                    type,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const userId = getUserId(req);
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                status: "error",
                message: "ID de categoria inválido.",
            });
        }

        const [categories] = await pool.execute(
            `SELECT id FROM categories
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Categoria não encontrada.",
            });
        }

        const [transactions] = await pool.execute(
            `SELECT id FROM transactions
             WHERE category_id = ? AND user_id = ?
             LIMIT 1`,
            [id, userId]
        );

        if (transactions.length > 0) {
            return res.status(409).json({
                status: "error",
                message:
                    "Não é possível excluir uma categoria que possui transações vinculadas.",
            });
        }

        await pool.execute(
            `DELETE FROM categories
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        return res.status(200).json({
            status: "success",
            message: "Categoria excluída com sucesso.",
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    getById,
    create,
    update,
    remove,
};
