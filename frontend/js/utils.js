
"use strict";

const Utils = (() => {
    const currencyFormatter = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    function formatCurrency(value) {
        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return currencyFormatter.format(0);
        }

        return currencyFormatter.format(amount);
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const dateString = String(value).slice(0, 10);
        const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (!match) {
            return "—";
        }

        const [, year, month, day] = match;

        return `${day}/${month}/${year}`;
    }

    function escapeHTML(value) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return String(value ?? "").replace(
            /[&<>"']/g,
            (character) => characters[character]
        );
    }

    function showMessage(element, message, type = "info") {
        if (!element) {
            return;
        }

        const allowedTypes = ["success", "error", "info", "warning"];

        element.textContent = message;
        element.dataset.type = allowedTypes.includes(type) ? type : "info";
        element.hidden = false;
        element.setAttribute("role", type === "error" ? "alert" : "status");
    }

    function hideMessage(element) {
        if (!element) {
            return;
        }

        element.textContent = "";
        element.hidden = true;
        delete element.dataset.type;
    }

    function getErrorMessage(error) {
        if (error?.errors?.length) {
            return error.errors
                .map((item) => item.message)
                .filter(Boolean)
                .join(" ");
        }

        return error?.message || "Ocorreu um erro inesperado.";
    }

    function getCurrentMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        return `${year}-${month}`;
    }

    return Object.freeze({
        formatCurrency,
        formatDate,
        escapeHTML,
        showMessage,
        hideMessage,
        getErrorMessage,
        getCurrentMonth,
    });
})();

window.Utils = Utils;
