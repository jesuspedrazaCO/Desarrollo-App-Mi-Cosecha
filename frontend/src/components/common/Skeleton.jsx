// Esqueletos de carga: formas grises que brillan suave mientras llegan los datos,
// con la misma silueta de lo que va a aparecer (así la pantalla no "salta").

const glass = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }

// Bloque básico. Se le da tamaño con className (h-4 w-24, etc.).
export function Skeleton({ className = '', rounded = 'rounded-xl' }) {
  return <div aria-hidden="true" className={`skeleton ${rounded} ${className}`} />
}

// Envoltorio accesible: los lectores de pantalla oyen "Cargando" una sola vez.
function Wrap({ children, className = '' }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  )
}

// Fila de 4 tarjetas de cifras (inicio, reportes, rentabilidad)
export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl p-4 space-y-3" style={glass}>
          <Skeleton className="h-9 w-9" rounded="rounded-2xl" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  )
}

// Cuadrícula de tarjetas (cultivos, listas de mercado, pendientes, productos)
export function SkeletonCards({ count = 6, className = '' }) {
  return (
    <Wrap className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-3xl p-5 space-y-4" style={glass}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0" rounded="rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12" rounded="rounded-2xl" />
              <Skeleton className="h-12" rounded="rounded-2xl" />
              <Skeleton className="h-12" rounded="rounded-2xl" />
              <Skeleton className="h-12" rounded="rounded-2xl" />
            </div>
            <Skeleton className="h-10" rounded="rounded-full" />
          </div>
        ))}
      </div>
    </Wrap>
  )
}

// Lista de filas (precios, productos de una lista)
export function SkeletonList({ rows = 6, className = '' }) {
  return (
    <Wrap className={className}>
      <div className="rounded-3xl divide-y divide-white/10 overflow-hidden" style={glass}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Wrap>
  )
}

// Filas de tabla (se usa dentro de <tbody>)
export function SkeletonTableRows({ columns = 4, rows = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} aria-hidden="true">
      {Array.from({ length: columns }).map((_, c) => (
        <td key={c} className="px-5 py-4">
          <Skeleton className={`h-4 ${c === 0 ? 'w-20' : c === columns - 1 ? 'w-10' : 'w-3/4'}`} />
        </td>
      ))}
    </tr>
  ))
}

// Galería de comprobantes
export function SkeletonGallery({ count = 8 }) {
  return (
    <Wrap>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={glass}>
            <Skeleton className="h-36" rounded="rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-1/3" />
              <Skeleton className="h-6" rounded="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  )
}

// Pantalla de inicio: saludo + cifras + dos paneles grandes
export function SkeletonDashboard() {
  return (
    <Wrap className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
      <SkeletonStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56" rounded="rounded-3xl" />
        <Skeleton className="h-56" rounded="rounded-3xl" />
      </div>
      <Skeleton className="h-32" rounded="rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-40" rounded="rounded-3xl" />
        <Skeleton className="h-40" rounded="rounded-3xl" />
      </div>
    </Wrap>
  )
}

// Reportes / rentabilidad: cifras + gráfica + tarjetas
export function SkeletonReport() {
  return (
    <Wrap className="space-y-5">
      <SkeletonStats />
      <Skeleton className="h-64" rounded="rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-28" rounded="rounded-3xl" />
        <Skeleton className="h-28" rounded="rounded-3xl" />
      </div>
    </Wrap>
  )
}

// Detalle de un cultivo o de una lista: encabezado + pestañas + contenido
export function SkeletonDetail() {
  return (
    <Wrap className="space-y-5">
      <div className="rounded-3xl p-5 space-y-3" style={glass}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 shrink-0" rounded="rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-7 w-20" rounded="rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" rounded="rounded-2xl" />)}
        </div>
      </div>
      <Skeleton className="h-11 w-full max-w-md" rounded="rounded-full" />
      <SkeletonStats />
      <Skeleton className="h-48" rounded="rounded-3xl" />
    </Wrap>
  )
}

export default Skeleton
