import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function GlowCard({ children, className, glowColor = 'rgba(139, 92, 246, 0.15)', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative rounded-xl border border-white/[0.06] bg-[#12121a] p-5 backdrop-blur-sm',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:shadow-[0_0_30px_-5px_var(--glow)]',
        'transition-shadow duration-500',
        className
      )}
      style={{ '--glow': glowColor }}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export function GlassPanel({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AnimatedBadge({ children, color = '#8b5cf6', className }) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        'border backdrop-blur-sm',
        className
      )}
      style={{
        borderColor: `${color}33`,
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      {children}
    </motion.span>
  )
}

export function ShimmerButton({ children, onClick, className, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg',
        'bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white',
        'shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300',
        'hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02]',
        'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

export function LiveValue({ value, unit = '', color = '#8b5cf6' }) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0.5, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-baseline gap-1 font-mono text-sm font-semibold"
      style={{ color }}
    >
      {typeof value === 'number' ? value.toFixed(4) : value}
      {unit && <span className="text-xs opacity-60">{unit}</span>}
    </motion.span>
  )
}

export function SectionTitle({ children, accent }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-3">
      {accent && <span className="h-5 w-1 rounded-full" style={{ backgroundColor: accent }} />}
      {children}
    </h3>
  )
}

export function MathBlock({ children }) {
  return (
    <div className="code-block my-3 text-brand-300">
      {children}
    </div>
  )
}

export function CodeSnippet({ title, children }) {
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-white/[0.06]">
      {title && (
        <div className="bg-white/[0.03] px-4 py-2 text-xs font-mono text-text-muted border-b border-white/[0.06]">
          {title}
        </div>
      )}
      <pre className="code-block rounded-none border-0 m-0">{children}</pre>
    </div>
  )
}
