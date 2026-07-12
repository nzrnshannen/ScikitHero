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

// Pre-seeded data: two classes of points
const CLASS_A = [
  [120, 140], [150, 160], [130, 180], [160, 130], [140, 150],
  [110, 170], [170, 140], [135, 195], [155, 175], [125, 155],
]
const CLASS_B = [
  [320, 300], [350, 280], [300, 320], [340, 340], [310, 290],
  [360, 310], [330, 350], [290, 340], [370, 290], [345, 325],
]

const COLORS = { A: '#8b5cf6', B: '#f97316' }

function euclidean(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

function knnPredict(query, dataPoints, k, weights) {
  const distances = dataPoints.map((p) => ({
    point: p.pos,
    cls: p.cls,
    dist: euclidean(query, p.pos),
  }))
  distances.sort((a, b) => a.dist - b.dist)
  const neighbors = distances.slice(0, k)
  
  let scoreA = 0
  let scoreB = 0
  
  neighbors.forEach(n => {
    const weight = weights === 'distance' ? (n.dist === 0 ? 1000 : 1 / n.dist) : 1
    if (n.cls === 'A') scoreA += weight
    else scoreB += weight
  })

  return { neighbors, prediction: scoreA >= scoreB ? 'A' : 'B', scoreA, scoreB }
}

export default function KNNModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'knn')
  const [k, setK] = useState(3)
  const [query, setQuery] = useState([230, 230])
  const [dragging, setDragging] = useState(false)
  const [weights, setWeights] = useState('uniform')

  const allPoints = [
    ...CLASS_A.map((p) => ({ pos: p, cls: 'A' })),
    ...CLASS_B.map((p) => ({ pos: p, cls: 'B' })),
  ]

  const { neighbors, prediction, scoreA, scoreB } = knnPredict(query, allPoints, k, weights)

  // Canvas rendering
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // Background
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

    // Distance lines to K nearest
    neighbors.forEach((n) => {
      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = `${COLORS[n.cls]}66`
      ctx.lineWidth = 1.5
      ctx.moveTo(query[0], query[1])
      ctx.lineTo(n.point[0], n.point[1])
      ctx.stroke()
      ctx.setLineDash([])

      // Distance label
      const mx = (query[0] + n.point[0]) / 2
      const my = (query[1] + n.point[1]) / 2
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '10px Inter'
      ctx.fillText(n.dist.toFixed(1), mx + 4, my - 4)
    })

    // Data points
    allPoints.forEach((p) => {
      const isNeighbor = neighbors.some(
        (n) => n.point[0] === p.pos[0] && n.point[1] === p.pos[1]
      )
      ctx.beginPath()
      ctx.arc(p.pos[0], p.pos[1], isNeighbor ? 8 : 6, 0, Math.PI * 2)
      ctx.fillStyle = isNeighbor ? COLORS[p.cls] : `${COLORS[p.cls]}88`
      ctx.fill()
      if (isNeighbor) {
        ctx.strokeStyle = '#ffffff44'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    // K-radius circle
    if (neighbors.length > 0) {
      const maxDist = neighbors[neighbors.length - 1].dist
      ctx.beginPath()
      ctx.arc(query[0], query[1], maxDist, 0, Math.PI * 2)
      ctx.strokeStyle = `${COLORS[prediction]}33`
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Query point
    ctx.beginPath()
    const qColor = COLORS[prediction]
    ctx.arc(query[0], query[1], 10, 0, Math.PI * 2)
    ctx.fillStyle = qColor
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Query crosshair
    ctx.beginPath()
    ctx.moveTo(query[0] - 15, query[1])
    ctx.lineTo(query[0] + 15, query[1])
    ctx.moveTo(query[0], query[1] - 15)
    ctx.lineTo(query[0], query[1] + 15)
    ctx.strokeStyle = `${qColor}55`
    ctx.lineWidth = 1
    ctx.stroke()

    // Labels
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Inter'
    ctx.fillText('?', query[0] - 3.5, query[1] + 4)

    // Legend
    ctx.fillStyle = COLORS.A
    ctx.fillRect(w - 120, 16, 10, 10)
    ctx.fillStyle = '#ffffffcc'
    ctx.font = '11px Inter'
    ctx.fillText('Class A (Setosa)', w - 105, 25)

    ctx.fillStyle = COLORS.B
    ctx.fillRect(w - 120, 34, 10, 10)
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('Class B (Versicolor)', w - 105, 43)
  }, [query, k, neighbors, prediction, allPoints])

  useEffect(() => { draw() }, [draw])

  // Mouse handlers for dragging query point
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ]
  }

  const handleMouseDown = (e) => {
    const [mx, my] = getCanvasPos(e)
    if (Math.abs(mx - query[0]) < 20 && Math.abs(my - query[1]) < 20) {
      setDragging(true)
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    const [mx, my] = getCanvasPos(e)
    setQuery([
      Math.max(10, Math.min(canvasRef.current.width - 10, mx)),
      Math.max(10, Math.min(canvasRef.current.height - 10, my)),
    ])
  }

  const handleMouseUp = () => setDragging(false)

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#a78bfa">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              K-Nearest Neighbors (KNN)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              KNN is a non-parametric, instance-based learning algorithm. It classifies a new
              data point by finding the <strong>K closest training examples</strong> in the
              feature space and assigning the majority class label.
            </p>
          </div>
          
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
            <h3 className="text-red-400 font-bold text-sm mb-1 uppercase tracking-wider">Critical Operational Rule</h3>
            <p className="text-sm text-text-secondary print-text-muted">
              <strong>Always scale your data before running KNN.</strong> Distance metrics are 
              easily overwhelmed by feature scales. If Feature X is in millions and Feature Y is in decimals, 
              Feature X will mathematically dominate the distance calculation!
            </p>
          </div>

          <GlowCard glowColor="rgba(167, 139, 250, 0.15)">
            <SectionTitle accent="#a78bfa">Core Mathematics</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              KNN computes the distance between query point <InlineMath math="q" /> and training point <InlineMath math="p" />. 
              The most common metric is the <strong>Minkowski distance</strong>:
            </p>
            <div className="bg-black/30 p-4 rounded text-center my-2 text-brand-100 overflow-x-auto">
               <BlockMath math="D(q, p) = \left( \sum_{i=1}^n |q_i - p_i|^p \right)^{\frac{1}{p}}" />
            </div>
            
            <p className="text-sm text-text-secondary mt-2 mb-1 print-text-muted">By setting <InlineMath math="p" />, we define specific geometries:</p>
            <ul className="text-sm text-text-secondary list-disc ml-5 mb-3 print-text-muted">
              <li><strong><InlineMath math="p=2" /> (Euclidean Distance):</strong> The shortest straight-line path.</li>
              <li><strong><InlineMath math="p=1" /> (Manhattan Distance):</strong> Grid-based, path-like distance.</li>
            </ul>
            
            <p className="text-sm text-text-secondary print-text-muted mt-3">
              After computing distances, we sort them ascending and select the top <strong>K = <LiveValue value={k} color="#a78bfa" /></strong> neighbors.
            </p>
          </GlowCard>

          <GlowCard glowColor="rgba(167, 139, 250, 0.15)">
            <SectionTitle accent="#a78bfa">📋 Example: Iris Flower Classification</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              A botanist discovers a new flower sample at coordinates
              (<LiveValue value={query[0].toFixed(0)} color="#a78bfa" />,{' '}
              <LiveValue value={query[1].toFixed(0)} color="#a78bfa" />).
              They want to classify it as either <strong style={{color: COLORS.A}}>Setosa (A)</strong> or{' '}
              <strong style={{color: COLORS.B}}>Versicolor (B)</strong>.
            </p>

            <div className="mt-2 rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-3 py-2 text-left text-text-muted font-medium">#</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Position</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Distance</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Class</th>
                    {weights === 'distance' && <th className="px-3 py-2 text-left text-text-muted font-medium">Weight <InlineMath math="(1/d)" /></th>}
                  </tr>
                </thead>
                <tbody>
                  {neighbors.map((n, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="px-3 py-1.5 text-text-muted">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-text-secondary">
                        ({n.point[0]}, {n.point[1]})
                      </td>
                      <td className="px-3 py-1.5">
                        <LiveValue value={n.dist} color="#a78bfa" />
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="font-semibold" style={{ color: COLORS[n.cls] }}>
                          {n.cls === 'A' ? 'Setosa' : 'Versicolor'}
                        </span>
                      </td>
                      {weights === 'distance' && (
                        <td className="px-3 py-1.5 font-mono text-emerald-400">
                          {(n.dist === 0 ? 1000 : 1/n.dist).toFixed(4)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-lg bg-brand-500/10 border border-brand-500/20 p-3">
              <p className="text-sm font-semibold" style={{ color: COLORS[prediction] }}>
                ✦ Prediction: {prediction === 'A' ? 'Setosa' : 'Versicolor'} (Class {prediction})
              </p>
              <p className="text-xs text-text-muted mt-1">
                {weights === 'uniform' ? (
                  <span>Majority vote: {scoreA} A vs {scoreB} B</span>
                ) : (
                  <span>Distance-weighted vote: {scoreA.toFixed(3)} A vs {scoreB.toFixed(3)} B</span>
                )}
              </p>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0">
            K = <span className="font-mono font-bold text-brand-400">{k}</span>
            <input
              type="range"
              min={1} max={9} step={2}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-24 accent-[#a78bfa]"
            />
          </label>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0">
            Weights:
            <select 
              value={weights} 
              onChange={e => setWeights(e.target.value)}
              className="bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-xs text-white"
            >
              <option value="uniform">uniform</option>
              <option value="distance">distance</option>
            </select>
          </label>
          <button
            onClick={exportPng}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06] shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-[#0f1117]">
          <canvas
            ref={canvasRef}
            width={480}
            height={420}
            className="rounded-xl border border-white/[0.06] cursor-crosshair max-w-full shadow-[0_0_40px_rgba(139,92,246,0.1)]"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  )
}
