// Sanity Studio custom tool: a manual "Publish site" / rebuild button.
//
// It POSTs to a SAME-ORIGIN proxy (functions/api/deploy.ts on this Studio's
// Cloudflare Pages project), NOT directly to the Cloudflare Deploy Hooks API.
// Two reasons:
//   1. CORS — the Deploy Hooks API sends no Access-Control-Allow-Origin, so a
//      direct browser fetch() fails with "Failed to fetch" even though the hook
//      fires (200). A same-origin request has no CORS to satisfy.
//   2. Secrecy — the hook URL is a bearer credential. Anything prefixed
//      SANITY_STUDIO_ is baked into this browser bundle, so the URL must NOT be
//      an env var here. The proxy holds it as a server-side secret.
//
// SETUP (on the STUDIO's Pages project → Settings → Variables and Secrets):
//   DEPLOY_HOOK_URL   — secret. The deploy hook URL for the SITE's Pages project.
//   SANITY_PROJECT_ID — plain text. Used by the proxy to validate the caller.
// No Studio rebuild is needed when the hook is rotated — only the proxy's secret.

import { useState, useCallback } from 'react'
import type { SVGProps } from 'react'
import { Card, Stack, Button, Text, Flex, Box, Badge } from '@sanity/ui'
import { useClient } from 'sanity'

// Inline SVG rather than importing from @sanity/icons: that package's named /
// subpath icon exports differ across versions and broke the Studio build under
// the browser/ESM resolution conditions. An inline icon can't regress.
export const RocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 15l-3-3a11 11 0 0 1 3.5-6.5A11 11 0 0 1 19 3a11 11 0 0 1-2.5 6.5A11 11 0 0 1 12 15z" />
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M9 12H5s.4-2.3 1.8-3.2c1-.7 2.7-.3 2.7-.3" />
    <path d="M12 15v4s2.3-.4 3.2-1.8c.7-1 .3-2.7.3-2.7" />
    <circle cx="15" cy="9" r="1" />
  </svg>
)

export function DeployTool() {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const client = useClient({ apiVersion: '2025-06-18' })

  const deploy = useCallback(async () => {
    // The Studio's own auth token proves to the proxy that a logged-in user of
    // THIS Sanity project is making the request.
    const token = client.config().token
    if (!token) {
      setStatus('error')
      setMessage('Could not read your Sanity session. Try reloading the Studio.')
      return
    }

    setStatus('deploying')
    setMessage('')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || `Deploy failed (${res.status})`)
      setStatus('done')
      setMessage('Build triggered — the site will update in a minute or two.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not trigger the build.')
    }
  }, [client])

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%' }} padding={4}>
      <Card padding={4} radius={3} shadow={1} style={{ maxWidth: 520, width: '100%' }}>
        <Stack space={4}>
          <Flex align="center" gap={3}>
            <RocketIcon style={{ fontSize: 28 }} />
            <Text size={3} weight="bold">Publish site</Text>
          </Flex>
          <Text size={1} muted>
            Content changes go live after the site rebuilds. This usually happens
            automatically when you publish, but you can trigger a rebuild manually
            here at any time.
          </Text>
          <Box>
            <Button
              text={status === 'deploying' ? 'Triggering…' : 'Rebuild & publish site'}
              tone="primary"
              disabled={status === 'deploying'}
              onClick={deploy}
              icon={RocketIcon}
            />
          </Box>
          {status === 'done' && <Badge tone="positive">{message}</Badge>}
          {status === 'error' && <Badge tone="critical">{message}</Badge>}
        </Stack>
      </Card>
    </Flex>
  )
}
