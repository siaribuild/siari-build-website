import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router'
import type { LinksFunction } from 'react-router'

import '../styles/index.css'

import { client } from './lib/sanity'
import { SITE_SETTINGS_QUERY, NAVIGATION_QUERY } from './lib/queries'
import { inlineSanitySvgs } from './lib/block-data'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MaintenancePage } from './components/MaintenancePage'

// ─── Global data, fetched once at BUILD TIME and baked into every page ───────
// Site settings + navigation drive the Header, Footer and SEO/meta. During a
// maintenance build we skip navigation (nothing renders it) but still bake
// settings, which the MaintenancePage needs.
export async function loader() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  if (__MAINTENANCE__) {
    return { settings, navigation: null }
  }

  const navigation = await client.fetch(NAVIGATION_QUERY)
  // Inline any Sanity-hosted SVG icons (e.g. footer social icons) so they don't
  // need a cross-origin browser fetch that 403s from non-allow-listed origins.
  await inlineSanitySvgs(navigation)
  return { settings, navigation }
}

// Head resources. Preconnect to BOTH Sanity origins — the query API host
// (LCP-critical: the page data comes from here) and the image CDN.
export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://f0yvhrzy.apicdn.sanity.io', crossOrigin: 'anonymous' },
  { rel: 'preconnect', href: 'https://cdn.sanity.io', crossOrigin: 'anonymous' },
  { rel: 'icon', href: '/favicon.ico' },
]

// The HTML document. <Meta/> and <Links/> render the merged output of every
// route's meta/links exports; <Scripts/> injects the client bundle; and
// <ScrollRestoration/> replaces the old custom ScrollToTop component.
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#111111" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  // Maintenance build → the entire site is the maintenance page (every route and
  // the SPA fallback). The real chrome + content are never rendered or shipped.
  if (__MAINTENANCE__) {
    return <MaintenancePage />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

// Branded error screen shown when a route throws (replaces the old class
// ErrorBoundary wrapper). Uses a plain anchor so recovery works even if the
// router itself is the thing that failed.
export function ErrorBoundary({ error }: { error: unknown }) {
  const is404 = isRouteErrorResponse(error) && error.status === 404
  const heading = is404 ? 'PAGE NOT FOUND' : 'UNEXPECTED ERROR'
  const message = is404
    ? "The page you're looking for doesn't exist or has been moved."
    : "Something didn't load as expected. Please try again — if the problem persists, get in touch and we'll sort it out."

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden on-media section--dark">
      <div
        className="absolute top-0 left-0 w-96 h-96 corner-bracket"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
      />
      <div className="relative z-10 text-center px-6 py-24 max-w-2xl">
        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">
          {is404 ? 'Error 404' : 'Something Went Wrong'}
        </div>
        <h1
          className="mb-6 uppercase"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}
        >
          {heading}
        </h1>
        <p className="text-xl opacity-90 mb-10">{message}</p>
        <a
          href="/"
          className="btn-bronze inline-block px-10 py-4 text-sm tracking-wider uppercase transition-all"
          style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
        >
          Back to Home
        </a>
      </div>
    </section>
  )
}
