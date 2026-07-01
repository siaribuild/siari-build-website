import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MaintenanceGate } from './components/MaintenanceGate'
import { DynamicPage } from './pages/DynamicPage'
import { DynamicPageBySlug } from './pages/DynamicPageBySlug'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

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

                {/* Individual project pages (separate component) */}
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

                {/* Any other single-segment path resolves to a Sanity page by
                    its slug — about, contact, projects, privacy-policy, and
                    any future page an editor creates. DynamicPage shows the
                    branded 404 if no matching published page exists. */}
                <Route path="/:slug" element={<DynamicPageBySlug />} />

                {/* Multi-segment / anything else → 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <Footer />
            </div>
          </MaintenanceGate>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  )
}
