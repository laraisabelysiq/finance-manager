
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const categoryForm = document.getElementById("categoryForm");
    const formPanel = document.getElementById("categoryFormPanel");
    const formTitle = document.getElementById("formTitle");
    const nameInput = document.getElementById("categoryName");
    const typeInput = document.getElementById("categoryType");
    const saveButton = document.getElementById("saveCategoryButton");
    const searchInput = document.getElementById("searchCategory");
    const pageMessage = document.getElementById("pageMessage");
    const incomeList = document.getElementById("incomeCategoryList");
    const expenseList = document.getElementById("expenseCategoryList");
    const deleteDialog = document.getElementById("deleteDialog");
    const deleteDialogMessage = document.getElementById("deleteDialogMessage");
    const confirmDeleteButton = document.getElementById("confirmDeleteButton");

    let categories = [];
    let editingId = null;
    let deletingId = null;
    let messageTimeout = null;

    function unwrap(response) {
        let value = response;

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

    function setFormOpen(isOpen) {
        formPanel.hidden = !isOpen;

        if (isOpen) {
            formPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function resetForm() {
        categoryForm.reset();
        editingId = null;
        formTitle.textContent = "Criar categoria";
        saveButton.textContent = "Salvar categoria";
        saveButton.disabled = false;
        typeInput.value = "expense";
    }

    function updateSummary() {
        const incomeCount = categories.filter(
            (category) => category.type === "income"
        ).length;

        const expenseCount = categories.filter(
            (category) => category.type === "expense"
        ).length;

        document.getElementById("totalCategories").textContent = categories.length;
        document.getElementById("incomeCategoriesCount").textContent = incomeCount;
        document.getElementById("expenseCategoriesCount").textContent = expenseCount;
        document.getElementById("incomeGroupCount").textContent = incomeCount;
        document.getElementById("expenseGroupCount").textContent = expenseCount;
    }

    function createCategoryCard(category) {
        const id = Number(category.id);
        const isIncome = category.type === "income";
        const type = isIncome ? "income" : "expense";
        const typeLabel = isIncome ? "Receita" : "Despesa";
        const symbol = isIncome ? "↙" : "↗";

        return `
            <article class="category-card">
                <div class="category-card-icon ${type}" aria-hidden="true">${symbol}</div>
                <div class="category-card-info">
                    <strong>${escapeHTML(category.name)}</strong>
                    <small>${typeLabel}</small>
                </div>
                <div class="category-actions">
                    <button class="category-action" type="button"
                        data-action="edit" data-id="${id}"
                        aria-label="Editar categoria ${escapeHTML(category.name)}"
                        title="Editar categoria">✎</button>
                    <button class="category-action delete" type="button"
                        data-action="delete" data-id="${id}"
                        aria-label="Excluir categoria ${escapeHTML(category.name)}"
                        title="Excluir categoria">×</button>
                </div>
            </article>
        `;
    }

    function renderCategories() {
        const search = searchInput.value.trim().toLocaleLowerCase("pt-BR");

        const filtered = categories.filter((category) =>
            String(category.name || "").toLocaleLowerCase("pt-BR").includes(search)
        );

        const incomeCategories = filtered.filter(
            (category) => category.type === "income"
        );

        const expenseCategories = filtered.filter(
            (category) => category.type === "expense"
        );

        incomeList.innerHTML = incomeCategories.length
            ? incomeCategories.map(createCategoryCard).join("")
            : `<p class="empty-state">${
                search
                    ? "Nenhuma categoria de receita corresponde à busca."
                    : "Você ainda não cadastrou categorias de receita."
            }</p>`;

        expenseList.innerHTML = expenseCategories.length
            ? expenseCategories.map(createCategoryCard).join("")
            : `<p class="empty-state">${
                search
                    ? "Nenhuma categoria de despesa corresponde à busca."
                    : "Você ainda não cadastrou categorias de despesa."
            }</p>`;

        // Os contadores mostram as categorias cadastradas, não apenas as filtradas.
        updateSummary();
    }

    async function loadCategories() {
        const response = await request("/categories");
        const payload = unwrap(response);

        if (Array.isArray(payload)) {
            categories = payload;
        } else if (Array.isArray(payload?.categories)) {
            categories = payload.categories;
        } else {
            categories = [];
        }

        renderCategories();
    }

    function openNewCategoryForm() {
        resetForm();
        hideMessage();
        setFormOpen(true);
        nameInput.focus();
    }

    function openEditCategoryForm(id) {
        const category = categories.find(
            (item) => Number(item.id) === Number(id)
        );

        if (!category) {
            showMessage("Não foi possível localizar essa categoria.", "error");
            return;
        }

        resetForm();
        editingId = Number(category.id);
        nameInput.value = category.name || "";
        typeInput.value = category.type;
        formTitle.textContent = "Editar categoria";
        saveButton.textContent = "Salvar alterações";

        hideMessage();
        setFormOpen(true);
        nameInput.focus();
    }

    async function saveCategory(event) {
        event.preventDefault();
        hideMessage();

        if (!categoryForm.reportValidity()) return;

        const name = nameInput.value.trim();
        const type = typeInput.value;

        if (!name) {
            showMessage("Informe o nome da categoria.", "error");
            nameInput.focus();
            return;
        }

        if (name.length > 60) {
            showMessage("O nome da categoria deve ter no máximo 60 caracteres.", "error");
            nameInput.focus();
            return;
        }

        if (!["income", "expense"].includes(type)) {
            showMessage("Selecione um tipo de categoria válido.", "error");
            return;
        }

        const duplicate = categories.some((category) => {
            const sameId = editingId !== null &&
                Number(category.id) === editingId;

            return !sameId &&
                category.type === type &&
                String(category.name).trim().toLocaleLowerCase("pt-BR") ===
                    name.toLocaleLowerCase("pt-BR");
        });

        if (duplicate) {
            showMessage(
                "Você já possui uma categoria com esse nome e esse tipo.",
                "error"
            );
            return;
        }

        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = "Salvando...";

        try {
            const body = { name, type };

            if (editingId !== null) {
                await request(`/categories/${editingId}`, {
                    method: "PUT",
                    body
                });

                showMessage("Categoria atualizada com sucesso!", "success");
            } else {
                await request("/categories", {
                    method: "POST",
                    body
                });

                showMessage("Categoria criada com sucesso!", "success");
            }

            resetForm();
            setFormOpen(false);
            await loadCategories();
        } catch (error) {
            showMessage(getErrorMessage(error), "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }

    function openDeleteDialog(id) {
        const category = categories.find(
            (item) => Number(item.id) === Number(id)
        );

        if (!category) {
            showMessage("Não foi possível localizar essa categoria.", "error");
            return;
        }

        deletingId = Number(category.id);
        deleteDialogMessage.textContent =
            `Deseja realmente excluir a categoria "${category.name}"? ` +
            "Se ela estiver vinculada a transações, o sistema poderá impedir a exclusão.";

        if (typeof deleteDialog.showModal === "function") {
            deleteDialog.showModal();
        } else {
            if (window.confirm(deleteDialogMessage.textContent)) {
                deleteCategory();
            }
        }
    }

    async function deleteCategory() {
        if (deletingId === null) return;

        const id = deletingId;
        const originalText = confirmDeleteButton.textContent;

        confirmDeleteButton.disabled = true;
        confirmDeleteButton.textContent = "Excluindo...";

        try {
            await request(`/categories/${id}`, {
                method: "DELETE"
            });

            if (deleteDialog.open) deleteDialog.close();

            deletingId = null;
            showMessage("Categoria excluída com sucesso.", "success");
            await loadCategories();
        } catch (error) {
            if (deleteDialog.open) deleteDialog.close();

            deletingId = null;
            showMessage(
                `${getErrorMessage(error)} Se a categoria estiver em uso, mantenha-a ou altere as transações vinculadas antes de tentar excluí-la novamente.`,
                "error"
            );
        } finally {
            confirmDeleteButton.disabled = false;
            confirmDeleteButton.textContent = originalText;
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
        document.getElementById("newCategoryButton").addEventListener(
            "click",
            openNewCategoryForm
        );

        document.getElementById("closeFormButton").addEventListener("click", () => {
            resetForm();
            setFormOpen(false);
        });

        document.getElementById("cancelFormButton").addEventListener("click", () => {
            resetForm();
            setFormOpen(false);
        });

        categoryForm.addEventListener("submit", saveCategory);
        searchInput.addEventListener("input", renderCategories);

        function handleCategoryAction(event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const id = Number(button.dataset.id);

            if (!Number.isInteger(id) || id < 1) return;

            if (button.dataset.action === "edit") {
                openEditCategoryForm(id);
            }

            if (button.dataset.action === "delete") {
                openDeleteDialog(id);
            }
        }

        incomeList.addEventListener("click", handleCategoryAction);
        expenseList.addEventListener("click", handleCategoryAction);

        document.getElementById("cancelDeleteButton").addEventListener("click", () => {
            deleteDialog.close();
            deletingId = null;
        });

        confirmDeleteButton.addEventListener("click", deleteCategory);

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
        setFormOpen(false);

        try {
            await loadCategories();
        } catch (error) {
            incomeList.innerHTML =
                '<p class="empty-state">Não foi possível carregar as categorias.</p>';

            expenseList.innerHTML =
                '<p class="empty-state">Não foi possível carregar as categorias.</p>';

            showMessage(
                `Erro ao carregar categorias: ${getErrorMessage(error)}`,
                "error"
            );
        }
    }

    initialize();
});
