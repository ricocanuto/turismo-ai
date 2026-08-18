const express = require('express')
const router = express.Router()
const pool = require('../database')
const auth = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  const { nome, telefone, origem } = req.body
  const empresa_id = req.user.empresaId

  const result = await pool.query(
    `INSERT INTO "Clientes" (empresa_id, nome, telefone, origem)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [empresa_id, nome, telefone, origem]
  )

  res.status(201).json(result.rows[0])
})

router.get('/', auth, async (req, res) => {
  const empresa_id = req.user.empresaId

  const result = await pool.query(
    `SELECT * FROM "Clientes" WHERE empresa_id = $1`,
    [empresa_id]
  )

  res.json(result.rows)
})

// ✅ Cancelar reserva
router.patch('/:id/cancelar', auth, async (req, res) => {
  const { id } = req.params
  const empresa_id = req.user.empresaId

  try {
    const result = await pool.query(
      `UPDATE reservas
       SET status = 'cancelada'
       WHERE id = $1 AND empresa_id = $2
       RETURNING *`,
      [id, empresa_id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' })
    }

    res.json({ message: 'Reserva cancelada com sucesso' })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router