import { useState, useRef, useEffect, useCallback } from 'react'
import { Download, GitMerge, GitPullRequestDraft, GitBranch, Trash2, MousePointer2 } from 'lucide-react'
import { BlockMath, InlineMath } from 'react-katex'
import { usePngExport } from '../../hooks/useExport.js'
import {
  GlowCard,
  AnimatedBadge,
  SectionTitle,
  LiveValue,
} from '../ui/AceternityComponents.jsx'

// --- ML Logic ---
function calculateImpurity(points, criterion) {
  if (points.length === 0) return 0
  let class0 = 0, class1 = 0
  for (let p of points) p.cls === 0 ? class0++ : class1++
  const r0 = class0 / points.length
  const r1 = class1 / points.length
  
  if (criterion === 'gini') {
    return 1 - (r0 * r0 + r1 * r1)
  } else {
    let e = 0
    if (r0 > 0) e -= r0 * Math.log2(r0)
    if (r1 > 0) e -= r1 * Math.log2(r1)
    return e
  }
}

function findBestSplit(points, criterion) {
  let bestGain = -1
  let bestSplit = null
  const currentImpurity = calculateImpurity(points, criterion)
  
  const features = ['x', 'y']
  for (let f of features) {
    const sorted = [...points].sort((a, b) => a[f] - b[f])
    for (let i = 0; i < sorted.length - 1; i++) {
      // Only evaluate split if class changes or value changes
      if (sorted[i].cls !== sorted[i+1].cls || sorted[i][f] !== sorted[i+1][f]) {
        const threshold = (sorted[i][f] + sorted[i+1][f]) / 2
        const left = sorted.slice(0, i + 1)
        const right = sorted.slice(i + 1)
        
        const pLeft = left.length / points.length
        const pRight = right.length / points.length
        
        const gain = currentImpurity - (pLeft * calculateImpurity(left, criterion) + pRight * calculateImpurity(right, criterion))
        
        if (gain > bestGain) {
          bestGain = gain
          bestSplit = { feature: f, threshold, left, right }
        }
      }
    }
  }
  return { bestGain, bestSplit }
}

function buildTree(points, depth, maxDepth, criterion) {
  const impurity = calculateImpurity(points, criterion)
  
  let class0 = 0, class1 = 0
  for (let p of points) p.cls === 0 ? class0++ : class1++
  const dominantClass = class0 >= class1 ? 0 : 1

  const node = {
    impurity,
    samples: points.length,
    dominantClass,
    classCounts: [class0, class1],
    isLeaf: true
  }

  if (impurity === 0 || points.length < 2 || depth >= maxDepth) {
    return node
  }

  const { bestGain, bestSplit } = findBestSplit(points, criterion)
  
  if (bestGain > 0 && bestSplit) {
    node.isLeaf = false
    node.feature = bestSplit.feature
    node.threshold = bestSplit.threshold
    node.left = buildTree(bestSplit.left, depth + 1, maxDepth, criterion)
    node.right = buildTree(bestSplit.right, depth + 1, maxDepth, criterion)
  }

  return node
}

function predict(tree, point) {
  if (!tree) return 0
  if (tree.isLeaf) return tree.dominantClass
  if (point[tree.feature] <= tree.threshold) {
    return predict(tree.left, point)
  } else {
    return predict(tree.right, point)
  }
}

// Generate Bootstrap sample
function bootstrap(points) {
  const n = points.length
  const sample = []
  for (let i = 0; i < n; i++) {
    sample.push(points[Math.floor(Math.random() * n)])
  }
  return sample
}

// Predict Random Forest
function predictRF(forest, point) {
  if (!forest || forest.length === 0) return 0
  let votes0 = 0, votes1 = 0
  for (let tree of forest) {
    const pred = predict(tree, point)
    pred === 0 ? votes0++ : votes1++
  }
  return votes0 >= votes1 ? 0 : 1
}


// --- Components ---
const TreeSVG = ({ tree, width = 600, height = 300, scale = 1 }) => {
  if (!tree || tree.samples === 0) return null

  // Calculate layout
  const nodes = []
  const links = []
  
  const calcLayout = (node, x, y, xOffset) => {
    const layoutNode = { ...node, x, y }
    nodes.push(layoutNode)
    if (!node.isLeaf) {
      const leftY = y + 50
      const rightY = y + 50
      const leftX = x - xOffset
      const rightX = x + xOffset
      links.push({ x1: x, y1: y, x2: leftX, y2: leftY })
      links.push({ x1: x, y1: y, x2: rightX, y2: rightY })
      layoutNode.leftLayout = calcLayout(node.left, leftX, leftY, xOffset / 2)
      layoutNode.rightLayout = calcLayout(node.right, rightX, rightY, xOffset / 2)
    }
    return layoutNode
  }

  calcLayout(tree, width / 2, 20, width / 4)

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', minWidth: width, minHeight: height }}>
      <svg width="100%" height={height} overflow="visible">
        {links.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1 + 15} x2={l.x2} y2={l.y2 - 15} stroke="#fbbf2455" strokeWidth={2} />
        ))}
        {nodes.map((n, i) => {
          const isLeaf = n.isLeaf
          const boxW = 56
          const boxH = 34
          return (
            <g key={i} transform={`translate(${n.x}, ${n.y})`}>
              <rect 
                x={-boxW/2} y={-boxH/2} width={boxW} height={boxH} 
                rx={4} 
                fill={isLeaf ? (n.dominantClass === 0 ? '#f43f5e22' : '#3b82f622') : '#fbbf2411'} 
                stroke={isLeaf ? (n.dominantClass === 0 ? '#f43f5e' : '#3b82f6') : '#fbbf24'} 
                strokeWidth={1.5}
              />
              {!isLeaf ? (
                <>
                  <text x={0} y={-4} fill="#e5e7eb" fontSize={8} fontWeight="bold" textAnchor="middle">{n.feature.toUpperCase()} {`<=`} {n.threshold.toFixed(1)}</text>
                  <text x={0} y={6} fill="#9ca3af" fontSize={8} textAnchor="middle">I: {n.impurity.toFixed(2)}</text>
                  <text x={0} y={14} fill="#9ca3af" fontSize={8} textAnchor="middle">N: {n.samples}</text>
                </>
              ) : (
                <>
                   <text x={0} y={-2} fill={n.dominantClass === 0 ? '#f43f5e' : '#3b82f6'} fontSize={9} fontWeight="bold" textAnchor="middle">Class {n.dominantClass}</text>
                   <text x={0} y={8} fill="#9ca3af" fontSize={8} textAnchor="middle">N: {n.samples}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}


export default function TreeEnsembleModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'decision-tree')
  
  const [activeTab, setActiveTab] = useState('dt') // 'dt', 'rf', 'gb'
  
  // DT State
  const [points, setPoints] = useState([
    {x: 30, y: 30, cls: 0}, {x: 35, y: 40, cls: 0}, {x: 40, y: 30, cls: 0},
    {x: 70, y: 70, cls: 1}, {x: 80, y: 65, cls: 1}, {x: 75, y: 80, cls: 1},
    {x: 80, y: 30, cls: 0}, {x: 25, y: 80, cls: 1}
  ])
  const [maxDepth, setMaxDepth] = useState(3)
  const [criterion, setCriterion] = useState('gini')
  const [nextClass, setNextClass] = useState(0) // 0: Red, 1: Blue
  const [estimators, setEstimators] = useState(5)

  // Derived
  const rootImpurity = calculateImpurity(points, criterion)
  const tree = buildTree(points, 0, maxDepth, criterion)
  
  // Random Forest Building
  const [forest, setForest] = useState([])
  useEffect(() => {
    if (activeTab === 'rf') {
      const newForest = []
      for (let i=0; i<estimators; i++) {
        const sample = bootstrap(points)
        newForest.push(buildTree(sample, 0, maxDepth, criterion))
      }
      setForest(newForest)
    }
  }, [points, maxDepth, criterion, estimators, activeTab])

  // Canvas drawing logic
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, w, h)

    // Draw decision boundaries
    if (points.length > 0) {
      const step = 4
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          let cls = 0
          if (activeTab === 'dt' || activeTab === 'gb') {
            cls = predict(tree, {x: (x/w)*100, y: (y/h)*100})
          } else if (activeTab === 'rf') {
            cls = predictRF(forest, {x: (x/w)*100, y: (y/h)*100})
          }
          
          ctx.fillStyle = cls === 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)'
          ctx.fillRect(x, y, step, step)
        }
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Points
    points.forEach(p => {
      const cx = (p.x / 100) * w
      const cy = (p.y / 100) * h
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = p.cls === 0 ? '#f43f5e' : '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
    
  }, [points, tree, activeTab, forest])

  useEffect(() => { draw() }, [draw])

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // map to 0-100 scale
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPoints([...points, {x, y, cls: nextClass}])
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#f59e0b">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Tree-Based & Ensemble Models
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Tree-based algorithms split the feature space into distinct regions. Ensembles combine multiple weak learners to create a single, highly accurate predictive model.
            </p>
          </div>

          <GlowCard glowColor="rgba(245, 158, 11, 0.15)">
            <SectionTitle accent="#f59e0b">Interactive Sandbox State</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-3 text-center">
              <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Root Node Impurity</p>
                <p className="font-mono text-xl font-bold text-amber-400">
                  <LiveValue value={rootImpurity.toFixed(3)} color="#f59e0b" />
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Points</p>
                <p className="font-mono text-xl font-bold text-amber-400">
                  <LiveValue value={points.length} color="#f59e0b" />
                </p>
              </div>
            </div>
          </GlowCard>

          {/* Decision Trees */}
          <GlowCard glowColor="rgba(245, 158, 11, 0.15)">
            <SectionTitle accent="#f59e0b">1. Decision Trees</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              A Decision Tree splits data iteratively based on feature values that maximize <strong>Information Gain</strong> or minimize <strong>Impurity</strong>.
            </p>
            <div className="bg-surface-overlay/50 p-3 rounded text-center my-2 text-text-primary overflow-x-auto space-y-3 relative">
              <div className={`transition-opacity ${criterion === 'gini' ? 'opacity-100' : 'opacity-30'}`}>
                <span className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold flex items-center justify-center gap-2">
                  Gini Impurity {criterion === 'gini' && <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Active</span>}
                </span>
                <BlockMath math="G = 1 - \sum_{i=1}^{c} p_i^2" />
              </div>
              <div className={`border-t border-amber-500/20 pt-2 transition-opacity ${criterion === 'entropy' ? 'opacity-100' : 'opacity-30'}`}>
                 <span className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold flex items-center justify-center gap-2">
                   Entropy {criterion === 'entropy' && <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Active</span>}
                 </span>
                <BlockMath math="E = - \sum_{i=1}^{c} p_i \log_2(p_i)" />
              </div>
            </div>
            <ul className="text-sm text-text-secondary list-disc ml-5 print-text-muted">
              <li><strong>Pros:</strong> Highly interpretable, handles non-linear relationships.</li>
              <li><strong>Cons:</strong> Extremely prone to <em>overfitting</em> (high variance).</li>
            </ul>
          </GlowCard>

          {/* Random Forests */}
          <GlowCard glowColor="rgba(245, 158, 11, 0.15)">
            <SectionTitle accent="#f59e0b">2. Random Forests (Bagging)</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              <strong>Bagging (Bootstrap Aggregating):</strong> Trains dozens of independent Decision Trees on random subsets of the data and random subsets of features.
            </p>
            <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20 text-center my-2">
               <span className="text-amber-400 font-bold text-xs">High Variance → Low Variance</span>
            </div>
            <p className="text-sm text-text-secondary print-text-muted">
              Because the trees are uncorrelated, averaging them dramatically reduces the risk of overfitting, smoothing the decision boundary in the sandbox.
            </p>
          </GlowCard>
          
          {/* Gradient Boosting */}
          <GlowCard glowColor="rgba(245, 158, 11, 0.15)">
            <SectionTitle accent="#f59e0b">3. Gradient Boosting</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              <strong>Boosting:</strong> Trains trees <em>sequentially</em>. Each new tree focuses specifically on correcting the errors (residuals) made by the previous ensemble of trees.
            </p>
            <div className="bg-surface-overlay/50 p-2 rounded text-center my-2 text-text-primary overflow-x-auto">
               <BlockMath math="F_m(x) = F_{m-1}(x) + \alpha \cdot h_m(x)" />
            </div>
            <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20 text-center mt-3">
               <span className="text-amber-400 font-bold text-xs">High Bias → Low Bias</span>
            </div>
          </GlowCard>

        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col bg-[#0f1117] overflow-y-auto custom-scrollbar">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 shrink-0 no-print" data-no-print>
          <div className="flex gap-1 bg-white/[0.05] p-1 rounded-lg border border-white/[0.06] sm:mb-0">
              <button
                onClick={() => setActiveTab('dt')}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors whitespace-nowrap ${activeTab === 'dt' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <GitBranch className="w-4 h-4" /> Decision Tree
              </button>
              <button
                onClick={() => setActiveTab('rf')}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors whitespace-nowrap ${activeTab === 'rf' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <GitMerge className="w-4 h-4" /> Random Forest
              </button>
              <button
                onClick={() => setActiveTab('gb')}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors whitespace-nowrap ${activeTab === 'gb' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <GitPullRequestDraft className="w-4 h-4" /> Gradient Boosting
              </button>
          </div>
        </div>

        {/* Feature Grid Panel */}
        <div className="flex flex-col border-b border-white/[0.06] items-center p-6 shrink-0">
           {/* Controls Row */}
           <div className="w-full max-w-[400px] flex justify-between items-center mb-4 shrink-0">
             <div className="flex gap-2 bg-surface-overlay/80 p-2 rounded-lg border border-white/[0.1] backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.1)]">
               <button 
                  onClick={() => setNextClass(0)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${nextClass === 0 ? 'bg-rose-500 text-text-primary' : 'bg-white/[0.1] text-text-muted hover:bg-white/[0.2]'}`}
               ><MousePointer2 className="w-3 h-3"/> Plot Red</button>
               <button 
                  onClick={() => setNextClass(1)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${nextClass === 1 ? 'bg-blue-500 text-text-primary' : 'bg-white/[0.1] text-text-muted hover:bg-white/[0.2]'}`}
               ><MousePointer2 className="w-3 h-3"/> Plot Blue</button>
             </div>
             <button onClick={() => setPoints([])} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/[0.06] shrink-0 whitespace-nowrap">
                <Trash2 className="w-3.5 h-3.5" /> Clear Points
             </button>
           </div>
           
           <div className="flex justify-center shrink-0 w-full overflow-x-auto">
              <canvas
                ref={canvasRef}
                width={400}
                height={260}
                onClick={handleCanvasClick}
                className="rounded-xl border border-white/[0.1] shadow-2xl cursor-crosshair shrink-0"
              />
           </div>
        </div>
        
        {/* Config and Tree Vis Panel */}
        <div className="flex flex-col shrink-0 min-h-[400px]">
          
           <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/[0.06] bg-surface-raised/20 shrink-0">
             <div className="flex gap-1 bg-surface-overlay/60 p-1 rounded-lg border border-white/[0.05]">
                <button
                  onClick={() => setCriterion('gini')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${criterion === 'gini' ? 'bg-white/[0.15] text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                >Gini</button>
                <button
                  onClick={() => setCriterion('entropy')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${criterion === 'entropy' ? 'bg-white/[0.15] text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                >Entropy</button>
             </div>
             
             <label className="text-xs text-text-muted flex items-center gap-2">
                Max Depth: <span className="font-mono text-amber-400 w-4">{maxDepth}</span>
                <input
                  type="range" min={1} max={5} step={1}
                  value={maxDepth} onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-24 accent-amber-500"
                />
             </label>

             {activeTab === 'rf' && (
                <label className="text-xs text-text-muted flex items-center gap-2">
                  Estimators: <span className="font-mono text-amber-400 w-4">{estimators}</span>
                  <input
                    type="range" min={1} max={20} step={1}
                    value={estimators} onChange={(e) => setEstimators(Number(e.target.value))}
                    className="w-24 accent-amber-500"
                  />
               </label>
             )}
           </div>

           <div className="w-full overflow-x-auto p-4 flex justify-center items-start">
             {activeTab === 'dt' && (
                <TreeSVG tree={tree} width={Math.max(600, maxDepth * 180)} height={200 + maxDepth * 60} />
             )}
             
             {activeTab === 'rf' && forest.length > 0 && (
                <div className="flex gap-8 shrink-0 pb-8">
                   {forest.slice(0, 3).map((ft, i) => (
                      <div key={i} className="flex flex-col items-center bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                        <p className="text-xs text-text-muted mb-4 font-bold tracking-widest uppercase">Estimator {i+1}</p>
                        <TreeSVG tree={ft} width={Math.max(300, maxDepth * 80)} height={150 + maxDepth * 50} scale={0.7} />
                      </div>
                   ))}
                   {forest.length > 3 && (
                     <div className="flex flex-col items-center justify-center p-8 opacity-50 min-w-[200px]">
                        <span className="text-2xl font-bold text-text-muted tracking-[0.5em]">...</span>
                        <p className="text-xs mt-4">And {forest.length - 3} more trees</p>
                     </div>
                   )}
                </div>
             )}

             {activeTab === 'gb' && (
               <div className="flex items-center mt-12 opacity-50 flex-col justify-center max-w-sm text-center">
                 <GitPullRequestDraft className="w-12 h-12 text-amber-500/50 mb-4" />
                 <p className="text-sm font-bold text-text-secondary">Gradient Boosting Sandbox</p>
                 <p className="text-xs text-text-muted mt-2">Visually similar to Decision Trees, but sequentially fit on residuals. Feature grid above shows the final ensemble boundary.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  )
}
