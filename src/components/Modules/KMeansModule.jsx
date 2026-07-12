import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, Play, SkipForward, RotateCcw } from 'lucide-react'
import { usePngExport } from '../../hooks/useExport.js'
import { BlockMath, InlineMath } from 'react-katex'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
} from '../ui/AceternityComponents.jsx'

const CLUSTER_COLORS = ['#8b5cf6', '#f97316', '#22d3ee', '#34d399', '#f472b6', '#fbbf24']

function generateData() {
  const centers = [
    [100, 100], [350, 120], [220, 330],
  ]
  const pts = []
  centers.forEach((c) => {
    for (let i = 0; i < 30; i++) {
      pts.push([
        c[0] + (Math.random() - 0.5) * 120,
        c[1] + (Math.random() - 0.5) * 120,
      ])
    }
  })
  return pts
}

function initCentroids(data, k) {
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, k).map((p) => [...p])
}

function assignClusters(data, centroids) {
  return data.map((p) => {
    let minDist = Infinity
    let minIdx = 0
    centroids.forEach((c, i) => {
      const d = Math.sqrt((p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2)
      if (d < minDist) { minDist = d; minIdx = i }
    })
    return minIdx
  })
}

function updateCentroids(data, assignments, k) {
  const sums = Array.from({ length: k }, () => [0, 0, 0]) // [sumX, sumY, count]
  data.forEach((p, i) => {
    const ci = assignments[i]
    sums[ci][0] += p[0]
    sums[ci][1] += p[1]
    sums[ci][2] += 1
  })
  return sums.map((s) =>
    s[2] > 0 ? [s[0] / s[2], s[1] / s[2]] : [Math.random() * 400, Math.random() * 400]
  )
}

function computeInertia(data, assignments, centroids) {
  return data.reduce((total, p, i) => {
    const c = centroids[assignments[i]]
    return total + (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2
  }, 0)
}

export default function KMeansModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'k-means')
  const [data] = useState(() => generateData())
  const [k, setK] = useState(3)
  const [centroids, setCentroids] = useState(() => initCentroids(data, 3))
  const [assignments, setAssignments] = useState(() => assignClusters(data, initCentroids(data, 3)))
  const [iteration, setIteration] = useState(0)
  const [converged, setConverged] = useState(false)

  const inertia = computeInertia(data, assignments, centroids)

  // Reset when K changes
  useEffect(() => {
    const newC = initCentroids(data, k)
    setCentroids(newC)
    setAssignments(assignClusters(data, newC))
    setIteration(0)
    setConverged(false)
  }, [k, data])

  const step = useCallback(() => {
    if (converged) return
    const newAssignments = assignClusters(data, centroids)
    const newCentroids = updateCentroids(data, newAssignments, k)
    const moved = newCentroids.some(
      (c, i) => Math.abs(c[0] - centroids[i][0]) > 0.01 || Math.abs(c[1] - centroids[i][1]) > 0.01
    )
    setCentroids(newCentroids)
    setAssignments(newAssignments)
    setIteration((prev) => prev + 1)
    if (!moved) setConverged(true)
  }, [data, centroids, k, converged])

  const runAll = useCallback(() => {
    let currentCentroids = [...centroids.map((c) => [...c])]
    let currentAssignments = [...assignments]
    let itr = iteration
    for (let i = 0; i < 100; i++) {
      const newAssignments = assignClusters(data, currentCentroids)
      const newCentroids = updateCentroids(data, newAssignments, k)
      const moved = newCentroids.some(
        (c, j) => Math.abs(c[0] - currentCentroids[j][0]) > 0.01 || Math.abs(c[1] - currentCentroids[j][1]) > 0.01
      )
      currentCentroids = newCentroids
      currentAssignments = newAssignments
      itr++
      if (!moved) break
    }
    setCentroids(currentCentroids)
    setAssignments(currentAssignments)
    setIteration(itr)
    setConverged(true)
  }, [data, centroids, assignments, iteration, k])

  const reset = () => {
    const newC = initCentroids(data, k)
    setCentroids(newC)
    setAssignments(assignClusters(data, newC))
    setIteration(0)
    setConverged(false)
  }

  // Draw
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

    // Voronoi-style region shading
    centroids.forEach((c, ci) => {
      ctx.beginPath()
      ctx.arc(c[0], c[1], 100, 0, Math.PI * 2)
      ctx.fillStyle = `${CLUSTER_COLORS[ci % CLUSTER_COLORS.length]}08`
      ctx.fill()
    })

    // Data points
    data.forEach((p, i) => {
      const ci = assignments[i]
      ctx.beginPath()
      ctx.arc(p[0], p[1], 4, 0, Math.PI * 2)
      ctx.fillStyle = CLUSTER_COLORS[ci % CLUSTER_COLORS.length] + '99'
      ctx.fill()
    })

    // Centroids
    centroids.forEach((c, ci) => {
      const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length]

      // Glow
      ctx.beginPath()
      ctx.arc(c[0], c[1], 18, 0, Math.PI * 2)
      ctx.fillStyle = `${color}22`
      ctx.fill()

      // Cross
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(c[0] - 8, c[1] - 8); ctx.lineTo(c[0] + 8, c[1] + 8)
      ctx.moveTo(c[0] + 8, c[1] - 8); ctx.lineTo(c[0] - 8, c[1] + 8)
      ctx.stroke()

      // Label
      ctx.fillStyle = color
      ctx.font = 'bold 10px Inter'
      ctx.fillText(`C${ci + 1}`, c[0] + 12, c[1] - 12)
    })

    // Status
    ctx.fillStyle = converged ? '#34d399' : '#fbbf24'
    ctx.font = 'bold 11px Inter'
    ctx.fillText(converged ? '✓ Converged' : `Iteration ${iteration}`, 16, 24)
    ctx.fillStyle = '#ffffff66'
    ctx.font = '10px Inter'
    ctx.fillText(`Inertia: ${inertia.toFixed(1)}`, 16, 40)
  }, [data, assignments, centroids, iteration, converged, inertia])

  useEffect(() => { draw() }, [draw])

  // Cluster sizes
  const clusterSizes = centroids.map((_, ci) =>
    assignments.filter((a) => a === ci).length
  )

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#fbbf24">Unsupervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              K-Means Clustering
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              K-Means partitions data into <strong>K clusters</strong> by iteratively assigning
              points to the nearest centroid and updating centroids to the mean of assigned points.
            </p>
          </div>

          <GlowCard glowColor="rgba(251, 191, 36, 0.15)">
            <SectionTitle accent="#fbbf24">Lloyd's Algorithm & Inertia</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              K-Means seeks to minimize the Within-Cluster Sum of Squares (WCSS), also known as <strong>Inertia</strong>. It follows these steps:
            </p>
            <ol className="text-sm text-text-secondary list-decimal ml-5 mb-3 print-text-muted">
              <li>Initialize <InlineMath math="K" /> centroids randomly.</li>
              <li>Assign each point <InlineMath math="x_i" /> to the nearest centroid <InlineMath math="\mu_k" />: <InlineMath math="c_i = \text{argmin}_k ||x_i - \mu_k||^2" /></li>
              <li>Update centroids to the mean of assigned points: <InlineMath math="\mu_k = \frac{1}{|S_k|} \sum_{x_i \in S_k} x_i" /></li>
              <li>Repeat steps 2-3 until convergence (centroids stop moving).</li>
            </ol>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-amber-100 overflow-x-auto">
              <BlockMath math="\text{Inertia} = \sum_{i=1}^{n} ||x_i - \mu_{c_i}||^2" />
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-amber-400 font-bold text-sm mb-2">The Elbow Method</h3>
              <p className="text-sm text-text-secondary print-text-muted">
                How do we choose <InlineMath math="K" />? As we increase <InlineMath math="K" />, Inertia will naturally decrease. 
                The <strong>Elbow Method</strong> plots Inertia vs. <InlineMath math="K" /> and looks for an "elbow" point where the rate of decrease sharply shifts. 
                This indicates the optimal balance between cluster tightness and model complexity.
              </p>
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(251, 191, 36, 0.15)">
            <SectionTitle accent="#fbbf24">📋 Case Study: Customer Segmentation</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              A marketing team segments <strong>{data.length} customers</strong> into{' '}
              <strong>K = <LiveValue value={k} color="#fbbf24" /></strong> groups based on
              spending patterns.
            </p>

            <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-text-muted mb-1">Iteration</p>
              <p className="font-mono text-lg font-bold text-amber-400">
                <LiveValue value={iteration} color="#fbbf24" />
                {converged && <span className="ml-2 text-xs text-emerald-400 font-sans">✓ Converged</span>}
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Cluster</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Centroid (x, y)</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {centroids.map((c, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="px-3 py-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: CLUSTER_COLORS[i] }} />
                        C{i + 1}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-text-secondary">
                        (<LiveValue value={c[0]} color={CLUSTER_COLORS[i]} />,{' '}
                        <LiveValue value={c[1]} color={CLUSTER_COLORS[i]} />)
                      </td>
                      <td className="px-3 py-1.5 font-mono">{clusterSizes[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Global Inertia</p>
              <p className="mt-1 font-mono text-lg font-bold text-amber-400">
                <LiveValue value={inertia} color="#fbbf24" />
              </p>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0 whitespace-nowrap">
            K = <span className="font-mono font-bold text-accent-kmeans">{k}</span>
            <input
              type="range"
              min={2} max={6} step={1}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-20 accent-[#fbbf24]"
            />
          </label>
          <button
            onClick={step}
            disabled={converged}
            className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-40 shrink-0 whitespace-nowrap"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={runAll}
            disabled={converged}
            className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-40 shrink-0 whitespace-nowrap"
          >
            <Play className="h-3 w-3" /> Run All
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06] shrink-0 whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" /> Reset
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
