import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Crosshair } from 'lucide-react'
import { usePngExport } from '../../hooks/useExport.js'
import { BlockMath, InlineMath } from 'react-katex'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
} from '../ui/AceternityComponents.jsx'

// Generate correlated 2D data
function generateCorrelatedData(n = 80) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 200
    const y = x * 0.8 + (Math.random() - 0.5) * 80
    pts.push([x + 240, y + 210]) // center in canvas
  }
  return pts
}

function computePCA(data, angleDeg) {
  const n = data.length
  const meanX = data.reduce((s, p) => s + p[0], 0) / n
  const meanY = data.reduce((s, p) => s + p[1], 0) / n

  // Covariance matrix
  let covXX = 0, covXY = 0, covYY = 0
  data.forEach((p) => {
    const dx = p[0] - meanX
    const dy = p[1] - meanY
    covXX += dx * dx
    covXY += dx * dy
    covYY += dy * dy
  })
  covXX /= n; covXY /= n; covYY /= n

  // True eigenvectors (2x2 analytical solution)
  const trace = covXX + covYY
  const det = covXX * covYY - covXY * covXY
  const disc = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det))
  const eigenval1 = trace / 2 + disc
  const eigenval2 = trace / 2 - disc
  const totalVar = eigenval1 + eigenval2

  // True PC1 angle
  const trueAngle = Math.atan2(covXY, eigenval1 - covYY) * (180 / Math.PI)

  // Current projection axis from slider
  const angleRad = (angleDeg * Math.PI) / 180
  const axisX = Math.cos(angleRad)
  const axisY = Math.sin(angleRad)

  // Project data onto the axis
  const projections = data.map((p) => {
    const dx = p[0] - meanX
    const dy = p[1] - meanY
    const proj = dx * axisX + dy * axisY
    return {
      original: p,
      projectedX: meanX + proj * axisX,
      projectedY: meanY + proj * axisY,
      projValue: proj,
    }
  })

  // Variance along current axis
  const projMean = projections.reduce((s, p) => s + p.projValue, 0) / n
  const projVar = projections.reduce((s, p) => s + (p.projValue - projMean) ** 2, 0) / n
  const explainedPct = totalVar > 0 ? (projVar / totalVar) * 100 : 0

  return {
    meanX, meanY,
    covXX, covXY, covYY,
    eigenval1, eigenval2,
    trueAngle,
    projections,
    explainedPct,
    axisX, axisY,
  }
}

export default function PCAModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'pca')
  const [data] = useState(() => generateCorrelatedData())
  const [angle, setAngle] = useState(30)

  const pca = computePCA(data, angle)

  const snapToPC1 = () => {
    setAngle(Math.round(pca.trueAngle + 360) % 180)
  }

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

    // Projection lines (shadows)
    pca.projections.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(p.original[0], p.original[1])
      ctx.lineTo(p.projectedX, p.projectedY)
      ctx.strokeStyle = '#22d3ee15'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Projected points on axis
    pca.projections.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.projectedX, p.projectedY, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#22d3ee55'
      ctx.fill()
    })

    // Principal axis line
    const lineLen = 300
    ctx.beginPath()
    ctx.moveTo(pca.meanX - pca.axisX * lineLen, pca.meanY - pca.axisY * lineLen)
    ctx.lineTo(pca.meanX + pca.axisX * lineLen, pca.meanY + pca.axisY * lineLen)
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.stroke()

    // Perpendicular axis (PC2)
    ctx.beginPath()
    ctx.moveTo(pca.meanX - (-pca.axisY) * lineLen, pca.meanY - pca.axisX * lineLen)
    ctx.lineTo(pca.meanX + (-pca.axisY) * lineLen, pca.meanY + pca.axisX * lineLen)
    ctx.strokeStyle = '#22d3ee33'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Data points
    data.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2)
      ctx.fillStyle = '#22d3ee88'
      ctx.fill()
    })

    // Mean point
    ctx.beginPath()
    ctx.arc(pca.meanX, pca.meanY, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.stroke()

    // Labels
    ctx.fillStyle = '#22d3ee'
    ctx.font = 'bold 11px Inter'
    ctx.fillText(`Explained Variance: ${pca.explainedPct.toFixed(1)}%`, 16, 24)
    ctx.fillStyle = '#ffffff66'
    ctx.font = '10px Inter'
    ctx.fillText(`Angle: ${angle}°`, 16, 40)
  }, [data, angle, pca])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#22d3ee">Unsupervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Principal Component Analysis (PCA)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              PCA finds the directions (principal components) along which the data varies the
              most. It projects high-dimensional data onto fewer dimensions while preserving
              maximum variance.
            </p>
          </div>

          <GlowCard glowColor="rgba(34, 211, 238, 0.15)">
            <SectionTitle accent="#22d3ee">Orthogonal Axes Rotation</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              PCA operates by rotating the original axes to align with the directions of maximum variance in the data. The new axes (Principal Components) are <strong>orthogonal</strong> (perpendicular) to each other, ensuring they capture independent information.
            </p>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Mathematically, we compute the covariance matrix <InlineMath math="C" /> of the mean-centered data <InlineMath math="X" />, and then perform eigendecomposition:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-cyan-100 overflow-x-auto">
              <BlockMath math="C = \frac{1}{n-1} X^T X" />
              <BlockMath math="C v = \lambda v" />
            </div>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Here, <InlineMath math="v" /> are the eigenvectors (the new axes) and <InlineMath math="\lambda" /> are the eigenvalues (the magnitude of variance along those axes).
            </p>
            <h3 className="text-cyan-400 font-bold text-sm mt-4 mb-2">Explained Variance Ratio</h3>
            <p className="text-sm text-text-secondary print-text-muted">
              The proportion of the dataset's total variance captured by a single principal component <InlineMath math="i" /> is computed as its eigenvalue divided by the sum of all eigenvalues:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-cyan-100 overflow-x-auto">
              <BlockMath math="\text{Variance Ratio}_i = \frac{\lambda_i}{\sum_{j} \lambda_j}" />
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(34, 211, 238, 0.15)">
            <SectionTitle accent="#22d3ee">📋 Case Study: Student Performance</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              An educator analyzes <strong>{data.length} students'</strong> correlated scores
              (math vs. science). By rotating the axis, they find the single direction that
              captures the most information.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Current Angle</p>
                <p className="mt-1 font-mono text-lg font-bold text-cyan-400">
                  <LiveValue value={`${angle}°`} color="#22d3ee" />
                </p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-3 border border-cyan-500/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">% Variance Explained</p>
                <p className="mt-1 font-mono text-lg font-bold text-cyan-400">
                  <LiveValue value={pca.explainedPct} color="#22d3ee" />%
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Property</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">Cov(X,X)</td>
                    <td className="px-3 py-1.5"><LiveValue value={pca.covXX} color="#22d3ee" /></td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">Cov(X,Y)</td>
                    <td className="px-3 py-1.5"><LiveValue value={pca.covXY} color="#22d3ee" /></td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">Cov(Y,Y)</td>
                    <td className="px-3 py-1.5"><LiveValue value={pca.covYY} color="#22d3ee" /></td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">λ₁ (largest)</td>
                    <td className="px-3 py-1.5"><LiveValue value={pca.eigenval1} color="#22d3ee" /></td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">λ₂ (smallest)</td>
                    <td className="px-3 py-1.5"><LiveValue value={pca.eigenval2} color="#22d3ee" /></td>
                  </tr>
                  <tr className="border-t border-white/[0.04]">
                    <td className="px-3 py-1.5 text-text-muted">True PC1 Angle</td>
                    <td className="px-3 py-1.5"><LiveValue value={`${(pca.trueAngle + 360) % 360}°`} color="#34d399" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0 whitespace-nowrap">
            Angle = <span className="font-mono font-bold text-accent-pca">{angle}°</span>
            <input
              type="range"
              min={0} max={179} step={1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-28 accent-[#22d3ee]"
            />
          </label>
          <button
            onClick={snapToPC1}
            className="flex items-center gap-1 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20 shrink-0 whitespace-nowrap"
          >
            <Crosshair className="h-3 w-3" /> Snap to PC1
          </button>
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
