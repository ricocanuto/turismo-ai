 const express = require('express')
 const pool = require('./database')
 const jwt = require('jsonwebtoken')
 const bcrypt = require('bcrypt')
 const auth = require('./middleware/auth')

 const router = express.Router()

 router.get('/health', async (_req, res) => {
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
             `INSERT INTO "Clientes" (empresa_id, nome, telefone, idioma, origem)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
             [empresa_id, nome, telefone, idioma, origem]
         )

         res.status(201).json(result.rows[0])
     } catch (err) {
         res.status(500).json({ error: err.message })
     }
 })

 router.post('/reservas', auth, async (req, res) => {
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
             `INSERT INTO "Reservas"
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

 router.get('/reservas', auth, async (_req, res) => {
     try {
         const result = await pool.query(`
       SELECT 
         r.*,
         c.nome,
         c.telefone,
         c.idioma,
         c.origem
       FROM "Reservas" r
       JOIN clientes c ON r.cliente_id = c.id
       ORDER BY r.created_at DESC
     `)

         res.json(result.rows)
     } catch (err) {
         res.status(500).json({ error: err.message })
     }
 })

 router.get('/relatorio/faturamento/:empresaId', async (req, res) => {
     const { empresaId } = req.params
     const { data_inicio, data_fim } = req.query

     try {
         let query = `
       SELECT
         COUNT(*) as total_reservas,
         COALESCE(SUM(valor), 0) as faturamento_total,
         COALESCE(SUM(CASE WHEN sinal_pago = false THEN valor ELSE 0 END), 0) as valor_pendente
       FROM "Reservas"
       WHERE empresa_id = $1
       AND status != 'cancelado'
     `

         const values = [empresaId]

         if (data_inicio && data_fim) {
             query += ` AND data_passeio BETWEEN $2 AND $3`
             values.push(data_inicio, data_fim)
         }

         const resultado = await pool.query(query, values)

         res.json(resultado.rows[0]);
     } catch (err) {
         res.status(500).json({ error: err.message });
     }
 })

 router.patch('/reservas/:id/cancelar', async (req, res) => {
   const { id } = req.params
   const empresa_id = req.user.empresaId

   try {
     const result = await pool.query(
       `UPDATE reservas
        SET status = 'cancelado'
        WHERE id = $1
        AND empresa_id = $2
        RETURNING *`,
       [id, empresa_id]
     )

     if (result.rows.length === 0) {
       return res.status(404).json({ error: 'Reserva não encontrada' })
     }

     res.json(result.rows[0])
   } catch (err) {
     res.status(500).json({ error: err.message })
   }
 })

 router.post('/auth/register', async (req, res) => {
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

 router.post('/auth/login', async (req, res) => {
   const { email, senha } = req.body

   try {
     const result = await pool.query(
       `SELECT * FROM "Users" WHERE email = $1`,
       [email]
     )

     if (result.rows.length === 0) {
       return res.status(401).json({ error: 'Usuário não encontrado' })
     }

     const usuario = result.rows[0]
     const senhaValida = await bcrypt.compare(senha, usuario.senha)

     if (!senhaValida) {
       return res.status(401).json({ error: 'Senha inválida' })
     }

     const token = jwt.sign(
       { 
         userId: usuario.id,
         empresaId: usuario.empresa_id
       },
       'segredo_super_forte',
       { expiresIn: '8h' }
     )
     res.json({ token })
   } catch (err) {
     res.status(500).json({ error: err.message })
   }
 })

     module.exports = router 