import { useState, useRef } from 'react'
import { MapPin, Search, LocateFixed } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateFarmLocation } from '../../services/authService'

export default function FarmLocationModal({ onClose, onSaved }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef(null)

  const handleQueryChange = (value) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=es&countrycodes=co&limit=6&q=${encodeURIComponent(value)}`
        )
        setResults(await res.json())
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 600)
  }

  const save = async (lat, lng) => {
    setSaving(true)
    try {
      await updateFarmLocation(lat, lng)
      toast.success('Ubicación de la finca guardada')
      onSaved?.()
      onClose()
    } catch {
      toast.error('No se pudo guardar la ubicación')
    } finally {
      setSaving(false)
    }
  }

  const selectResult = (r) => save(parseFloat(r.lat), parseFloat(r.lon))

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { save(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      () => { toast.error('No se pudo obtener tu ubicación'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl p-5"
        style={{ background: '#142c1c', border: '1px solid rgba(255,255,255,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={18} className="text-emerald-400" />
          <h3 className="font-fraunces text-lg text-white">Ubicación de tu finca</h3>
        </div>
        <p className="text-white/50 text-xs mb-4">
          La usamos solo para darte el pronóstico del clima en el Agrónomo IA.
        </p>

        <div className="relative mb-3">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <Search size={15} className="text-stone-500 flex-shrink-0" />
            <input
              type="text" value={query} onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Busca tu vereda, pueblo o ciudad..."
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#1c1917' }}
            />
            {searching && <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-2xl overflow-hidden shadow-lg"
              style={{ background: 'rgba(20,44,28,0.98)', border: '1px solid rgba(255,255,255,0.15)' }}>
              {results.map((r, i) => (
                <button key={i} type="button" onClick={() => selectResult(r)}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button" onClick={useCurrentLocation} disabled={locating || saving}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {locating ? <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : <LocateFixed size={15} />}
          {locating ? 'Ubicando...' : 'Usar mi ubicación actual'}
        </button>

        <button onClick={onClose} className="w-full text-center text-white/40 text-xs mt-4 hover:text-white/60">
          Cancelar
        </button>
      </div>
    </div>
  )
}