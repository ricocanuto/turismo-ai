const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, 'segredo_super_forte')

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

const bcrypt = require('bcrypt')

async function gerar() {
  const hash = await bcrypt.hash('123456', 10)
  console.log(hash)
}

gerar()

module.exports = authMiddleware