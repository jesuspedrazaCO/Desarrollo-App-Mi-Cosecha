import { useState, useEffect, useCallback } from 'react'
import { getReceipts, uploadReceipt, deleteReceipt } from '../services/receiptService'
import toast from 'react-hot-toast'

export const useReceipts = (initialParams = {}) => {
  const [receipts, setReceipts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(initialParams)

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReceipts(params)
      setReceipts(res.data.receipts)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Error al cargar comprobantes')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchReceipts() }, [fetchReceipts])

  const upload = async (formData) => {
    await uploadReceipt(formData)
    toast.success('Comprobante subido correctamente')
    fetchReceipts()
  }

  const remove = async (id) => {
    await deleteReceipt(id)
    toast.success('Comprobante eliminado')
    fetchReceipts()
  }

  return { receipts, total, totalPages, loading, params, setParams, upload, remove, refetch: fetchReceipts }
}
