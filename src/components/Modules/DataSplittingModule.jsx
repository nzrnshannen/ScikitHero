import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Download, ArrowRight, Server, Database, CheckCircle2, XCircle } from 'lucide-react'
import {
  GlowCard,
  AnimatedBadge,
  SectionTitle,
  CodeSnippet,
} from '../ui/AceternityComponents.jsx'

export default function DataSplittingModule() {
  const [splitRatio, setSplitRatio] = useState(80)
  const [leakageMode, setLeakageMode] = useState(false)

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left Panel — Note */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-white/[0.06] print-white-bg">
        <div className="max-w-xl mx-auto space-y-5">
          <div>
            <AnimatedBadge color="#f43f5e">Concepts & Lifecycle</AnimatedBadge>
            <h2 className="mt-3 text-2xl font-bold text-text-primary print-text-dark">
              Data Splitting & Leakage Prevention
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary print-text-muted">
              Before touching any machine learning algorithm, the very first step is to split your dataset.
              The model must be evaluated on data it has <strong>never seen before</strong> to accurately measure its ability to generalize to real-world scenarios.
            </p>
          </div>

          <GlowCard glowColor="rgba(244, 63, 94, 0.15)">
            <SectionTitle accent="#f43f5e">The Data Leakage Pitfall</SectionTitle>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                <strong className="text-red-400 block mb-1">Critical Error: Scaling before splitting.</strong>
                If you apply a <code className="text-xs bg-black/30 px-1 rounded">StandardScaler</code> (or any transformation relying on dataset properties like mean/min/max) to your <em>entire</em> dataset before splitting, information from the test set "leaks" into the training set. The model's evaluation metrics will be artificially high and misleading.
              </p>
            </div>
            
            <p className="text-sm text-text-secondary mb-2 print-text-muted">
              <strong>The Golden Rule:</strong> Fit your preprocessors (scalers, imputers) <em>only</em> on the training data. Then use that fitted preprocessor to transform both the train and test sets.
            </p>

            <CodeSnippet title="Correct Scaling Pipeline">
{`from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 1. Split FIRST
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 2. Fit scaler ONLY on training data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# 3. Transform test data using the fitted scaler
X_test_scaled = scaler.transform(X_test)`}
            </CodeSnippet>
          </GlowCard>

          <GlowCard glowColor="rgba(244, 63, 94, 0.15)">
            <SectionTitle accent="#f43f5e">Train vs. Test Split</SectionTitle>
            <p className="text-sm text-text-secondary mb-3 print-text-muted">
              Common split ratios are 80/20 or 70/30. Adjust the slider in the sandbox to see how the data blocks are allocated.
            </p>
            <ul className="text-sm text-text-secondary list-disc ml-5 mb-3 space-y-1 print-text-muted">
              <li><strong>Training Set:</strong> Used to fit the model parameters.</li>
              <li><strong>Test Set:</strong> Held out completely until the very end to evaluate performance.</li>
              <li><strong>Validation Set (Optional):</strong> A third split used for hyperparameter tuning (often replaced by Cross-Validation).</li>
            </ul>
          </GlowCard>
        </div>
      </div>

      {/* Right Panel — Sandbox */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 bg-surface-raised/50 no-print">
          <div className="flex items-center gap-4">
             <label className="text-xs text-text-muted flex items-center gap-2">
              Split Ratio (Train %): <span className="font-mono font-bold text-rose-400">{splitRatio}%</span>
              <input
                type="range"
                min={50} max={95} step={5}
                value={splitRatio}
                onChange={(e) => setSplitRatio(Number(e.target.value))}
                className="w-24 accent-rose-500"
              />
            </label>
            <div className="h-4 w-px bg-white/[0.1]"></div>
            <label className="text-xs text-text-muted flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={leakageMode} 
                onChange={(e) => setLeakageMode(e.target.checked)}
                className="accent-red-500 w-4 h-4"
              />
              <span className={leakageMode ? "text-red-400 font-bold" : ""}>Simulate Data Leakage</span>
            </label>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-[#0f1117] overflow-y-auto">
           <div className="w-full max-w-2xl space-y-8">
             
             {/* Raw Data Block */}
             <div className="flex flex-col items-center">
               <div className="w-full h-12 bg-white/[0.05] border border-white/[0.1] rounded-lg flex items-center justify-center gap-2 relative overflow-hidden">
                 <Database className="h-5 w-5 text-text-muted" />
                 <span className="text-sm font-semibold text-text-secondary">Raw Dataset (100%)</span>
               </div>
               <ArrowRight className="h-6 w-6 text-white/[0.2] my-4 rotate-90" />
             </div>

             {/* Split blocks */}
             <div className="flex gap-4 w-full">
                {/* Train Path */}
                <div 
                  className="flex flex-col gap-4 transition-all duration-500"
                  style={{ width: `${splitRatio}%` }}
                >
                  <div className="h-16 bg-rose-500/10 border border-rose-500/30 rounded-lg flex flex-col items-center justify-center relative overflow-visible">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent rounded-lg" />
                    <span className="text-sm font-bold text-rose-400 whitespace-nowrap z-10 drop-shadow-md">Training Set</span>
                    <span className="text-xs font-mono text-rose-400/70 whitespace-nowrap z-10 drop-shadow-md">{splitRatio}% of Data</span>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-white/[0.2] rotate-90" />
                  </div>

                  {/* Preprocessing block */}
                  <div className={`h-16 rounded-lg flex flex-col items-center justify-center border transition-colors ${leakageMode ? 'bg-red-500/10 border-red-500/50' : 'bg-brand-500/10 border-brand-500/30'}`}>
                    <span className={`text-sm font-bold whitespace-nowrap z-10 drop-shadow-md ${leakageMode ? 'text-red-400' : 'text-brand-400'}`}>Fit Preprocessor</span>
                    <span className={`text-xs whitespace-nowrap z-10 drop-shadow-md ${leakageMode ? 'text-red-400/70' : 'text-brand-400/70'}`}>
                      {leakageMode ? 'Calculates Mean/Std on ALL DATA 🚨' : 'Calculates Mean/Std on TRAIN ONLY'}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-white/[0.2] rotate-90" />
                  </div>

                  {/* Model Training */}
                  <div className="h-16 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center gap-2">
                    <Server className="h-5 w-5 text-blue-400 shrink-0 z-10 drop-shadow-md" />
                    <span className="text-sm font-bold text-blue-400 whitespace-nowrap z-10 drop-shadow-md">Fit Model (Train)</span>
                  </div>
                </div>

                {/* Test Path */}
                <div 
                  className="flex flex-col gap-4 transition-all duration-500"
                  style={{ width: `${100 - splitRatio}%` }}
                >
                  <div className="h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center relative overflow-visible">
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-lg" />
                    <span className="text-sm font-bold text-emerald-400 whitespace-nowrap z-10 drop-shadow-md">Test Set</span>
                    <span className="text-xs font-mono text-emerald-400/70 whitespace-nowrap z-10 drop-shadow-md">{100 - splitRatio}% of Data</span>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-white/[0.2] rotate-90" />
                  </div>

                  {/* Preprocessing Transform */}
                  <div className={`h-16 rounded-lg flex flex-col items-center justify-center border border-dashed transition-colors ${leakageMode ? 'bg-red-500/5 border-red-500/30' : 'bg-brand-500/5 border-brand-500/30'}`}>
                    <span className={`text-sm font-bold whitespace-nowrap z-10 drop-shadow-md ${leakageMode ? 'text-red-400' : 'text-brand-400'}`}>Transform</span>
                    <span className={`text-xs text-center px-2 whitespace-nowrap z-10 drop-shadow-md ${leakageMode ? 'text-red-400/70' : 'text-brand-400/70'}`}>
                      Apply fitted scaler
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-white/[0.2] rotate-90" />
                  </div>

                   {/* Model Evaluation */}
                   <div className="h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center gap-1">
                    <span className="text-sm font-bold text-emerald-400 whitespace-nowrap z-10 drop-shadow-md">Predict & Evaluate</span>
                    {leakageMode ? (
                       <span className="text-[10px] bg-red-500/20 text-red-300 px-2 rounded-full flex items-center gap-1 whitespace-nowrap z-10 drop-shadow-md"><XCircle className="w-3 h-3 shrink-0"/> Invalid Metric</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 rounded-full flex items-center gap-1 whitespace-nowrap z-10 drop-shadow-md"><CheckCircle2 className="w-3 h-3 shrink-0"/> Valid Metric</span>
                    )}
                  </div>
                </div>
             </div>

           </div>
        </div>
      </div>
    </div>
  )
}
