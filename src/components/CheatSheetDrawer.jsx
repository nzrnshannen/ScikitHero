import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Code2, Copy, Check } from 'lucide-react'

const CHEAT_SHEET = [
  {
    category: 'Model Selection & Validation',
    code: `from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold`,
  },
  {
    category: 'Preprocessing & Scaling',
    code: `from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder`,
  },
  {
    category: 'Pipelines & Composition',
    code: `from sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import Pipeline`,
  },
]

export default function CheatSheetDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="border-b border-white/[0.06] bg-surface-raised/80 backdrop-blur-md sticky top-0 z-40 no-print" data-no-print>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Estimator Lifecycle & Code Checklist
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0a0c10]"
          >
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/[0.06]">
              {CHEAT_SHEET.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">
                    {section.category}
                  </p>
                  <div className="relative group rounded bg-white/[0.03] border border-white/[0.06] p-2 pr-8 font-mono text-[11px] text-brand-100 overflow-x-auto whitespace-pre">
                    {section.code}
                    <button
                      onClick={() => handleCopy(section.code, idx)}
                      className="absolute top-2 right-2 p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-text-muted hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
