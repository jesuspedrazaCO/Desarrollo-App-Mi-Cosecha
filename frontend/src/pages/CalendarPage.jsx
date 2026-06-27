import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCalendar } from '../hooks/useCalendar'
import { getCrops } from '../services/cropService'
import EventForm from '../components/calendar/EventForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { EVENT_TYPES } from '../utils/constants'
import { formatDate } from '../utils/formatDate'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'

const locales = { es }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const messages = {
  today: 'Hoy', previous: '‹', next: '›',
  month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
  date: 'Fecha', time: 'Hora', event: 'Evento',
  noEventsInRange: 'No hay eventos en este período',
}

const EVENT_COLORS = {
  siembra: '#16a34a',
  cosecha: '#ea580c',
  pago_pendiente: '#dc2626',
  servicio_hogar: '#2563eb',
  actividad_agricola: '#15803d',
  otro: '#6b7280',
}

// Estilos inline para sobreescribir react-big-calendar completamente
const calendarStyles = `
  .rbc-calendar { background: transparent !important; color: rgba(255,255,255,0.90) !important; }
  .rbc-month-view { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 16px !important; overflow: hidden !important; }
  .rbc-header { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.55) !important; font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; padding: 10px 8px !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
  .rbc-header + .rbc-header { border-left: 1px solid rgba(255,255,255,0.07) !important; }
  .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.07) !important; min-height: 80px !important; }
  .rbc-day-bg { background: transparent !important; }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.06) !important; }
  .rbc-today { background: rgba(74,222,128,0.08) !important; }
  .rbc-off-range-bg { background: rgba(0,0,0,0.15) !important; }
  .rbc-date-cell { color: rgba(255,255,255,0.75) !important; padding: 4px 8px !important; font-size: 13px !important; font-weight: 500 !important; }
  .rbc-date-cell.rbc-now { color: #4ade80 !important; font-weight: 800 !important; }
  .rbc-off-range .rbc-button-link { color: rgba(255,255,255,0.25) !important; }
  .rbc-button-link { color: rgba(255,255,255,0.75) !important; }
  .rbc-event { background: linear-gradient(135deg,#258a4e,#1a6e3c) !important; border: none !important; border-radius: 6px !important; font-size: 11px !important; font-weight: 600 !important; color: white !important; padding: 2px 6px !important; }
  .rbc-event.rbc-selected { background: linear-gradient(135deg,#16a34a,#15803d) !important; box-shadow: 0 0 0 2px rgba(74,222,128,0.5) !important; }
  .rbc-show-more { color: #4ade80 !important; font-size: 11px !important; font-weight: 700 !important; background: transparent !important; }
  .rbc-toolbar { margin-bottom: 16px !important; }
  .rbc-toolbar button { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.80) !important; border: 1px solid rgba(255,255,255,0.14) !important; border-radius: 99px !important; font-size: 13px !important; font-weight: 600 !important; padding: 6px 16px !important; transition: all 0.15s !important; cursor: pointer !important; }
  .rbc-toolbar button:hover { background: rgba(255,255,255,0.16) !important; color: white !important; }
  .rbc-toolbar button.rbc-active { background: linear-gradient(135deg,#258a4e,#1a6e3c) !important; color: white !important; border-color: transparent !important; }
  .rbc-toolbar-label { color: rgba(255,255,255,0.92) !important; font-weight: 700 !important; font-size: 16px !important; }
  .rbc-agenda-view table { color: rgba(255,255,255,0.85) !important; }
  .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: rgba(255,255,255,0.60) !important; border-color: rgba(255,255,255,0.08) !important; }
  .rbc-agenda-event-cell { color: rgba(255,255,255,0.85) !important; border-color: rgba(255,255,255,0.08) !important; }
  .rbc-agenda-empty { color: rgba(255,255,255,0.45) !important; }
  .rbc-time-view { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 16px !important; }
  .rbc-time-header { background: rgba(255,255,255,0.04) !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
  .rbc-time-content { border-top: none !important; }
  .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
  .rbc-time-slot { color: rgba(255,255,255,0.35) !important; font-size: 11px !important; }
  .rbc-current-time-indicator { background: #4ade80 !important; }
`

export default function CalendarPage() {
  const { events, loading, create, update, remove } = useCalendar()
  const [crops, setCrops] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [prefilledDate, setPrefilledDate] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    getCrops().then(r => setCrops(r.data)).catch(() => {})
  }, [])

  const calendarEvents = events.map(e => {
    const datePart = e.date.split('T')[0]
    const [y, m, d] = datePart.split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const end = new Date(y, m - 1, d, 23, 59)
    return { id: e._id, title: e.title, start, end, resource: e }
  })

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: EVENT_COLORS[event.resource?.type] || EVENT_COLORS.otro,
      borderRadius: '6px',
      border: 'none',
      fontSize: '11px',
      fontWeight: '600',
      color: 'white',
      opacity: event.resource?.completed ? 0.5 : 1,
    },
  })

  const handleSelectSlot = ({ start }) => {
    setEditing(null)
    setPrefilledDate(format(start, 'yyyy-MM-dd'))
    setShowForm(true)
  }

  const handleSelectEvent = (calEvent) => setSelectedEvent(calEvent.resource)

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editing) await update(editing._id, data)
      else await create(data)
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el evento')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      await remove(deleting._id)
      setDeleting(null)
      setSelectedEvent(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-float-up">
      {/* Inyectar estilos del calendario inline para sobreescribir react-big-calendar */}
      <style>{calendarStyles}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Calendario 🗓️</h1>
          <p className="text-white/50 text-sm mt-1">Siembras, cosechas, pagos y actividades</p>
        </div>
        <Button onClick={() => { setEditing(null); setPrefilledDate(''); setShowForm(true) }}>
          + Nuevo evento
        </Button>
      </div>

      {/* Leyenda */}
      <div className="rounded-2xl px-5 py-3 flex flex-wrap gap-3"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}>
        {Object.entries(EVENT_TYPES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: EVENT_COLORS[key] }} />
            <span className="text-xs text-white/65 font-medium">{val.label}</span>
          </div>
        ))}
        <p className="text-xs text-white/30 ml-auto hidden sm:block">Haz clic en un día para agregar un evento</p>
      </div>

      {/* Calendario */}
      <div className="rounded-3xl p-4"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.25)',
        }}>
        <div style={{ height: 560 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            culture="es"
            messages={messages}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            defaultView="month"
            views={['month', 'week', 'agenda']}
          />
        </div>
      </div>

      {/* Panel evento seleccionado */}
      {selectedEvent && (
        <div className="rounded-3xl p-5 animate-float-up"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EVENT_TYPES[selectedEvent.type]?.icon || '📌'}</span>
              <div>
                <h3 className="font-bold text-white font-display">{selectedEvent.title}</h3>
                <p className="text-sm text-white/50">{formatDate(selectedEvent.date)}</p>
                {selectedEvent.crop && <p className="text-xs text-emerald-400">{selectedEvent.crop.name}</p>}
                {selectedEvent.amount > 0 && <p className="text-sm font-semibold text-white/80 mt-1">{formatCurrency(selectedEvent.amount)}</p>}
                {selectedEvent.notes && <p className="text-sm text-white/50 mt-1">{selectedEvent.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge color={selectedEvent.completed ? 'green' : EVENT_TYPES[selectedEvent.type]?.color || 'gray'}>
                {selectedEvent.completed ? '✅ Completado' : EVENT_TYPES[selectedEvent.type]?.label}
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(selectedEvent); setShowForm(true) }}>✏️</Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(selectedEvent)}>🗑️</Button>
              <button onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar evento' : 'Nuevo evento'} size="lg">
        <EventForm
          defaultValues={editing || (prefilledDate ? { date: prefilledDate } : null)}
          crops={crops}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={handleDelete} title="Eliminar evento"
        message={`¿Eliminar "${deleting?.title}"?`} loading={formLoading} />
    </div>
  )
}
