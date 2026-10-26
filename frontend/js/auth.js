
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const messageElement = document.getElementById("auth-message");

    function displayError(message) {
        Utils.showMessage(messageElement, message, "error");
    }

    function displaySuccess(message) {
        Utils.showMessage(messageElement, message, "success");
    }

    function clearMessage() {
        Utils.hideMessage(messageElement);
    }

    function setLoading(form, loading, loadingText, originalText) {
        const submitButton = form.querySelector('button[type="submit"]');

        if (!submitButton) {
            return;
        }

        submitButton.disabled = loading;
        submitButton.textContent = loading ? loadingText : originalText;
    }

    function getUtf8ByteLength(value) {
        return new TextEncoder().encode(value).length;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function saveSession(data) {
        const token = data?.data?.token;
        const user = data?.data?.user;

        if (typeof token !== "string" || !token.trim()) {
            throw new Error(
                "A autenticação foi processada, mas a API não retornou um token válido."
            );
        }

        API.setToken(token);

        if (user) {
            localStorage.setItem(
                window.APP_CONFIG.USER_KEY,
                JSON.stringify(user)
            );
        }
    }

    function redirectToDashboard() {
        window.location.assign("./dashboard.html");
    }

    // Exibe ou oculta as senhas.
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
        button.addEventListener("click", () => {
            const inputId = button.dataset.togglePassword;
            const input = document.getElementById(inputId);

            if (!input) {
                return;
            }

            const showingPassword = input.type === "password";

            input.type = showingPassword ? "text" : "password";
            button.textContent = showingPassword ? "Ocultar" : "Mostrar";
            button.setAttribute("aria-pressed", String(showingPassword));
            button.setAttribute(
                "aria-label",
                showingPassword ? "Ocultar senha" : "Mostrar senha"
            );

            input.focus();
        });
    });

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage();

            const formData = new FormData(loginForm);
            const email = String(formData.get("email") || "").trim();
            const password = String(formData.get("password") || "");

            if (!email || !password) {
                displayError("Preencha o e-mail e a senha.");
                return;
            }

            if (email.length > 254 || !isValidEmail(email)) {
                displayError("Informe um endereço de e-mail válido.");
                return;
            }

            if (getUtf8ByteLength(password) > 72) {
                displayError("A senha ultrapassa o limite permitido.");
                return;
            }

            setLoading(
                loginForm,
                true,
                "Entrando...",
                "Entrar na minha conta"
            );

            try {
                const response = await API.request("/auth/login", {
                    method: "POST",
                    auth: false,
                    body: {
                        email,
                        password,
                    },
                });

                saveSession(response);
                displaySuccess("Login realizado! Redirecionando...");
                redirectToDashboard();
            } catch (error) {
                displayError(Utils.getErrorMessage(error));
            } finally {
                setLoading(
                    loginForm,
                    false,
                    "Entrando...",
                    "Entrar na minha conta"
                );
            }
        });
    }

    // CADASTRO
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage();

            const formData = new FormData(registerForm);

            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("email") || "").trim();
            const password = String(formData.get("password") || "");
            const confirmPassword = String(
                formData.get("confirm-password") || ""
            );

            if (!name || !email || !password || !confirmPassword) {
                displayError("Preencha todos os campos para criar sua conta.");
                return;
            }

            if (name.length > 100) {
                displayError("O nome deve ter no máximo 100 caracteres.");
                return;
            }

            if (email.length > 254 || !isValidEmail(email)) {
                displayError("Informe um endereço de e-mail válido.");
                return;
            }

            if (password.length < 8) {
                displayError("A senha deve ter pelo menos 8 caracteres.");
                return;
            }

            if (getUtf8ByteLength(password) > 72) {
                displayError(
                    "A senha ultrapassa o limite de 72 bytes em UTF-8."
                );
                return;
            }

            if (password !== confirmPassword) {
                displayError("As senhas não coincidem.");
                return;
            }

            setLoading(
                registerForm,
                true,
                "Criando conta...",
                "Criar minha conta"
            );

            try {
                const response = await API.request("/auth/register", {
                    method: "POST",
                    auth: false,
                    body: {
                        name,
                        email,
                        password,
                    },
                });

                saveSession(response);
                displaySuccess("Conta criada! Redirecionando...");
                redirectToDashboard();
            } catch (error) {
                displayError(Utils.getErrorMessage(error));
            } finally {
                setLoading(
                    registerForm,
                    false,
                    "Criando conta...",
                    "Criar minha conta"
                );
            }
        });
    }
});
