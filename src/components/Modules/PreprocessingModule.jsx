import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePngExport } from '../../hooks/useExport.js'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
  MathBlock,
  CodeSnippet,
} from '../ui/AceternityComponents.jsx'

// Highly skewed raw data: X in [0, 10000], Y in [0, 1]
function generateSkewedData(n = 40) {
  const pts = []
  for (let i = 0; i < n; i++) {
    // Exponential-ish X, uniform Y
    const x = Math.pow(Math.random(), 0.5) * 10000
    const y = Math.random() * 0.8 + Math.random() * 0.2
    pts.push({ rawX: x, rawY: y })
  }
  return pts
}

function standardScale(data) {
  const n = data.length
  const meanX = data.reduce((s, p) => s + p.rawX, 0) / n
  const meanY = data.reduce((s, p) => s + p.rawY, 0) / n
  const stdX = Math.sqrt(data.reduce((s, p) => s + (p.rawX - meanX) ** 2, 0) / n)
  const stdY = Math.sqrt(data.reduce((s, p) => s + (p.rawY - meanY) ** 2, 0) / n)
  return {
    points: data.map((p) => ({
      x: stdX > 0 ? (p.rawX - meanX) / stdX : 0,
      y: stdY > 0 ? (p.rawY - meanY) / stdY : 0,
    })),
    params: { meanX, meanY, stdX, stdY },
  }
}

function minMaxScale(data) {
  const minX = Math.min(...data.map((p) => p.rawX))
  const maxX = Math.max(...data.map((p) => p.rawX))
  const minY = Math.min(...data.map((p) => p.rawY))
  const maxY = Math.max(...data.map((p) => p.rawY))
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  return {
    points: data.map((p) => ({
      x: (p.rawX - minX) / rangeX,
      y: (p.rawY - minY) / rangeY,
    })),
    params: { minX, maxX, minY, maxY },
  }
}

const MODES = ['raw', 'standard', 'minmax']
const MODE_LABELS = { raw: 'Raw Data', standard: 'StandardScaler', minmax: 'MinMaxScaler' }
const MODE_COLORS = { raw: '#f472b6', standard: '#8b5cf6', minmax: '#34d399' }

export default function PreprocessingModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'preprocessing')
  const [rawData] = useState(() => generateSkewedData())
  const [mode, setMode] = useState('raw')
  const [animatedPoints, setAnimatedPoints] = useState([])

  // Compute scaled data
  const standardResult = useMemo(() => standardScale(rawData), [rawData])
  const minMaxResult = useMemo(() => minMaxScale(rawData), [rawData])

  // Get normalized canvas coordinates for each mode
  const getCanvasPoints = useCallback(
    (m) => {
      const W = 440, H = 380, PAD = 40
      if (m === 'raw') {
        // Map raw data: X [0, 10000] -> [PAD, W-PAD], Y [0, 1] -> [H-PAD, PAD]
        return rawData.map((p) => ({
          cx: PAD + (p.rawX / 10000) * (W - 2 * PAD),
          cy: H - PAD - p.rawY * (H - 2 * PAD),
        }))
      }
      const result = m === 'standard' ? standardResult : minMaxResult
      const pts = result.points
      const minPX = Math.min(...pts.map((p) => p.x))
      const maxPX = Math.max(...pts.map((p) => p.x))
      const minPY = Math.min(...pts.map((p) => p.y))
      const maxPY = Math.max(...pts.map((p) => p.y))
      const rangeX = maxPX - minPX || 1
      const rangeY = maxPY - minPY || 1
      return pts.map((p) => ({
        cx: PAD + ((p.x - minPX) / rangeX) * (W - 2 * PAD),
        cy: H - PAD - ((p.y - minPY) / rangeY) * (H - 2 * PAD),
      }))
    },
    [rawData, standardResult, minMaxResult]
  )

  // Animate point transitions
  useEffect(() => {
    const target = getCanvasPoints(mode)
    if (animatedPoints.length === 0) {
      setAnimatedPoints(target)
      return
    }
    // Smooth interpolation
    let frame
    let progress = 0
    const start = [...animatedPoints]
    const duration = 600 // ms
    const startTime = performance.now()

    const animate = (now) => {
      progress = Math.min(1, (now - startTime) / duration)
      // Ease out cubic
      const t = 1 - Math.pow(1 - progress, 3)
      const interpolated = target.map((tp, i) => ({
        cx: (start[i]?.cx ?? tp.cx) + (tp.cx - (start[i]?.cx ?? tp.cx)) * t,
        cy: (start[i]?.cy ?? tp.cy) + (tp.cy - (start[i]?.cy ?? tp.cy)) * t,
      }))
      setAnimatedPoints(interpolated)
      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [mode, getCanvasPoints])

  // Compute axis labels based on mode
  const axisInfo = useMemo(() => {
    if (mode === 'raw') return { xLabel: 'X: [0, 10,000]', yLabel: 'Y: [0, 1]', xTicks: ['0', '2.5k', '5k', '7.5k', '10k'], yTicks: ['0', '0.25', '0.50', '0.75', '1.0'] }
    if (mode === 'standard') return { xLabel: 'X: z-score', yLabel: 'Y: z-score', xTicks: ['-2σ', '-1σ', '0', '+1σ', '+2σ'], yTicks: ['-2σ', '-1σ', '0', '+1σ', '+2σ'] }
    return { xLabel: 'X: [0, 1]', yLabel: 'Y: [0, 1]', xTicks: ['0', '0.25', '0.50', '0.75', '1.0'], yTicks: ['0', '0.25', '0.50', '0.75', '1.0'] }
  }, [mode])

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const PAD = 40

    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const x = PAD + i * ((W - 2 * PAD) / 4)
      const y = PAD + i * ((H - 2 * PAD) / 4)
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.stroke()

    // Tick labels
    ctx.fillStyle = '#55556a'
    ctx.font = '9px Inter'
    for (let i = 0; i <= 4; i++) {
      const x = PAD + i * ((W - 2 * PAD) / 4)
      ctx.fillText(axisInfo.xTicks[i], x - 10, H - PAD + 16)
      const y = H - PAD - i * ((H - 2 * PAD) / 4)
      ctx.fillText(axisInfo.yTicks[i], 4, y + 3)
    }

    // Axis labels
    ctx.fillStyle = '#8888a0'
    ctx.font = '10px Inter'
    ctx.fillText(axisInfo.xLabel, W / 2 - 30, H - 8)
    ctx.save()
    ctx.translate(12, H / 2 + 20)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(axisInfo.yLabel, 0, 0)
    ctx.restore()

    // Data points with current animated positions
    const color = MODE_COLORS[mode]
    animatedPoints.forEach((p) => {
      // Glow
      ctx.beginPath()
      ctx.arc(p.cx, p.cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = `${color}15`
      ctx.fill()

      // Point
      ctx.beginPath()
      ctx.arc(p.cx, p.cy, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = `${color}cc`
      ctx.fill()
      ctx.strokeStyle = `${color}44`
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Mode badge
    ctx.fillStyle = color
    ctx.font = 'bold 12px Inter'
    ctx.fillText(MODE_LABELS[mode], PAD + 8, PAD - 10)
  }, [animatedPoints, mode, axisInfo])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#f472b6">Preprocessing</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Data Preprocessing: Feature Scaling
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Many ML algorithms (KNN, SVM, Neural Networks) are sensitive to feature scale.
              When features have vastly different ranges (e.g., X: 0–10,000 vs Y: 0–1), the
              model will be dominated by the larger-scale feature. <strong>Feature scaling</strong> normalizes
              all features to comparable ranges.
            </p>
          </div>

          {/* StandardScaler */}
          <GlowCard glowColor="rgba(139, 92, 246, 0.15)">
            <SectionTitle accent="#8b5cf6">StandardScaler (Z-Score Normalization)</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Centers data to have <strong>mean = 0</strong> and <strong>std = 1</strong>.
              Best when data is approximately Gaussian or when outliers should be preserved.
            </p>
            <MathBlock>
              z = (x - μ) / σ{'\n'}
              {'\n'}
              where μ = mean, σ = standard deviation
            </MathBlock>

            <CodeSnippet title="sklearn — StandardScaler">
{`from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# After scaling:
# mean ≈ 0, std ≈ 1`}
            </CodeSnippet>

            {mode === 'standard' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 rounded-lg bg-brand-500/10 border border-brand-500/20 p-3"
              >
                <p className="text-xs font-semibold text-brand-300 mb-2">Live Fitted Parameters:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">μ_X = </span>
                    <LiveValue value={standardResult.params.meanX} color="#8b5cf6" />
                  </div>
                  <div>
                    <span className="text-text-muted">μ_Y = </span>
                    <LiveValue value={standardResult.params.meanY} color="#8b5cf6" />
                  </div>
                  <div>
                    <span className="text-text-muted">σ_X = </span>
                    <LiveValue value={standardResult.params.stdX} color="#8b5cf6" />
                  </div>
                  <div>
                    <span className="text-text-muted">σ_Y = </span>
                    <LiveValue value={standardResult.params.stdY} color="#8b5cf6" />
                  </div>
                </div>
              </motion.div>
            )}
          </GlowCard>

          {/* MinMaxScaler */}
          <GlowCard glowColor="rgba(52, 211, 153, 0.15)">
            <SectionTitle accent="#34d399">MinMaxScaler (Min-Max Normalization)</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Scales data to a fixed range, typically <strong>[0, 1]</strong>. Preserves the
              shape of the original distribution. Sensitive to outliers since they define the
              min/max bounds.
            </p>
            <MathBlock>
              x_scaled = (x - x_min) / (x_max - x_min)
            </MathBlock>

            <CodeSnippet title="sklearn — MinMaxScaler">
{`from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler(feature_range=(0, 1))
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# After scaling:
# all values in [0, 1]`}
            </CodeSnippet>

            {mode === 'minmax' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3"
              >
                <p className="text-xs font-semibold text-emerald-300 mb-2">Live Fitted Parameters:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">X_min = </span>
                    <LiveValue value={minMaxResult.params.minX} color="#34d399" />
                  </div>
                  <div>
                    <span className="text-text-muted">X_max = </span>
                    <LiveValue value={minMaxResult.params.maxX} color="#34d399" />
                  </div>
                  <div>
                    <span className="text-text-muted">Y_min = </span>
                    <LiveValue value={minMaxResult.params.minY} color="#34d399" />
                  </div>
                  <div>
                    <span className="text-text-muted">Y_max = </span>
                    <LiveValue value={minMaxResult.params.maxY} color="#34d399" />
                  </div>
                </div>
              </motion.div>
            )}
          </GlowCard>

          {/* Key Differences */}
          <GlowCard glowColor="rgba(244, 114, 182, 0.15)">
            <SectionTitle accent="#f472b6">📋 When to Use Which?</SectionTitle>
            <div className="rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Criteria</th>
                    <th className="px-3 py-2 text-left text-brand-300 font-medium">StandardScaler</th>
                    <th className="px-3 py-2 text-left text-emerald-300 font-medium">MinMaxScaler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted">Output range</td>
                    <td className="px-3 py-2 text-text-secondary">Unbounded (≈ -3 to +3)</td>
                    <td className="px-3 py-2 text-text-secondary">[0, 1] (fixed)</td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted">Outlier handling</td>
                    <td className="px-3 py-2 text-text-secondary">Robust (preserves)</td>
                    <td className="px-3 py-2 text-text-secondary">Sensitive (squishes)</td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted">Distribution</td>
                    <td className="px-3 py-2 text-text-secondary">Best for Gaussian</td>
                    <td className="px-3 py-2 text-text-secondary">Best for uniform</td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted">Use with</td>
                    <td className="px-3 py-2 text-text-secondary">SVM, Logistic Reg, PCA</td>
                    <td className="px-3 py-2 text-text-secondary">Neural Nets, KNN, Images</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-text-muted italic print-text-muted">
              Toggle the scaler modes on the right panel to see how data transforms in real-time.
              Notice how the proportions of the scatter plot change dramatically.
            </p>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <div className="flex items-center gap-1.5">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 border ${
                  mode === m
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary border-white/[0.06] hover:bg-white/[0.05]'
                }`}
                style={
                  mode === m
                    ? {
                        borderColor: `${MODE_COLORS[m]}40`,
                        backgroundColor: `${MODE_COLORS[m]}18`,
                        color: MODE_COLORS[m],
                      }
                    : {}
                }
              >
                {mode === m && (
                  <motion.div
                    layoutId="scaler-active"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `${MODE_COLORS[m]}10`,
                      border: `1px solid ${MODE_COLORS[m]}30`,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{MODE_LABELS[m]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={exportPng}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.1] transition-colors border border-white/[0.06]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart Only (PNG)
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-[#0f1117] min-h-0">
          <canvas
            ref={canvasRef}
            width={480}
            height={420}
            className="rounded-xl border border-white/[0.06] max-w-full"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
