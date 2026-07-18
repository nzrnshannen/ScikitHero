import { motion, AnimatePresence } from 'framer-motion'
import { X, FileDown, CheckSquare, Square, FileText, Layers, Loader2, PanelBottom, PanelRight } from 'lucide-react'
import { useState, useRef } from 'react'
import { GROUPS, MODULE_COMPONENTS } from '../../lib/curriculum.js'
import { useBotState } from '../../lib/BotContext.jsx'

export default function ExportPreviewModal({ isOpen, onClose, onExport, activeTopic }) {
  const [scope, setScope] = useState('current') // 'current' or 'all'
  const [chartLayout, setChartLayout] = useState('bottom') // 'bottom' or 'right'
  const [includeChat, setIncludeChat] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const previewRef = useRef(null)
  const { chatHistory } = useBotState()

  // Build the list of chapters to render based on scope
  const topicsToRender = scope === 'all' 
    ? GROUPS.flatMap(g => g.items.map(i => i.id))
    : [activeTopic]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport({ includeChat, mode: scope, previewRef })
    } catch (err) {
      console.error(err)
    } finally {
      setIsExporting(false)
      onClose()
    }
  }

  const renderChatAppendix = (topicId) => {
    if (!includeChat) return null;
    const topicChats = chatHistory.filter(msg => msg.topic === topicId);
    if (topicChats.length === 0) return null;

    return (
      <div className="p-8 mt-8 bg-slate-50/5 rounded-3xl border border-white/[0.06] print-transcript">
        <div className="flex items-center gap-3 mb-6 border-b border-white/[0.06] pb-4">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">HeroBot Q&A Appendix</h2>
        </div>
        {topicChats.map((msg, idx) => (
          <div key={idx} className="mb-6 bg-slate-800/50 p-5 rounded-2xl border border-white/[0.04]" style={{ pageBreakInside: 'avoid' }}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${msg.role === 'user' ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {msg.role === 'user' ? 'You asked:' : 'HeroBot answered:'}
            </div>
            <div 
              className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full h-full max-w-[1600px] bg-slate-900 border border-slate-700/80 overflow-hidden flex flex-col md:flex-row rounded-3xl shadow-2xl"
          >
            {/* Close Button (Mobile Absolute) */}
            <button
              onClick={onClose}
              disabled={isExporting}
              className="md:hidden absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Panel: Scope Control Settings */}
            <div className="w-full md:w-80 lg:w-[400px] flex flex-col bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 relative z-10 shrink-0 max-h-[50vh] md:max-h-full">
              <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Export Document</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Configure your export scope and preview the exact layout before generating the PDF.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Scope Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Scope</label>
                    <div className="grid gap-3">
                      <button 
                        onClick={() => setScope('current')}
                        className={`flex flex-col text-left p-4 rounded-xl border transition-all ${scope === 'current' ? 'bg-brand-500/10 border-brand-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className={`w-4 h-4 ${scope === 'current' ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span className={`font-medium ${scope === 'current' ? 'text-brand-300' : 'text-slate-200'}`}>Current Chapter</span>
                        </div>
                        <span className="text-xs text-slate-400 pl-6">Capture strictly the active lesson.</span>
                      </button>

                      <button 
                        onClick={() => setScope('all')}
                        className={`flex flex-col text-left p-4 rounded-xl border transition-all ${scope === 'all' ? 'bg-brand-500/10 border-brand-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className={`w-4 h-4 ${scope === 'all' ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span className={`font-medium ${scope === 'all' ? 'text-brand-300' : 'text-slate-200'}`}>Full Textbook</span>
                        </div>
                        <span className="text-xs text-slate-400 pl-6">Sequentially compile all {GROUPS.reduce((acc, g) => acc + g.items.length, 0)} chapters.</span>
                      </button>
                    </div>
                  </div>

                  {/* Layout Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chart Layout</label>
                    <div className="grid gap-3">
                      <button 
                        onClick={() => setChartLayout('bottom')}
                        className={`flex flex-col text-left p-4 rounded-xl border transition-all ${chartLayout === 'bottom' ? 'bg-brand-500/10 border-brand-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <PanelBottom className={`w-4 h-4 ${chartLayout === 'bottom' ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span className={`font-medium ${chartLayout === 'bottom' ? 'text-brand-300' : 'text-slate-200'}`}>Stacked (Bottom)</span>
                        </div>
                        <span className="text-xs text-slate-400 pl-6">Chart spans full width below the lesson text.</span>
                      </button>

                      <button 
                        onClick={() => setChartLayout('right')}
                        className={`flex flex-col text-left p-4 rounded-xl border transition-all ${chartLayout === 'right' ? 'bg-brand-500/10 border-brand-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <PanelRight className={`w-4 h-4 ${chartLayout === 'right' ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span className={`font-medium ${chartLayout === 'right' ? 'text-brand-300' : 'text-slate-200'}`}>Side-by-Side (Right)</span>
                        </div>
                        <span className="text-xs text-slate-400 pl-6">Chart sits next to the lesson text (best for wide pages).</span>
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</label>
                    <button 
                      onClick={() => setIncludeChat(!includeChat)}
                      className="flex items-start gap-3 w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="mt-0.5 text-brand-400 shrink-0">
                        {includeChat ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-500" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 mb-1">Include HeroBot Discussions</div>
                        <div className="text-xs text-slate-400 leading-relaxed">
                          Append relevant HeroBot discussions as a Q&A appendix at the end of each corresponding chapter block.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-3.5 px-4 flex justify-center items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:opacity-90 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rendering PDF...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      Confirm & Generate PDF 🚀
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="w-full mt-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Right Panel: WYSIWYG Print Preview Canvas */}
            <div className="flex-1 bg-slate-950 p-6 md:p-12 overflow-y-auto flex flex-col items-center gap-12 relative shadow-inner">
              <div className="absolute top-4 left-6 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Preview
              </div>
              
              <div ref={previewRef} className="flex flex-col gap-12 pt-8 pb-12 items-center w-full max-w-[210mm]">
                {topicsToRender.map((topicId, index) => {
                  const ModuleComponent = MODULE_COMPONENTS[topicId];
                  if (!ModuleComponent) return null;
                  
                  return (
                    <div 
                      key={topicId} 
                      className={`chapter-page printing layout-${chartLayout} flex flex-col border border-slate-800/60 shadow-2xl shadow-black/50 rounded-md w-[210mm] min-h-[297mm] overflow-visible relative shrink-0`}
                    >
                       <div className="flex-1 w-full flex flex-col relative min-h-[297mm] h-max">
                         <ModuleComponent />
                       </div>
                       
                       {/* Chat transcript */}
                       {includeChat && renderChatAppendix(topicId) && (
                         <div className="p-[20mm] bg-surface-raised border-t border-white/[0.04]">
                           {renderChatAppendix(topicId)}
                         </div>
                       )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
