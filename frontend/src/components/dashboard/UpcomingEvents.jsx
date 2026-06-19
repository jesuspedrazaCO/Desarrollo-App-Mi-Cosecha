import { formatDate } from '../../utils/formatDate'
import { EVENT_TYPES } from '../../utils/constants'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'

export default function UpcomingEvents({ events = [] }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <span className="text-lg">🗓️</span>
        <h3 className="section-title">Próximos eventos (30 días)</h3>
      </div>
      <div className="divide-y divide-stone-50">
        {events.length === 0 ? (
          <EmptyState icon="📅" title="Sin eventos próximos" description="Agrega siembras, cosechas o pagos en tu calendario" />
        ) : (
          events.map((event) => {
            const type = EVENT_TYPES[event.type] || EVENT_TYPES.otro
            return (
              <div key={event._id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="text-center flex-shrink-0 w-12">
                  <p className="text-[10px] text-stone-400 uppercase font-bold">{formatDate(event.date, 'MMM')}</p>
                  <p className="text-lg font-bold text-primary-600 leading-none font-display">{formatDate(event.date, 'dd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{event.title}</p>
                  {event.crop && <p className="text-xs text-stone-400">{event.crop.name}</p>}
                </div>
                <Badge color={type.color}>{type.icon} {type.label}</Badge>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}