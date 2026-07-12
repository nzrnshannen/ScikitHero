import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Settings, Play, Square, CircleDot, Terminal, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePngExport } from '../../hooks/useExport.js'
import {
  GlowCard,
  AnimatedBadge,
  SectionTitle,
  LiveValue,
} from '../ui/AceternityComponents.jsx'

// Generate True Landscape Function
// Returns a score between 0.2 and 0.98
function trueLandscape(x, y) {
  const g1 = Math.exp(-(((x - 0.75)**2) / 0.04 + ((y - 0.8)**2) / 0.06));
  const g2 = 0.8 * Math.exp(-(((x - 0.2)**2) / 0.08 + ((y - 0.3)**2) / 0.05));
  const g3 = 0.6 * Math.exp(-(((x - 0.8)**2) / 0.1 + ((y - 0.2)**2) / 0.08));
  let score = g1 + g2 + g3;
  // normalize roughly to 0.2 - 0.98
  return 0.2 + Math.min(score, 1) * 0.78;
}

// Color map for score (0.2 to 0.98) -> Blue to Green
function getScoreColor(score) {
  // score 0.2 -> Hue 240 (Blue)
  // score 0.98 -> Hue 120 (Green)
  // score 1.0 -> Hue 60 (Yellow) if we want a peak
  const norm = (score - 0.2) / 0.78; 
  // Map norm [0, 1] to hue [240, 140]
  const hue = 240 - (norm * 100); 
  return `hsl(${hue}, 80%, 60%)`;
}

export default function TuningModule() {
  const canvasRef = useRef(null)
  const bgCanvasRef = useRef(null) // Pre-rendered background
  const exportPng = usePngExport(canvasRef, 'tuning')
  
  const [searchType, setSearchType] = useState('grid') // 'grid' or 'random'
  const [gridSize, setGridSize] = useState(6) // 6x6 = 36 iterations
  
  const [animState, setAnimState] = useState('idle') // 'idle', 'running', 'completed'
  const [testedPoints, setTestedPoints] = useState([])
  const [targetPoints, setTargetPoints] = useState([])
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false)
  
  // Metric States
  const [bestParams, setBestParams] = useState({ x: 0, y: 0, score: 0 })
  const totalModelsTrained = testedPoints.length * 5 // 5 folds

  const CANVAS_W = 400
  const CANVAS_H = 400

  // Draw Background Contour once
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const step = 4;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    for (let cx = 0; cx < CANVAS_W; cx += step) {
      for (let cy = 0; cy < CANVAS_H; cy += step) {
        const score = trueLandscape(cx / CANVAS_W, cy / CANVAS_H);
        // Faint outline: highly transparent
        ctx.fillStyle = `rgba(255, 255, 255, ${score * 0.1})`;
        ctx.fillRect(cx, cy, step, step);
      }
    }
  }, []);

  // Setup Target Points based on Search Type
  useEffect(() => {
    if (animState === 'running') return; // Don't change target points mid-run

    const pts = [];
    if (searchType === 'grid') {
      const step = 1 / (gridSize - 1);
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = i * step;
          const y = j * step;
          pts.push({ x, y, score: trueLandscape(x, y) });
        }
      }
    } else {
      const iters = gridSize * gridSize;
      for (let i = 0; i < iters; i++) {
        const x = Math.random();
        const y = Math.random();
        pts.push({ x, y, score: trueLandscape(x, y) });
      }
    }
    setTargetPoints(pts);
    setTestedPoints([]);
    setAnimState('idle');
    setBestParams({ x: 0, y: 0, score: 0 });
  }, [searchType, gridSize, animState])


  // Animation Engine
  useEffect(() => {
    if (animState !== 'running') return;

    let idx = 0;
    let maxScore = -1;
    let bestPt = null;

    const interval = setInterval(() => {
      if (idx >= targetPoints.length) {
        setAnimState('completed');
        clearInterval(interval);
        return;
      }

      const pt = targetPoints[idx];
      if (pt.score > maxScore) {
        maxScore = pt.score;
        bestPt = pt;
        setBestParams(bestPt);
      }

      setTestedPoints(prev => [...prev, pt]);
      idx++;
    }, 25); // 25ms per point -> ~1.5 sec for 6x6, ~3.6 sec for 12x12

    return () => clearInterval(interval);
  }, [animState, targetPoints]);

  const handleAnimate = () => {
    if (animState === 'running') {
      setAnimState('idle');
      setTestedPoints([]);
    } else {
      setTestedPoints([]);
      setBestParams({ x: 0, y: 0, score: 0 });
      setAnimState('running');
    }
  }


  // Draw Main Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const bgCanvas = bgCanvasRef.current
    if (!canvas || !bgCanvas) return
    const ctx = canvas.getContext('2d')
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Draw pre-rendered bg
    ctx.drawImage(bgCanvas, 0, 0);

    // Draw Grid Lines (light)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40, CANVAS_H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * 40); ctx.lineTo(CANVAS_W, i * 40); ctx.stroke()
    }

    // Draw Tested Points
    testedPoints.forEach((p, index) => {
      const cx = p.x * CANVAS_W;
      const cy = (1 - p.y) * CANVAS_H; // Invert Y so high param values are at top
      
      const isLast = index === testedPoints.length - 1 && animState === 'running';
      const isBest = animState === 'completed' && p === bestParams;

      if (isLast) {
        // Pulsing yellow for active CV
        ctx.beginPath()
        ctx.arc(cx, cy, 12, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)'
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fillStyle = getScoreColor(p.score)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      if (isBest) {
        // Highlight best point
        ctx.beginPath()
        ctx.arc(cx, cy, 14, 0, Math.PI * 2)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.setLineDash([4, 2])
        ctx.stroke()
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
        
        // Label
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText('BEST', cx + 15, cy - 10)
      }
    })

    // Axis Labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px sans-serif'
    ctx.fillText('Parameter 1 (e.g., C)', CANVAS_W / 2 - 40, CANVAS_H - 10)
    
    ctx.save()
    ctx.translate(15, CANVAS_H / 2 + 50)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Parameter 2 (e.g., Gamma)', 0, 0)
    ctx.restore()

  }, [testedPoints, animState, bestParams])

  useEffect(() => { draw() }, [draw])


  return (
    <div className="flex h-full flex-col lg:flex-row">
      
      {/* Hidden BG Canvas for contour */}
      <canvas ref={bgCanvasRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />

      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#ec4899">Evaluation & Selection</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Hyperparameter Optimization
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Hyperparameters are the dials and knobs of an algorithm (like the <strong>C</strong> parameter in SVM or <strong>Max Depth</strong> in Trees) that must be set <em>before</em> training. Finding the best combination is essential to maximize performance.
            </p>
          </div>

          <GlowCard glowColor="rgba(236, 72, 153, 0.15)">
            <SectionTitle accent="#ec4899">The Search Strategies</SectionTitle>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-pink-400 mb-1">GridSearchCV</h3>
                <p className="text-sm text-text-secondary print-text-muted">
                  Defines a strict, exhaustive grid of parameters. While it guarantees finding the best combination <em>within the specified grid</em>, it suffers from the <strong>Curse of Dimensionality</strong>. Adding more parameters exponentially increases training time.
                </p>
              </div>
              <div className="border-t border-white/[0.05] pt-3">
                <h3 className="text-sm font-bold text-pink-400 mb-1">RandomizedSearchCV</h3>
                <p className="text-sm text-text-secondary print-text-muted">
                  Samples randomly from parameter distributions. It is significantly faster and often finds equal or better parameters because it tests a broader range of distinct values rather than repeating coordinates on a strict grid.
                </p>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(236, 72, 153, 0.15)">
            <SectionTitle accent="#ec4899">Scikit-Learn Implementation</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              Always wrap your model in a Pipeline to prevent data leakage during Cross-Validation.
            </p>
            <div className="bg-black/50 p-3 rounded-lg border border-white/[0.1] text-xs font-mono text-indigo-200 overflow-x-auto">
              <p><span className="text-pink-400">from</span> sklearn.pipeline <span className="text-pink-400">import</span> Pipeline</p>
              <p><span className="text-pink-400">from</span> sklearn.model_selection <span className="text-pink-400">import</span> GridSearchCV</p>
              <br/>
              <p>pipe = Pipeline([</p>
              <p>  (<span className="text-green-400">'scaler'</span>, StandardScaler()),</p>
              <p>  (<span className="text-green-400">'svc'</span>, SVC())</p>
              <p>])</p>
              <br/>
              <p>param_grid = {'{'}</p>
              <p>  <span className="text-green-400">'svc__C'</span>: [0.1, 1, 10, 100],</p>
              <p>  <span className="text-green-400">'svc__gamma'</span>: [0.01, 0.1, 1]</p>
              <p>{'}'}</p>
              <br/>
              <p>search = GridSearchCV(pipe, param_grid, cv=<span className="text-orange-400">5</span>)</p>
              <p>search.fit(X_train, y_train)</p>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/[0.06] bg-surface-raised/50 no-print" data-no-print>
           <div className="flex gap-1 bg-white/[0.05] p-1 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setSearchType('grid')}
                disabled={animState === 'running'}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors ${searchType === 'grid' ? 'bg-pink-500/20 text-pink-400 font-bold' : 'text-text-secondary hover:text-white disabled:opacity-50'}`}
              >Grid Search</button>
              <button
                onClick={() => setSearchType('random')}
                disabled={animState === 'running'}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors ${searchType === 'random' ? 'bg-pink-500/20 text-pink-400 font-bold' : 'text-text-secondary hover:text-white disabled:opacity-50'}`}
              >Random Search</button>
          </div>
          
          <div className="h-4 w-px bg-white/[0.1]"></div>
          
          <label className="text-xs text-text-muted flex items-center gap-2">
            {searchType === 'grid' ? 'Grid Size' : 'Iterations'}: 
            <span className="font-mono text-pink-400 w-12 text-right">
              {searchType === 'grid' ? `${gridSize}x${gridSize}` : gridSize*gridSize}
            </span>
            <input
              type="range" min={3} max={12} step={1}
              value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}
              disabled={animState === 'running'}
              className="w-24 accent-pink-500 disabled:opacity-50"
            />
          </label>

          <button 
             onClick={handleAnimate} 
             className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ml-auto shadow-lg
               ${animState === 'running' 
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50' 
                  : 'bg-pink-500 text-white hover:bg-pink-400 border border-pink-400'
               }`}
          >
             {animState === 'running' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             {animState === 'running' ? 'Stop' : 'Animate Search'}
          </button>
        </div>

        {/* Feature Grid Panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 overflow-y-auto">
           
           <div className="relative shrink-0">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="rounded-xl border border-white/[0.1] shadow-2xl bg-[#0f1117]"
              />

              {/* iPhone style expanding widget overlay */}
              <div className="absolute top-4 left-4 flex flex-col items-start z-10">
                <button
                  onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                  className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/[0.1] px-3 py-1.5 rounded-full shadow-lg transition-colors text-xs font-bold text-white mb-2"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-pink-400" />
                  Live Metrics
                  {isMetricsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
                </button>

                <AnimatePresence>
                  {isMetricsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-black/70 p-4 rounded-xl border border-white/[0.1] backdrop-blur-md shadow-[0_0_20px_rgba(236,72,153,0.15)] min-w-[220px]"
                    >
                       <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-3">Live Search Metrics</p>
                       <p className="text-xs text-text-secondary mb-2 flex justify-between">
                         <span>Models Trained:</span>
                         <span className="font-mono text-white"><LiveValue value={totalModelsTrained} color="#ec4899"/></span>
                       </p>
                       <p className="text-xs text-text-secondary mb-2 flex justify-between">
                         <span>Highest CV Score:</span>
                         <span className="font-mono text-emerald-400"><LiveValue value={(bestParams.score * 100).toFixed(1)} color="#10b981"/>%</span>
                       </p>
                       <div className="mt-4 pt-3 border-t border-white/[0.1]">
                         <p className="text-[10px] text-text-muted mb-2 uppercase tracking-widest">Best Parameters</p>
                         <p className="font-mono text-xs text-pink-400 leading-relaxed">
                            Param 1 (X): <LiveValue value={bestParams.x.toFixed(3)} color="#ec4899"/><br/>
                            Param 2 (Y): <LiveValue value={bestParams.y.toFixed(3)} color="#ec4899"/>
                         </p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accuracy Legend Overlay */}
              <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-lg border border-white/[0.1] backdrop-blur-md flex flex-col items-end gap-1 pointer-events-none shadow-lg">
                 <span className="text-[10px] uppercase text-text-muted font-bold">Score</span>
                 <div className="w-24 h-2 rounded bg-gradient-to-r from-blue-500 to-green-500"></div>
                 <span className="text-[10px] text-text-muted font-mono">&gt; 90%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
