import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopNavbar from './components/TopNavbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import { MODULE_COMPONENTS as MODULES } from './lib/curriculum.js'
import CheatSheetDrawer from './components/CheatSheetDrawer.jsx'
import DeveloperCard from './components/Layout/DeveloperCard.jsx'
import SplashScreen from './components/Layout/SplashScreen.jsx'
import HeroBot from './components/Companion/HeroBot.jsx'
import { BotProvider } from './lib/BotContext.jsx'

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

      <BotProvider>
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
      <HeroBot activeTopic={activeTopic} />
    </div>
    </BotProvider>
    </>
  )
}
