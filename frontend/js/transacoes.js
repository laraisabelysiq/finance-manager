
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("transactionForm");
    const formPanel = document.getElementById("transactionFormPanel");
    const formTitle = document.getElementById("formTitle");
    const tableBody = document.getElementById("transactionsTableBody");
    const mobileTransactions = document.getElementById("mobileTransactions");
    const categorySelect = document.getElementById("categoryId");
    const filterCategory = document.getElementById("filterCategory");
    const filterType = document.getElementById("filterType");
    const filtersForm = document.getElementById("filtersForm");
    const pageMessage = document.getElementById("pageMessage");
    const resultsCount = document.getElementById("resultsCount");
    const saveButton = document.getElementById("saveButton");
    const deleteDialog = document.getElementById("deleteDialog");

    let categories = [];
    let transactions = [];
    let editingId = null;
    let deletingId = null;
    let messageTimeout = null;

    const moneyFormatter = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    function unwrap(response) {
        let value = response;

        // Compatível com respostas JSON diretas e respostas encapsuladas.
        for (let i = 0; i < 3; i += 1) {
            if (value && typeof value === "object" && "data" in value) {
                value = value.data;
            } else {
                break;
            }
        }

        return value;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function showMessage(message, type = "info") {
        clearTimeout(messageTimeout);

        pageMessage.textContent = message;
        pageMessage.className = `feedback ${type}`;
        pageMessage.hidden = false;

        pageMessage.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        messageTimeout = setTimeout(() => {
            pageMessage.hidden = true;
        }, 6000);
    }

    function hideMessage() {
        clearTimeout(messageTimeout);
        pageMessage.hidden = true;
    }

    function getErrorMessage(error) {
        const responseData = error?.data;

        if (typeof responseData === "string" && responseData.trim()) {
            return responseData;
        }

        if (responseData && typeof responseData === "object") {
            if (typeof responseData.message === "string") {
                return responseData.message;
            }

            if (Array.isArray(responseData.errors) && responseData.errors.length) {
                return responseData.errors
                    .map((item) => item.msg || item.message || "Campo inválido.")
                    .join(" ");
            }
        }

        if (Array.isArray(error?.errors) && error.errors.length) {
            return error.errors
                .map((item) => item.msg || item.message || "Campo inválido.")
                .join(" ");
        }

        return error?.message || "Ocorreu um erro inesperado. Tente novamente.";
    }

    async function request(endpoint, options = {}) {
        try {
            return await API.request(endpoint, options);
        } catch (error) {
            if (error?.status === 401) {
                API.clearToken();
                window.location.href = "./login.html";
                throw error;
            }

            throw error;
        }
    }

    function getSelectedType() {
        return form.querySelector('input[name="type"]:checked')?.value || "income";
    }

    function formatCurrency(value) {
        const amount = Number(value);

        return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
    }

    function formatDate(value) {
        if (!value) return "—";

        const datePart = String(value).slice(0, 10);
        const parts = datePart.split("-");

        if (parts.length !== 3) return escapeHTML(value);

        const [year, month, day] = parts;

        if (!year || !month || !day) return escapeHTML(value);

        return `${day}/${month}/${year}`;
    }

    function todayLocal() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function setDefaultDate() {
        document.getElementById("transactionDate").value = todayLocal();
    }

    function setFormOpen(isOpen) {
        formPanel.hidden = !isOpen;

        if (isOpen) {
            formPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function getCategoryName(transaction) {
        if (transaction.category_name) return transaction.category_name;

        const category = categories.find(
            (item) => Number(item.id) === Number(transaction.category_id)
        );

        return category?.name || "Categoria";
    }

    function normalizeCategoryList(response) {
        const payload = unwrap(response);

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.categories)) return payload.categories;

        return [];
    }

    function normalizeTransactionList(response) {
        const payload = unwrap(response);

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.transactions)) return payload.transactions;
        if (Array.isArray(payload?.items)) return payload.items;

        return [];
    }

    function renderCategoryOptions() {
        const selectedFormCategory = categorySelect.value;
        const selectedFilterCategory = filterCategory.value;

        const type = getSelectedType();
        const formCategories = categories.filter((category) => category.type === type);

        categorySelect.innerHTML = [
            '<option value="">Selecione uma categoria</option>',
            ...formCategories.map((category) =>
                `<option value="${Number(category.id)}">${escapeHTML(category.name)}</option>`
            )
        ].join("");

        if (formCategories.some((category) => String(category.id) === selectedFormCategory)) {
            categorySelect.value = selectedFormCategory;
        }

        filterCategory.innerHTML = [
            '<option value="">Todas as categorias</option>',
            ...categories.map((category) => {
                const typeLabel = category.type === "income" ? "Receita" : "Despesa";

                return `<option value="${Number(category.id)}">${escapeHTML(category.name)} · ${typeLabel}</option>`;
            })
        ].join("");

        if (categories.some((category) => String(category.id) === selectedFilterCategory)) {
            filterCategory.value = selectedFilterCategory;
        }

        document.getElementById("categoryHint").textContent = formCategories.length
            ? "Selecione uma categoria compatível com o tipo da transação."
            : "Não há categorias para este tipo. Cadastre uma na página Categorias.";
    }

    function renderEmptyTable(message) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">${escapeHTML(message)}</td>
            </tr>
        `;

        mobileTransactions.innerHTML = `
            <div class="table-message">${escapeHTML(message)}</div>
        `;
    }

    function renderTransactions() {
        resultsCount.textContent =
            `${transactions.length} ${transactions.length === 1 ? "registro" : "registros"}`;

        if (!transactions.length) {
            renderEmptyTable(
                "Nenhuma transação encontrada. Cadastre uma movimentação ou altere os filtros."
            );
            return;
        }

        tableBody.innerHTML = transactions.map((transaction) => {
            const id = Number(transaction.id);
            const type = transaction.type === "income" ? "income" : "expense";
            const typeLabel = type === "income" ? "Receita" : "Despesa";
            const sign = type === "income" ? "+" : "−";
            const description = escapeHTML(transaction.description || "Sem descrição");
            const categoryName = escapeHTML(getCategoryName(transaction));
            const date = formatDate(transaction.transaction_date);
            const amount = formatCurrency(transaction.amount);
            const notes = transaction.notes
                ? `<span class="transaction-notes">${escapeHTML(transaction.notes)}</span>`
                : "";

            return `
                <tr>
                    <td>
                        <span class="transaction-description">${description}</span>
                        ${notes}
                    </td>
                    <td>${categoryName}</td>
                    <td>${date}</td>
                    <td><span class="type-badge ${type}">${typeLabel}</span></td>
                    <td class="align-right">
                        <span class="amount ${type}">${sign} ${amount}</span>
                    </td>
                    <td class="align-right">
                        <div class="row-actions">
                            <button class="row-action" type="button"
                                data-action="edit" data-id="${id}"
                                aria-label="Editar ${description}" title="Editar">✎</button>
                            <button class="row-action delete" type="button"
                                data-action="delete" data-id="${id}"
                                aria-label="Excluir ${description}" title="Excluir">×</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        mobileTransactions.innerHTML = transactions.map((transaction) => {
            const id = Number(transaction.id);
            const type = transaction.type === "income" ? "income" : "expense";
            const typeLabel = type === "income" ? "Receita" : "Despesa";
            const sign = type === "income" ? "+" : "−";
            const description = escapeHTML(transaction.description || "Sem descrição");
            const categoryName = escapeHTML(getCategoryName(transaction));
            const notes = transaction.notes
                ? `<p class="transaction-notes">${escapeHTML(transaction.notes)}</p>`
                : "";

            return `
                <article class="mobile-transaction">
                    <div class="mobile-transaction-top">
                        <div>
                            <span class="transaction-description">${description}</span>
                            ${notes}
                        </div>
                        <span class="type-badge ${type}">${typeLabel}</span>
                    </div>
                    <div class="mobile-transaction-meta">
                        <span>${categoryName}</span>
                        <span>·</span>
                        <span>${formatDate(transaction.transaction_date)}</span>
                    </div>
                    <div class="mobile-transaction-bottom">
                        <strong class="amount ${type}">${sign} ${formatCurrency(transaction.amount)}</strong>
                        <div class="row-actions">
                            <button class="row-action" type="button"
                                data-action="edit" data-id="${id}"
                                aria-label="Editar ${description}" title="Editar">✎</button>
                            <button class="row-action delete" type="button"
                                data-action="delete" data-id="${id}"
                                aria-label="Excluir ${description}" title="Excluir">×</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    async function loadCategories() {
        const response = await request("/categories");
        categories = normalizeCategoryList(response);
        renderCategoryOptions();
    }

    function buildFilters() {
        const params = new URLSearchParams();

        const type = filterType.value;
        const categoryId = filterCategory.value;
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (type) params.set("type", type);
        if (categoryId) params.set("category_id", categoryId);
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);

        // O backend aceita no máximo 100 registros por consulta.
        params.set("limit", "100");

        return params.toString();
    }

    async function loadTransactions() {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (startDate && endDate && startDate > endDate) {
            showMessage("A data inicial não pode ser posterior à data final.", "error");
            return;
        }

        tableBody.innerHTML = `
            <tr><td colspan="6" class="table-message">Carregando transações...</td></tr>
        `;
        mobileTransactions.innerHTML = "";

        try {
            const query = buildFilters();
            const response = await request(`/transactions?${query}`);
            transactions = normalizeTransactionList(response);
            renderTransactions();
        } catch (error) {
            renderEmptyTable("Não foi possível carregar as transações.");
            showMessage(getErrorMessage(error), "error");
        }
    }

    function resetForm() {
        form.reset();
        editingId = null;
        formTitle.textContent = "Adicionar transação";
        saveButton.textContent = "Salvar transação";
        setDefaultDate();
        renderCategoryOptions();
    }

    function openNewTransactionForm() {
        resetForm();
        setFormOpen(true);
        hideMessage();

        document.getElementById("description").focus();
    }

    async function editTransaction(id) {
        const transaction = transactions.find(
            (item) => Number(item.id) === Number(id)
        );

        if (!transaction) {
            showMessage("Não foi possível localizar essa transação na lista.", "error");
            return;
        }

        resetForm();
        editingId = Number(id);

        const typeInput = form.querySelector(
            `input[name="type"][value="${transaction.type}"]`
        );

        if (typeInput) typeInput.checked = true;

        renderCategoryOptions();

        document.getElementById("description").value = transaction.description || "";
        document.getElementById("amount").value = Number(transaction.amount);
        document.getElementById("transactionDate").value =
            String(transaction.transaction_date || "").slice(0, 10);
        categorySelect.value = String(transaction.category_id || "");
        document.getElementById("notes").value = transaction.notes || "";

        formTitle.textContent = "Editar transação";
        saveButton.textContent = "Salvar alterações";
        setFormOpen(true);
        hideMessage();
    }

    async function saveTransaction(event) {
        event.preventDefault();
        hideMessage();

        if (!form.reportValidity()) return;

        const type = getSelectedType();
        const amount = Number(document.getElementById("amount").value);
        const description = document.getElementById("description").value.trim();
        const transactionDate = document.getElementById("transactionDate").value;
        const categoryId = Number(categorySelect.value);
        const notes = document.getElementById("notes").value.trim();

        if (!description) {
            showMessage("Informe a descrição da transação.", "error");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage("Informe um valor maior que zero.", "error");
            return;
        }

        if (!Number.isInteger(categoryId) || categoryId < 1) {
            showMessage("Selecione uma categoria válida.", "error");
            return;
        }

        if (!transactionDate) {
            showMessage("Informe a data da transação.", "error");
            return;
        }

        const selectedCategory = categories.find(
            (category) => Number(category.id) === categoryId
        );

        if (!selectedCategory || selectedCategory.type !== type) {
            showMessage("Selecione uma categoria compatível com o tipo escolhido.", "error");
            return;
        }

        const body = {
            type,
            description,
            amount,
            category_id: categoryId,
            transaction_date: transactionDate,
            notes
        };

        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = "Salvando...";

        try {
            if (editingId !== null) {
                await request(`/transactions/${editingId}`, {
                    method: "PUT",
                    body
                });

                showMessage("Transação atualizada com sucesso!", "success");
            } else {
                await request("/transactions", {
                    method: "POST",
                    body
                });

                showMessage("Transação cadastrada com sucesso!", "success");
            }

            resetForm();
            setFormOpen(false);
            await loadTransactions();
        } catch (error) {
            showMessage(getErrorMessage(error), "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }

    function openDeleteDialog(id) {
        deletingId = Number(id);

        if (typeof deleteDialog.showModal === "function") {
            deleteDialog.showModal();
        } else {
            // Compatibilidade com navegadores sem suporte a dialog.
            if (window.confirm("Deseja realmente excluir esta transação?")) {
                deleteTransaction();
            }
        }
    }

    async function deleteTransaction() {
        if (!deletingId) return;

        const id = deletingId;
        const confirmButton = document.getElementById("confirmDeleteButton");

        confirmButton.disabled = true;
        confirmButton.textContent = "Excluindo...";

        try {
            await request(`/transactions/${id}`, {
                method: "DELETE"
            });

            if (deleteDialog.open) deleteDialog.close();

            deletingId = null;
            showMessage("Transação excluída com sucesso.", "success");
            await loadTransactions();
        } catch (error) {
            if (deleteDialog.open) deleteDialog.close();
            showMessage(getErrorMessage(error), "error");
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = "Excluir";
        }
    }

    function setupNavigation() {
        const sidebar = document.getElementById("sidebar");
        const menuToggle = document.getElementById("menuToggle");
        const overlay = document.getElementById("sidebarOverlay");

        function closeSidebar() {
            sidebar.classList.remove("open");
            overlay.classList.remove("visible");
            menuToggle.setAttribute("aria-expanded", "false");
        }

        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");
            overlay.classList.toggle("visible", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        overlay.addEventListener("click", closeSidebar);

        document.querySelectorAll(".navigation .nav-link").forEach((link) => {
            link.addEventListener("click", closeSidebar);
        });

        document.getElementById("logoutButton").addEventListener("click", () => {
            API.clearToken();
            window.location.href = "./login.html";
        });
    }

    function setupEvents() {
        document.getElementById("newTransactionButton")
            .addEventListener("click", openNewTransactionForm);

        document.getElementById("closeFormButton").addEventListener("click", () => {
            setFormOpen(false);
            resetForm();
        });

        document.getElementById("cancelFormButton").addEventListener("click", () => {
            setFormOpen(false);
            resetForm();
        });

        form.addEventListener("submit", saveTransaction);

        form.querySelectorAll('input[name="type"]').forEach((input) => {
            input.addEventListener("change", renderCategoryOptions);
        });

        filtersForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loadTransactions();
        });

        document.getElementById("clearFiltersButton").addEventListener("click", () => {
            filtersForm.reset();
            hideMessage();
            loadTransactions();
        });

        function handleRowAction(event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const id = Number(button.dataset.id);
            if (!Number.isInteger(id) || id < 1) return;

            if (button.dataset.action === "edit") {
                editTransaction(id);
            }

            if (button.dataset.action === "delete") {
                openDeleteDialog(id);
            }
        }

        tableBody.addEventListener("click", handleRowAction);
        mobileTransactions.addEventListener("click", handleRowAction);

        document.getElementById("cancelDeleteButton").addEventListener("click", () => {
            deleteDialog.close();
            deletingId = null;
        });

        document.getElementById("confirmDeleteButton")
            .addEventListener("click", deleteTransaction);

        deleteDialog.addEventListener("click", (event) => {
            if (event.target === deleteDialog) {
                deleteDialog.close();
                deletingId = null;
            }
        });

        setupNavigation();
    }

    async function initialize() {
        if (!API.getToken()) {
            window.location.href = "./login.html";
            return;
        }

        setupEvents();
        setDefaultDate();
        setFormOpen(false);

        try {
            await loadCategories();
            await loadTransactions();
        } catch (error) {
            showMessage(
                `Não foi possível carregar os dados da página. ${getErrorMessage(error)}`,
                "error"
            );
        }
    }

    initialize();
});
