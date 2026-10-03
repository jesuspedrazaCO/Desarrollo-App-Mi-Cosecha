export default function RowSimulation({ length, width, lotPolygon, exclusionPolygons = [], rowDetails = [], rowsPerGroup = 1 }) {
  if (!lotPolygon || lotPolygon.length < 3 || length <= 0 || width <= 0) return null

  const PAD = 24
  const scale = Math.min(340 / length, 220 / width)
  const svgW = length * scale + PAD * 2
  const svgH = width * scale + PAD * 2

  const toSvg = ([x, y]) => [PAD + x * scale, PAD + y * scale]
  const toPath = (poly) => poly.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvg(p).join(',')}`).join(' ') + ' Z'

  const hasExclusions = exclusionPolygons.length > 0

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Simulación de surcos</p>
      <div className="flex justify-center overflow-x-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: '100%' }}>
          {/* Forma real del lote, tal como la marcaste en el mapa */}
          <path d={toPath(lotPolygon)} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

          {/* Surcos, ya recortados donde el lote no llega o hay una zona excluida */}
          {rowDetails.map((row, i) => {
            const groupIndex = Math.floor(i / rowsPerGroup)
            const color = groupIndex % 2 === 0 ? '#4ade80' : '#7dd3a8'
            return row.segments.map(([start, end], si) => {
              const [x1, y1] = toSvg([start, row.offset])
              const [x2, y2] = toSvg([end, row.offset])
              return <line key={`${i}-${si}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
            })
          })}

          {/* Zonas marcadas como no sembrables (carretera, casa, etc.) */}
          {exclusionPolygons.map((poly, i) => (
            <path key={i} d={toPath(poly)} fill="rgba(248,113,113,0.35)" stroke="#f87171" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
      <p className="text-[10px] text-white/35 mt-2 text-center">
        {hasExclusions
          ? 'Las zonas en rojo son las que marcaste como no sembrables — no se cuentan en el total de plantas.'
          : 'La simulación respeta la forma real del lote que marcaste en el mapa.'}
      </p>
    </div>
  )
}