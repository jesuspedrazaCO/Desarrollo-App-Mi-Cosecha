import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'
import { CROP_STATUS } from '../../utils/constants'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function CropCard({ crop, onEdit, onDelete }) {
  const status = CROP_STATUS[crop.status] || CROP_STATUS.activo
  const isProfit = crop.netProfit >= 0

  return (
    <div className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      style={{
        background: 'rgba(255,255,255,0.13)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.20)',
      }}>

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #258a4e, #1a6e3c)', boxShadow: '0 4px 12px rgba(37,138,78,0.45)' }}>
            🌾
          </div>
          <div>
            <h3 className="font-bold text-white font-display text-[15px] leading-tight">{crop.name}</h3>
            <p className="text-[12px] text-white/60 mt-0.5">{crop.type}</p>
          </div>
        </div>
        <Badge color={status.color}>{status.label}</Badge>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-3">
        {[
          { label: 'INICIO', value: formatDate(crop.startDate) },
          { label: 'COSECHA EST.', value: crop.estimatedHarvestDate ? formatDate(crop.estimatedHarvestDate) : '—' },
          { label: 'INVERTIDO', value: formatCurrencyCompact(crop.totalInvested), accent: 'orange' },
          { label: 'VENDIDO', value: formatCurrencyCompact(crop.totalSold), accent: 'green' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{item.label}</p>
            <p className={`text-[13px] font-bold mt-0.5 ${
              item.accent === 'orange' ? 'text-orange-300' :
              item.accent === 'green' ? 'text-emerald-300' : 'text-white/90'
            }`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Ganancia */}
      <div className="mx-5 mb-4 rounded-2xl px-4 py-3"
        style={{
          background: isProfit ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)',
          border: `1px solid ${isProfit ? 'rgba(74,222,128,0.30)' : 'rgba(248,113,113,0.30)'}`,
        }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Ganancia neta</span>
          <span className={`text-[17px] font-bold font-display ${isProfit ? 'text-emerald-300' : 'text-red-400'}`}>
            {formatCurrency(crop.netProfit)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 px-5 pb-5">
        <Link to={`/crops/${crop._id}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">Ver detalle</Button>
        </Link>
        <button onClick={() => onEdit(crop)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all duration-150">
          ✏️
        </button>
        <button onClick={() => onDelete(crop)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-400/15 transition-all duration-150">
          🗑️
        </button>
      </div>
    </div>
  )
}
