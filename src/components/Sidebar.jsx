import { motion } from 'framer-motion'
import { cn } from '../lib/utils.js'
import { GROUPS } from '../lib/curriculum.js'

export default function Sidebar({ activeTopic, setActiveTopic, onOpenDevCard, isMobileMenuOpen, onCloseMenu }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm" 
          onClick={onCloseMenu}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border-subtle bg-surface-raised/95 backdrop-blur-md no-print transition-transform duration-300 ease-in-out md:static md:w-60 md:translate-x-0 md:bg-surface-raised/50",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
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
                        ? 'text-text-primary bg-surface-overlay border border-border-medium shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50 border border-transparent'
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
      <div className="border-t border-border-subtle p-4 space-y-4">
        <button
          onClick={onOpenDevCard}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-overlay/80 border border-border-medium text-sm font-medium text-text-secondary hover:text-text-primary transition-all group"
        >
          <span>Meet the Dev</span>
          <span className="text-base group-hover:scale-110 transition-transform">👩‍💻</span>
        </button>
        <p className="text-[10px] text-text-muted text-center">
          Built with React + Aceternity UI
        </p>
      </div>
    </aside>
    </>
  )
}
