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

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z))
}

export default function LogisticRegressionModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'logistic-regression')
  
  // Model parameters
  const [weight, setWeight] = useState(1.5)
  const [bias, setBias] = useState(0)
  const [threshold, setThreshold] = useState(0.5)

  // Generate 1D data points (x-axis) and true classes based on a hidden true model
  const [points] = useState(() => {
    const pts = []
    const trueW = 1.2
    const trueB = 1.0
    for (let i = -10; i <= 10; i += 0.8) {
      const x = i + (Math.random() - 0.5)
      const z = trueW * x + trueB
      const p = sigmoid(z)
      // Coin flip based on probability to generate class
      const cls = Math.random() < p ? 1 : 0
      pts.push({ x, cls })
    }
    return pts
  })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    
    // Coordinates mapping
    // X goes from -12 to 12
    // Y goes from -0.1 to 1.1
    const mapX = (x) => ((x + 12) / 24) * w
    const mapY = (y) => h - ((y + 0.1) / 1.2) * h

    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = -10; x <= 10; x += 2) {
      const cx = mapX(x)
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
    }
    for (let y = 0; y <= 1; y += 0.25) {
      const cy = mapY(y)
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    const zeroY = mapY(0)
    ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(w, zeroY); ctx.stroke()
    const zeroX = mapX(0)
    ctx.beginPath(); ctx.moveTo(zeroX, 0); ctx.lineTo(zeroX, h); ctx.stroke()

    // Threshold Line
    const threshY = mapY(threshold)
    ctx.beginPath()
    ctx.moveTo(0, threshY)
    ctx.lineTo(w, threshY)
    ctx.strokeStyle = '#f43f5e55' // Rose
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.fillStyle = '#f43f5e'
    ctx.font = '10px Inter'
    ctx.fillText(`Threshold = ${threshold}`, 10, threshY - 5)

    // Decision Boundary Line (where sigmoid = threshold -> z = ln(t/(1-t)))
    let decisionX = null
    if (threshold > 0 && threshold < 1) {
      const zThresh = Math.log(threshold / (1 - threshold))
      if (Math.abs(weight) > 0.01) {
        decisionX = (zThresh - bias) / weight
        const decCx = mapX(decisionX)
        if (decCx >= 0 && decCx <= w) {
          ctx.beginPath()
          ctx.moveTo(decCx, 0)
          ctx.lineTo(decCx, h)
          ctx.strokeStyle = '#3b82f644' // Blue
          ctx.lineWidth = 2
          ctx.stroke()
          
          ctx.fillStyle = '#60a5fa'
          ctx.fillText(`Decision Boundary`, decCx + 5, 20)
        }
      }
    }

    // Sigmoid Curve
    ctx.beginPath()
    for (let x = -12; x <= 12; x += 0.2) {
      const z = weight * x + bias
      const y = sigmoid(z)
      const cx = mapX(x)
      const cy = mapY(y)
      if (x === -12) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    }
    ctx.strokeStyle = '#34d399' // Emerald
    ctx.lineWidth = 3
    ctx.stroke()

    // Data points
    points.forEach((p) => {
      const cx = mapX(p.x)
      const cy = mapY(p.cls) // plot on 0 or 1 line
      
      const pPred = sigmoid(weight * p.x + bias)
      const predictedCls = pPred >= threshold ? 1 : 0
      const isCorrect = predictedCls === p.cls

      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = isCorrect ? '#34d39988' : '#f43f5e88'
      ctx.fill()
      ctx.strokeStyle = isCorrect ? '#34d399' : '#f43f5e'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Vertical line to curve
      const cyCurve = mapY(pPred)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cyCurve)
      ctx.strokeStyle = '#ffffff22'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Legend
    ctx.fillStyle = '#34d399'
    ctx.fillRect(w - 110, 16, 10, 10)
    ctx.fillStyle = '#ffffffcc'
    ctx.font = '11px Inter'
    ctx.fillText('Correct Prediction', w - 95, 25)

    ctx.fillStyle = '#f43f5e'
    ctx.fillRect(w - 110, 34, 10, 10)
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('False Prediction', w - 95, 43)

  }, [weight, bias, threshold, points])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#34d399">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Logistic Regression
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Despite its name, Logistic Regression is a <strong>classification</strong> algorithm. It predicts the probability that a given instance belongs to a specific class.
            </p>
          </div>

          <GlowCard glowColor="rgba(52, 211, 153, 0.15)">
            <SectionTitle accent="#34d399">The Sigmoid Function</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              It takes the output of a linear equation (<InlineMath math="z = wx + b" />) and maps it to a value between 0 and 1 using the <strong>Sigmoid (logistic) function</strong>:
            </p>
            <div className="bg-black/30 p-4 rounded text-center my-3 text-emerald-100 overflow-x-auto">
              <BlockMath math="\sigma(z) = \frac{1}{1 + e^{-z}}" />
            </div>
            <p className="text-sm text-text-secondary print-text-muted">
              This outputs a probability <InlineMath math="\hat{p}" />. If <InlineMath math="\hat{p} \geq 0.5" /> (the threshold), the model predicts Class 1. Otherwise, it predicts Class 0.
            </p>
          </GlowCard>

          <GlowCard glowColor="rgba(52, 211, 153, 0.15)">
            <SectionTitle accent="#34d399">📋 Interactive S-Curve</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              Adjust the <strong>Weight</strong> (slope equivalent) and <strong>Bias</strong> (intercept equivalent) in the sandbox to see how the S-curve shifts and squishes to fit the data points (0 or 1).
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Weight (w)</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  <LiveValue value={weight.toFixed(2)} color="#34d399" />
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Bias (b)</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  <LiveValue value={bias.toFixed(2)} color="#34d399" />
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary print-text-muted">
              Moving the <strong>Decision Threshold</strong> changes where the cut-off for Class 1 is made. A lower threshold increases False Positives but decreases False Negatives.
            </p>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0">
            Weight: <span className="font-mono text-emerald-400 w-8">{weight.toFixed(1)}</span>
            <input
              type="range" min={-5} max={5} step={0.1}
              value={weight} onChange={(e) => setWeight(Number(e.target.value))}
              className="w-20 accent-emerald-500"
            />
          </label>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0">
            Bias: <span className="font-mono text-emerald-400 w-8">{bias.toFixed(1)}</span>
            <input
              type="range" min={-10} max={10} step={0.5}
              value={bias} onChange={(e) => setBias(Number(e.target.value))}
              className="w-20 accent-emerald-500"
            />
          </label>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0">
            Threshold: <span className="font-mono text-rose-400 w-8">{threshold.toFixed(2)}</span>
            <input
              type="range" min={0.05} max={0.95} step={0.05}
              value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 accent-rose-500"
            />
          </label>
          <button
            onClick={exportPng}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06] shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-[#0f1117] min-h-0">
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="rounded-xl border border-white/[0.06] max-w-full shadow-[0_0_40px_rgba(52,211,153,0.1)]"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
