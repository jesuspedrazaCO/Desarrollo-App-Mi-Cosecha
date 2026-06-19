import { useState, useEffect, useCallback } from 'react'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/calendarService'
import toast from 'react-hot-toast'

export const useCalendar = (initialParams = {}) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEvents(params)
      setEvents(res.data)
    } catch {
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const create = async (data) => {
    await createEvent(data)
    toast.success('Evento creado')
    fetchEvents()
  }

  const update = async (id, data) => {
    await updateEvent(id, data)
    toast.success('Evento actualizado')
    fetchEvents()
  }

  const remove = async (id) => {
    await deleteEvent(id)
    toast.success('Evento eliminado')
    fetchEvents()
  }

  return { events, loading, params, setParams, create, update, remove, refetch: fetchEvents }
}
