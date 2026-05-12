import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Heart, Activity, Shield, Users, Database, Clock, Loader2 } from 'lucide-react'
import { loginStaff, loginPatient, loginHospital } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

const ROLES = [
  { id: 'staff',    label: 'Doctor / Nurse', icon: Activity,  desc: 'Clinical staff access' },
  { id: 'patient',  label: 'Patient',         icon: Users,     desc: 'View your health records' },
  { id: 'hospital', label: 'Hospital Admin',  icon: Shield,    desc: 'Hospital management' },
]

const STATS = [
  { value: '500+',   label: 'Hospitals' },
  { value: '1M+',    label: 'Patients' },
  { value: '50M+',   label: 'Records' },
  { value: '99.9%',  label: 'Uptime' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [role, setRole] = useState('staff')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: '', password: '' })

  const idLabel = role === 'staff' ? 'Staff ID' : role === 'patient' ? 'Patient ID' : 'Email'
  const idPlaceholder = role === 'staff' ? 'DOC-001' : role === 'patient' ? 'PAT-2026-0001' : 'admin@hospital.com'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      let res
      if (role === 'staff') res = await loginStaff(form.id, form.password)
      else if (role === 'patient') res = await loginPatient(form.id, form.password)
      else res = await loginHospital(form.id, form.password)

      const { accessToken, refreshToken } = res.data
      const rawUser = res.data.staff || res.data.patient || res.data.hospital

      let user
      if (role === 'staff') {
        user = { ...rawUser, type: 'staff' }
      } else if (role === 'patient') {
        user = { ...rawUser, type: 'patient' }
      } else {
        user = { ...rawUser, type: 'hospital', role: 'admin' }
      }

      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.name}!`)

      if (user.type === 'patient') navigate('/patient')
      else if (user.role === 'admin' || user.type === 'hospital') navigate('/admin')
      else navigate('/doctor')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#020817' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
          {/* Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(30,58,95,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center glow-blue">
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-xl">Swasthify</p>
            <p className="text-xs text-slate-500">Healthcare Network</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-4">
            The future of<br />
            <span className="text-gradient">connected</span><br />
            healthcare.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            One continuous medical record across every hospital. Instant access to patient history, AI-powered insights, and real-time vitals monitoring.
          </p>

          {/* Animated vitals card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-10 glass-card p-5 max-w-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">Live Monitoring</span>
              </div>
              <span className="mono text-xs text-slate-500">PAT-2026-0001</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'HR', value: '72', unit: 'bpm', color: '#f43f5e' },
                { label: 'BP', value: '118/76', unit: 'mmHg', color: '#3b82f6' },
                { label: 'SpO₂', value: '98.5', unit: '%', color: '#8b5cf6' },
              ].map((v) => (
                <div key={v.label} className="text-center">
                  <p className="mono text-lg font-semibold" style={{ color: v.color }}>{v.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{v.unit}</p>
                  <p className="text-[10px] text-slate-400">{v.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="mono text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
        style={{ background: 'rgba(5,11,26,0.95)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <p className="font-display font-bold text-white text-lg">Swasthify</p>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-8">Access your healthcare dashboard</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {ROLES.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => { setRole(id); setForm({ id: '', password: '' }) }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 ${
                  role === id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                    : 'border-navy-600/40 text-slate-400 hover:border-navy-600/70 hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-medium leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{idLabel}</label>
              <input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder={idPlaceholder}
                className={`input-field ${role !== 'hospital' ? 'mono' : ''}`}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {role === 'patient' && (
            <p className="text-center text-slate-500 text-sm mt-6">
              New patient?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          )}

          {/* Test credentials helper */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(30,58,95,0.2)', border: '1px solid rgba(30,58,95,0.3)' }}>
            <p className="text-xs text-slate-500 mb-2 font-medium">Test credentials</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Doctor: <span className="mono text-slate-400">DOC-001</span> / <span className="mono text-slate-400">Doctor@123</span></p>
              <p>Patient: <span className="mono text-slate-400">PAT-2026-0001</span> / <span className="mono text-slate-400">Patient@123</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
