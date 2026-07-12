import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopNavbar from './components/TopNavbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import KNNModule from './components/Modules/KNNModule.jsx'
import LinearRegressionModule from './components/Modules/LinearRegressionModule.jsx'
import KMeansModule from './components/Modules/KMeansModule.jsx'
import PCAModule from './components/Modules/PCAModule.jsx'
import PreprocessingModule from './components/Modules/PreprocessingModule.jsx'
import DataSplittingModule from './components/Modules/DataSplittingModule.jsx'
import LogisticRegressionModule from './components/Modules/LogisticRegressionModule.jsx'
import RegularizationModule from './components/Modules/RegularizationModule.jsx'
import TreeEnsembleModule from './components/Modules/TreeEnsembleModule.jsx'
import EvaluationModule from './components/Modules/EvaluationModule.jsx'
import SVMModule from './components/Modules/SVMModule.jsx'
import DBSCANModule from './components/Modules/DBSCANModule.jsx'
import TuningModule from './components/Modules/TuningModule.jsx'
import CheatSheetDrawer from './components/CheatSheetDrawer.jsx'
import DeveloperCard from './components/Layout/DeveloperCard.jsx'
import SplashScreen from './components/Layout/SplashScreen.jsx'

const MODULES = {
  knn: KNNModule,
  linear_regression: LinearRegressionModule,
  ridge_lasso: RegularizationModule,
  logistic_regression: LogisticRegressionModule,
  decision_trees: TreeEnsembleModule,
  svm: SVMModule,
  kmeans: KMeansModule,
  dbscan: DBSCANModule,
  pca: PCAModule,
  preprocessing: PreprocessingModule,
  data_splitting: DataSplittingModule,
  metrics: EvaluationModule,
  tuning: TuningModule,
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [activeTopic, setActiveTopic] = useState('knn')
  const [isDevCardOpen, setIsDevCardOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const contentRef = useRef(null)

  const ActiveModule = MODULES[activeTopic]

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface">
      <TopNavbar 
        contentRef={contentRef} 
        activeTopic={activeTopic} 
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      <CheatSheetDrawer />
      <DeveloperCard isOpen={isDevCardOpen} onClose={() => setIsDevCardOpen(false)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          activeTopic={activeTopic} 
          setActiveTopic={(topic) => {
            setActiveTopic(topic)
            setIsMobileMenuOpen(false)
          }} 
          onOpenDevCard={() => setIsDevCardOpen(true)} 
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMenu={() => setIsMobileMenuOpen(false)}
        />

        <main ref={contentRef} className="flex-1 overflow-hidden print-white-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              <ActiveModule />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </>
  )
}
