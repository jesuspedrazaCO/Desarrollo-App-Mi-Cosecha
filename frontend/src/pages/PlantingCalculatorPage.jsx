import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sprout, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import PlantingMap, { calculateAreaM2 } from '../components/planting/PlantingMap'
import RowSimulation from '../components/planting/RowSimulation'
import { computeBoundingDims, computeRowLayout } from '../utils/rowLayout'
import { PLANTING_PRESETS } from '../utils/plantingPresets'
import { createPlantingPlot } from '../services/plantingPlotService'
import Button from '../components/common/Button'

export default function PlantingCalculatorPage() {
  const navigate = useNavigate()
  const [points, setPoints] = useState([])
  const [cropKey, setCropKey] = useState('pina')

  const [patternMode, setPatternMode] = useState('simple') // 'simple' | 'grouped'
  const [orientation, setOrientation] = useState('horizontal') // 'horizontal' | 'vertical'
  const [rowSpacing, setRowSpacing] = useState(PLANTING_PRESETS.pina.rowSpacing) // modo simple
  const [rowsPerGroup, setRowsPerGroup] = useState(3) // modo agrupado
  const [intraGroupSpacing, setIntraGroupSpacing] = useState(0.4) // entre surcos del mismo grupo
  const [interGroupSpacing, setInterGroupSpacing] = useState(1) // pasillo entre grupos
  const [plantSpacing, setPlantSpacing] = useState(PLANTING_PRESETS.pina.plantSpacing)

  const [plotName, setPlotName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCropChange = (key) => {
    setCropKey(key)
    setRowSpacing(PLANTING_PRESETS[key].rowSpacing)
    setPlantSpacing(PLANTING_PRESETS[key].plantSpacing)
  }

  const areaM2 = calculateAreaM2(points)
  const areaHectares = areaM2 / 10000

  const { length, width } = useMemo(
    () => computeBoundingDims(points, orientation),
    [points, orientation]
  )

  const layout = useMemo(() => {
    if (patternMode === 'simple') {
      return computeRowLayout({
        length, width,
        rowsPerGroup: 1,
        intraGroupSpacing: rowSpacing,
        interGroupSpacing: rowSpacing,
        plantSpacing,
      })
    }
    return computeRowLayout({
      length, width,
      rowsPerGroup,
      intraGroupSpacing,
      interGroupSpacing,
      plantSpacing,
    })
  }, [patternMode, length, width, rowSpacing, rowsPerGroup, intraGroupSpacing, interGroupSpacing, plantSpacing])

  const inputStyle = { background: 'rgba(255,255,255,0.85)', color: '#1c1917' }
  const inputClass = 'w-full rounded-2xl px-4 py-2.5 text-sm outline-none'

  const toggleBtnClass = (active) =>
    `flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
      active ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white/80'
    }`

  const handleSave = async () => {
    if (points.length < 3) {
      toast.error('Marca al menos 3 puntos en el mapa')
      return
    }
    if (!plotName.trim()) {
      toast.error('Ponle un nombre al lote')
      return
    }
    setSaving(true)
    try {
      await createPlantingPlot({
        name: plotName,
        cropType: cropKey,
        geometry: points.map(([lat, lng]) => ({ lat, lng })),
        areaM2,
        areaHectares,
        orientation,
        patternMode,
        rowSpacing: patternMode === 'simple' ? rowSpacing : null,
        rowsPerGroup: patternMode === 'grouped' ? rowsPerGroup : 1,
        intraGroupSpacing: patternMode === 'grouped' ? intraGroupSpacing : rowSpacing,
        interGroupSpacing: patternMode === 'grouped' ? interGroupSpacing : rowSpacing,
        plantSpacing,
        totalRows: layout.totalRows,
        plantsPerRow: layout.plantsPerRow,
        estimatedPlants: layout.totalPlants,
      })
      toast.success('Lote guardado correctamente')
      navigate('/crops')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el lote')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-float-up max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sprout size={22} /> Calculadora de siembra
          </h1>
          <p className="text-white/45 text-sm mt-1">Marca tu lote en el mapa y calcula cuántas plantas caben</p>
        </div>
      </div>

      <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <PlantingMap points={points} onPointsChange={setPoints} />
      </div>

      <div className="rounded-3xl p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)' }}>
        {/* Cultivo */}
        <div>
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Cultivo</label>
          <select value={cropKey} onChange={(e) => handleCropChange(e.target.value)} style={inputStyle} className={inputClass}>
            {Object.entries(PLANTING_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-white/35 mt-1.5">
            Los valores se sugieren automáticamente según el cultivo — puedes ajustarlos si tu técnica es distinta.
          </p>
        </div>

        {/* Orientación */}
        <div>
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Orientación de los surcos</label>
          <div className="flex gap-1.5 rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={() => setOrientation('horizontal')} className={toggleBtnClass(orientation === 'horizontal')}>
              ↔ Horizontal
            </button>
            <button type="button" onClick={() => setOrientation('vertical')} className={toggleBtnClass(orientation === 'vertical')}>
              ↕ Vertical
            </button>
          </div>
        </div>

        {/* Patrón de siembra */}
        <div>
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Patrón de siembra</label>
          <div className="flex gap-1.5 rounded-2xl p-1 mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={() => setPatternMode('simple')} className={toggleBtnClass(patternMode === 'simple')}>
              Surcos simples
            </button>
            <button type="button" onClick={() => setPatternMode('grouped')} className={toggleBtnClass(patternMode === 'grouped')}>
              Surcos agrupados (camas)
            </button>
          </div>

          {patternMode === 'simple' ? (
            <div>
              <label className="block text-[12px] text-white/60 mb-1.5">Espacio entre surcos (m)</label>
              <input
                type="number" min="0.1" step="0.1" value={rowSpacing}
                onChange={(e) => setRowSpacing(Number(e.target.value))}
                style={inputStyle} className={inputClass}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-white/40">
                Ej: piña oro miel con camas de 3 surcos muy juntos, luego un pasillo ancho, y se repite.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1.5">Surcos por grupo</label>
                  <input
                    type="number" min="1" step="1" value={rowsPerGroup}
                    onChange={(e) => setRowsPerGroup(Math.max(1, Number(e.target.value)))}
                    style={inputStyle} className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1.5">Entre surcos del grupo (m)</label>
                  <input
                    type="number" min="0.1" step="0.05" value={intraGroupSpacing}
                    onChange={(e) => setIntraGroupSpacing(Number(e.target.value))}
                    style={inputStyle} className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 mb-1.5">Pasillo entre grupos (m)</label>
                  <input
                    type="number" min="0.1" step="0.05" value={interGroupSpacing}
                    onChange={(e) => setInterGroupSpacing(Number(e.target.value))}
                    style={inputStyle} className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Espacio entre plantas */}
        <div>
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Espacio entre plantas (a lo largo del surco, m)</label>
          <input
            type="number" min="0.05" step="0.05" value={plantSpacing}
            onChange={(e) => setPlantSpacing(Number(e.target.value))}
            style={inputStyle} className={inputClass}
          />
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Área</p>
            <p className="text-sm font-bold text-white mt-1">
              {areaHectares > 0 ? `${areaHectares.toLocaleString('es-CO', { maximumFractionDigits: 3 })} ha` : '—'}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Surcos</p>
            <p className="text-sm font-bold text-white mt-1">{layout.totalRows}</p>
          </div>
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Matas / surco</p>
            <p className="text-sm font-bold text-white mt-1">{layout.plantsPerRow}</p>
          </div>
          <div className="rounded-2xl px-3 py-3 text-center" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Total plantas</p>
            <p className="text-base font-bold text-emerald-300 mt-1">{layout.totalPlants.toLocaleString('es-CO')}</p>
          </div>
        </div>

        {/* Simulación visual */}
        <RowSimulation
          length={length} width={width} rows={layout.rows}
          orientation={orientation} rowsPerGroup={patternMode === 'grouped' ? rowsPerGroup : 1}
        />

        <div>
          <label className="block text-[13px] font-semibold text-white/70 mb-1.5">Nombre del lote</label>
          <input
            type="text" placeholder="Ej: Lote norte - Piña" value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            style={inputStyle} className={inputClass}
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} className="mr-1.5" /> Guardar lote
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-white/30 text-center px-4">
        Los valores de espaciamiento son referencias generales — ajústalos según tu variedad, clima y experiencia local.
        Los surcos y matas se calculan sobre el rectángulo que envuelve tu lote, no la forma irregular exacta.
      </p>
    </div>
  )
}