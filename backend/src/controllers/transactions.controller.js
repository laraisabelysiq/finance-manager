
const pool = require("../config/database");

function getUserId(req) {
    return req.user?.id ?? req.user?.userId ?? req.user?.user_id;
}

function isValidId(value) {
    return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validateTransaction(data, partial = false) {
    const errors = [];
    const { type, description, amount, category_id, transaction_date, notes } = data;

    if (!partial || type !== undefined) {
        if (!["income", "expense"].includes(type)) {
            errors.push({
                field: "type",
                message: "O tipo deve ser income ou expense.",
            });
        }
    }

    if (!partial || description !== undefined) {
        if (typeof description !== "string" || !description.trim()) {
            errors.push({
                field: "description",
                message: "A descrição é obrigatória.",
            });
        } else if (description.trim().length > 255) {
            errors.push({
                field: "description",
                message: "A descrição deve ter no máximo 255 caracteres.",
            });
        }
    }

    if (!partial || amount !== undefined) {
        const validAmount =
            (typeof amount === "number" || typeof amount === "string") &&
            String(amount).trim() !== "" &&
            Number.isFinite(Number(amount)) &&
            Number(amount) > 0 &&
            /^\d{1,10}(\.\d{1,2})?$/.test(String(amount));

        if (!validAmount) {
            errors.push({
                field: "amount",
                message: "Informe um valor maior que zero, com até duas casas decimais.",
            });
        }
    }

    if (!partial || category_id !== undefined) {
        if (!isValidId(category_id)) {
            errors.push({
                field: "category_id",
                message: "Informe um ID de categoria válido.",
            });
        }
    }

    if (!partial || transaction_date !== undefined) {
        if (
            typeof transaction_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date) ||
            !isRealDate(transaction_date)
        ) {
            errors.push({
                field: "transaction_date",
                message: "Informe uma data válida no formato AAAA-MM-DD.",
            });
        }
    }

    if (notes !== undefined && notes !== null) {
        if (typeof notes !== "string" || notes.length > 1000) {
            errors.push({
                field: "notes",
                message: "As observações devem ser um texto de até 1000 caracteres.",
            });
        }
    }

    return errors;
}

function isRealDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function validateFilters(query) {
    const errors = [];
    const { type, category_id, start_date, end_date } = query;

    if (type !== undefined && !["income", "expense"].includes(type)) {
        errors.push({
            field: "type",
            message: "O tipo deve ser income ou expense.",
        });
    }

    if (category_id !== undefined && !isValidId(category_id)) {
        errors.push({
            field: "category_id",
            message: "O ID da categoria é inválido.",
        });
    }

    if (start_date !== undefined && (
        typeof start_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(start_date) ||
        !isRealDate(start_date)
    )) {
        errors.push({
            field: "start_date",
            message: "A data inicial deve ser válida e usar o formato AAAA-MM-DD.",
        });
    }

    if (end_date !== undefined && (
        typeof end_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(end_date) ||
        !isRealDate(end_date)
    )) {
        errors.push({
            field: "end_date",
            message: "A data final deve ser válida e usar o formato AAAA-MM-DD.",
        });
    }

    if (
        typeof start_date === "string" &&
        typeof end_date === "string" &&
        start_date > end_date
    ) {
        errors.push({
            field: "end_date",
            message: "A data final não pode ser anterior à data inicial.",
        });
    }

    return errors;
}

async function validateCategory(userId, categoryId, type) {
    const [categories] = await pool.execute(
        `SELECT id
         FROM categories
         WHERE id = ? AND user_id = ? AND type = ?`,
        [categoryId, userId, type]
    );

    return categories.length > 0;
}

async function list(req, res, next) {
    try {
        const userId = getUserId(req);
        const errors = validateFilters(req.query);

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Verifique os filtros informados.",
                errors,
            });
        }

        const conditions = ["t.user_id = ?"];
        const params = [userId];

        if (req.query.type) {
            conditions.push("t.type = ?");
            params.push(req.query.type);
        }

        if (req.query.category_id) {
            conditions.push("t.category_id = ?");
            params.push(Number(req.query.category_id));
        }

        if (req.query.start_date) {
            conditions.push("t.transaction_date >= ?");
            params.push(req.query.start_date);
        }

        if (req.query.end_date) {
            conditions.push("t.transaction_date <= ?");
            params.push(req.query.end_date);
        }

        const limit = req.query.limit === undefined
            ? null
            : Number(req.query.limit);

        if (
            limit !== null &&
            (!Number.isInteger(limit) || limit < 1 || limit > 100)
        ) {
            return res.status(400).json({
                status: "error",
                message: "O limite deve ser um número inteiro entre 1 e 100.",
            });
        }

        const limitClause = limit === null ? "" : " LIMIT ?";
        const queryParams = limit === null ? params : [...params, limit];

       const [transactions] = await pool.execute(
            `SELECT
                t.id,
                t.type,
                t.description,
                t.amount,
                t.transaction_date,
                t.notes,
                t.category_id,
                c.name AS category_name,
                t.created_at,
                t.updated_at
            FROM transactions t
            INNER JOIN categories c
                ON c.id = t.category_id
                AND c.user_id = t.user_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY t.transaction_date DESC, t.id DESC${limitClause}`,
            queryParams
        );

        return res.status(200).json({
            status: "success",
            results: transactions.length,
            data: { transactions },
        });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        const userId = getUserId(req);
        const id = Number(req.params.id);

        if (!isValidId(id)) {
            return res.status(400).json({
                status: "error",
                message: "ID de transação inválido.",
            });
        }

        const [transactions] = await pool.execute(
            `SELECT
                t.id,
                t.type,
                t.description,
                t.amount,
                t.transaction_date,
                t.notes,
                t.category_id,
                c.name AS category_name,
                t.created_at,
                t.updated_at
             FROM transactions t
             INNER JOIN categories c
                ON c.id = t.category_id AND c.user_id = t.user_id
             WHERE t.id = ? AND t.user_id = ?`,
            [id, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Transação não encontrada.",
            });
        }

        return res.status(200).json({
            status: "success",
            data: { transaction: transactions[0] },
        });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const userId = getUserId(req);
        const data = req.body;
        const errors = validateTransaction(data);

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Verifique os dados informados.",
                errors,
            });
        }

        const validCategory = await validateCategory(
            userId,
            Number(data.category_id),
            data.type
        );

        if (!validCategory) {
            return res.status(400).json({
                status: "error",
                message: "A categoria não existe ou não corresponde ao tipo da transação.",
            });
        }

        const description = data.description.trim();
        const amount = Number(data.amount).toFixed(2);
        const notes = data.notes?.trim() || null;

        const [result] = await pool.execute(
            `INSERT INTO transactions
                (user_id, category_id, type, description, amount, transaction_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                Number(data.category_id),
                data.type,
                description,
                amount,
                data.transaction_date,
                notes,
            ]
        );

        return res.status(201).json({
            status: "success",
            message: "Transação criada com sucesso.",
            data: {
                transaction: {
                    id: result.insertId,
                    category_id: Number(data.category_id),
                    type: data.type,
                    description,
                    amount,
                    transaction_date: data.transaction_date,
                    notes,
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
        const data = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                status: "error",
                message: "ID de transação inválido.",
            });
        }

        const fields = [
            "type",
            "description",
            "amount",
            "category_id",
            "transaction_date",
            "notes",
        ];

        const providedFields = fields.filter((field) =>
            Object.prototype.hasOwnProperty.call(data, field)
        );

        if (providedFields.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Informe ao menos um campo para atualizar.",
            });
        }

        const [currentRows] = await pool.execute(
            `SELECT id, type, description, amount, category_id, transaction_date, notes
             FROM transactions
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (currentRows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Transação não encontrada.",
            });
        }

        const current = currentRows[0];
        const merged = {
            type: data.type ?? current.type,
            description: data.description ?? current.description,
            amount: data.amount ?? current.amount,
            category_id: data.category_id ?? current.category_id,
            transaction_date: data.transaction_date ?? formatDate(current.transaction_date),
            notes: Object.prototype.hasOwnProperty.call(data, "notes")
                ? data.notes
                : current.notes,
        };

        const errors = validateTransaction(merged);

        if (errors.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Verifique os dados informados.",
                errors,
            });
        }

        const validCategory = await validateCategory(
            userId,
            Number(merged.category_id),
            merged.type
        );

        if (!validCategory) {
            return res.status(400).json({
                status: "error",
                message: "A categoria não existe ou não corresponde ao tipo da transação.",
            });
        }

        const [result] = await pool.execute(
            `UPDATE transactions
             SET category_id = ?, type = ?, description = ?,
                 amount = ?, transaction_date = ?, notes = ?
             WHERE id = ? AND user_id = ?`,
            [
                Number(merged.category_id),
                merged.type,
                merged.description.trim(),
                Number(merged.amount).toFixed(2),
                merged.transaction_date,
                merged.notes?.trim() || null,
                id,
                userId,
            ]
        );

        return res.status(200).json({
            status: "success",
            message: "Transação atualizada com sucesso.",
        });
    } catch (error) {
        next(error);
    }
}

function formatDate(value) {
    if (value instanceof Date) {
        return [
            value.getFullYear(),
            String(value.getMonth() + 1).padStart(2, "0"),
            String(value.getDate()).padStart(2, "0"),
        ].join("-");
    }

    return String(value).slice(0, 10);
}

async function remove(req, res, next) {
    try {
        const userId = getUserId(req);
        const id = Number(req.params.id);

        if (!isValidId(id)) {
            return res.status(400).json({
                status: "error",
                message: "ID de transação inválido.",
            });
        }

        const [result] = await pool.execute(
            "DELETE FROM transactions WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                message: "Transação não encontrada.",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Transação excluída com sucesso.",
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
