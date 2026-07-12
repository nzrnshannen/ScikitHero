import { useState, useRef, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'
import { usePngExport } from '../../hooks/useExport.js'
import { BlockMath, InlineMath } from 'react-katex'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
} from '../ui/AceternityComponents.jsx'

export default function RegularizationModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'regularization')
  
  const [regType, setRegType] = useState('L2') // 'L1' or 'L2'
  const [alpha, setAlpha] = useState(1.0) // penalty strength 0.0 to 3.0

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    
    // Center coords
    const cx = w / 2
    const cy = h / 2
    
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y <= h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
    
    ctx.fillStyle = '#8888a0'
    ctx.font = '10px Inter'
    ctx.fillText('β₁', w - 15, cy - 5)
    ctx.fillText('β₂', cx + 5, 10)

    // OLS minimum point (unregularized)
    const olsX = cx + 90
    const olsY = cy - 60

    // Loss contours (ellipses radiating from OLS min)
    for (let i = 4; i >= 1; i--) {
      ctx.beginPath()
      ctx.ellipse(olsX, olsY, 30 * i, 15 * i, -Math.PI / 6, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.1 * (5-i)})` // Rose color
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Draw OLS min point
    ctx.beginPath()
    ctx.arc(olsX, olsY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#f43f5e'
    ctx.fill()
    ctx.fillText('OLS Min', olsX + 8, olsY - 8)

    // Regularization constraint boundary (size inversely proportional to alpha)
    // When alpha=0, size is huge. When alpha=3, size is small.
    // Let's map alpha [0, 3] to a "budget" radius [150, 20]
    const budget = 150 - (alpha * 40)
    const constraintSize = Math.max(0, budget)
    
    ctx.beginPath()
    if (regType === 'L1') {
      // Diamond for L1 (|b1| + |b2| <= t)
      ctx.moveTo(cx, cy - constraintSize)
      ctx.lineTo(cx + constraintSize, cy)
      ctx.lineTo(cx, cy + constraintSize)
      ctx.lineTo(cx - constraintSize, cy)
      ctx.closePath()
    } else {
      // Circle for L2 (b1^2 + b2^2 <= t)
      ctx.arc(cx, cy, constraintSize, 0, Math.PI * 2)
    }
    
    const regColor = regType === 'L1' ? '#a855f7' : '#3b82f6' // Purple for L1, Blue for L2
    
    ctx.fillStyle = `${regColor}22`
    ctx.fill()
    ctx.strokeStyle = regColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Regularized Solution Point (intersection of contour and constraint)
    // Approximate visualization
    let solX, solY
    
    if (regType === 'L1') {
      // L1 tends to hit corners (sparsity)
      if (alpha > 0.8) {
         solX = cx + constraintSize
         solY = cy
      } else {
         solX = cx + constraintSize * 0.8
         solY = cy - constraintSize * 0.2
      }
    } else {
      // L2 tends to hit tangentially
      const angle = Math.atan2(olsY - cy, olsX - cx)
      solX = cx + Math.cos(angle) * constraintSize
      solY = cy + Math.sin(angle) * constraintSize
    }

    // Draw regularized solution
    ctx.beginPath()
    ctx.arc(solX, solY, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#34d399' // Emerald
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.fillStyle = '#34d399'
    ctx.font = 'bold 11px Inter'
    ctx.fillText('Regularized', solX + 10, solY - 10)
    ctx.fillText('Solution', solX + 10, solY + 2)

    // Path line from OLS to Solution
    ctx.beginPath()
    ctx.moveTo(olsX, olsY)
    ctx.lineTo(solX, solY)
    ctx.strokeStyle = '#34d39988'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

  }, [regType, alpha])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#8b5cf6">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Ridge & Lasso Regularization
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Regularization combats <strong>overfitting</strong> by adding a penalty to the loss function. This forces the model to learn smaller, simpler coefficients instead of perfectly memorizing the training data.
            </p>
          </div>

          <GlowCard glowColor="rgba(139, 92, 246, 0.15)">
            <SectionTitle accent="#8b5cf6">L2 Regularization (Ridge)</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Adds a penalty equal to the <strong>square of the magnitude</strong> of coefficients. It shrinks all coefficients towards zero, but rarely exactly to zero.
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-purple-200 overflow-x-auto">
              <BlockMath math="J(w) = \text{MSE} + \alpha \sum_{j=1}^{p} w_j^2" />
            </div>
            <ul className="text-sm text-text-secondary list-disc ml-5 print-text-muted">
              <li>Visualized as a <strong>circular constraint</strong> boundary.</li>
              <li>Good for handling highly correlated features (multicollinearity).</li>
            </ul>
          </GlowCard>

          <GlowCard glowColor="rgba(139, 92, 246, 0.15)">
            <SectionTitle accent="#8b5cf6">L1 Regularization (Lasso)</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Adds a penalty equal to the <strong>absolute value of the magnitude</strong> of coefficients. It can shrink coefficients <em>exactly to zero</em>, effectively performing feature selection.
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-purple-200 overflow-x-auto">
              <BlockMath math="J(w) = \text{MSE} + \alpha \sum_{j=1}^{p} |w_j|" />
            </div>
            <ul className="text-sm text-text-secondary list-disc ml-5 print-text-muted">
              <li>Visualized as a <strong>diamond constraint</strong> boundary.</li>
              <li>Because the diamond has sharp corners, the elliptical loss contours frequently intersect at the axes, driving some <InlineMath math="\beta" /> values to 0.</li>
            </ul>
          </GlowCard>
          
          <GlowCard glowColor="rgba(139, 92, 246, 0.15)">
            <SectionTitle accent="#8b5cf6">📋 Interactive Constraint Visualization</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              The red ellipses represent the contours of the unregularized MSE loss. The center is the OLS minimum. 
              The shaded region is the "budget" allowed by the regularization penalty <InlineMath math="\alpha" />.
            </p>
            <p className="text-sm text-text-secondary print-text-muted">
              The regularized solution (green dot) is where the lowest possible MSE contour intersects the allowed penalty budget region.
            </p>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <div className="flex gap-1 bg-white/[0.05] p-1 rounded-lg border border-white/[0.06] shrink-0">
             <button
               onClick={() => setRegType('L2')}
               className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${regType === 'L2' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-text-secondary hover:text-white'}`}
             >
               L2 (Ridge)
             </button>
             <button
               onClick={() => setRegType('L1')}
               className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${regType === 'L1' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-text-secondary hover:text-white'}`}
             >
               L1 (Lasso)
             </button>
          </div>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0 whitespace-nowrap">
            Penalty (<InlineMath math="\alpha" />): <span className="font-mono text-brand-400 w-8">{alpha.toFixed(1)}</span>
            <input
              type="range" min={0} max={3.5} step={0.1}
              value={alpha} onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-24 accent-brand-500"
            />
          </label>
          <button
            onClick={exportPng}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06] shrink-0 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-[#0f1117] min-h-0">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="rounded-xl border border-white/[0.06] max-w-full shadow-[0_0_40px_rgba(139,92,246,0.1)]"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
