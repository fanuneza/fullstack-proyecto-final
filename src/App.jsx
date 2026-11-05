import { useEffect } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { isDemo } from './api'
import { PlantGrid, PlantImage, ResourceState, buttonCls, modalidades, precio } from './components'
import { useResource } from './useResource'
import { AuthForm, PublishForm } from './forms'
import { PlantMark } from './PlantMark'

const navCls = ({ isActive }) => `no-underline ${isActive ? 'font-bold underline' : 'hover:underline'}`

function Layout() {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const titles = { '/': 'Inicio', '/plantas': 'Explorar plantas', '/registro': 'Crear cuenta', '/ingreso': 'Iniciar sesión', '/perfil': 'Mi perfil', '/publicar': 'Publicar una planta' }
    const path = location.pathname.replace(/\/+$/, '') || '/'
    const title = titles[path] || (/^\/plantas\/[^/]+$/.test(path) ? 'Detalle de planta' : 'Página no encontrada')
    document.title = `${title} · Mercado Verde`
  }, [location.pathname])
  return <>
    <a className="absolute -top-28 left-3 z-10 bg-white px-3 py-3 focus:top-3" href="#contenido">Saltar al contenido</a>
    <header className="border-b border-line bg-white"><nav aria-label="Navegación principal"
      className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-6 px-6 py-5">
      <Link className="mr-4 flex items-center gap-2 text-lg font-bold no-underline hover:underline" to="/"><PlantMark className="h-9 w-auto" />Mercado Verde</Link>
      <NavLink className={navCls} to="/">Inicio</NavLink><NavLink className={navCls} to="/plantas">Galería</NavLink>
      <div className="ml-auto flex flex-wrap items-center gap-5">{usuario ? <>
        <NavLink className={navCls} to="/publicar">Publicar</NavLink><NavLink className={navCls} to="/perfil">Mi perfil</NavLink>
        <button className="cursor-pointer border-0 bg-transparent p-0 text-forest underline hover:text-forest-dark" onClick={() => { logout(); navigate('/', { replace: true }) }}>Cerrar sesión</button>
      </> : <><NavLink className={navCls} to="/ingreso" state={location.state}>Ingresar</NavLink><NavLink className={navCls} to="/registro" state={location.state}>Registro</NavLink></>}</div>
    </nav></header>
    {isDemo && <p className="m-0 max-w-none bg-mist px-6 py-2.5 text-center text-sm">Demostración: datos ficticios. Los cambios y la sesión se reinician al recargar.</p>}
    <main id="contenido" tabIndex={-1} className="mx-auto min-h-[70vh] max-w-[1120px] px-6 pb-16 pt-10"><Outlet /></main>
    <footer className="border-t border-line px-6 py-6 text-center">Mercado Verde · Compra, vende o intercambia plantas.
      <p className="mx-auto mt-2 text-xs">Plant by Eskak from <a href="https://thenounproject.com/browse/icons/term/plant/" target="_blank" title="Plant Icons" rel="noopener noreferrer">Noun Project</a> (CC BY 3.0)</p>
    </footer>
  </>
}

function PrivateRoute() {
  const { usuario, sessionExpired } = useAuth()
  const location = useLocation()
  return usuario ? <Outlet /> : <Navigate to="/ingreso" state={{ from: location.pathname, sessionExpired }} replace />
}

function Home() {
  return <>
    <section className="flex min-h-[440px] items-center bg-forest-dark bg-cover bg-center px-6 py-12 text-white md:px-12 md:py-16"
      style={{ backgroundImage: 'linear-gradient(rgb(0 0 0 / 65%), rgb(0 0 0 / 65%)), url(/hero-plantas.webp)' }}>
      <div className="max-w-[600px]">
      <h1 className="mb-6 max-w-[20ch] text-3xl leading-tight md:text-4xl">Encuentra un nuevo hogar para tus plantas</h1>
      <p className="text-xl">Compra, vende o intercambia con otras personas.</p>
      <div className="mt-6 flex flex-wrap items-center gap-4"><Link className={buttonCls} to="/plantas">Explorar plantas</Link><Link className="inline-block rounded border border-white px-[18px] py-2.5 text-white no-underline hover:bg-white hover:text-forest-dark" to="/publicar">Publicar una planta</Link></div>
      </div>
    </section>
    <section><h2 className="mb-4 mt-8 text-2xl">Cómo funciona</h2><ol className="grid grid-cols-1 gap-y-0 pl-6 md:grid-cols-3 md:gap-10">
      <li><h3 className="text-lg">Explora</h3><p>Encuentra plantas y revisa su ubicación y modalidad.</p></li>
      <li><h3 className="text-lg">Contacta</h3><p>Abre el enlace de contacto de quien publica.</p></li>
      <li><h3 className="text-lg">Acuerda</h3><p>Coordina la venta o el intercambio directamente.</p></li>
    </ol></section>
    <section><h2 className="mb-4 mt-8 text-2xl">Acerca del proyecto</h2><p>Un espacio para compartir plantas y darles un nuevo hogar. Los acuerdos se realizan fuera de la aplicación, sin pagos ni envíos dentro del sitio.</p></section>
  </>
}

function Gallery() {
  const resource = useResource('/publicaciones')
  return <><h1 className="mb-6 text-3xl">Explorar plantas</h1><ResourceState resource={resource}>{data => <PlantGrid plantas={data} />}</ResourceState></>
}

function Detail() {
  const { id } = useParams()
  const resource = useResource(`/publicaciones/${id}`)
  return <><Link to="/plantas">← Volver a la galería</Link>
    {(resource.loading || resource.error) && <h1 className="mb-6 mt-8 text-3xl">{resource.error ? 'No se pudo cargar la planta' : 'Detalle de planta'}</h1>}
    <ResourceState resource={resource} missingIsFinal>{planta => <article className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
      <PlantImage key={planta.imagen_url} src={planta.imagen_url} nombre={planta.nombre} className="h-80 w-full md:h-[440px]" />
      <div><h1 className="mb-4 text-3xl">{planta.nombre}</h1><p className="mb-2">{modalidades[planta.modalidad]}</p>
        {planta.precio_clp !== null && <p className="mb-2 text-2xl font-bold">{precio(planta.precio_clp)}</p>}
        <p className="mb-2">{planta.ubicacion}</p><p className="mb-2">Publicado por: {planta.propietario.nombre}</p>
        <h2 className="mb-4 mt-8 text-2xl">Descripción</h2><p className="mb-4 whitespace-pre-wrap break-words">{planta.descripcion}</p>
        {planta.condiciones_intercambio && <><h2 className="mb-4 mt-8 text-2xl">Condiciones de intercambio</h2><p className="mb-4 whitespace-pre-wrap break-words">{planta.condiciones_intercambio}</p></>}
        {planta.contacto_url.startsWith('https://') && <a className={`${buttonCls} mt-2`} href={planta.contacto_url} target="_blank" rel="noopener noreferrer">Contactar al propietario ↗</a>}
        {isDemo && <p className="mt-4 text-sm">Los contactos de las publicaciones de ejemplo son ficticios.</p>}
      </div>
    </article>}</ResourceState>
  </>
}

function Profile() {
  const { token } = useAuth()
  const profile = useResource('/usuarios/me', token)
  const plants = useResource('/usuarios/me/publicaciones', token)
  return <><h1 className="mb-6 text-3xl">Mi perfil</h1><ResourceState resource={profile}>{user => <><p className="mb-2">Nombre: {user.nombre}</p><p className="mb-2">Correo: {user.correo}</p></>}</ResourceState>
    <Link className={`${buttonCls} mt-4`} to="/publicar">Crear publicación</Link>
    <h2 className="mb-4 mt-8 text-2xl">Mis publicaciones</h2><ResourceState resource={plants}>{data => <PlantGrid plantas={data} />}</ResourceState>
  </>
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes><Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="registro" element={<AuthForm key="registro" register />} />
    <Route path="ingreso" element={<AuthForm key="ingreso" />} />
    <Route path="plantas" element={<Gallery />} />
    <Route path="plantas/:id" element={<Detail />} />
    <Route element={<PrivateRoute />}><Route path="perfil" element={<Profile />} /><Route path="publicar" element={<PublishForm />} /></Route>
    <Route path="*" element={<><h1 className="mb-6 text-3xl">Página no encontrada</h1><Link to="/">Volver al inicio</Link></>} />
  </Route></Routes></AuthProvider></BrowserRouter>
}
