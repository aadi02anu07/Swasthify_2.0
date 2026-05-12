import { useState } from 'react'
import { User, Download, Plus, Activity, ChevronDown, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { fAge, fDate } from '@/utils/formatters'
import { downloadSummaryPDF, downloadVitalsPDF } from '@/api/reports'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

export default function PatientHeader({ patient, stats, latestVitals, hasCritical, onRecordVitals, onAddRecord }) {
  const { user } = useAuthStore()
  const [dlOpen, setDlOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const isStaff = user?.type === 'staff'

  const handleDownload = async (type) => {
    setDlOpen(false)
    setDownloading(true)
    try {
      if (type === 'summary') await downloadSummaryPDF(patient.patientID)
      else await downloadVitalsPDF(patient.patientID)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="glass-card p-5 mb-6">
      {hasCritical && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm font-medium text-rose-300"
          style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', animation: 'pulse-border 2s ease infinite' }}
        >
          <AlertCircle size={16} className="text-rose-400 shrink-0 animate-pulse" />
          Critical vitals detected — immediate review recommended
        </motion.div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/20 flex items-center justify-center">
            <User size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="section-title text-2xl">{patient?.name}</h1>
            <p className="mono text-blue-400 text-sm mt-0.5">{patient?.patientID}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {patient?.dob && <span className="text-slate-400 text-sm">{fAge(patient.dob)}</span>}
              {patient?.bloodGroup && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mono font-medium">
                  {patient.bloodGroup}
                </span>
              )}
              {patient?.gender && (
                <span className="text-slate-400 text-sm capitalize">{patient.gender}</span>
              )}
              {patient?.phone && <span className="text-slate-500 text-sm">{patient.phone}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-4 mr-2">
            <div className="text-center">
              <p className="mono text-lg font-semibold text-blue-400">{stats?.totalVitals ?? 0}</p>
              <p className="text-xs text-slate-500">Vitals</p>
            </div>
            <div className="text-center">
              <p className="mono text-lg font-semibold text-violet-400">{stats?.totalHistory ?? 0}</p>
              <p className="text-xs text-slate-500">Records</p>
            </div>
          </div>

          {isStaff && (
            <>
              <button onClick={onRecordVitals} className="btn-primary">
                <Activity size={15} />
                Record Vitals
              </button>
              <button onClick={onAddRecord} className="btn-secondary">
                <Plus size={15} />
                Add Record
              </button>
              <div className="relative">
                <button
                  onClick={() => setDlOpen(!dlOpen)}
                  disabled={downloading}
                  className="btn-secondary"
                >
                  <Download size={15} />
                  {downloading ? 'Downloading…' : 'Download'}
                  <ChevronDown size={13} />
                </button>
                {dlOpen && (
                  <div className="absolute right-0 top-11 w-44 glass-card-elevated shadow-xl z-10 overflow-hidden rounded-xl">
                    <button onClick={() => handleDownload('summary')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-navy-700/50 hover:text-white transition-colors">
                      Summary Report
                    </button>
                    <button onClick={() => handleDownload('vitals')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-navy-700/50 hover:text-white transition-colors">
                      Vitals History
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {patient?.emergencyContact && (
        <div className="mt-3 pt-3 border-t border-navy-600/30">
          <p className="text-xs text-slate-500">
            Emergency contact: <span className="text-slate-300">{patient.emergencyContact}</span>
          </p>
        </div>
      )}
    </div>
  )
}
