const express = require('express')
const pool = require('./database')

const router = express.Router()

router.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()')
        res.json({
            status: 'ok',
            server_time: result.rows[0]
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/clientes', async (req, res) => {
    try {
        const { empresa_id, nome, telefone, idioma, origem } = req.body

        const result = await pool.query(
            `INSERT INTO clientes (empresa_id, nome, telefone, idioma, origem)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [empresa_id, nome, telefone, idioma, origem]
        )

        res.status(201).json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/reservas', async (req, res) => {
  try {
    const {
      empresa_id,
      cliente_id,
      data_passeio,
      horario,
      valor,
      status,
      sinal_pago
    } = req.body

    const result = await pool.query(
      `INSERT INTO reservas
       (empresa_id, cliente_id, data_passeio, horario, valor, status, sinal_pago)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        empresa_id,
        cliente_id,
        data_passeio,
        horario,
        valor,
        status || 'pendente',
        sinal_pago || false
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/reservas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        c.nome,
        c.telefone,
        c.idioma,
        c.origem
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      ORDER BY r.created_at DESC
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router