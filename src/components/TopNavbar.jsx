import { FileDown, Cpu, Sparkles, Menu } from 'lucide-react'
import { usePdfExport } from '../hooks/useExport.js'
import { ShimmerButton } from './ui/AceternityComponents.jsx'

const TOPIC_LABELS = {
  knn: 'K-Nearest Neighbors',
  'linear-regression': 'Linear Regression',
  'k-means': 'K-Means Clustering',
  pca: 'Principal Component Analysis',
  preprocessing: 'Data Preprocessing',
}

export default function TopNavbar({ contentRef, activeTopic, onToggleMenu }) {
  const exportPdf = usePdfExport(contentRef, activeTopic)

  return (
    <header
      className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-surface-raised/80 px-4 sm:px-6 backdrop-blur-xl z-20 no-print"
      data-no-print
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMenu}
          className="md:hidden flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
          <Cpu className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-text-primary">
            ScikitHero
          </h1>
          <p className="text-[10px] text-text-muted font-medium tracking-wider uppercase">
            {TOPIC_LABELS[activeTopic] || activeTopic}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 border border-brand-500/20">
          <Sparkles className="h-3 w-3 text-brand-400" />
          <span className="text-[10px] font-medium text-brand-300">Interactive Live</span>
        </div>
        <ShimmerButton onClick={exportPdf}>
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Export Full Chapter (PDF)</span>
          <span className="sm:hidden">PDF</span>
        </ShimmerButton>
      </div>
    </header>
  )
}
