
require("dotenv").config();

const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
    console.log(`Finance Manager API disponível em http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
});

// Encerra o servidor de maneira controlada.
function shutdown(signal) {
    console.log(`\n${signal} recebido. Encerrando servidor...`);

    server.close((err) => {
        if (err) {
            console.error("Erro ao encerrar o servidor:", err);
            process.exitCode = 1;
            return;
        }

        console.log("Servidor encerrado com sucesso.");
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
