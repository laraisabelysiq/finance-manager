
const pool = require("../config/database");

function getUserId(req) {
    return req.user?.id ?? req.user?.userId ?? req.user?.user_id;
}

function isValidMonth(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month] = value.split("-").map(Number);

    return year >= 1000 && year <= 9999 && month >= 1 && month <= 12;
}

function getMonthRange(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    const startDate = `${month}-01`;
    const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
    const endDate = [
        nextMonth.getUTCFullYear(),
        String(nextMonth.getUTCMonth() + 1).padStart(2, "0"),
        String(nextMonth.getUTCDate()).padStart(2, "0"),
    ].join("-");

    return { startDate, endDate };
}

async function getSummary(req, res, next) {
    try {
        const userId = getUserId(req);
        const month = req.query.month;

        if (month !== undefined && !isValidMonth(month)) {
            return res.status(400).json({
                status: "error",
                message: "Informe um mês válido no formato AAAA-MM.",
            });
        }

        const selectedMonth = month || new Date().toISOString().slice(0, 7);
        const { startDate, endDate } = getMonthRange(selectedMonth);

        const [totals] = await pool.execute(
            `SELECT
                COALESCE(SUM(CASE
                    WHEN type = 'income' THEN amount ELSE 0
                END), 0) AS income,
                COALESCE(SUM(CASE
                    WHEN type = 'expense' THEN amount ELSE 0
                END), 0) AS expenses,
                COUNT(*) AS transaction_count
             FROM transactions
             WHERE user_id = ?
               AND transaction_date >= ?
               AND transaction_date < ?`,
            [userId, startDate, endDate]
        );

        const income = Number(totals[0].income);
        const expenses = Number(totals[0].expenses);

        return res.status(200).json({
            status: "success",
            data: {
                month: selectedMonth,
                summary: {
                    income,
                    expenses,
                    balance: Number((income - expenses).toFixed(2)),
                    transaction_count: Number(totals[0].transaction_count),
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

async function getMonthlyHistory(req, res, next) {
    try {
        const userId = getUserId(req);

        const requestedMonths = req.query.months === undefined
            ? 6
            : Number(req.query.months);

        if (
            !Number.isInteger(requestedMonths) ||
            requestedMonths < 1 ||
            requestedMonths > 12
        ) {
            return res.status(400).json({
                status: "error",
                message: "O parâmetro months deve ser um número entre 1 e 12.",
            });
        }

        const [rows] = await pool.execute(
            `SELECT
                DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                COALESCE(SUM(CASE
                    WHEN type = 'income' THEN amount ELSE 0
                END), 0) AS income,
                COALESCE(SUM(CASE
                    WHEN type = 'expense' THEN amount ELSE 0
                END), 0) AS expenses
             FROM transactions
             WHERE user_id = ?
               AND transaction_date >= DATE_FORMAT(
                    DATE_SUB(CURRENT_DATE, INTERVAL ? - 1 MONTH),
                    '%Y-%m-01'
               )
               AND transaction_date < DATE_ADD(
                    DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'),
                    INTERVAL 1 MONTH
               )
             GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
             ORDER BY month ASC`,
            [userId, requestedMonths]
        );

        const historyByMonth = new Map(
            rows.map((row) => [
                row.month,
                {
                    month: row.month,
                    income: Number(row.income),
                    expenses: Number(row.expenses),
                },
            ])
        );

        const history = [];
        const now = new Date();

        for (let offset = requestedMonths - 1; offset >= 0; offset--) {
            const date = new Date(
                Date.UTC(now.getFullYear(), now.getMonth() - offset, 1)
            );

            const key = [
                date.getUTCFullYear(),
                String(date.getUTCMonth() + 1).padStart(2, "0"),
            ].join("-");

            const monthData = historyByMonth.get(key) || {
                month: key,
                income: 0,
                expenses: 0,
            };

            history.push({
                ...monthData,
                balance: Number(
                    (monthData.income - monthData.expenses).toFixed(2)
                ),
            });
        }

        return res.status(200).json({
            status: "success",
            data: { history },
        });
    } catch (error) {
        next(error);
    }
}

async function getExpensesByCategory(req, res, next) {
    try {
        const userId = getUserId(req);
        const month = req.query.month;

        if (month !== undefined && !isValidMonth(month)) {
            return res.status(400).json({
                status: "error",
                message: "Informe um mês válido no formato AAAA-MM.",
            });
        }

        const selectedMonth = month || new Date().toISOString().slice(0, 7);
        const { startDate, endDate } = getMonthRange(selectedMonth);

        const [rows] = await pool.execute(
            `SELECT
                c.id AS category_id,
                c.name AS category_name,
                COALESCE(SUM(t.amount), 0) AS total
             FROM transactions t
             INNER JOIN categories c
                ON c.id = t.category_id
                AND c.user_id = t.user_id
             WHERE t.user_id = ?
               AND t.type = 'expense'
               AND t.transaction_date >= ?
               AND t.transaction_date < ?
             GROUP BY c.id, c.name
             ORDER BY total DESC, c.name ASC`,
            [userId, startDate, endDate]
        );

        const categories = rows.map((row) => ({
            category_id: Number(row.category_id),
            category_name: row.category_name,
            total: Number(row.total),
        }));

        return res.status(200).json({
            status: "success",
            data: {
                month: selectedMonth,
                categories,
            },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getSummary,
    getMonthlyHistory,
    getExpensesByCategory,
};
