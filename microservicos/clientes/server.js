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

app.post("/clientes", async (req, res) => {
    try {
        const { nome, sobrenome, telefone, email } = req.body;

        if (!nome || !sobrenome || !email) {
            return res.status(400).json({
                erro: "nome, sobrenome e email são obrigatórios"
            });
        }

        const resultado = await pool.query(
            `
            INSERT INTO clientes (nome, sobrenome, telefone, email)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [nome, sobrenome, telefone || null, email]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        if (erro.code === "23505") {
            return res.status(409).json({
                erro: "Email já cadastrado"
            });
        }

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar cliente"
        });
    }
});

app.get("/clientes", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM clientes ORDER BY id"
        );

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar clientes"
        });
    }
});

app.get("/clientes/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            "SELECT * FROM clientes WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado"
            });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar cliente"
        });
    }
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