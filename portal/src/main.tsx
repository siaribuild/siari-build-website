import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import PortalLayout from './routes/layout'
import PortalLogin from './routes/login'
import PortalVerify from './routes/verify'
import PortalOverview from './routes/overview'
import PortalUpdates from './routes/updates'
import PortalDocuments from './routes/documents'
import PortalAdmin from './routes/admin'
import './styles.css'

// A plain client-side router. There is no SSR and no prerendering by design:
// the served HTML is an empty shell, so no private project data can ever appear
// in a static payload. Everything is fetched from /api/portal/* after login.
const router = createBrowserRouter([
  { path: '/login', element: <PortalLogin /> },
  { path: '/verify', element: <PortalVerify /> },
  {
    element: <PortalLayout />,
    children: [
      { path: '/', element: <PortalOverview /> },
      { path: '/updates', element: <PortalUpdates /> },
      { path: '/documents', element: <PortalDocuments /> },
      { path: '/admin', element: <PortalAdmin /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
