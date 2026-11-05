const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const createApp = require('../src/app')

if (!process.env.TEST_DATABASE_URL) throw new Error('Configura TEST_DATABASE_URL para ejecutar las pruebas de integración.')

const schema = `test_${process.pid}_${Date.now()}`
const db = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` })
const secret = 'secreto-exclusivo-para-pruebas'
const app = createApp(db, secret)
const user = { nombre: 'Ana', correo: 'ana@example.com', password: 'plantas123' }
const plant = { nombre: 'Monstera', descripcion: 'Planta joven', modalidad: 'ambas', precio_clp: 5000, condiciones_intercambio: 'Por suculentas', ubicacion: 'Santiago', imagen_url: 'https://example.com/planta.jpg', contacto_url: 'https://example.com/contacto' }
let token
let id

beforeAll(async () => {
  await db.query(`CREATE SCHEMA ${schema}`)
  await db.query(fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8'))
})
afterAll(async () => {
  await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
  await db.end()
})

test('registro valida datos, no expone hash y rechaza correo duplicado', async () => {
  await request(app).post('/api/usuarios').send({ ...user, correo: 'incorrecto' }).expect(400)
  const result = await request(app).post('/api/usuarios').send(user).expect(201)
  expect(result.body).toEqual({ id: expect.any(Number), nombre: 'Ana', correo: user.correo })
  await request(app).post('/api/usuarios').send({ ...user, correo: 'ANA@example.com' }).expect(409)
  const saved = await db.query('SELECT password_hash FROM usuarios WHERE id = $1', [result.body.id])
  expect(saved.rows[0].password_hash).not.toBe(user.password)
})

test('inicio de sesión devuelve JWT y rechaza credenciales incorrectas', async () => {
  await request(app).post('/api/sesion').send({ ...user, password: 'incorrecta' }).expect(401)
  const result = await request(app).post('/api/sesion').send(user).expect(200)
  expect(result.body.usuario.correo).toBe(user.correo)
  token = result.body.token
})

test('perfil exige token válido y usuario existente', async () => {
  await request(app).get('/api/usuarios/me').expect(401)
  await request(app).get('/api/usuarios/me').set('Authorization', 'Bearer falso').expect(401)
  await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${jwt.sign({ id: 999 }, secret)}`).expect(401)
  await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${jwt.sign({ id: 1 }, secret, { expiresIn: -1 })}`).expect(401)
  const result = await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${token}`).expect(200)
  expect(result.body.correo).toBe(user.correo)
})

test('galería vacía y creación protegida y validada', async () => {
  expect((await request(app).get('/api/publicaciones').expect(200)).body).toEqual([])
  await request(app).post('/api/publicaciones').send(plant).expect(401)
  await request(app).post('/api/publicaciones').set('Authorization', `Bearer ${token}`).send({ ...plant, imagen_url: 'http://example.com' }).expect(400)
  await request(app).post('/api/publicaciones').set('Authorization', `Bearer ${token}`).send({ ...plant, precio_clp: null }).expect(400)
  const result = await request(app).post('/api/publicaciones').set('Authorization', `Bearer ${token}`).send({ ...plant, usuario_id: 999 }).expect(201)
  expect(result.body).toMatchObject({ ...plant, propietario: { id: 1, nombre: 'Ana' } })
  id = result.body.id
})

test('detalle, galería y mis publicaciones recuperan datos persistidos', async () => {
  await request(app).get('/api/publicaciones/invalido').expect(400)
  await request(app).get('/api/publicaciones/999').expect(404)
  expect((await request(app).get(`/api/publicaciones/${id}`).expect(200)).body).toMatchObject(plant)
  expect((await request(app).get('/api/publicaciones').expect(200)).body).toHaveLength(1)
  await request(app).get('/api/usuarios/me/publicaciones').expect(401)
  expect((await request(app).get('/api/usuarios/me/publicaciones').set('Authorization', `Bearer ${token}`).expect(200)).body).toHaveLength(1)
})

test('modalidades y CORS', async () => {
  for (const changes of [
    { modalidad: 'venta', condiciones_intercambio: null },
    { modalidad: 'intercambio', precio_clp: null },
  ]) await request(app).post('/api/publicaciones').set('Authorization', `Bearer ${token}`).send({ ...plant, ...changes }).expect(201)
  const response = await request(app).options('/api/publicaciones').set('Origin', 'http://localhost:4180').set('Access-Control-Request-Method', 'POST').expect(204)
  expect(response.headers['access-control-allow-origin']).toBe('*')
})
