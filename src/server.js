require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const clientesRoutes = require('./routes/clientes.routes')
const reservasRoutes = require('./routes/reservas.routes')
const relatoriosRoutes = require('./routes/faturamento.routes')

const app = express()

app.use(cors({
  origin: 'http://localhost:3000'
}))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/clientes', clientesRoutes)
app.use('/reservas', reservasRoutes)
app.use('/relatorios', relatoriosRoutes)

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001 🚀')
})