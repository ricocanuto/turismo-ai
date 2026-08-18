const express = require('express')
const router = express.Router()
const pool = require('../database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

router.post('/register', async (req, res) => {
  const { empresa_id, nome, email, senha } = req.body

  try {
    const senhaHash = await bcrypt.hash(senha, 10)

    const result = await pool.query(
      `INSERT INTO "Users" (empresa_id, nome, email, senha)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email`,
      [empresa_id, nome, email, senhaHash]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body

  try {
    const result = await pool.query(
      `SELECT * FROM "Companies" WHERE email = $1`,
      [email]
    )

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Empresa não encontrada' })

    const empresa = result.rows[0]
    const senhaValida = await bcrypt.compare(senha, empresa.senha)

    if (!senhaValida)
      return res.status(401).json({ error: 'Senha inválida' })

    const token = jwt.sign(
      {
        empresaId: empresa.id
      },
      process.env.JWT_SECRET || 'segredo_super_forte',
      { expiresIn: '8h' }
    )

    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



module.exports = router