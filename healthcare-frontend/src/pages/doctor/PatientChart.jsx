import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Clock, Calendar, Brain, Loader2 } from 'lucide-react'
import { usePatientData } from '@/hooks/usePatientData'
import { useVitalsChart } from '@/hooks/useVitalsChart'
import { getHistoryTimeline } from '@/api/history'
import { getPatientAppointments } from '@/api/appointments'
import { joinPatientRoom, leavePatientRoom, getSocket } from '@/socket/socket'
import PatientHeader from '@/components/patient/PatientHeader'
import VitalsLatestCard from '@/components/vitals/VitalsLatestCard'
import VitalsForm from '@/components/vitals/VitalsForm'
import AddRecordModal from '@/components/history/AddRecordModal'
import Timeline from '@/components/history/Timeline'
import AppointmentCard from '@/components/appointments/AppointmentCard'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import HeartRateChart from '@/components/charts/HeartRateChart'
import BloodPressureChart from '@/components/charts/BloodPressureChart'
import SugarChart from '@/components/charts/SugarChart'
import SpO2Chart from '@/components/charts/SpO2Chart'
import VitalsSummaryCards from '@/components/charts/VitalsSummaryCards'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'vitals',       label: 'Vitals',      icon: Activity },
  { id: 'history',      label: 'History',      icon: Clock },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'ai',           label: 'AI Analysis',  icon: Brain },
]

const ChartSection = ({ title, children }) => (
  <div className="glass-card p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">{title}</p>
    {children}
  </div>
)

export default function PatientChart() {
  const { patientID } = useParams()
  const [tab, setTab]               = useState('vitals')
  const [vitalsOpen, setVitalsOpen] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [bookOpen, setBookOpen]     = useState(false)
  const [timeline, setTimeline]     = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [appointments, setAppointments]       = useState([])
  const [apptLoading, setApptLoading]         = useState(false)

  // latestVitals is managed locally so it updates instantly after recording
  const [latestVitals, setLatestVitals] = useState(null)

  const { data: patientData, loading: patientLoading, refetch: refetchPatient } = usePatientData(patientID)
  const { chartData, summary, loading: vitalsLoading, appendReading, refetch: refetchVitals } = useVitalsChart(patientID, 50)

  // Seed latestVitals from summary on first load only
  useEffect(() => {
    if (patientData?.latestVitals && !latestVitals) {
      setLatestVitals(patientData.latestVitals)
    }
  }, [patientData])

  // Socket.IO real-time updates
  useEffect(() => {
    joinPatientRoom(patientID)
    const socket = getSocket()
    if (!socket) return

    socket.on('vitals:new', (data) => {
      if (data.reading) {
        appendReading(data.reading)
        setLatestVitals(data.reading) // always update from socket too
      }
      if (data.hasAlerts) toast(`⚠ ${data.alerts?.length} alert(s) on new reading`, { icon: '⚠️' })
    })

    socket.on('vitals:critical', (data) => {
      toast.error(`🚨 Critical vitals: ${data.patientName || data.patientID}`, { duration: 10000 })
    })

    socket.on('history:new', () => {
      if (tab === 'history') fetchTimeline()
    })

    return () => {
      leavePatientRoom(patientID)
      socket.off('vitals:new')
      socket.off('vitals:critical')
      socket.off('history:new')
    }
  }, [patientID])

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true)
    try {
      const res = await getHistoryTimeline(patientID)
      setTimeline(res.data.timeline || [])
    } catch { toast.error('Failed to load history') }
    finally { setTimelineLoading(false) }
  }, [patientID])

  const fetchAppointments = useCallback(async () => {
    setApptLoading(true)
    try {
      const res = await getPatientAppointments(patientID)
      setAppointments(res.data.appointments || [])
    } catch { toast.error('Failed to load appointments') }
    finally { setApptLoading(false) }
  }, [patientID])

  useEffect(() => {
    if (tab === 'history')      fetchTimeline()
    if (tab === 'appointments') fetchAppointments()
  }, [tab])

  // Called when new vitals are submitted via the form
  const handleVitalsSuccess = (reading) => {
    if (reading) {
      setLatestVitals(reading)   // update card immediately with full reading incl. weight
      appendReading(reading)     // update charts
    }
    refetchVitals()              // refresh summary stats
    refetchPatient()             // refresh header counts
  }

  if (patientLoading) return <PageLoader />

  const patient = patientData?.patient
  const stats   = patientData?.stats

  return (
    <div>
      <PatientHeader
        patient={patient}
        stats={stats}
        latestVitals={latestVitals}
        hasCritical={false}
        onRecordVitals={() => setVitalsOpen(true)}
        onAddRecord={() => setRecordOpen(true)}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl"
        style={{ background: 'rgba(13,27,46,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200',
              tab === id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* TAB: Vitals */}
      {tab === 'vitals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Latest Reading</p>
            <VitalsLatestCard reading={latestVitals} />
          </div>

          {vitalsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState icon={Activity} title="No vitals recorded yet" description="Record the first vitals to see trends." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartSection title="❤ Heart Rate (bpm)">
                  <HeartRateChart data={chartData} />
                </ChartSection>
                <ChartSection title="🩺 Blood Pressure (mmHg)">
                  <BloodPressureChart data={chartData} />
                </ChartSection>
                <ChartSection title="🩸 Blood Sugar (mg/dL)">
                  <SugarChart data={chartData} />
                </ChartSection>
                <ChartSection title="💨 SpO₂ (%)">
                  <SpO2Chart data={chartData} />
                </ChartSection>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Summary Statistics</p>
                <VitalsSummaryCards summary={summary} />
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* TAB: History */}
      {tab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {timelineLoading
            ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-500" /></div>
            : <Timeline timeline={timeline} />
          }
        </motion.div>
      )}

      {/* TAB: Appointments */}
      {tab === 'appointments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setBookOpen(true)} className="btn-primary">
              <Calendar size={14} /> Book Appointment
            </button>
          </div>
          {apptLoading
            ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-500" /></div>
            : appointments.length === 0
            ? <EmptyState icon={Calendar} title="No appointments" description="No appointments found for this patient." />
            : <div className="space-y-3">
                {appointments.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} onRefresh={fetchAppointments} />
                ))}
              </div>
          }
        </motion.div>
      )}

      {/* TAB: AI */}
      {tab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AIAnalysisPanel patientID={patientID} />
        </motion.div>
      )}

      {/* Modals */}
      <VitalsForm
        isOpen={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        patientID={patientID}
        onSuccess={handleVitalsSuccess}
      />
      <AddRecordModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        patientID={patientID}
        onSuccess={() => { if (tab === 'history') fetchTimeline() }}
      />
      <BookAppointmentModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        defaultPatientID={patientID}
        onSuccess={fetchAppointments}
      />
    </div>
  )
}