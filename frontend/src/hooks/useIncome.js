import { useState, useEffect, useCallback } from 'react'
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../services/incomeService'
import toast from 'react-hot-toast'

export const useIncome = (initialParams = {}) => {
  const [incomes, setIncomes] = useState([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchIncomes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getIncomes(params)
      setIncomes(res.data.incomes)
      setTotal(res.data.total)
      setTotalAmount(res.data.totalAmount)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Error al cargar los ingresos')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchIncomes() }, [fetchIncomes])

  const create = async (data) => {
    await createIncome(data)
    toast.success('Ingreso registrado')
    fetchIncomes()
  }

  const update = async (id, data) => {
    await updateIncome(id, data)
    toast.success('Ingreso actualizado')
    fetchIncomes()
  }

  const remove = async (id) => {
    await deleteIncome(id)
    toast.success('Ingreso eliminado')
    fetchIncomes()
  }

  return { incomes, total, totalAmount, totalPages, loading, params, setParams, create, update, remove, refetch: fetchIncomes }
}
