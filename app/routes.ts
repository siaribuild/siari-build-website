import { type RouteConfig, index, route } from '@react-router/dev/routes'

// Mirrors the old <Routes> in App.tsx:
//   "/"                     → home (DynamicPage slug="home")
//   "/projects/:projectId"  → project detail
//   "/:slug"                → any Sanity page by slug (about, contact, projects, …)
//   "*"                     → branded 404 (also the SPA-fallback catch-all)
export default [
  index('routes/home.tsx'),
  route('projects/:projectId', 'routes/project.tsx'),
  route(':slug', 'routes/page.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
