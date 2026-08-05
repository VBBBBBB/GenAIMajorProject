import { useState } from 'react'
import { ToastProvider } from './context/ToastContext'
import Topbar    from './components/Layout/Topbar'
import Sidebar   from './components/Layout/Sidebar'
import Overview      from './pages/Overview'
import FormalContext from './pages/FormalContext'
import ConceptLattice from './pages/ConceptLattice'
import GaloisClosure  from './pages/GaloisClosure'
import ParetoFrontier from './pages/ParetoFrontier'
import RuntimeRouter  from './pages/RuntimeRouter'
import SelfRefactor   from './pages/SelfRefactor'
import Telemetry      from './pages/Telemetry'

const PAGES = {
  overview:  Overview,
  context:   FormalContext,
  lattice:   ConceptLattice,
  galois:    GaloisClosure,
  pareto:    ParetoFrontier,
  router:    RuntimeRouter,
  refactor:  SelfRefactor,
  telemetry: Telemetry,
}

export default function App() {
  const [page, setPage] = useState('overview')
  const PageComponent   = PAGES[page] ?? Overview

  return (
    <ToastProvider>
      <div className="app-layout">
        <Topbar onNavigate={setPage} />
        <Sidebar current={page} onNavigate={setPage} />
        <main className="main-content">
          <PageComponent onNavigate={setPage} />
        </main>
      </div>
    </ToastProvider>
  )
}
