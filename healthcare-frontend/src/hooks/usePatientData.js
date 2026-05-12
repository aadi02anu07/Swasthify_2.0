import { useState, useEffect, useCallback } from 'react'
import { getPatientSummary } from '@/api/patients'
import toast from 'react-hot-toast'

export const usePatientData = (patientID) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!patientID) return
    try {
      setLoading(true)
      setError(null)
      const res = await getPatientSummary(patientID)
      setData(res.data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load patient data'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [patientID])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
