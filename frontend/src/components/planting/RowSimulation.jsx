export default function RowSimulation({ length, width, rows, orientation, rowsPerGroup }) {
  if (!rows || rows.length === 0 || length <= 0 || width <= 0) return null

  const PAD = 24
  const boxW = orientation === 'horizontal' ? length : width
  const boxH = orientation === 'horizontal' ? width : length
  const scale = Math.min(340 / boxW, 220 / boxH)
  const svgW = boxW * scale + PAD * 2
  const svgH = boxH * scale + PAD * 2

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Simulación de surcos</p>
      <div className="flex justify-center overflow-x-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: '100%' }}>
          <rect
            x={PAD} y={PAD} width={boxW * scale} height={boxH * scale}
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" rx="4"
          />
          {rows.map((offset, i) => {
            const groupIndex = Math.floor(i / rowsPerGroup)
            const color = groupIndex % 2 === 0 ? '#4ade80' : '#7dd3a8'
            if (orientation === 'horizontal') {
              const y = PAD + offset * scale
              return <line key={i} x1={PAD} y1={y} x2={PAD + boxW * scale} y2={y} stroke={color} strokeWidth="2" />
            }
            const x = PAD + offset * scale
            return <line key={i} x1={x} y1={PAD} x2={x} y2={PAD + boxH * scale} stroke={color} strokeWidth="2" />
          })}
        </svg>
      </div>
      <p className="text-[10px] text-white/35 mt-2 text-center">
        Esquema basado en el rectángulo que envuelve tu lote — los bordes irregulares reales pueden variar el resultado exacto.
      </p>
    </div>
  )
}