import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart, Activity, Brain, Shield, Building2, Users, Database,
  ArrowRight, Check, Mail, Github, Globe, Zap, Clock, Lock,
  ChevronRight, Star, TrendingUp, Bell
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const FEATURES = [
  {
    icon: Database,
    color: '#3b82f6',
    title: 'Unified Health Records',
    desc: 'One continuous medical record that follows the patient across every hospital — Apollo Delhi in 2020, City Hospital Mumbai in 2025, same chart.',
  },
  {
    icon: Activity,
    color: '#f43f5e',
    title: 'Real-time Vitals Monitoring',
    desc: 'Live vitals streaming via WebSockets. Critical alerts broadcast instantly to all clinical staff on the floor.',
  },
  {
    icon: Brain,
    color: '#8b5cf6',
    title: 'AI-Powered Clinical Insights',
    desc: 'Gemini AI analyzes vitals trends and full patient charts, flagging concerns and suggesting next steps for the doctor.',
  },
  {
    icon: Shield,
    color: '#10b981',
    title: 'Role-Based Access Control',
    desc: 'Doctors, nurses, admins, and patients each see exactly what they need — nothing more, nothing less.',
  },
  {
    icon: Bell,
    color: '#f59e0b',
    title: 'Intelligent Alerting',
    desc: 'Automatic critical threshold detection on every vitals entry. Alerts fire before the doctor even submits the form.',
  },
  {
    icon: Lock,
    color: '#06b6d4',
    title: 'Secure by Design',
    desc: 'JWT auth with auto-refresh, hospital-scoped data isolation, and encrypted transmission end to end.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Hospital registers', desc: 'Gets a unique registration code to onboard their staff.' },
  { step: '02', title: 'Staff join their hospital', desc: 'Doctors and nurses register using the hospital code.' },
  { step: '03', title: 'Patient walks in anywhere', desc: 'One ID, one record — visible to every hospital treating them.' },
  { step: '04', title: 'Doctor sees everything', desc: 'Full history, AI analysis, live vitals, and appointments in one view.' },
]

const STATS = [
  { value: '500+', label: 'Hospitals' },
  { value: '1M+', label: 'Patients' },
  { value: '50M+', label: 'Records' },
  { value: '99.9%', label: 'Uptime' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#020817' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,58,95,0.3)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">Swasthify</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary py-2 text-sm">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #2563eb, transparent)', transform: 'translate(-50%,-50%)' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(30,58,95,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
            <Zap size={11} />
            AI-powered · Real-time · Multi-hospital
          </motion.div>

          <motion.h1 {...fadeUp(0.05)} className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            One patient.<br />
            <span className="text-gradient">Every hospital.</span><br />
            One record.
          </motion.h1>

          <motion.p {...fadeUp(0.1)} className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Swasthify connects hospitals into a single healthcare network — so a patient treated anywhere has their complete history, vitals, and appointments accessible in seconds.
          </motion.p>

          <motion.div {...fadeUp(0.15)} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto justify-center">
              Open dashboard <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto justify-center">
              Register as patient
            </Link>
          </motion.div>

          {/* Floating vitals card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            animate={{ y: [0, -8, 0] }}
            className="mt-16 max-w-lg mx-auto glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium">Live · Rahul Mehta</span>
              </div>
              <span className="mono text-xs text-blue-400">PAT-2026-0001</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Heart Rate', value: '72', unit: 'bpm', color: '#f43f5e', status: 'Normal' },
                { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', color: '#3b82f6', status: 'Normal' },
                { label: 'SpO₂', value: '98.5', unit: '%', color: '#8b5cf6', status: 'Normal' },
              ].map((v) => (
                <div key={v.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.2)' }}>
                  <p className="mono text-xl font-bold" style={{ color: v.color }}>{v.value}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{v.unit}</p>
                  <p className="text-slate-400 text-[10px]">{v.label}</p>
                  <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">{v.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 md:px-12 border-y border-navy-600/30"
        style={{ background: 'rgba(13,27,46,0.3)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.05)} className="text-center">
              <p className="font-display text-4xl font-bold text-white">{s.value}</p>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-wide mb-3">Features</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Built for clinical reality</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Every feature is designed around how hospitals actually work — not how we wish they did.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.05)} className="glass-card p-6 hover:bg-navy-750/40 transition-colors">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12" style={{ background: 'rgba(13,27,46,0.2)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-wide mb-3">How it works</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Up and running in minutes</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} {...fadeUp(i * 0.08)} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(90deg, rgba(30,58,95,0.6), transparent)' }} />
                )}
                <div className="glass-card p-5 relative z-10">
                  <span className="mono text-3xl font-bold text-blue-500/30">{step.step}</span>
                  <h3 className="font-semibold text-slate-200 mt-3 mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-violet-400 text-sm font-medium uppercase tracking-wide mb-3">Roles</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Something for everyone</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2, color: '#3b82f6', title: 'Hospitals',
                points: ['Register and get a unique code', 'Onboard all clinical staff', 'Full appointment management', 'Hospital-wide analytics dashboard'],
              },
              {
                icon: Activity, color: '#10b981', title: 'Doctors & Nurses',
                points: ['Full patient chart access', 'Record and monitor vitals', 'AI-powered clinical insights', 'Schedule and confirm appointments'],
              },
              {
                icon: Users, color: '#8b5cf6', title: 'Patients',
                points: ['Self-register in 60 seconds', 'View your own health records', 'Track vitals over time', 'See all your appointments'],
              },
            ].map((card, i) => (
              <motion.div key={card.title} {...fadeUp(i * 0.08)} className="glass-card p-6">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-4">{card.title}</h3>
                <ul className="space-y-2.5">
                  {card.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp()} className="glass-card p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12), transparent 70%)' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 glow-blue">
                <Heart size={24} className="text-white" />
              </div>
              <h2 className="font-display text-4xl font-bold text-white mb-4">Ready to connect your hospital?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join the network. Give your patients a health record that actually follows them.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto justify-center">
                  Open dashboard <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto justify-center">
                  Register as patient
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer className="border-t border-navy-600/30 py-16 px-6 md:px-12"
        style={{ background: 'rgba(5,11,26,0.9)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <span className="font-display font-bold text-white">Swasthify</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                A multi-hospital patient health record network. Built for doctors, nurses, admins, and patients.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-slate-300 font-medium text-sm mb-4">Quick links</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Doctor login', to: '/login' },
                  { label: 'Patient login', to: '/login' },
                  { label: 'Register as patient', to: '/register' },
                ].map((l) => (
                  <Link key={l.label} to={l.to}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-blue-400 text-sm transition-colors">
                    <ChevronRight size={12} />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-slate-300 font-medium text-sm mb-4">Get in touch</p>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Have questions, found a bug, or want to connect a new hospital? Reach out.
              </p>
              <a
                href="mailto:aadi02anu07@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-400 transition-all hover:text-blue-300"
                style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <Mail size={15} />
                aadi02anu07@gmail.com
              </a>
              <div className="flex items-center gap-3 mt-4">
                <a href="https://github.com/aadi02anu07" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                  style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <Github size={16} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-navy-600/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-600 text-xs">© 2026 Swasthify. Built with React, Node.js, and MongoDB.</p>
            <p className="text-slate-600 text-xs">Powered by Gemini AI · Deployed on Vercel + Render</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
