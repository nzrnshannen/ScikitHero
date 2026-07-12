import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Download, RefreshCw, MousePointer2 } from 'lucide-react'
import { usePngExport } from '../../hooks/useExport.js'
import {
  GlowCard,
  AnimatedBadge,
  LiveValue,
  SectionTitle,
  CodeSnippet,
} from '../ui/AceternityComponents.jsx'

const POINT_TYPES = { UNVISITED: 0, CORE: 1, BORDER: 2, NOISE: 3 }

const CLUSTER_COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#eab308', // yellow
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

function generateMoons(n = 300) {
  const pts = []
  for (let i = 0; i < n / 2; i++) {
    const angle = Math.random() * Math.PI
    const r = 80 + (Math.random() - 0.5) * 15
    pts.push({ x: 240 - 40 + Math.cos(angle) * r, y: 210 - 20 - Math.sin(angle) * r })
  }
  for (let i = 0; i < n / 2; i++) {
    const angle = Math.random() * Math.PI
    const r = 80 + (Math.random() - 0.5) * 15
    pts.push({ x: 240 + 40 + Math.cos(angle) * r, y: 210 + 20 + Math.sin(angle) * r })
  }
  return pts
}

function generateCircles(n = 300) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const isInner = Math.random() > 0.6
    const angle = Math.random() * Math.PI * 2
    const r = isInner ? (40 + (Math.random() - 0.5) * 15) : (120 + (Math.random() - 0.5) * 20)
    pts.push({ x: 240 + Math.cos(angle) * r, y: 210 + Math.sin(angle) * r })
  }
  return pts
}

function generateBlobs(n = 300) {
  const pts = []
  const centers = [{x: 140, y: 140}, {x: 340, y: 140}, {x: 240, y: 300}]
  for (let i = 0; i < n - 40; i++) {
    const c = centers[i % 3]
    pts.push({ x: c.x + (Math.random() - 0.5) * 60, y: c.y + (Math.random() - 0.5) * 60 })
  }
  for (let i = 0; i < 40; i++) {
    pts.push({ x: Math.random() * 480, y: Math.random() * 420 })
  }
  return pts
}

function runDBSCAN(pts, eps, minPts) {
  pts.forEach(p => {
    p.type = POINT_TYPES.UNVISITED
    p.clusterId = null
    p.visited = false
  })

  const dist = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)
  const neighbors = pts.map(p1 => pts.filter(p2 => dist(p1, p2) <= eps))

  let currentCluster = 0

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (p.visited) continue

    p.visited = true

    if (neighbors[i].length < minPts) {
      p.type = POINT_TYPES.NOISE
    } else {
      currentCluster++
      p.type = POINT_TYPES.CORE
      p.clusterId = currentCluster

      const seedSet = [...neighbors[i]]
      
      for (let j = 0; j < seedSet.length; j++) {
        const seed = seedSet[j]
        const seedIndex = pts.indexOf(seed)
        
        if (seed.type === POINT_TYPES.NOISE) {
          seed.type = POINT_TYPES.BORDER
          seed.clusterId = currentCluster
        }
        
        if (!seed.visited) {
          seed.visited = true
          seed.clusterId = currentCluster
          const seedNeighbors = neighbors[seedIndex]
          if (seedNeighbors.length >= minPts) {
            seed.type = POINT_TYPES.CORE
            seedSet.push(...seedNeighbors)
          } else {
            seed.type = POINT_TYPES.BORDER
          }
        }
      }
    }
  }

  return {
    clustersCount: currentCluster,
    coreCount: pts.filter(p => p.type === POINT_TYPES.CORE).length,
    borderCount: pts.filter(p => p.type === POINT_TYPES.BORDER).length,
    noiseCount: pts.filter(p => p.type === POINT_TYPES.NOISE).length
  }
}

export default function DBSCANModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'dbscan')
  
  const [points, setPoints] = useState(() => generateMoons())
  const [datasetIndex, setDatasetIndex] = useState(0)
  const datasets = ['Moons', 'Circles', 'Blobs']
  
  const [epsilon, setEpsilon] = useState(25)
  const [minSamples, setMinSamples] = useState(4)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const stats = useMemo(() => {
    return runDBSCAN(points, epsilon, minSamples)
  }, [points, epsilon, minSamples])

  const handleGenerateData = () => {
    const nextIdx = (datasetIndex + 1) % datasets.length
    setDatasetIndex(nextIdx)
    if (nextIdx === 0) setPoints(generateMoons())
    else if (nextIdx === 1) setPoints(generateCircles())
    else setPoints(generateBlobs())
  }

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    let closest = null
    let minDist = Infinity
    for (const p of points) {
      const d = Math.sqrt((p.x - x)**2 + (p.y - y)**2)
      if (d < Math.max(epsilon, 15) && d < minDist) {
        minDist = d
        closest = p
      }
    }
    setHoveredPoint(closest)
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setPoints(prev => [...prev, { x, y }])
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    if (hoveredPoint) {
      ctx.beginPath()
      ctx.arc(hoveredPoint.x, hoveredPoint.y, epsilon, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    points.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      
      if (p.type === POINT_TYPES.NOISE) {
        ctx.fillStyle = '#0f1117'
        ctx.fill()
        ctx.strokeStyle = '#6b7280'
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        const color = CLUSTER_COLORS[(p.clusterId - 1) % CLUSTER_COLORS.length]
        
        if (p.type === POINT_TYPES.CORE) {
          ctx.fillStyle = color
          ctx.fill()
        } else if (p.type === POINT_TYPES.BORDER) {
          ctx.fillStyle = `${color}66`
          ctx.fill()
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      if (p === hoveredPoint) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

  }, [points, hoveredPoint, epsilon])

  useEffect(() => { draw() }, [draw])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Notes */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#10b981">Unsupervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              DBSCAN Clustering
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              <strong>Density-Based Spatial Clustering of Applications with Noise</strong> groups together points that are closely packed, marking points that lie alone in low-density regions as outliers. Unlike K-Means, it doesn't require you to specify the number of clusters in advance and can find arbitrarily shaped clusters.
            </p>
          </div>

          <GlowCard glowColor="rgba(16, 185, 129, 0.15)">
            <SectionTitle accent="#10b981">Point Classifications</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              DBSCAN classifies every point into one of three distinct categories based on its local neighborhood density:
            </p>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="h-3 w-3 rounded-full bg-[#10b981] mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div>
                  <strong className="text-text-primary">Core Points:</strong>
                  <br />A point is a core point if there are at least <em>MinSamples</em> points (including itself) within a distance of <em>Epsilon (ε)</em>. They form the dense interior of a cluster.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-[#10b981] bg-[#10b981]/30 mt-1 shrink-0" />
                <div>
                  <strong className="text-text-primary">Border Points:</strong>
                  <br />A point is a border point if it is reachable from a core point (within ε) but has fewer than <em>MinSamples</em> points in its own neighborhood.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-3 w-3 rounded-full border-[1.5px] border-gray-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-text-primary">Noise / Outliers:</strong>
                  <br />A point is noise if it is neither a core point nor reachable from any core point. It belongs to no cluster.
                </div>
              </li>
            </ul>
          </GlowCard>

          <GlowCard glowColor="rgba(16, 185, 129, 0.15)">
            <SectionTitle accent="#10b981">Live Statistics</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Clusters Discovered</p>
                <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                  <LiveValue value={stats.clustersCount} color="#34d399" />
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Points</p>
                <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
                  <LiveValue value={points.length} color="#fff" />
                </p>
              </div>
            </div>
            
            <div className="mt-3 rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted border-l-2 border-emerald-500 bg-white/[0.02]">Core Points</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400 bg-white/[0.02]"><LiveValue value={stats.coreCount} color="#34d399" /></td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-text-muted border-l-2 border-emerald-500/50 bg-white/[0.01]">Border Points</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400/80 bg-white/[0.01]"><LiveValue value={stats.borderCount} color="#34d399" /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-text-muted border-l-2 border-gray-500">Noise / Outliers</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400"><LiveValue value={stats.noiseCount} color="#9ca3af" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(16, 185, 129, 0.15)">
            <SectionTitle accent="#10b981">Scikit-Learn Implementation</SectionTitle>
            <CodeSnippet title="sklearn — DBSCAN">
{`from sklearn.cluster import DBSCAN

# eps: Max distance between two samples
# min_samples: Min points in neighborhood to be considered a core point
dbscan = DBSCAN(eps=${epsilon}, min_samples=${minSamples})

# Fit and predict cluster labels (-1 is Noise)
labels = dbscan.fit_predict(X)`}
            </CodeSnippet>
          </GlowCard>

        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0 whitespace-nowrap">
            Epsilon (ε) = <span className="font-mono font-bold text-emerald-400 w-6">{epsilon}</span>
            <input
              type="range"
              min={10} max={60} step={1}
              value={epsilon}
              onChange={(e) => setEpsilon(Number(e.target.value))}
              className="w-24 accent-[#10b981]"
            />
          </label>
          
          <label className="text-xs text-text-muted flex items-center gap-2 shrink-0 whitespace-nowrap">
            MinSamples = <span className="font-mono font-bold text-emerald-400 w-4">{minSamples}</span>
            <input
              type="range"
              min={2} max={10} step={1}
              value={minSamples}
              onChange={(e) => setMinSamples(Number(e.target.value))}
              className="w-24 accent-[#10b981]"
            />
          </label>

          <div className="h-4 w-px bg-white/[0.1] shrink-0"></div>

          <button
            onClick={handleGenerateData}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="h-3 w-3" />
            Dataset: {datasets[datasetIndex]}
          </button>

          <button
            onClick={exportPng}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white hover:bg-white/[0.1] transition-colors border border-white/[0.06] shrink-0 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0f1117] relative">
          <div className="absolute top-6 flex items-center gap-2 text-xs text-text-muted bg-black/50 px-3 py-1.5 rounded-full border border-white/[0.05] pointer-events-none">
            <MousePointer2 className="w-3.5 h-3.5" />
            Hover to view ε radius. Click anywhere to add a point.
          </div>
          
          <canvas
            ref={canvasRef}
            width={480}
            height={420}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
            className="rounded-xl border border-white/[0.06] max-w-full cursor-crosshair"
            style={{ maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  )
}
