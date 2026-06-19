import { useState, useEffect, useCallback } from 'react'
import {
  getMarketLists, createMarketList,
  updateMarketList, deleteMarketList,
  addMarketItem, updateMarketItem, deleteMarketItem
} from '../services/marketService'
import toast from 'react-hot-toast'

export const useMarketLists = () => {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMarketLists()
      setLists(res.data)
    } catch {
      toast.error('Error al cargar las listas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLists() }, [fetchLists])

  const createList = async (data) => {
    await createMarketList(data)
    toast.success('Lista creada')
    fetchLists()
  }

  const updateList = async (id, data) => {
    await updateMarketList(id, data)
    toast.success('Lista actualizada')
    fetchLists()
  }

  const removeList = async (id) => {
    await deleteMarketList(id)
    toast.success('Lista eliminada')
    fetchLists()
  }

  const addItem = async (listId, data) => {
    await addMarketItem(listId, data)
    fetchLists()
  }

  const updateItem = async (id, data) => {
    await updateMarketItem(id, data)
  }

  const removeItem = async (id) => {
    await deleteMarketItem(id)
  }

  return { lists, loading, createList, updateList, removeList, addItem, updateItem, removeItem, refetch: fetchLists }
}
