import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    // Animate the loading dots
    const timer = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    
    // Auto-complete the splash screen after 3 seconds
    const finish = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => {
      clearInterval(timer)
      clearTimeout(finish)
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-surface overflow-hidden"
    >
      {/* Ambient radar wave circles representing clustering */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[300px] h-[300px] rounded-full border border-indigo-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-[450px] h-[450px] rounded-full border border-violet-500/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] style={{ animationDelay: '200ms' }}"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full border border-emerald-500/10 animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite] style={{ animationDelay: '400ms' }}"></div>
      </div>

      {/* Glassmorphic Logo Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative z-10 bg-surface-overlay/50 backdrop-blur-xl border border-border-subtle p-8 rounded-3xl shadow-2xl shadow-indigo-500/10 mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-3xl pointer-events-none"></div>
        <Cpu className="w-20 h-20 text-indigo-400 relative z-10 animate-pulse" strokeWidth={1.5} />
      </motion.div>

      {/* Title sliding up into view */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4"
      >
        SciKit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Hero</span>
      </motion.h1>

      {/* Loading Pipeline Tracker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="relative z-10 text-sm font-medium text-text-secondary tracking-widest uppercase font-mono"
      >
        Loading Pipeline<span className="inline-block w-8 text-left">{dots}</span>
      </motion.div>
    </motion.div>
  )
}
