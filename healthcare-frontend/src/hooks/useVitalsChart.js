import { useState, useEffect, useCallback } from 'react'
import { getVitalsHistory, getVitalsSummary } from '@/api/vitals'
import { fChartDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

export const useVitalsChart = (patientID, limit = 50) => {
  const [readings, setReadings] = useState([])
  const [chartData, setChartData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const formatChartData = (rawReadings) => {
    return rawReadings.map((r) => ({
      date: fChartDate(r.recordedAt),
      fullDate: r.recordedAt,
      heartRate: r.heartRate,
      bpSystolic: r.bpSystolic,
      bpDiastolic: r.bpDiastolic,
      sugar: r.sugar,
      spo2: r.spo2,
      temperature: r.temperature,
      weight: r.weight,
      hospital: r.hospital?.name,
    }))
  }

  const fetchData = useCallback(async () => {
    if (!patientID) return
    try {
      setLoading(true)
      const [histRes, sumRes] = await Promise.all([
        getVitalsHistory(patientID, { limit }),
        getVitalsSummary(patientID),
      ])
      const raw = histRes.data.readings || []
      setReadings(raw)
      setChartData(formatChartData(raw))
      setSummary(sumRes.data.summary)
    } catch (err) {
      toast.error('Failed to load vitals data')
    } finally {
      setLoading(false)
    }
  }, [patientID, limit])

  useEffect(() => { fetchData() }, [fetchData])

  const appendReading = (reading) => {
    setReadings((prev) => {
      const next = [...prev, reading]
      setChartData(formatChartData(next))
      return next
    })
  }

  return { readings, chartData, summary, loading, refetch: fetchData, appendReading }
}
