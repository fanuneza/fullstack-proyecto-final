const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function createApp(db, secret) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const error = (res, status, codigo, mensaje) => res.status(status).json({ error: { codigo, mensaje } })
  const invalid = res => error(res, 400, 'DATOS_INVALIDOS', 'Revisa los campos enviados.')
  const unauthorized = res => error(res, 401, 'NO_AUTORIZADO', 'Credenciales o token inválidos.')
  const text = (value, max = Infinity) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
  const email = value => text(value, 255) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  const https = value => {
    try { return typeof value === 'string' && new URL(value).protocol === 'https:' } catch { return false }
  }
  const summary = 'id, nombre, modalidad, precio_clp, ubicacion, imagen_url'
  const detail = `SELECT p.id, p.nombre, p.descripcion, p.modalidad, p.precio_clp,
    p.condiciones_intercambio, p.ubicacion, p.imagen_url, p.contacto_url,
    json_build_object('id', u.id, 'nombre', u.nombre) AS propietario
    FROM publicaciones p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = $1`

  async function auth(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '')
    if (!match) return unauthorized(res)
    let payload
    try { payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] }) } catch { return unauthorized(res) }
    if (!Number.isInteger(payload.id) || payload.id < 1 || payload.id > 2147483647) return unauthorized(res)
    const result = await db.query('SELECT id, nombre, correo FROM usuarios WHERE id = $1', [payload.id])
    if (!result.rows[0]) return unauthorized(res)
    req.usuario = result.rows[0]
    next()
  }

  app.post('/api/usuarios', async (req, res) => {
    const { nombre, correo, password } = req.body || {}
    if (!text(nombre, 100) || !email(correo) || !text(password) || Buffer.byteLength(password) > 72) return invalid(res)
    const hash = await bcrypt.hash(password, 10)
    try {
      const result = await db.query('INSERT INTO usuarios (nombre, correo, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, correo', [nombre.trim(), correo.trim().toLowerCase(), hash])
      res.status(201).json(result.rows[0])
    } catch (err) {
      if (err.code === '23505') return error(res, 409, 'CORREO_DUPLICADO', 'Este correo ya está registrado.')
      throw err
    }
  })

  app.post('/api/sesion', async (req, res) => {
    const { correo, password } = req.body || {}
    if (!email(correo) || !text(password) || Buffer.byteLength(password) > 72) return invalid(res)
    const result = await db.query('SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = $1', [correo.trim().toLowerCase()])
    const found = result.rows[0]
    if (!found || !await bcrypt.compare(password, found.password_hash)) return unauthorized(res)
    const usuario = { id: found.id, nombre: found.nombre, correo: found.correo }
    res.json({ token: jwt.sign({ id: usuario.id }, secret, { expiresIn: '12h', algorithm: 'HS256' }), usuario })
  })

  app.get('/api/usuarios/me', auth, (req, res) => res.json(req.usuario))
  app.get('/api/usuarios/me/publicaciones', auth, async (req, res) => {
    const result = await db.query(`SELECT ${summary} FROM publicaciones WHERE usuario_id = $1 ORDER BY id DESC`, [req.usuario.id])
    res.json(result.rows)
  })
  app.get('/api/publicaciones', async (req, res) => {
    const result = await db.query(`SELECT ${summary} FROM publicaciones ORDER BY id DESC`)
    res.json(result.rows)
  })
  app.get('/api/publicaciones/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (!/^\d+$/.test(req.params.id) || !Number.isInteger(id) || id < 1 || id > 2147483647) return invalid(res)
    const result = await db.query(detail, [id])
    if (!result.rows[0]) return error(res, 404, 'NO_ENCONTRADO', 'Esta publicación no existe.')
    res.json(result.rows[0])
  })
  app.post('/api/publicaciones', auth, async (req, res) => {
    const p = req.body || {}
    const validPrice = Number.isInteger(p.precio_clp) && p.precio_clp >= 0 && p.precio_clp <= 2147483647
    const validMode = (p.modalidad === 'venta' && validPrice && p.condiciones_intercambio === null) ||
      (p.modalidad === 'intercambio' && p.precio_clp === null && text(p.condiciones_intercambio)) ||
      (p.modalidad === 'ambas' && validPrice && text(p.condiciones_intercambio))
    if (!text(p.nombre, 100) || !text(p.descripcion) || !text(p.ubicacion, 150) || !https(p.imagen_url) || !https(p.contacto_url) || !validMode) return invalid(res)
    const result = await db.query(`INSERT INTO publicaciones
      (usuario_id, nombre, descripcion, modalidad, precio_clp, condiciones_intercambio, ubicacion, imagen_url, contacto_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.usuario.id, p.nombre.trim(), p.descripcion.trim(), p.modalidad, p.precio_clp, p.condiciones_intercambio === null ? null : p.condiciones_intercambio.trim(), p.ubicacion.trim(), new URL(p.imagen_url).href, new URL(p.contacto_url).href])
    const created = await db.query(detail, [result.rows[0].id])
    res.status(201).json(created.rows[0])
  })
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return invalid(res)
    if (err.type === 'entity.too.large') return error(res, 413, 'CUERPO_DEMASIADO_GRANDE', 'La solicitud supera el límite de 100 KB.')
    if (err.status === 415) return error(res, 415, 'FORMATO_NO_ADMITIDO', 'Usa JSON con codificación UTF-8.')
    console.error(err)
    error(res, 500, 'ERROR_INTERNO', 'No se pudo completar la solicitud.')
  })
  return app
}
module.exports = createApp
