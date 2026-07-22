import { Link } from 'react-router-dom'
import { Sprout, Wheat } from 'lucide-react'
import { formatCurrencyCompact } from '../../utils/formatCurrency'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import Button from '../common/Button'

export default function CropsSummary({ crops = [] }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout size={18} className="text-stone-500" strokeWidth={2} />
          <h3 className="section-title">Mis cultivos activos</h3>
        </div>
        <Link to="/crops">
          <Button variant="ghost" size="sm">Ver todos</Button>
        </Link>
      </div>
      <div className="divide-y divide-stone-50">
        {crops.length === 0 ? (
          <EmptyState
            icon={<Sprout size={32} strokeWidth={1.75} />}
            title="Aún no tienes cultivos"
            description="Registra tu primer cultivo para empezar"
            action={<Link to="/crops"><Button size="sm">+ Registrar cultivo</Button></Link>}
          />
        ) : (
          crops.map((crop) => (
            <Link
              key={crop._id}
              to={`/crops/${crop._id}`}
              className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-primary-50/40 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-soft text-white">
                  <Wheat size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{crop.name}</p>
                  <p className="text-xs text-stone-400">{crop.type}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${crop.isProfit ? 'text-primary-600' : 'text-red-500'}`}>
                  {formatCurrencyCompact(crop.netProfit)}
                </p>
                <Badge color={crop.isProfit ? 'green' : 'red'}>
                  {crop.isProfit ? 'Ganancia' : 'Pérdida'}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}