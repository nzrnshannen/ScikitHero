import { motion } from 'framer-motion'
import { cn } from '../lib/utils.js'
import {
  GitBranch,
  TrendingUp,
  Hexagon,
  Compass,
  SlidersHorizontal,
  Scissors,
  Activity,
  Shield,
  Network,
  Target,
  Layers,
  CircleDot,
  Sliders,
} from 'lucide-react'

const GROUPS = [
  {
    label: 'SUPERVISED LEARNING',
    items: [
      { id: 'knn', label: 'K-Nearest Neighbors', short: 'KNN', icon: GitBranch, color: '#a78bfa' },
      { id: 'linear_regression', label: 'Linear Regression', short: 'LinReg', icon: TrendingUp, color: '#34d399' },
      { id: 'ridge_lasso', label: 'Regularized Linear Models', short: 'Reg', icon: Shield, color: '#8b5cf6' },
      { id: 'logistic_regression', label: 'Logistic Regression', short: 'LogReg', icon: Activity, color: '#f43f5e' },
      { id: 'decision_trees', label: 'Tree & Ensemble Models', short: 'Trees', icon: Network, color: '#f59e0b' },
      { id: 'svm', label: 'Support Vector Machines', short: 'SVM', icon: Layers, color: '#6366f1' },
    ],
  },
  {
    label: 'UNSUPERVISED LEARNING',
    items: [
      { id: 'kmeans', label: 'K-Means Clustering', short: 'K-Means', icon: Hexagon, color: '#fbbf24' },
      { id: 'dbscan', label: 'DBSCAN Clustering', short: 'DBSCAN', icon: CircleDot, color: '#10b981' },
      { id: 'pca', label: 'Principal Component Analysis', short: 'PCA', icon: Compass, color: '#22d3ee' },
    ],
  },
  {
    label: 'DATA PREPROCESSING',
    items: [
      { id: 'preprocessing', label: 'Data Preprocessing Basics', short: 'Preprocess', icon: SlidersHorizontal, color: '#f472b6' },
      { id: 'data_splitting', label: 'Data Splitting & Leakage Prevention', short: 'Split', icon: Scissors, color: '#f43f5e' },
    ],
  },
  {
    label: 'EVALUATION & SELECTION',
    items: [
      { id: 'metrics', label: 'Performance Metrics & Confusion Matrix', short: 'Metrics', icon: Target, color: '#3b82f6' },
      { id: 'tuning', label: 'Hyperparameter Optimization', short: 'Tuning', icon: Sliders, color: '#ec4899' },
    ],
  },
]

export default function Sidebar({ activeTopic, setActiveTopic, onOpenDevCard }) {
  return (
    <aside
      className="hidden md:flex w-60 flex-col border-r border-white/[0.06] bg-surface-raised/50 backdrop-blur-md no-print"
      data-no-print
    >
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTopic === item.id
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTopic(item.id)}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
                          border: `1px solid ${item.color}30`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon
                      className="relative z-10 h-4 w-4 shrink-0"
                      style={{ color: isActive ? item.color : undefined }}
                    />
                    <span className="relative z-10 truncate font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-dot"
                        className="absolute right-3 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom brand */}
      <div className="border-t border-white/[0.04] p-4 space-y-4">
        <button
          onClick={onOpenDevCard}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white transition-all group"
        >
          <span>Meet the Dev</span>
          <span className="text-base group-hover:scale-110 transition-transform">👩‍💻</span>
        </button>
        <p className="text-[10px] text-text-muted text-center">
          Built with React + Aceternity UI
        </p>
      </div>
    </aside>
  )
}
