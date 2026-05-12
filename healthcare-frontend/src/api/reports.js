import { API_URL } from '@/utils/constants'

export const downloadPDF = async (url, filename) => {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to download PDF')
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const downloadSummaryPDF = (patientID) =>
  downloadPDF(`/api/reports/patient/${patientID}/summary`, `${patientID}_summary.pdf`)

export const downloadVitalsPDF = (patientID, from, to) => {
  const params = from && to ? `?from=${from}&to=${to}` : ''
  return downloadPDF(`/api/reports/patient/${patientID}/vitals${params}`, `${patientID}_vitals.pdf`)
}
