import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MaintenanceGate } from './components/MaintenanceGate'
import { DynamicPage } from './pages/DynamicPage'

// Route-level code splitting: the landing page (DynamicPage) ships in the main
// bundle for the fastest possible first paint; heavier routes (project detail
// pulls in the lightbox + motion, the contact page pulls in Turnstile) load on
// demand, cutting initial JS / Total Blocking Time.
const DynamicPageBySlug = lazy(() =>
  import('./pages/DynamicPageBySlug').then((m) => ({ default: m.DynamicPageBySlug })))
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

// Lightweight fallback shown while a lazy route chunk loads.
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-busy="true">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <MaintenanceGate>
            <div className="min-h-screen bg-[#F5F3EF] text-[#111111]">
              <Header />

              <Routes>
                {/* Homepage — fixed to the "home" slug */}
                <Route path="/" element={<DynamicPage slug="home" />} />

                {/* Lazy routes share one Suspense fallback. */}
                <Route path="/projects/:projectId" element={
                  <Suspense fallback={<RouteFallback />}><ProjectDetailPage /></Suspense>
                } />
                <Route path="/:slug" element={
                  <Suspense fallback={<RouteFallback />}><DynamicPageBySlug /></Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<RouteFallback />}><NotFoundPage /></Suspense>
                } />
              </Routes>

              <Footer />
            </div>
          </MaintenanceGate>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  )
}
