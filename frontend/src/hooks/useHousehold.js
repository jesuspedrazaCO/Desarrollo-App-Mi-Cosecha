import { useState, useEffect, useCallback } from 'react'
import {
  getHouseholdExpenses, createHouseholdExpense,
  updateHouseholdExpense, deleteHouseholdExpense
} from '../services/householdService'
import toast from 'react-hot-toast'

export const useHousehold = (initialParams = {}) => {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [byCategory, setByCategory] = useState([])
  const [byMonth, setByMonth] = useState([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getHouseholdExpenses(params)
      setItems(res.data.items)
      setTotal(res.data.total)
      setTotalAmount(res.data.totalAmount)
      setTotalPages(res.data.totalPages)
      setByCategory(res.data.byCategory || [])
      setByMonth(res.data.byMonth || [])
    } catch {
      toast.error('Error al cargar los gastos del hogar')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchItems() }, [fetchItems])

  const create = async (data) => {
    await createHouseholdExpense(data)
    toast.success('Gasto registrado')
    fetchItems()
  }

  const update = async (id, data) => {
    await updateHouseholdExpense(id, data)
    toast.success('Gasto actualizado')
    fetchItems()
  }

  const remove = async (id) => {
    await deleteHouseholdExpense(id)
    toast.success('Gasto eliminado')
    fetchItems()
  }

  return { items, total, totalAmount, totalPages, byCategory, byMonth, loading, params, setParams, create, update, remove, refetch: fetchItems }
}
