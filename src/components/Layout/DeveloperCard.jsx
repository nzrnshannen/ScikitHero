import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User, Mail, MessageSquare } from 'lucide-react'

export default function DeveloperCard({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle') // 'idle', 'loading', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    
    const formData = new FormData(e.target)
    
    // Web3Forms endpoint integration
    // Note: To send emails to nzrnshannen.work1@gmail.com, 
    // generate an Access Key at https://web3forms.com/
    formData.append("access_key", import.meta.env.VITE_WEB3FORMS_ACCESS_KEY)
    formData.append("subject", "New Message from MachineHero Playground!")
    formData.append("from_name", "MachineHero App")

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      
      if (data.success) {
        setStatus('success')
        e.target.reset()
        // Optional: auto-close after a few seconds
        setTimeout(() => {
          setStatus('idle')
          onClose()
        }, 3000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm print:hidden"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-2xl print:hidden overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header & Bio */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                Meet the Dev 👩‍💻
              </h2>
              <div className="text-sm leading-relaxed text-slate-300">
                <p>
                  Hi, I'm <strong className="text-indigo-400 font-medium">Shannen Nazareno!</strong> ⚡
                </p>
                <p className="mt-2">
                  I'm the one who built this interactive machine learning notebook. I created this playground to make mastering Scikit-Learn intuitive, dynamic, and easy to visualize. If you want to collaborate, swap data ideas, suggest features, or if you spot any errors in the notes, please drop me a message below!
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your Name"
                  className="w-full bg-slate-900/60 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your Email"
                  className="w-full bg-slate-900/60 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="relative mb-4">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                </div>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Message / Suggestions"
                  className="w-full bg-slate-900/60 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 font-medium py-3 rounded-xl transition-all text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="animate-pulse">Sending...</span>
                ) : status === 'success' ? (
                  <span>Sent!</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-emerald-400 mt-4 font-medium bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-500/20"
                >
                  Message sent! Shannen will get back to you soon.
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-rose-400 mt-4 font-medium bg-rose-500/10 py-2.5 rounded-xl border border-rose-500/20"
                >
                  Oops! Something went wrong. Make sure you added your Web3Forms access key.
                </motion.div>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
