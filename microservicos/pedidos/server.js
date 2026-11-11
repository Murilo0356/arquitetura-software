require("dotenv").config();

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const connectDB = require("./db");



const app = express();



const PRODUTOS_URL =
    process.env.PRODUTOS_URL || "http://localhost:3001";

const CLIENTES_URL =
    process.env.CLIENTES_URL || "http://localhost:3003";

app.use(express.json());


const pedidoSchema = new mongoose.Schema({
    produto_id: Number,
    nome_produto: String,
    preco_unitario: Number,
    quantidade: Number,
    total: Number
});
const Pedido = mongoose.model(
    "Pedido",
    pedidoSchema
);
app.get("/pedidos", async (req, res) => {
    try {
        const resultado = await Pedido.find().sort({ _id: 1 });
        res.json(resultado);

        res.json(resultado);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar pedidos"
        });
    }
});

app.post("/pedidos", async (req, res) => {
    const { produtoId, clienteId, quantidade } = req.body;

    if (!produtoId || !clienteId || !quantidade || quantidade <= 0) {
        return res.status(400).json({
            erro: "produtoId, clienteId e quantidade válida são obrigatórios"
        });
    }

    try {
        await axios.get(
            `${CLIENTES_URL}/clientes/${clienteId}`,
            {
                timeout: 3000
            }
        );

        const resposta = await axios.get(
            `${PRODUTOS_URL}/produtos/${produtoId}`,
            {
                timeout: 3000
            }
        );

        const produto = resposta.data;
        const total = produto.preco * quantidade;

        const resultado = await db.query(
            `INSERT INTO pedidos (
                produto_id,
                cliente_id,
                nome_produto,
                preco_unitario,
                quantidade,
                total
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                produto.id,
                clienteId,
                produto.nome,
                produto.preco,
                quantidade,
                total
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {
        if (
            erro.response?.status === 404 &&
            erro.config?.url?.includes("/clientes/")
        ) {
            return res.status(404).json({
                erro: "Cliente não encontrado"
            });
        }

        if (
            erro.response?.status === 404 &&
            erro.config?.url?.includes("/produtos/")
        ) {
            return res.status(400).json({
                erro: "Produto não encontrado"
            });
        }

        if (
            erro.config?.url?.includes("/clientes/") &&
            (
                erro.code === "ECONNREFUSED" ||
                erro.code === "ECONNABORTED" ||
                erro.code === "ETIMEDOUT"
            )
        ) {
            return res.status(503).json({
                erro: "Serviço de Clientes indisponível"
            });
        }

        if (
            erro.config?.url?.includes("/produtos/") &&
            (
                erro.code === "ECONNREFUSED" ||
                erro.code === "ECONNABORTED" ||
                erro.code === "ETIMEDOUT"
            )
        ) {
            return res.status(503).json({
                erro: "Serviço de Produtos indisponível"
            });
        }

        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao criar pedido"
        });
    }
});

app.get("/pedidos/:id", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM pedidos WHERE id = $1",
            [req.params.id]
        );

        const pedido = resultado.rows[0];

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado"
            });
        }

        res.json(pedido);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar pedido"
        });
    }
});

async function criarTabela() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id SERIAL PRIMARY KEY,
            produto_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            nome_produto VARCHAR(100) NOT NULL,
            preco_unitario NUMERIC(10, 2) NOT NULL,
            quantidade INTEGER NOT NULL,
            total NUMERIC(10, 2) NOT NULL
        )
    `);

    console.log("Tabela de pedidos pronta");
}

async function iniciar() {
    try {
        await criarTabela();

        app.listen(3002, () => {
            console.log("Pedidos rodando na porta 3002");
        });

    } catch (erro) {
        console.error("Erro ao iniciar o servidor:", erro);
    }
}

iniciar();