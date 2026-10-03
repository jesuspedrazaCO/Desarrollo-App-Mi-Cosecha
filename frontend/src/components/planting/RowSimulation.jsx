export default function RowSimulation({ canonicalWidth, canonicalHeight, lotPolygon, exclusionPolygons = [], rowSegments = [], rowsPerGroup = 1 }) {
  if (!lotPolygon || lotPolygon.length < 3 || canonicalWidth <= 0 || canonicalHeight <= 0) return null

  const PAD = 24
  const scale = Math.min(340 / canonicalWidth, 220 / canonicalHeight)
  const svgW = canonicalWidth * scale + PAD * 2
  const svgH = canonicalHeight * scale + PAD * 2

  const sx = (x) => PAD + x * scale
  const sy = (y) => PAD + y * scale
  const toPath = (poly) => poly.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0])},${sy(p[1])}`).join(' ') + ' Z'

  const hasExclusions = exclusionPolygons.length > 0

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Simulación de surcos</p>
      <div className="flex justify-center overflow-x-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: '100%' }}>
          <path d={toPath(lotPolygon)} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

          {rowSegments.map((row, i) => {
            const groupIndex = Math.floor(i / rowsPerGroup)
            const color = groupIndex % 2 === 0 ? '#4ade80' : '#7dd3a8'
            return row.segments.map(([x1, y1, x2, y2], si) => (
              <line key={`${i}-${si}`} x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)} stroke={color} strokeWidth="2" />
            ))
          })}

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