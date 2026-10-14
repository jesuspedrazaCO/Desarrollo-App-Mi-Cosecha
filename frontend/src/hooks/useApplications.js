import { useState, useEffect, useCallback } from 'react'
import {
  getApplications,
  getApplicationSummary,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../services/applicationService'
import toast from 'react-hot-toast'

export const useApplications = (initialParams = {}) => {
  const [applications, setApplications] = useState([])
  const [summary, setSummary] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getApplications(params)
      setApplications(res.data.applications)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Error al cargar los insumos aplicados')
    } finally {
      setLoading(false)
    }
  }, [params])

  const fetchSummary = useCallback(async () => {
    if (!params.crop) {
      setLoadingSummary(false)
      return
    }
    setLoadingSummary(true)
    try {
      const res = await getApplicationSummary(params.crop)
      setSummary(res.data.summary)
    } catch {
      // silencioso — el contador no es crítico, la pantalla sigue funcionando
    } finally {
      setLoadingSummary(false)
    }
  }, [params.crop])

  useEffect(() => { fetchApplications() }, [fetchApplications])
  useEffect(() => { fetchSummary() }, [fetchSummary])

  const create = async (data) => {
    await createApplication(data)
    toast.success('Insumo registrado')
    fetchApplications()
    fetchSummary()
  }

  const update = async (id, data) => {
    await updateApplication(id, data)
    toast.success('Registro actualizado')
    fetchApplications()
    fetchSummary()
  }

  const remove = async (id) => {
    await deleteApplication(id)
    toast.success('Registro eliminado')
    fetchApplications()
    fetchSummary()
  }

  return {
    applications, total, totalPages, loading,
    summary, loadingSummary,
    params, setParams,
    create, update, remove,
    refetch: fetchApplications,
  }
}