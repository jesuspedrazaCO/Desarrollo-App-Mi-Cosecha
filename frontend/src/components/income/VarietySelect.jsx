import { useEffect, useState } from 'react'
import Select from '../common/Select'
import Input from '../common/Input'

const OTHER = '__otra__'

// Busca la variedad del menú que coincide con lo escrito, ignorando mayúsculas
// y tildes de formato ("piña pareja", "Pareja" y "Piña Pareja" → "Piña pareja").
// Así un registro viejo escrito a mano no queda como una variedad distinta.
function findCanonical(value, varieties) {
  const v = (value || '').trim().toLowerCase()
  if (!v) return null
  return varieties.find((o) => {
    const l = o.toLowerCase()
    return l === v || l.endsWith(` ${v}`)
  }) || null
}

// Menú de variedades según el cultivo. Si el cultivo no tiene lista (ej: "Otro")
// o la variedad no está en el menú, se puede elegir "Otra variedad" y escribirla.
export default function VarietySelect({ value, onChange, varieties = [], error, label = 'Producto / variedad' }) {
  const hasMenu = varieties.length > 0
  const canonical = findCanonical(value, varieties)
  const [custom, setCustom] = useState(() => !!value && !canonical)

  // Si lo guardado es la misma variedad pero escrita distinto, lo normalizamos al nombre del menú.
  useEffect(() => {
    if (canonical && canonical !== value) onChange(canonical)
  }, [canonical, value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasMenu) {
    return (
      <Input
        label={label}
        placeholder="Escribe la variedad o producto"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
    )
  }

  const selectValue = custom ? OTHER : (canonical || '')

  const handleSelect = (e) => {
    const v = e.target.value
    if (v === OTHER) {
      setCustom(true)
      onChange('')
    } else {
      setCustom(false)
      onChange(v)
    }
  }

  // Al salir del campo de texto, si lo escrito ya existe en el menú, se cambia a esa opción.
  const handleCustomBlur = () => {
    const match = findCanonical(value, varieties)
    if (match) {
      setCustom(false)
      onChange(match)
    } else if (value) {
      onChange(value.trim())
    }
  }

  return (
    <div className="space-y-2">
      <Select
        label={label}
        value={selectValue}
        onChange={handleSelect}
        placeholder="Seleccionar variedad"
        options={[
          ...varieties.map((v) => ({ value: v, label: v })),
          { value: OTHER, label: 'Otra variedad…' },
        ]}
        error={!custom ? error : undefined}
      />
      {custom && (
        <Input
          placeholder="Escribe la variedad"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleCustomBlur}
          error={error}
        />
      )}
    </div>
  )
}