const express = require('express')
const router = express.Router()
const pool = require('../database')
const auth = require('../middleware/auth')

/* 🔹 ROTA DE FATURAMENTO */
router.get('/faturamento', auth, async (req, res) => {
  const empresa_id = req.user.empresaId

  const result = await pool.query(
    `SELECT SUM(valor) AS total
     FROM reservas
     WHERE empresa_id = $1 AND status = 'confirmado'`,
    [empresa_id]
  )

  res.json(result.rows[0])
})

/* 🔹 ROTA DE CANCELAMENTO */
router.patch('/:id/cancelar', auth, async (req, res) => {
  const { id } = req.params
  const empresa_id = req.user.empresaId

  const result = await pool.query(
    `UPDATE reservas
     SET status = 'cancelado'
     WHERE id = $1 AND empresa_id = $2
     RETURNING *`,
    [id, empresa_id]
  )

  if (result.rows.length === 0)
    return res.status(404).json({ error: 'Reserva não encontrada' })

  res.json(result.rows[0])
})

module.exports = router