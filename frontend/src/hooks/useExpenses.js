import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService'
import toast from 'react-hot-toast'

export const useExpenses = (initialParams = {}) => {
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getExpenses(params)
      setExpenses(res.data.expenses)
      setTotal(res.data.total)
      setTotalAmount(res.data.totalAmount)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Error al cargar los gastos')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const create = async (data) => {
    await createExpense(data)
    toast.success('Gasto registrado')
    fetchExpenses()
  }

  const update = async (id, data) => {
    await updateExpense(id, data)
    toast.success('Gasto actualizado')
    fetchExpenses()
  }

  const remove = async (id) => {
    await deleteExpense(id)
    toast.success('Gasto eliminado')
    fetchExpenses()
  }

  return { expenses, total, totalAmount, totalPages, loading, params, setParams, create, update, remove, refetch: fetchExpenses }
}
