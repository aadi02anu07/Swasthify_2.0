import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { registerPatient } from '@/api/auth'
import { BLOOD_GROUPS } from '@/utils/constants'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [patientID, setPatientID] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '', dob: '', bloodGroup: '', gender: '', phone: '', password: '',
  })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Object.values(form).some((v) => !v)) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const res = await registerPatient(form)
      const id = res.data.patient?.patientID
      setPatientID(id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(patientID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (patientID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 page-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-slate-400 text-sm mb-8">Your health record has been created. Save your Patient ID — you'll need it to log in.</p>

          <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(37,99,235,0.1)', border: '2px dashed rgba(59,130,246,0.4)' }}>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Your Patient ID</p>
            <p className="mono text-3xl font-bold text-blue-400">{patientID}</p>
          </div>

          <button onClick={handleCopy} className="btn-secondary w-full mb-3">
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Patient ID</>}
          </button>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            Continue to Login
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
          <p className="font-display font-bold text-white text-lg">Swasthify</p>
        </div>

        <h2 className="font-display text-3xl font-bold text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-8">Register as a new patient</p>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input value={form.name} onChange={update('name')} placeholder="Rahul Mehta" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth *</label>
              <input value={form.dob} onChange={update('dob')} type="date" className="input-field"
                max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select value={form.gender} onChange={update('gender')} className="select-field">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Blood Group *</label>
              <select value={form.bloodGroup} onChange={update('bloodGroup')} className="select-field">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input value={form.phone} onChange={update('phone')} placeholder="9876543210" className="input-field mono" type="tel" />
            </div>
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Min 8 characters"
                className="input-field pr-11"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
