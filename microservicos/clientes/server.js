const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3003;

app.use(express.json());

async function criarTabela() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            sobrenome VARCHAR(100) NOT NULL,
            telefone VARCHAR(20),
            email VARCHAR(150) NOT NULL UNIQUE
        );
    `);

    console.log("Tabela clientes verificada/criada.");
}

app.get("/", (req, res) => {
    res.json({
        mensagem: "Microserviço de Clientes funcionando!"
    });
});

async function iniciar() {
    try {
        await criarTabela();

        app.listen(PORT, () => {
            console.log(`Clientes rodando na porta ${PORT}`);
        });
    } catch (erro) {
        console.error("Erro ao iniciar o servidor:", erro);
    }
}

iniciar();