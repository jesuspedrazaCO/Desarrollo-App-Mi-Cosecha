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
  siembra: '#2d6f43',
  cosecha: '#df7e42',
  pago_pendiente: '#dc2626',
  servicio_hogar: '#2563eb',
  actividad_agricola: '#5dab74',
  otro: '#79766b',
}

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

  // Convertir eventos a formato de react-big-calendar
  const calendarEvents = events.map(e => {
    const datePart = e.date.split('T')[0]
    const [y, m, d] = datePart.split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const end = new Date(y, m - 1, d)
    end.setHours(23, 59, 59)
    return { id: e._id, title: e.title, start, end, resource: e }
  })

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: EVENT_COLORS[event.resource?.type] || EVENT_COLORS.otro,
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '600',
      opacity: event.resource?.completed ? 0.5 : 1,
    },
  })

  const handleSelectSlot = ({ start }) => {
    setEditing(null)
    setPrefilledDate(format(start, 'yyyy-MM-dd'))
    setShowForm(true)
  }

  const handleSelectEvent = (calEvent) => {
    setSelectedEvent(calEvent.resource)
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Calendario 🗓️</h1>
          <p className="text-stone-500 text-sm mt-1">Siembras, cosechas, pagos y actividades</p>
        </div>
        <Button onClick={() => { setEditing(null); setPrefilledDate(''); setShowForm(true) }}>
          + Nuevo evento
        </Button>
      </div>

      {/* Leyenda */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-soft px-5 py-3 flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: EVENT_COLORS[key] }} />
            <span className="text-xs text-stone-600 font-medium">{val.label}</span>
          </div>
        ))}
        <p className="text-xs text-stone-400 ml-auto hidden sm:block">Haz clic en un día para agregar un evento</p>
      </div>

      {/* Calendario */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-4">
        <div style={{ height: 580 }}>
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

      {/* Panel del evento seleccionado */}
      {selectedEvent && (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EVENT_TYPES[selectedEvent.type]?.icon || '📌'}</span>
              <div>
                <h3 className="font-bold text-stone-900 font-display">{selectedEvent.title}</h3>
                <p className="text-sm text-stone-500">{formatDate(selectedEvent.date)}</p>
                {selectedEvent.crop && <p className="text-xs text-accent-600">{selectedEvent.crop.name}</p>}
                {selectedEvent.amount > 0 && <p className="text-sm font-semibold text-primary-700 mt-1">{formatCurrency(selectedEvent.amount)}</p>}
                {selectedEvent.notes && <p className="text-sm text-stone-500 mt-1">{selectedEvent.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge color={selectedEvent.completed ? 'green' : EVENT_TYPES[selectedEvent.type]?.color || 'gray'}>
                {selectedEvent.completed ? '✅ Completado' : EVENT_TYPES[selectedEvent.type]?.label}
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(selectedEvent); setShowForm(true) }}>✏️ Editar</Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(selectedEvent)}>🗑️</Button>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar evento' : 'Nuevo evento'}
        size="lg"
      >
        <EventForm
          defaultValues={editing || (prefilledDate ? { date: prefilledDate } : null)}
          crops={crops}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar evento"
        message={`¿Eliminar "${deleting?.title}"?`}
        loading={formLoading}
      />
    </div>
  )
}
