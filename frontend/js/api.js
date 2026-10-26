
"use strict";

const API = (() => {
    const BASE_URL = window.APP_CONFIG.API_BASE_URL;
    const TOKEN_KEY = window.APP_CONFIG.TOKEN_KEY;

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        if (typeof token !== "string" || !token.trim()) {
            throw new Error("Token de autenticação inválido.");
        }

        localStorage.setItem(TOKEN_KEY, token);
    }

    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    }

    async function request(endpoint, options = {}) {
        const {
            method = "GET",
            body,
            headers = {},
            auth = true,
        } = options;

        const requestHeaders = {
            Accept: "application/json",
            ...headers,
        };

        let requestBody;

        if (body !== undefined) {
            if (body instanceof FormData) {
                requestBody = body;
            } else {
                requestHeaders["Content-Type"] = "application/json";
                requestBody = JSON.stringify(body);
            }
        }

        const token = getToken();

        if (auth && token) {
            requestHeaders.Authorization = `Bearer ${token}`;
        }

        let response;

        try {
            response = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers: requestHeaders,
                body: requestBody,
            });
        } catch {
            throw new Error(
                "Não foi possível conectar ao servidor. Verifique se a API está funcionando."
            );
        }

        let data = null;

        if (response.status !== 204) {
            try {
                data = await response.json();
            } catch {
                data = null;
            }
        }

        if (!response.ok) {
            const error = new Error(
                data?.message ||
                `A solicitação falhou. Código HTTP: ${response.status}.`
            );

            error.status = response.status;
            error.data = data;
            error.errors = data?.errors || [];

            throw error;
        }

        return data;
    }

    return Object.freeze({
        request,
        getToken,
        setToken,
        clearToken,
    });
})();

window.API = API;
