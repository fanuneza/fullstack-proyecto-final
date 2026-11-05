import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isDemo, request } from './api'
import { Field, buttonCls, inputCls } from './components'

function https(value) {
  return URL.canParse(value) && new URL(value).protocol === 'https:'
}

export function AuthForm({ register = false }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const firstError = Object.keys(errors)[0]
    if (firstError) document.getElementById(firstError)?.focus()
  }, [errors])
  const from = ['/perfil', '/publicar'].includes(location.state?.from) ? location.state.from : '/perfil'

  async function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const nextErrors = {}
    values.correo = values.correo.trim().toLowerCase()
    if (register && !values.nombre.trim()) nextErrors.nombre = 'Ingresa tu nombre.'
    if (register && values.nombre.trim().length > 100) nextErrors.nombre = 'El nombre admite hasta 100 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) nextErrors.correo = 'Ingresa un correo válido.'
    if (values.correo.length > 255) nextErrors.correo = 'El correo admite hasta 255 caracteres.'
    if (!values.password) nextErrors.password = 'Ingresa tu contraseña.'
    if (register && values.confirmacion !== values.password) nextErrors.confirmacion = 'Las contraseñas no coinciden.'
    setErrors(nextErrors); setError('')
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      if (register) {
        await request('/usuarios', { method: 'POST', body: { nombre: values.nombre.trim(), correo: values.correo, password: values.password } })
        navigate('/ingreso', { state: { from, registered: true } })
      } else {
        await login({ correo: values.correo, password: values.password })
        navigate(from, { replace: true })
      }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-[560px]"><h1 className="mb-6 text-3xl">{register ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
    {!register && location.state?.registered && <p role="status" className="mb-4 rounded border border-forest bg-mist px-3 py-2">Cuenta creada. Inicia sesión para continuar.</p>}
    {!register && location.state?.sessionExpired && <p role="alert" className="mb-4 text-danger">Tu sesión ya no es válida. Inicia sesión nuevamente.</p>}
    {isDemo && <p className="mb-4">Usa datos de prueba.{!register && <> Cuenta de ejemplo: <strong>ana@example.com</strong> · Contraseña: <strong>plantas123</strong></>}</p>}
    <form onSubmit={submit} noValidate>
      {register && <Field label="Nombre" name="nombre" autoComplete="name" maxLength={100} required error={errors.nombre} />}
      <Field label="Correo" name="correo" type="email" autoComplete="email" maxLength={255} required error={errors.correo} />
      <Field label="Contraseña" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required error={errors.password} />
      {register && <Field label="Confirmar contraseña" name="confirmacion" type="password" autoComplete="new-password" required error={errors.confirmacion} />}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-danger">Revisa los campos indicados.</p>}
      <button className={buttonCls} disabled={busy}>{busy ? 'Enviando…' : register ? 'Crear cuenta' : 'Ingresar'}</button>
    </form>
    <p>{register ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'} <Link to={register ? '/ingreso' : '/registro'} state={{ from }}>{register ? 'Inicia sesión' : 'Regístrate'}</Link></p>
  </div>
}

export function PublishForm() {
  const { token, expireSession } = useAuth()
  const navigate = useNavigate()
  const [modalidad, setModalidad] = useState('venta')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const firstError = Object.keys(errors)[0]
    if (firstError) document.getElementById(firstError)?.focus()
  }, [errors])

  async function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const nextErrors = {}
    for (const key of ['nombre', 'descripcion', 'ubicacion']) {
      values[key] = values[key].trim()
      if (!values[key]) nextErrors[key] = 'Completa este campo.'
    }
    if (values.nombre.length > 100) nextErrors.nombre = 'El nombre admite hasta 100 caracteres.'
    if (values.ubicacion.length > 150) nextErrors.ubicacion = 'La ubicación admite hasta 150 caracteres.'
    for (const key of ['imagen_url', 'contacto_url']) {
      values[key] = values[key].trim()
      if (!https(values[key])) nextErrors[key] = 'Ingresa una URL válida que comience con https://.'
      else values[key] = new URL(values[key]).href
    }
    const amount = Number(values.precio_clp)
    if (modalidad !== 'intercambio' && (!values.precio_clp?.trim() || !Number.isSafeInteger(amount) || amount < 0 || amount > 2147483647)) nextErrors.precio_clp = 'Ingresa un precio entero entre 0 y 2147483647.'
    if (modalidad !== 'venta' && !values.condiciones_intercambio?.trim()) nextErrors.condiciones_intercambio = 'Indica qué te gustaría recibir.'
    setErrors(nextErrors); setError('')
    if (Object.keys(nextErrors).length) return
    const body = { ...values, modalidad, precio_clp: modalidad === 'intercambio' ? null : amount, condiciones_intercambio: modalidad === 'venta' ? null : values.condiciones_intercambio.trim() }
    setBusy(true)
    try {
      const planta = await request('/publicaciones', { method: 'POST', body, token })
      navigate(`/plantas/${planta.id}`)
    } catch (err) {
      if (err.status === 401) expireSession()
      else setError(err.message)
    } finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-[560px]"><h1 className="mb-2 text-3xl">Publicar una planta</h1><p className="mb-6">Todos los campos visibles son obligatorios.</p>
    <form onSubmit={submit} noValidate>
      <Field label="Nombre" name="nombre" maxLength={100} required error={errors.nombre} />
      <Field label="Descripción" name="descripcion" error={errors.descripcion}>
        <textarea id="descripcion" name="descripcion" rows="4" required className={`${inputCls} resize-y`} aria-invalid={!!errors.descripcion} aria-describedby={errors.descripcion ? 'descripcion-error' : undefined} />
      </Field>
      <Field label="Modalidad" name="modalidad"><select id="modalidad" name="modalidad" className={inputCls} value={modalidad} onChange={event => setModalidad(event.target.value)}>
        <option value="venta">Venta</option><option value="intercambio">Intercambio</option><option value="ambas">Venta o intercambio</option>
      </select></Field>
      {modalidad !== 'intercambio' && <Field label="Precio CLP" name="precio_clp" type="number" min="0" max="2147483647" step="1" required error={errors.precio_clp} />}
      {modalidad !== 'venta' && <Field label="Condiciones de intercambio" name="condiciones_intercambio" required error={errors.condiciones_intercambio} />}
      <Field label="Ubicación" name="ubicacion" maxLength={150} required error={errors.ubicacion} />
      <Field label="URL de imagen" name="imagen_url" type="url" placeholder="https://…" required error={errors.imagen_url} />
      <Field label="Enlace de contacto" name="contacto_url" type="url" placeholder="https://…" required error={errors.contacto_url} />
      {error && <p role="alert" className="text-danger">{error}</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-danger">Revisa los campos indicados.</p>}
      <div className="mt-2 flex items-center gap-4"><button className={buttonCls} disabled={busy}>{busy ? 'Publicando…' : 'Publicar'}</button><Link to="/perfil">Cancelar</Link></div>
    </form>
  </div>
}
