import { useState } from 'react'
import { Link } from 'react-router-dom'

export const modalidades = { venta: 'Venta', intercambio: 'Intercambio', ambas: 'Venta o intercambio' }
export function precio(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)
}

export const buttonCls = 'inline-block cursor-pointer rounded border border-forest bg-forest px-[18px] py-2.5 text-white no-underline hover:bg-forest-dark hover:text-white disabled:cursor-wait disabled:opacity-65'
export const secondaryCls = 'inline-block cursor-pointer rounded border border-forest bg-transparent px-[18px] py-2.5 text-forest no-underline hover:text-forest-dark disabled:cursor-wait disabled:opacity-65'
export const inputCls = 'w-full rounded border border-field bg-white px-3 py-2.5 text-ink placeholder:text-[#576457] aria-invalid:border-danger'

export function PlantImage({ src, nombre, className }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <div className={`grid place-content-center bg-fallback p-6 text-center ${className}`}>Imagen no disponible · {nombre}</div>
    : <img src={src} alt={nombre} className={className} onError={() => setFailed(true)} />
}

export function PlantCard({ planta }) {
  return <article className="overflow-hidden rounded border border-line bg-white">
    <Link to={`/plantas/${planta.id}`} aria-label={`Ver detalle de ${planta.nombre}`}>
      <PlantImage src={planta.imagen_url} nombre={planta.nombre} className="h-60 w-full" />
    </Link>
    <div className="p-5">
      <h2 className="m-0 mb-3 text-xl"><Link to={`/plantas/${planta.id}`}>{planta.nombre}</Link></h2>
      <p className="my-2">{modalidades[planta.modalidad]}</p>
      {planta.precio_clp !== null && <p className="my-2"><strong>{precio(planta.precio_clp)}</strong></p>}
      <p className="my-2">{planta.ubicacion}</p>
      <Link to={`/plantas/${planta.id}`}>Ver detalle<span className="sr-only"> de {planta.nombre}</span></Link>
    </div>
  </article>
}

export function PlantGrid({ plantas }) {
  return plantas.length
    ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{plantas.map(planta => <PlantCard key={planta.id} planta={planta} />)}</div>
    : <p>No hay publicaciones todavía. <Link to="/publicar">Publica una planta</Link>.</p>
}

export function Field({ label, name, error, children, ...props }) {
  return <div className="mb-5 flex flex-col gap-1.5">
    <label htmlFor={name} className="font-semibold">{label}</label>
    {children || <input id={name} name={name} className={inputCls} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} {...props} />}
    {error && <span className="text-danger" id={`${name}-error`}>{error}</span>}
  </div>
}

export function ResourceState({ resource, children, missingIsFinal = false }) {
  if (resource.loading) return <p role="status">Cargando…</p>
  if (resource.error) return <div role="alert" className="text-danger"><p>{resource.error.message}</p>
    {!(missingIsFinal && resource.error.status === 404) && <button className={buttonCls} onClick={resource.retry}>Reintentar</button>}
    <p className="mt-4"><Link className="text-forest" to="/plantas">Volver a la galería</Link></p>
  </div>
  return children(resource.data)
}
