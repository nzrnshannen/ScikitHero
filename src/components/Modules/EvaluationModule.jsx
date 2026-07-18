import { useState } from 'react'
import { Download } from 'lucide-react'
import { BlockMath, InlineMath } from 'react-katex'
import {
  GlowCard,
  AnimatedBadge,
  SectionTitle,
  LiveValue,
} from '../ui/AceternityComponents.jsx'

export default function EvaluationModule() {
  const [tp, setTp] = useState(85)
  const [fp, setFp] = useState(15)
  const [fn, setFn] = useState(10)
  const [tn, setTn] = useState(90)

  // Calculations
  const total = tp + fp + fn + tn
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn) // also TPR
  const f1 = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall)
  const accuracy = total === 0 ? 0 : (tp + tn) / total
  
  // Simplified ROC AUC estimation for UI (using TPR and FPR)
  const fpr = tn + fp === 0 ? 0 : fp / (tn + fp)
  const tpr = recall
  // A rough linear area estimation since we only have one threshold point
  const roc_auc = (1 + tpr - fpr) / 2

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg min-h-0">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#3b82f6">Concepts & Lifecycle</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Model Evaluation & Validation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Accuracy is often a misleading metric, especially with imbalanced datasets. A <strong>Confusion Matrix</strong> provides a complete picture of a classification model's performance by breaking down exact hit and miss types.
            </p>
          </div>

          <GlowCard glowColor="rgba(59, 130, 246, 0.15)">
            <SectionTitle accent="#3b82f6">Core Metrics</SectionTitle>
            
            <div className="space-y-4">
               <div>
                  <h3 className="text-sm font-bold text-blue-400">Precision</h3>
                  <p className="text-xs text-text-secondary mb-1 print-text-muted">Out of all the positive predictions, how many were actually positive?</p>
                  <div className="bg-surface-overlay/50 p-2 rounded text-center text-text-primary overflow-x-auto">
                    <BlockMath math="\text{Precision} = \frac{TP}{TP + FP}" />
                  </div>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-blue-400">Recall (Sensitivity / TPR)</h3>
                  <p className="text-xs text-text-secondary mb-1 print-text-muted">Out of all the actual positive instances, how many did we find?</p>
                  <div className="bg-surface-overlay/50 p-2 rounded text-center text-text-primary overflow-x-auto">
                    <BlockMath math="\text{Recall} = \frac{TP}{TP + FN}" />
                  </div>
               </div>

               <div>
                  <h3 className="text-sm font-bold text-blue-400">F1 Score</h3>
                  <p className="text-xs text-text-secondary mb-1 print-text-muted">The harmonic mean of Precision and Recall. Useful when you need a balance.</p>
                  <div className="bg-surface-overlay/50 p-2 rounded text-center text-text-primary overflow-x-auto">
                    <BlockMath math="F1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}" />
                  </div>
               </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(59, 130, 246, 0.15)">
            <SectionTitle accent="#3b82f6">The ROC Curve & AUC</SectionTitle>
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              The <strong>Receiver Operating Characteristic (ROC)</strong> curve plots the True Positive Rate (Recall) against the False Positive Rate (FPR) at various threshold settings.
            </p>
            <ul className="text-sm text-text-secondary list-disc ml-5 print-text-muted">
              <li><strong>AUC (Area Under Curve):</strong> Represents the probability that the model ranks a random positive example higher than a random negative example.</li>
              <li>AUC = 1.0 is perfect. AUC = 0.5 is random guessing.</li>
            </ul>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print" data-no-print>
           <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Interactive Confusion Matrix</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0f1117] overflow-y-auto min-h-0">
           
           <div className="w-full max-w-lg mb-8">
              <div className="grid grid-cols-2 gap-4">
                 {/* Live Metric Cards */}
                 <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                    <span className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Precision</span>
                    <span className="text-2xl font-mono font-bold text-blue-400"><LiveValue value={precision.toFixed(3)} color="#60a5fa" /></span>
                 </div>
                 <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                    <span className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Recall</span>
                    <span className="text-2xl font-mono font-bold text-blue-400"><LiveValue value={recall.toFixed(3)} color="#60a5fa" /></span>
                 </div>
                 <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                    <span className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">F1 Score</span>
                    <span className="text-2xl font-mono font-bold text-indigo-400"><LiveValue value={f1.toFixed(3)} color="#818cf8" /></span>
                 </div>
                 <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                    <span className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Accuracy</span>
                    <span className="text-2xl font-mono font-bold text-text-secondary"><LiveValue value={accuracy.toFixed(3)} color="#cbd5e1" /></span>
                 </div>
              </div>
           </div>

           {/* Interactive Confusion Matrix Grid */}
           <div className="relative mt-12 ml-12">
              
              {/* Labels */}
              <div className="absolute -top-10 left-12 right-0 text-center text-xs font-bold text-text-muted uppercase tracking-widest">
                 Predicted Class
              </div>
              <div className="absolute top-12 bottom-0 -left-12 flex items-center justify-center w-8">
                 <div className="text-xs font-bold text-text-muted uppercase tracking-widest -rotate-90 whitespace-nowrap">
                    Actual Class
                 </div>
              </div>

              <div className="flex">
                 {/* Empty corner */}
                 <div className="w-12 h-12"></div>
                 {/* Col headers */}
                 <div className="flex w-64">
                    <div className="w-32 flex items-center justify-center text-xs text-emerald-500 font-bold bg-emerald-500/5 border-b border-r border-white/[0.06]">Positive (1)</div>
                    <div className="w-32 flex items-center justify-center text-xs text-rose-500 font-bold bg-rose-500/5 border-b border-white/[0.06]">Negative (0)</div>
                 </div>
              </div>

              <div className="flex">
                 {/* Row 1 header */}
                 <div className="w-12 h-32 flex items-center justify-center bg-emerald-500/5 border-b border-r border-white/[0.06]">
                    <span className="text-xs text-emerald-500 font-bold -rotate-90 whitespace-nowrap">Pos (1)</span>
                 </div>
                 
                 {/* TP */}
                 <div className="w-32 h-32 bg-emerald-500/10 border-r border-b border-emerald-500/30 flex flex-col items-center justify-center p-2 relative group hover:bg-emerald-500/20 transition-colors">
                    <span className="text-xs text-emerald-400 font-semibold absolute top-2 left-2">TP</span>
                    <input 
                      type="number" 
                      value={tp} 
                      onChange={(e) => setTp(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-transparent text-center text-3xl font-mono font-bold text-emerald-400 w-full outline-none"
                    />
                    <span className="text-[10px] text-emerald-400/70 absolute bottom-2">True Positive</span>
                 </div>

                 {/* FN */}
                 <div className="w-32 h-32 bg-rose-500/10 border-b border-rose-500/30 flex flex-col items-center justify-center p-2 relative group hover:bg-rose-500/20 transition-colors">
                    <span className="text-xs text-rose-400 font-semibold absolute top-2 left-2">FN</span>
                    <input 
                      type="number" 
                      value={fn} 
                      onChange={(e) => setFn(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-transparent text-center text-3xl font-mono font-bold text-rose-400 w-full outline-none"
                    />
                    <span className="text-[10px] text-rose-400/70 absolute bottom-2">False Negative</span>
                 </div>
              </div>

              <div className="flex">
                 {/* Row 2 header */}
                 <div className="w-12 h-32 flex items-center justify-center bg-rose-500/5 border-r border-white/[0.06]">
                    <span className="text-xs text-rose-500 font-bold -rotate-90 whitespace-nowrap">Neg (0)</span>
                 </div>
                 
                 {/* FP */}
                 <div className="w-32 h-32 bg-rose-500/10 border-r border-rose-500/30 flex flex-col items-center justify-center p-2 relative group hover:bg-rose-500/20 transition-colors">
                    <span className="text-xs text-rose-400 font-semibold absolute top-2 left-2">FP</span>
                    <input 
                      type="number" 
                      value={fp} 
                      onChange={(e) => setFp(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-transparent text-center text-3xl font-mono font-bold text-rose-400 w-full outline-none"
                    />
                    <span className="text-[10px] text-rose-400/70 absolute bottom-2">False Positive</span>
                 </div>

                 {/* TN */}
                 <div className="w-32 h-32 bg-emerald-500/10 border-emerald-500/30 flex flex-col items-center justify-center p-2 relative group hover:bg-emerald-500/20 transition-colors">
                    <span className="text-xs text-emerald-400 font-semibold absolute top-2 left-2">TN</span>
                    <input 
                      type="number" 
                      value={tn} 
                      onChange={(e) => setTn(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-transparent text-center text-3xl font-mono font-bold text-emerald-400 w-full outline-none"
                    />
                    <span className="text-[10px] text-emerald-400/70 absolute bottom-2">True Negative</span>
                 </div>
              </div>
           </div>

           <div className="mt-8 text-center bg-white/[0.02] border border-white/[0.05] rounded p-3">
             <p className="text-xs text-text-muted mb-1 uppercase tracking-widest font-semibold">Total Observations</p>
             <p className="text-xl font-mono font-bold text-text-secondary">N = {total}</p>
           </div>
           
        </div>
      </div>
    </div>
  )
}
