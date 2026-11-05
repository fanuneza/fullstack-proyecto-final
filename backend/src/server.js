const createApp = require('./app')
const db = require('./db')

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('DATABASE_URL y JWT_SECRET son obligatorias.')
  process.exit(1)
}

const port = process.env.PORT || 3000
createApp(db, process.env.JWT_SECRET).listen(port, () => console.log(`API escuchando en el puerto ${port}`))
