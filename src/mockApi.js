// Datos solo en memoria: al recargar se reinicia la demostración.
const usuarioDemo = { id: 1, nombre: 'Ana', correo: 'ana@example.com' }
const usuarios = [{ ...usuarioDemo, password: 'plantas123' }]
const sesiones = new Map()
const publicaciones = [
  { id: 1, nombre: 'Ficus', descripcion: 'Ficus elastica variegada, planta joven en maceta de greda. Prefiere luz indirecta.', modalidad: 'ambas', precio_clp: 5000, condiciones_intercambio: 'Por una suculenta.', ubicacion: 'Santiago', imagen_url: 'https://images.unsplash.com/photo-1762117862978-2f9b0ece8390?w=800&auto=format&fit=crop', contacto_url: 'https://example.com', propietario: { id: 1, nombre: 'Ana' } },
  { id: 2, nombre: 'Suculenta', descripcion: 'Suculenta en roseta, fácil de cuidar. Entrega a coordinar.', modalidad: 'intercambio', precio_clp: null, condiciones_intercambio: 'Por un esqueje de pothos.', ubicacion: 'Ñuñoa', imagen_url: 'https://images.unsplash.com/photo-1550642088-04d7e6a461b0?w=800&auto=format&fit=crop', contacto_url: 'https://example.com', propietario: { id: 2, nombre: 'Diego' } },
  { id: 3, nombre: 'Planta de interior', descripcion: 'Monstera deliciosa con hojas fenestradas, lista para un nuevo hogar.', modalidad: 'venta', precio_clp: 8000, condiciones_intercambio: null, ubicacion: 'Providencia', imagen_url: 'https://images.unsplash.com/photo-1604866830513-d54766457f45?w=800&auto=format&fit=crop', contacto_url: 'https://example.com', propietario: { id: 2, nombre: 'Diego' } },
]

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

function resumen({ id, nombre, modalidad, precio_clp, ubicacion, imagen_url }) {
  return { id, nombre, modalidad, precio_clp, ubicacion, imagen_url }
}

export async function mockRequest(path, { method = 'GET', body, token } = {}) {
  await new Promise(resolve => setTimeout(resolve, 180))
  const usuario = sesiones.get(token)
  if (path.startsWith('/usuarios/me') || (path === '/publicaciones' && method === 'POST')) {
    if (!usuario) fail(401, 'Inicia sesión para continuar.')
  }
  if (path === '/usuarios' && method === 'POST') {
    if (usuarios.some(item => item.correo === body.correo)) fail(409, 'Este correo ya está registrado.')
    const nuevo = { id: usuarios.length + 2, ...body }
    usuarios.push(nuevo)
    return { id: nuevo.id, nombre: nuevo.nombre, correo: nuevo.correo }
  }
  if (path === '/sesion' && method === 'POST') {
    const found = usuarios.find(item => item.correo === body.correo && item.password === body.password)
    if (!found) fail(401, 'Correo o contraseña incorrectos.')
    const publicUser = { id: found.id, nombre: found.nombre, correo: found.correo }
    const sessionToken = crypto.randomUUID()
    sesiones.set(sessionToken, publicUser)
    return { token: sessionToken, usuario: publicUser }
  }
  if (path === '/usuarios/me') return { ...usuario }
  if (path === '/usuarios/me/publicaciones') return publicaciones.filter(item => item.propietario.id === usuario.id).map(resumen)
  if (path === '/publicaciones' && method === 'GET') return publicaciones.map(resumen)
  if (path === '/publicaciones' && method === 'POST') {
    const nueva = { ...body, id: publicaciones.length + 1, propietario: { id: usuario.id, nombre: usuario.nombre } }
    publicaciones.unshift(nueva)
    return nueva
  }
  if (path.startsWith('/publicaciones/')) {
    const id = Number(path.split('/').pop())
    if (!Number.isInteger(id) || id < 1) fail(400, 'El identificador no es válido.')
    const found = publicaciones.find(item => item.id === id)
    if (!found) fail(404, 'Esta publicación no existe.')
    return found
  }
  fail(404, 'Recurso no encontrado.')
}