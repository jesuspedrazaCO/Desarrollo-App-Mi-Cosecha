import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sprout, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import PlantingMap, { calculateAreaM2 } from '../components/planting/PlantingMap'
import RowSimulation from '../components/planting/RowSimulation'
import { projectPlotSpace, computeRowLayout } from '../utils/rowLayout'
import { PLANTING_PRESETS } from '../utils/plantingPresets'
import { createPlantingPlot } from '../services/plantingPlotService'
import Button from '../components/common/Button'

export default function PlantingCalculatorPage() {
  const navigate = useNavigate()
  const [points, setPoints] = useState([])
  const [exclusionZones, setExclusionZones] = useState([])
  const [cropKey, setCropKey] = useState('pina')
  const [patternMode, setPatternMode] = useState('simple') // 'simple' | 'grouped'
  const [orientation, setOrientation] = useState('horizontal')
  const [rowSpacing, setRowSpacing] = useState(1)
  const [rowsPerGroup, setRowsPerGroup] = useState(2)
  const [intraGroupSpacing, setIntraGroupSpacing] = useState(0.4)
  const [interGroupSpacing, setInterGroupSpacing] = useState(1.2)
  const [plantSpacing, setPlantSpacing] = useState(0.3)
  const [plotName, setPlotName] = useState('')
  const [saving, setSaving] = useState(false)

  const areaM2 = calculateAreaM2(points)
  const areaHectares = areaM2 / 10000

  const { canonicalWidth, canonicalHeight, lotPolygon, exclusionPolygons } = useMemo(
    () => projectPlotSpace(points, exclusionZones),
    [points, exclusionZones]
  )

  const layout = useMemo(() => {
    const base = {
      canonicalWidth,
      canonicalHeight,
      orientation,
      lotPolygon,
      exclusionPolygons,
      plantSpacing,
    }
    if (patternMode === 'simple') {
      return computeRowLayout({
        ...base,
        rowsPerGroup: 1,
        intraGroupSpacing: rowSpacing,
        interGroupSpacing: rowSpacing,
      })
    }
    return computeRowLayout({
      ...base,
      rowsPerGroup,
      intraGroupSpacing,
      interGroupSpacing,
    })
  }, [
    patternMode,
    canonicalWidth,
    canonicalHeight,
    orientation,
    rowSpacing,
    rowsPerGroup,
    intraGroupSpacing,
    interGroupSpacing,
    plantSpacing,
    lotPolygon,
    exclusionPolygons,
  ])

  const handleSave = async () => {
    if (points.length < 3) {
      toast.error('Marca el lote en el mapa antes de guardar')
      return
    }
    if (!plotName.trim()) {
      toast.error('Ponle un nombre al lote')
      return
    }
    setSaving(true)
    try {
      await createPlantingPlot({
        name: plotName.trim(),
        cropKey,
        points,
        exclusionZones,
        orientation,
        patternMode,
        rowSpacing,
        rowsPerGroup,
        intraGroupSpacing,
        interGroupSpacing,
        plantSpacing,
        areaM2,
        areaHectares,
        totalRows: layout.totalRows,
        plantsPerRow: layout.plantsPerRow,
        estimatedPlants: layout.totalPlants,
      })
      toast.success('Lote guardado correctamente')
      navigate(-1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'No se pudo guardar el lote')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px 60px' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '14px',
        }}
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h1
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'Fraunces, serif',
          fontSize: '26px',
          color: '#fff',
          marginBottom: '20px',
        }}
      >
        <Sprout size={24} color="#4ade80" /> Calculadora de siembra
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Mapa */}
        <PlantingMap
          points={points}
          onPointsChange={setPoints}
          exclusionZones={exclusionZones}
          onExclusionZonesChange={setExclusionZones}
        />

        {/* Resumen de área */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Stat label="Área del lote" value={`${areaHectares.toFixed(3)} ha`} />
          <Stat label="Zonas sin sembrar" value={`${exclusionZones.length}`} />
          <Stat label="Surcos" value={`${layout.totalRows ?? 0}`} />
          <Stat label="Plantas por surco (aprox.)" value={`${layout.plantsPerRow ?? 0}`} />
          <Stat label="Total estimado" value={`${layout.totalPlants ?? 0} plantas`} />
        </div>

        {/* Configuración de siembra */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Field label="Cultivo">
            <select
              value={cropKey}
              onChange={(e) => setCropKey(e.target.value)}
              style={selectStyle}
            >
              {Object.entries(PLANTING_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Orientación de los surcos">
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              style={selectStyle}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </Field>

          <Field label="Patrón">
            <select
              value={patternMode}
              onChange={(e) => setPatternMode(e.target.value)}
              style={selectStyle}
            >
              <option value="simple">Surcos simples</option>
              <option value="grouped">Surcos agrupados</option>
            </select>
          </Field>

          <Field label="Distancia entre plantas (m)">
            <input
              type="number"
              step="0.05"
              value={plantSpacing || ''}
              onChange={(e) => setPlantSpacing(parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </Field>

          {patternMode === 'simple' ? (
            <Field label="Distancia entre surcos (m)">
              <input
                type="number"
                step="0.1"
                value={rowSpacing || ''}
                onChange={(e) => setRowSpacing(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </Field>
          ) : (
            <>
              <Field label="Surcos por grupo">
                <input
                  type="number"
                  step="1"
                  value={rowsPerGroup || ''}
                  onChange={(e) => setRowsPerGroup(parseInt(e.target.value) || 0)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Distancia dentro del grupo (m)">
                <input
                  type="number"
                  step="0.05"
                  value={intraGroupSpacing || ''}
                  onChange={(e) => setIntraGroupSpacing(parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Distancia entre grupos (m)">
                <input
                  type="number"
                  step="0.1"
                  value={interGroupSpacing || ''}
                  onChange={(e) => setInterGroupSpacing(parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </Field>
            </>
          )}
        </div>

        {/* Simulación visual */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <RowSimulation
            canonicalWidth={canonicalWidth}
            canonicalHeight={canonicalHeight}
            lotPolygon={lotPolygon}
            exclusionPolygons={exclusionPolygons}
            rowSegments={layout.rowSegments}
            rowsPerGroup={patternMode === 'grouped' ? rowsPerGroup : 1}
          />
        </div>

        {/* Guardar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            placeholder="Nombre del lote"
            value={plotName}
            onChange={(e) => setPlotName(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
          />
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} style={{ marginRight: '6px' }} />
            {saving ? 'Guardando...' : 'Guardar lote'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ minWidth: '120px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14px',
}

const selectStyle = { ...inputStyle }