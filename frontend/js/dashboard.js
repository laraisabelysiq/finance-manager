"use strict";

(() => {
    const API = window.API;
    const Utils = window.Utils;
    const CONFIG = window.APP_CONFIG;

    const elements = {
        userName: document.getElementById("user-name"),
        userAvatar: document.getElementById("user-avatar"),
        welcomeTitle: document.getElementById("welcome-title"),
        currentYear: document.getElementById("current-year"),
        balance: document.getElementById("summary-balance"),
        income: document.getElementById("summary-income"),
        expenses: document.getElementById("summary-expenses"),
        count: document.getElementById("summary-count"),
        transactions: document.getElementById("recent-transactions"),
        chart: document.getElementById("finance-chart"),
        chartEmpty: document.getElementById("chart-empty"),
        alert: document.getElementById("dashboard-alert"),
        logout: document.getElementById("logout-button"),
        menuToggle: document.getElementById("menu-toggle"),
        sidebar: document.getElementById("sidebar"),
        overlay: document.getElementById("sidebar-overlay"),
    };

    let financeChart = null;

    function getStoredUser() {
        try {
            const user = localStorage.getItem(CONFIG.USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    }

    function requireAuthentication() {
        if (!API.getToken()) {
            window.location.replace("./login.html");
            return false;
        }

        return true;
    }

    function getFirstName(name) {
        if (typeof name !== "string" || !name.trim()) {
            return "aí";
        }

        return name.trim().split(/\s+/)[0];
    }

    function initializeUser() {
        const user = getStoredUser();
        const name = user?.name || user?.nome || user?.fullName || "";

        elements.userName.textContent = name || "Minha conta";
        elements.userAvatar.textContent = name
            ? name.trim().charAt(0).toUpperCase()
            : "U";

        elements.welcomeTitle.textContent = `Olá, ${getFirstName(name)}! 👋`;
        elements.currentYear.textContent = new Date().getFullYear();
    }

    function showAlert(message) {
        elements.alert.textContent = message;
        elements.alert.hidden = false;
    }

    function hideAlert() {
        elements.alert.textContent = "";
        elements.alert.hidden = true;
    }

    function formatCurrency(value) {
        const amount = Number(value);

        return Utils.formatCurrency(
            Number.isFinite(amount) ? amount : 0
        );
    }

    function getAmount(transaction) {
        const value = Number(
            transaction.amount ??
            transaction.valor ??
            transaction.value ??
            0
        );

        return Number.isFinite(value) ? value : 0;
    }

    function isIncome(transaction) {
        const type = String(
            transaction.type ??
            transaction.tipo ??
            ""
        ).toLowerCase();

        return ["income", "receita", "entrada"].includes(type);
    }

    function getTransactionDate(transaction) {
        return (
            transaction.date ??
            transaction.transaction_date ??
            transaction.data ??
            transaction.created_at ??
            null
        );
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return Utils.formatDate(date);
    }

    function getPayload(response) {
        if (response?.data?.data !== undefined) {
            return response.data.data;
        }

        if (response?.data !== undefined) {
            return response.data;
        }

        return response;
    }

    async function fetchEndpoint(endpoint) {
        const response = await API.request(endpoint);
        return getPayload(response);
    }

    function renderSummary(summary = {}) {
        const income = Number(
            summary.income ??
            summary.receitas ??
            summary.totalIncome ??
            0
        );

        const expenses = Number(
            summary.expenses ??
            summary.despesas ??
            summary.totalExpenses ??
            0
        );

        const balance = Number(
            summary.balance ??
            summary.saldo ??
            income - expenses
        );

        const count = Number(
            summary.transaction_count ??
            summary.transactionCount ??
            summary.transactionsCount ??
            summary.totalTransactions ??
            summary.total_transacoes ??
            summary.count ??
            0
        );

        elements.balance.textContent = formatCurrency(balance);
        elements.income.textContent = formatCurrency(income);
        elements.expenses.textContent = formatCurrency(expenses);
        elements.count.textContent = String(
            Number.isFinite(count) ? count : 0
        );

        elements.balance.style.color =
            balance < 0 ? "#d85c50" : "";
    }

    function normalizeTransactions(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.transactions)) {
            return data.transactions;
        }

        if (Array.isArray(data?.transacoes)) {
            return data.transacoes;
        }

        if (Array.isArray(data?.items)) {
            return data.items;
        }

        return [];
    }

    function renderTransactions(transactions) {
        if (!transactions.length) {
            elements.transactions.innerHTML = `
                <tr>
                    <td colspan="5" class="table-empty">
                        Você ainda não tem transações neste período.
                        <br>
                        Comece registrando sua primeira movimentação!
                    </td>
                </tr>
            `;
            return;
        }

        elements.transactions.innerHTML = transactions
            .slice(0, 5)
            .map((transaction) => {
                const income = isIncome(transaction);
                const amount = getAmount(transaction);
                const description = String(
                    transaction.description ??
                    transaction.descricao ??
                    transaction.title ??
                    "Transação"
                );

                const category =
                    transaction.category?.name ??
                    transaction.category_name ??
                    transaction.categoria?.nome ??
                    transaction.categoria_nome ??
                    transaction.category ??
                    transaction.categoria ??
                    "Sem categoria";

                const date = getTransactionDate(transaction);

                return `
                    <tr>
                        <td class="transaction-description">
                            <span class="transaction-symbol" aria-hidden="true">
                                ${income ? "↗" : "↘"}
                            </span>
                            <span>${Utils.escapeHTML(String(description))}</span>
                        </td>
                        <td>${Utils.escapeHTML(String(category))}</td>
                        <td>${formatDate(date)}</td>
                        <td>
                            <span class="transaction-type ${income ? "income" : "expense"}">
                                ${income ? "Receita" : "Despesa"}
                            </span>
                        </td>
                        <td class="amount-column ${income ? "income-amount" : "expense-amount"}">
                            ${income ? "+" : "−"} ${formatCurrency(Math.abs(amount))}
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function normalizeMonthlyData(data) {
        const source = Array.isArray(data)
            ? data
            : data?.months ?? data?.monthly ?? data?.history ?? [];

        const now = new Date();
        const months = [];

        for (let offset = 5; offset >= 0; offset--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - offset,
                1
            );

            const key = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
            ].join("-");

            const found = source.find((item) => {
                const itemKey =
                    item.month ??
                    item.mes ??
                    item.period ??
                    item.reference;

                return String(itemKey ?? "").startsWith(key);
            });

            months.push({
                key,
                label: date.toLocaleDateString("pt-BR", {
                    month: "short",
                }).replace(".", ""),
                income: Number(
                    found?.income ??
                    found?.receitas ??
                    found?.totalIncome ??
                    0
                ),
                expenses: Number(
                    found?.expenses ??
                    found?.despesas ??
                    found?.totalExpenses ??
                    0
                ),
            });
        }

        return months;
    }

    function renderChart(monthlyData) {
        if (typeof Chart === "undefined" || !elements.chart) {
            elements.chartEmpty.hidden = false;
            return;
        }

        const hasData = monthlyData.some(
            (month) => month.income !== 0 || month.expenses !== 0
        );

        elements.chartEmpty.hidden = hasData;

        if (financeChart) {
            financeChart.destroy();
        }

        financeChart = new Chart(elements.chart, {
            type: "bar",
            data: {
                labels: monthlyData.map((month) => month.label),
                datasets: [
                    {
                        label: "Receitas",
                        data: monthlyData.map((month) => month.income),
                        backgroundColor: "#27a785",
                        borderRadius: 5,
                        maxBarThickness: 22,
                    },
                    {
                        label: "Despesas",
                        data: monthlyData.map((month) => month.expenses),
                        backgroundColor: "#ed8a7b",
                        borderRadius: 5,
                        maxBarThickness: 22,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            boxWidth: 7,
                            boxHeight: 7,
                            padding: 18,
                            color: "#7f8d99",
                            font: {
                                family: "DM Sans",
                                size: 10,
                            },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        border: {
                            display: false,
                        },
                        ticks: {
                            color: "#8a98a3",
                            font: {
                                family: "DM Sans",
                                size: 10,
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        border: {
                            display: false,
                        },
                        grid: {
                            color: "#edf1f4",
                        },
                        ticks: {
                            color: "#8a98a3",
                            font: {
                                family: "DM Sans",
                                size: 9,
                            },
                            callback(value) {
                                return new Intl.NumberFormat("pt-BR", {
                                    notation: "compact",
                                    maximumFractionDigits: 1,
                                }).format(value);
                            },
                        },
                    },
                },
            },
        });
    }

    async function loadDashboard() {
        hideAlert();

        const now = new Date();
        const month = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
        ].join("-");

        const summaryPromise = fetchEndpoint(
            `/dashboard/summary?month=${month}`
        );

        const transactionsPromise = fetchEndpoint(
            `/transactions?limit=5&sort=recent`
        );

        const monthlyPromise = fetchEndpoint(
            `/dashboard/monthly?months=6`
        );

        const results = await Promise.allSettled([
            summaryPromise,
            transactionsPromise,
            monthlyPromise,
        ]);

        if (results.every((result) => result.status === "rejected")) {
            showAlert(
                "Não foi possível carregar os dados financeiros. " +
                "Confira se o servidor está ativo e se os endpoints do painel já foram implementados."
            );

            renderSummary();
            renderTransactions([]);
            renderChart(normalizeMonthlyData([]));
            return;
        }

        if (results[0].status === "fulfilled") {
            const summaryData = results[0].value;
            renderSummary(summaryData.summary ?? summaryData);
        } else {
            renderSummary();
            showAlert(
                "O resumo financeiro ainda não pôde ser carregado."
            );
        }

        if (results[1].status === "fulfilled") {
            renderTransactions(normalizeTransactions(results[1].value));
        } else {
            renderTransactions([]);
        }

        if (results[2].status === "fulfilled") {
            renderChart(normalizeMonthlyData(results[2].value));
        } else {
            renderChart(normalizeMonthlyData([]));
        }
    }

    function closeSidebar() {
        elements.sidebar.classList.remove("is-open");
        elements.overlay.classList.remove("is-visible");
        elements.menuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    function initializeNavigation() {
        elements.logout.addEventListener("click", () => {
            API.clearToken();
            localStorage.removeItem(CONFIG.USER_KEY);
            window.location.replace("./login.html");
        });

        elements.menuToggle.addEventListener("click", () => {
            const isOpen = elements.sidebar.classList.toggle("is-open");

            elements.overlay.classList.toggle("is-visible", isOpen);
            elements.menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            document.body.style.overflow = isOpen ? "hidden" : "";
        });

        elements.overlay.addEventListener("click", closeSidebar);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        });
    }

    async function initialize() {
        if (!requireAuthentication()) {
            return;
        }

        initializeUser();
        initializeNavigation();

        try {
            await loadDashboard();
        } catch (error) {
            console.error("Erro ao inicializar o painel:", error);
            showAlert(
                "Ocorreu um erro ao carregar o painel. Tente atualizar a página."
            );
        }
    }

    initialize();
})();