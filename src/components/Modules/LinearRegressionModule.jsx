import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { usePngExport } from '../../hooks/useExport.js'
import { BlockMath, InlineMath } from 'react-katex'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
} from '../ui/AceternityComponents.jsx'

function computeRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, mse: 0, r2: 0 }
  const sumX = points.reduce((s, p) => s + p[0], 0)
  const sumY = points.reduce((s, p) => s + p[1], 0)
  const sumXY = points.reduce((s, p) => s + p[0] * p[1], 0)
  const sumX2 = points.reduce((s, p) => s + p[0] * p[0], 0)
  const sumY2 = points.reduce((s, p) => s + p[1] * p[1], 0)

  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sumY / n, mse: 0, r2: 0 }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // MSE
  const mse = points.reduce((s, p) => {
    const predicted = slope * p[0] + intercept
    return s + (p[1] - predicted) ** 2
  }, 0) / n

  // R²
  const meanY = sumY / n
  const ssTot = points.reduce((s, p) => s + (p[1] - meanY) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - (mse * n) / ssTot : 0

  return { slope, intercept, mse, r2 }
}

const INITIAL_POINTS = [
  [60, 340], [100, 300], [150, 270], [200, 220], [250, 200],
  [300, 160], [350, 130], [400, 100],
]

export default function LinearRegressionModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'linear-regression')
  const [points, setPoints] = useState(INITIAL_POINTS)

  // Transform canvas coords to data space for display (flip Y)
  const toData = (cx, cy) => [cx, 420 - cy]
  const toCanvas = (dx, dy) => [dx, 420 - dy]

  const canvasPoints = points
  const dataPoints = points.map(([x, y]) => toData(x, y))
  const { slope, intercept, mse, r2 } = computeRegression(canvasPoints)

  // Display slope/intercept in "data space" (inverted Y)
  const dataSlope = -slope
  const dataIntercept = 420 - intercept

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(40, h - 30); ctx.lineTo(w - 10, h - 30); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(40, h - 30); ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#55556a'
    ctx.font = '10px Inter'
    ctx.fillText('Sq. Footage →', w / 2 - 30, h - 10)
    ctx.save()
    ctx.translate(14, h / 2 + 20)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Price ($k) →', 0, 0)
    ctx.restore()

    if (points.length >= 2) {
      // Regression line
      const x0 = 0, x1 = w
      const y0 = slope * x0 + intercept
      const y1 = slope * x1 + intercept

      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Residual lines
      points.forEach(([px, py]) => {
        const predicted = slope * px + intercept
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px, predicted)
        ctx.strokeStyle = '#f9731644'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
      })
    }

    // Points
    points.forEach(([px, py]) => {
      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#34d399'
      ctx.fill()
      ctx.strokeStyle = '#ffffff33'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // Equation label
    if (points.length >= 2) {
      ctx.fillStyle = '#34d399'
      ctx.font = 'bold 12px JetBrains Mono'
      ctx.fillText(
        `ŷ = ${slope.toFixed(3)}x + ${intercept.toFixed(1)}`,
        w - 220, 30
      )
      ctx.fillStyle = '#ffffff66'
      ctx.font = '10px Inter'
      ctx.fillText(`MSE: ${mse.toFixed(2)}  |  R²: ${r2.toFixed(4)}`, w - 220, 48)
    }
  }, [points, slope, intercept, mse, r2])

  useEffect(() => { draw() }, [draw])

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    setPoints((prev) => [...prev, [x, y]])
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#34d399">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Linear Regression
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Linear Regression fits a straight line <strong>ŷ = mx + b</strong> through the
              data points by minimizing the <strong>sum of squared residuals</strong> (Ordinary Least Squares).
            </p>
          </div>

          <GlowCard glowColor="rgba(52, 211, 153, 0.15)">
            <SectionTitle accent="#34d399">OLS Error Minimization</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              The goal of Ordinary Least Squares (OLS) is to minimize the <strong>Sum of Squared Errors (SSE)</strong>. A residual (error) is the vertical distance between the actual data point and the predicted line:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-emerald-100 overflow-x-auto">
              <BlockMath math="\text{Residual } e_i = y_i - \hat{y}_i" />
            </div>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              We square these residuals so negative and positive errors don't cancel out, and larger errors are penalized more heavily. The cost function <InlineMath math="J(m, b)" /> is:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-emerald-100 overflow-x-auto">
              <BlockMath math="J(m, b) = \sum_{i=1}^{n} (y_i - (m x_i + b))^2" />
            </div>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              By taking the partial derivatives of <InlineMath math="J" /> with respect to <InlineMath math="m" /> and <InlineMath math="b" />, and setting them to zero, we derive the closed-form normal equations:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-emerald-100 overflow-x-auto">
              <BlockMath math="m = \frac{n(\sum x_iy_i) - (\sum x_i)(\sum y_i)}{n(\sum x_i^2) - (\sum x_i)^2}" />
              <BlockMath math="b = \frac{\sum y_i - m(\sum x_i)}{n}" />
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(52, 211, 153, 0.15)">
            <SectionTitle accent="#34d399">📋 Case Study: House Price Prediction</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              A real estate analyst has collected <strong>{points.length} data points</strong> of
              house square footage vs. sale price.
            </p>
            <p className="text-sm text-text-secondary print-text-muted">
              The best-fit line equation is:
            </p>
            <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="font-mono text-sm font-bold text-emerald-400">
                ŷ = <LiveValue value={slope} color="#34d399" />x +{' '}
                <LiveValue value={intercept} color="#34d399" />
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Slope (m)</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  <LiveValue value={slope} color="#34d399" />
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Intercept (b)</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  <LiveValue value={intercept} color="#34d399" />
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">MSE</p>
                <p className="mt-1 font-mono text-lg font-bold text-amber-400">
                  <LiveValue value={mse} color="#fbbf24" />
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">R² Score</p>
                <p className="mt-1 font-mono text-lg font-bold text-cyan-400">
                  <LiveValue value={r2} color="#22d3ee" />
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted print-text-muted">
              Click on the chart to add more data points and observe how the regression line adjusts.
            </p>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <button
            onClick={() => setPoints(INITIAL_POINTS)}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset Points
          </button>
          <button
            onClick={exportPng}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart Only (PNG)
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-[#0f1117]">
          <canvas
            ref={canvasRef}
            width={480}
            height={420}
            className="rounded-xl border border-white/[0.06] cursor-crosshair max-w-full"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  )
}
