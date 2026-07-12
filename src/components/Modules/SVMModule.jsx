import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Download, Crosshair, RefreshCw, MousePointer2 } from 'lucide-react'
import { BlockMath, InlineMath } from 'react-katex'
import { usePngExport } from '../../hooks/useExport.js'
import {
  GlowCard,
  AnimatedBadge,
  SectionTitle,
  LiveValue,
} from '../ui/AceternityComponents.jsx'

// --- SVM SMO Logic ---
class SVM {
  constructor(options = {}) {
    this.C = options.C || 1.0;
    this.tol = 1e-4;
    this.maxPasses = 25; // Keep it low for interactive real-time performance
    this.kernelType = options.kernelType || 'linear';
    this.gamma = options.gamma || 2.0; 
  }

  kernel(x1, x2) {
    if (this.kernelType === 'linear') {
      return x1[0] * x2[0] + x1[1] * x2[1];
    } else {
      const dx = x1[0] - x2[0];
      const dy = x1[1] - x2[1];
      return Math.exp(-this.gamma * (dx * dx + dy * dy));
    }
  }

  train(X, y) {
    const m = X.length;
    this.X = X;
    this.y = y;
    this.alphas = new Array(m).fill(0);
    this.b = 0;

    if (m === 0) return;

    let passes = 0;
    while (passes < this.maxPasses) {
      let numChangedAlphas = 0;
      for (let i = 0; i < m; i++) {
        let Ei = this.predictVal(X[i]) - y[i];
        if ((y[i] * Ei < -this.tol && this.alphas[i] < this.C) || (y[i] * Ei > this.tol && this.alphas[i] > 0)) {
          let j = Math.floor(Math.random() * (m - 1));
          if (j >= i) j++;

          let Ej = this.predictVal(X[j]) - y[j];

          let oldAi = this.alphas[i];
          let oldAj = this.alphas[j];

          let L, H;
          if (y[i] !== y[j]) {
            L = Math.max(0, this.alphas[j] - this.alphas[i]);
            H = Math.min(this.C, this.C + this.alphas[j] - this.alphas[i]);
          } else {
            L = Math.max(0, this.alphas[i] + this.alphas[j] - this.C);
            H = Math.min(this.C, this.alphas[i] + this.alphas[j]);
          }

          if (L === H) continue;

          let eta = 2 * this.kernel(X[i], X[j]) - this.kernel(X[i], X[i]) - this.kernel(X[j], X[j]);
          if (eta >= 0) continue;

          this.alphas[j] = this.alphas[j] - (y[j] * (Ei - Ej)) / eta;
          if (this.alphas[j] > H) this.alphas[j] = H;
          else if (this.alphas[j] < L) this.alphas[j] = L;

          if (Math.abs(this.alphas[j] - oldAj) < 1e-5) continue;

          this.alphas[i] = this.alphas[i] + y[i] * y[j] * (oldAj - this.alphas[j]);

          let b1 = this.b - Ei - y[i] * (this.alphas[i] - oldAi) * this.kernel(X[i], X[i]) - y[j] * (this.alphas[j] - oldAj) * this.kernel(X[i], X[j]);
          let b2 = this.b - Ej - y[i] * (this.alphas[i] - oldAi) * this.kernel(X[i], X[j]) - y[j] * (this.alphas[j] - oldAj) * this.kernel(X[j], X[j]);

          if (0 < this.alphas[i] && this.alphas[i] < this.C) this.b = b1;
          else if (0 < this.alphas[j] && this.alphas[j] < this.C) this.b = b2;
          else this.b = (b1 + b2) / 2;

          numChangedAlphas++;
        }
      }
      if (numChangedAlphas === 0) passes++;
      else passes = 0;
    }

    if (this.kernelType === 'linear') {
      this.w = [0, 0];
      for (let i = 0; i < m; i++) {
        this.w[0] += this.alphas[i] * y[i] * X[i][0];
        this.w[1] += this.alphas[i] * y[i] * X[i][1];
      }
    }
  }

  predictVal(x) {
    if (this.kernelType === 'linear' && this.w) {
      return this.w[0] * x[0] + this.w[1] * x[1] + this.b;
    }
    let sum = this.b;
    for (let i = 0; i < this.alphas.length; i++) {
      if (this.alphas[i] > 1e-4) {
        sum += this.alphas[i] * this.y[i] * this.kernel(this.X[i], x);
      }
    }
    return sum;
  }
}

// Generate initial points
const generateData = () => {
  const pts = [];
  // Class 1 (Blue) top leftish
  for (let i = 0; i < 20; i++) {
    pts.push({ id: `p1_${i}`, x: (Math.random() - 0.5) * 0.8 - 0.4, y: (Math.random() - 0.5) * 0.8 + 0.4, cls: 1 });
  }
  // Class -1 (Red) bottom rightish
  for (let i = 0; i < 20; i++) {
    pts.push({ id: `p-1_${i}`, x: (Math.random() - 0.5) * 0.8 + 0.4, y: (Math.random() - 0.5) * 0.8 - 0.4, cls: -1 });
  }
  return pts;
};

export default function SVMModule() {
  const canvasRef = useRef(null)
  const exportPng = usePngExport(canvasRef, 'svm')
  
  const [points, setPoints] = useState(generateData())
  const [C, setC] = useState(1.0)
  const [kernel, setKernel] = useState('linear')
  const [nextClass, setNextClass] = useState(1) // 1: Blue, -1: Red
  const [dragTarget, setDragTarget] = useState(null)
  const [svmInstance, setSvmInstance] = useState(null)

  // Map canvas px to [-1.5, 1.5] math plane
  const CANVAS_W = 480
  const CANVAS_H = 360
  const X_RANGE = 1.5
  const Y_RANGE = (CANVAS_H / CANVAS_W) * X_RANGE

  const mapToMath = (cx, cy) => [
    (cx / CANVAS_W) * (2 * X_RANGE) - X_RANGE,
    -((cy / CANVAS_H) * (2 * Y_RANGE) - Y_RANGE)
  ]
  const mapToPx = (x, y) => [
    ((x + X_RANGE) / (2 * X_RANGE)) * CANVAS_W,
    ((-y + Y_RANGE) / (2 * Y_RANGE)) * CANVAS_H
  ]

  // Re-train SVM when points, C, or kernel changes
  useEffect(() => {
    if (points.length === 0) return;
    const X = points.map(p => [p.x, p.y]);
    const y = points.map(p => p.cls);
    const model = new SVM({ C, kernelType: kernel, gamma: 2.0 });
    model.train(X, y);
    setSvmInstance(model);
  }, [points, C, kernel])

  // Count SVs and Margin Width
  const stats = useMemo(() => {
    if (!svmInstance) return { svCount: 0, marginWidth: 0 };
    const svs = svmInstance.alphas ? svmInstance.alphas.filter(a => a > 1e-4).length : 0;
    
    let marginWidth = 0;
    if (kernel === 'linear' && svmInstance.w) {
      const norm = Math.sqrt(svmInstance.w[0]**2 + svmInstance.w[1]**2);
      marginWidth = norm > 0 ? 2 / norm : 0;
    }
    
    return { svCount: svs, marginWidth };
  }, [svmInstance, kernel])

  // Canvas drawing logic
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    if (svmInstance && points.length > 0) {
      if (kernel === 'linear' && svmInstance.w) {
        // Draw linear boundary and margins
        const w1 = svmInstance.w[0];
        const w2 = svmInstance.w[1];
        const b = svmInstance.b;
        
        const drawLine = (offset, color, dash) => {
          if (Math.abs(w2) < 1e-5) return;
          const y1 = (-w1 * (-X_RANGE) - b + offset) / w2;
          const y2 = (-w1 * X_RANGE - b + offset) / w2;
          
          const [cx1, cy1] = mapToPx(-X_RANGE, y1);
          const [cx2, cy2] = mapToPx(X_RANGE, y2);
          
          ctx.beginPath();
          ctx.moveTo(cx1, cy1);
          ctx.lineTo(cx2, cy2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          if (dash) ctx.setLineDash(dash);
          ctx.stroke();
          ctx.setLineDash([]);
        };

        // Margin -1 (Red)
        drawLine(-1, 'rgba(244, 63, 94, 0.4)', [5, 5]);
        // Margin +1 (Blue)
        drawLine(1, 'rgba(59, 130, 246, 0.4)', [5, 5]);
        // Hyperplane
        drawLine(0, '#ffffff', []);
        
      } else if (kernel === 'rbf') {
        // Draw RBF heatmap
        const step = 6;
        for (let cx = 0; cx < CANVAS_W; cx += step) {
          for (let cy = 0; cy < CANVAS_H; cy += step) {
             const [x, y] = mapToMath(cx + step/2, cy + step/2);
             const val = svmInstance.predictVal([x, y]);
             
             let opacity = Math.min(Math.abs(val) / 2, 0.3) + 0.05;
             if (val > 0) {
                ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
             } else {
                ctx.fillStyle = `rgba(244, 63, 94, ${opacity})`;
             }
             ctx.fillRect(cx, cy, step, step);
          }
        }
      }
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
    }

    // Points
    points.forEach((p, i) => {
      const [cx, cy] = mapToPx(p.x, p.y);
      
      // Highlight Support Vectors
      const isSV = svmInstance && svmInstance.alphas && svmInstance.alphas[i] > 1e-4;
      if (isSV) {
        ctx.beginPath()
        ctx.arc(cx, cy, 10, 0, Math.PI * 2)
        ctx.fillStyle = p.cls === 1 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(244, 63, 94, 0.3)'
        ctx.fill()
        ctx.strokeStyle = '#fbbf24' // Amber glow
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = p.cls === 1 ? '#3b82f6' : '#f43f5e'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
    
  }, [points, svmInstance, kernel])

  useEffect(() => { draw() }, [draw])

  // Mouse Interactions
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const [x, y] = mapToMath(cx, cy)

    // Check if clicking an existing point
    const hitRadius = 0.15; // math units
    const clickedPoint = points.find(p => Math.hypot(p.x - x, p.y - y) < hitRadius)

    if (clickedPoint) {
      setDragTarget(clickedPoint.id)
      canvas.setPointerCapture(e.pointerId)
    } else {
      if (points.length >= 80) return; // Cap points for performance
      // Add new point
      setPoints([...points, { id: `new_${Date.now()}`, x, y, cls: nextClass }])
    }
  }

  const handlePointerMove = (e) => {
    if (!dragTarget) return;
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const [x, y] = mapToMath(cx, cy)

    setPoints(pts => pts.map(p => p.id === dragTarget ? { ...p, x, y } : p))
  }

  const handlePointerUp = (e) => {
    if (dragTarget) {
      const canvas = canvasRef.current
      canvas.releasePointerCapture(e.pointerId)
      setDragTarget(null)
    }
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#6366f1">Supervised Learning</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Support Vector Machines
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              SVMs are powerful models that find the <strong>optimal separating hyperplane</strong> which maximizes the margin between different classes. The margin is the distance between the hyperplane and the closest data points, known as the <em>Support Vectors</em>.
            </p>
          </div>

          <GlowCard glowColor="rgba(99, 102, 241, 0.15)">
            <SectionTitle accent="#6366f1">The Linear Decision Boundary</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              For a linearly separable dataset, the decision boundary is an explicit line (or hyperplane in higher dimensions) defined by:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-indigo-200 overflow-x-auto">
              <BlockMath math="w \cdot x + b = 0" />
            </div>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              The margin boundaries where the Support Vectors lie are defined by <InlineMath math="w \cdot x + b = \pm 1" />. The total width of the margin we aim to maximize is:
            </p>
            <div className="bg-black/30 p-2 rounded text-center my-2 text-indigo-200 overflow-x-auto">
              <BlockMath math="M = \frac{2}{||w||}" />
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(99, 102, 241, 0.15)">
            <SectionTitle accent="#6366f1">The Kernel Trick</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              When data isn't linearly separable, we don't need to manually calculate complex polynomial features. We can implicitly map the data into a higher-dimensional space using a <strong>Kernel Function</strong>.
            </p>
            <ul className="text-sm text-text-secondary list-disc ml-5 mb-2 print-text-muted">
              <li><strong>Linear Kernel:</strong> <InlineMath math="K(x_i, x_j) = x_i \cdot x_j" /> (Standard dot product)</li>
              <li><strong>RBF Kernel (Non-Linear):</strong> <InlineMath math="K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)" /></li>
            </ul>
            <p className="text-sm text-text-secondary print-text-muted">
              The Radial Basis Function (RBF) essentially wraps a "mountain" of probability around each Support Vector, allowing for highly complex, non-linear circular contours.
            </p>
          </GlowCard>

          <GlowCard glowColor="rgba(99, 102, 241, 0.15)">
             <SectionTitle accent="#6366f1">Regularization (C Parameter)</SectionTitle>
             <p className="text-sm text-text-secondary mb-2 print-text-muted">
                The <InlineMath math="C" /> parameter dictates the trade-off between maximizing the margin width and ensuring all training points are classified perfectly (Hard vs Soft margin).
             </p>
             <ul className="text-sm text-text-secondary list-disc ml-5 print-text-muted">
              <li><strong>Small C (High Bias):</strong> Prioritizes a wider margin. Allows more misclassifications and margin violations inside the dashed lines.</li>
              <li><strong>Large C (High Variance):</strong> Forces a strict, narrow margin. Highly sensitive to outliers.</li>
            </ul>
          </GlowCard>

        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/[0.06] bg-surface-raised/50 no-print" data-no-print>
           <div className="flex gap-1 bg-white/[0.05] p-1 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setKernel('linear')}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors ${kernel === 'linear' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-text-secondary hover:text-white'}`}
              >Linear</button>
              <button
                onClick={() => setKernel('rbf')}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs rounded transition-colors ${kernel === 'rbf' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-text-secondary hover:text-white'}`}
              >RBF (Non-linear)</button>
          </div>
          
          <div className="h-4 w-px bg-white/[0.1]"></div>
          
          <label className="text-xs text-text-muted flex items-center gap-2">
            Reg (C): <span className="font-mono text-indigo-400 w-6">{C.toFixed(1)}</span>
            <input
              type="range" min={0.1} max={10} step={0.1}
              value={C} onChange={(e) => setC(Number(e.target.value))}
              className="w-24 accent-indigo-500"
            />
          </label>

          <button onClick={() => setPoints(generateData())} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-text-secondary hover:text-white transition-colors ml-auto">
             <RefreshCw className="w-3.5 h-3.5" /> Reset Data
          </button>
        </div>

        {/* Feature Grid Panel */}
        <div className="flex-1 flex flex-col items-center p-6 gap-6 overflow-y-auto">
           {/* Draggable Sandbox HUD */}
           <div className="w-full max-w-[500px] flex justify-between items-start shrink-0 pointer-events-none relative z-20">
             <div className="flex gap-2 pointer-events-auto bg-black/50 p-2 rounded-lg border border-white/[0.1] backdrop-blur-sm shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <button 
                  onClick={() => setNextClass(1)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${nextClass === 1 ? 'bg-blue-500 text-white' : 'bg-white/[0.1] text-text-muted hover:bg-white/[0.2]'}`}
                ><MousePointer2 className="w-3 h-3"/> Add Blue</button>
                <button 
                  onClick={() => setNextClass(-1)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${nextClass === -1 ? 'bg-rose-500 text-white' : 'bg-white/[0.1] text-text-muted hover:bg-white/[0.2]'}`}
                ><MousePointer2 className="w-3 h-3"/> Add Red</button>
             </div>
             
             {/* Collapsible Info Button ("iPhone Style") */}
             <div className="relative pointer-events-auto">
               <button 
                 onClick={() => {
                   const panel = document.getElementById('svm-state-panel');
                   if (panel) panel.classList.toggle('hidden');
                 }}
                 className="w-10 h-10 rounded-full bg-black/50 border border-white/[0.1] backdrop-blur-sm shadow-[0_0_20px_rgba(99,102,241,0.15)] flex items-center justify-center text-indigo-400 hover:text-white hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                 title="Toggle Live SVM State"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
               </button>

               <div id="svm-state-panel" className="hidden absolute top-12 right-0 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/[0.15] text-right px-4 shadow-2xl min-w-[200px] transform origin-top-right transition-all">
                 <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 pb-1 border-b border-white/[0.1]">Live SVM State</p>
                 <p className="text-xs text-text-secondary mb-1">
                   Support Vectors: <LiveValue value={stats.svCount} color="#6366f1" />
                   <span className="text-indigo-400 font-mono ml-1">({((stats.svCount / Math.max(1, points.length)) * 100).toFixed(0)}%)</span>
                 </p>
                 {kernel === 'linear' && (
                   <p className="text-xs text-text-secondary mb-1">
                     Margin Width: <LiveValue value={stats.marginWidth.toFixed(2)} color="#6366f1" /> px
                   </p>
                 )}
                  <p className="text-[10px] text-indigo-400 font-bold mt-2">
                     Kernel: {kernel.toUpperCase()}
                  </p>
               </div>
             </div>
           </div>
           
           <div className="relative shrink-0 mb-4">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="rounded-xl border border-white/[0.1] shadow-2xl cursor-crosshair touch-none"
              />
              <p className="text-center text-xs text-text-muted mt-4 absolute w-full -bottom-8">
                Click & Drag points to retrain the SVM in real-time. Glowing points are the Support Vectors.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
