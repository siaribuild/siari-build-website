import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

// Mirrors the old <Routes> in App.tsx:
//   "/"                     → home (DynamicPage slug="home")
//   "/projects/:projectId"  → project detail
//   "/:slug"                → any Sanity page by slug (about, contact, projects, …)
//   "*"                     → branded 404 (also the SPA-fallback catch-all)
export default [
  index('routes/home.tsx'),

  // Client portal. NONE of these are in react-router.config.ts's prerender list,
  // so they are never statically generated and never contain project data. They
  // are served as a bare SPA shell (see scripts/finalize-build.mjs + _redirects)
  // and fetch everything from authenticated /api/portal/* endpoints.
  route('portal/login', 'routes/portal/login.tsx'),
  route('portal/verify', 'routes/portal/verify.tsx'),
  layout('routes/portal/layout.tsx', [
    route('portal', 'routes/portal/overview.tsx'),
    route('portal/updates', 'routes/portal/updates.tsx'),
    route('portal/documents', 'routes/portal/documents.tsx'),
    route('portal/admin', 'routes/portal/admin.tsx'),
  ]),

  route('projects/:projectId', 'routes/project.tsx'),
  route(':slug', 'routes/page.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
