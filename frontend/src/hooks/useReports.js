import { useState } from 'react'
import {
  getCropsComparison, getAgroExpensesReport,
  getAgroIncomeReport, getHouseholdReport
} from '../services/reportService'
import toast from 'react-hot-toast'

export const useReports = () => {
  const [comparison, setComparison] = useState([])
  const [agroExpenses, setAgroExpenses] = useState(null)
  const [agroIncome, setAgroIncome] = useState(null)
  const [householdReport, setHouseholdReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = async (params = {}) => {
    setLoading(true)
    try {
      const [compRes, expRes, incRes, houseRes] = await Promise.all([
        getCropsComparison(params),
        getAgroExpensesReport(params),
        getAgroIncomeReport(params),
        getHouseholdReport(params),
      ])
      setComparison(compRes.data)
      setAgroExpenses(expRes.data)
      setAgroIncome(incRes.data)
      setHouseholdReport(houseRes.data)
    } catch {
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  return { comparison, agroExpenses, agroIncome, householdReport, loading, fetchAll }
}
