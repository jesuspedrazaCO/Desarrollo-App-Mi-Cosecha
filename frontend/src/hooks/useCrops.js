import { useState, useEffect, useCallback } from 'react'
import { getCrops, createCrop, updateCrop, deleteCrop } from '../services/cropService'
import toast from 'react-hot-toast'

export const useCrops = (initialParams = {}) => {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchCrops = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCrops(params)
      setCrops(res.data)
    } catch {
      toast.error('Error al cargar los cultivos')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchCrops() }, [fetchCrops])

  const create = async (data) => {
    await createCrop(data)
    toast.success('Cultivo registrado correctamente')
    fetchCrops()
  }

  const update = async (id, data) => {
    await updateCrop(id, data)
    toast.success('Cultivo actualizado')
    fetchCrops()
  }

  const remove = async (id) => {
    await deleteCrop(id)
    toast.success('Cultivo eliminado')
    fetchCrops()
  }

  return { crops, loading, params, setParams, create, update, remove, refetch: fetchCrops }
}
