import { useState, useEffect, useCallback } from 'react'
import { getContributors, createContributor, deleteContributor } from '../services/contributorService'
import toast from 'react-hot-toast'

export const useContributors = () => {
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchContributors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getContributors()
      setContributors(res.data.data)
    } catch {
      toast.error('Error al cargar los aportantes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContributors() }, [fetchContributors])

  const create = async (name) => {
    await createContributor(name)
    await fetchContributors()
  }

  const remove = async (id) => {
    await deleteContributor(id)
    await fetchContributors()
  }

  return { contributors, loading, create, remove, refetch: fetchContributors }
}