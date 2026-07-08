// Sanity Studio custom tool: a manual "Publish site" / rebuild button that POSTs
// to a Cloudflare Pages Deploy Hook. Gives editors a one-click rebuild instead of
// relying only on the automatic publish webhook.
//
// SETUP
// 1. In Cloudflare: dev/prod Pages project → Settings → Builds & deployments →
//    Deploy hooks → create one → copy its URL.
// 2. Because the hook URL is a secret-ish trigger, don't hard-code it in the repo.
//    Put it in a Studio env var: SANITY_STUDIO_DEPLOY_HOOK_URL (Studio exposes
//    vars prefixed SANITY_STUDIO_ to the browser bundle). For production hooks,
//    prefer routing through a tiny serverless proxy so the URL isn't public — see
//    the note at the bottom.
// 3. Register this tool in sanity.config.ts (see snippet in README.md).

import { useState, useCallback } from 'react'
import type { SVGProps } from 'react'
import { Card, Stack, Button, Text, Flex, Box, Badge } from '@sanity/ui'

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

const HOOK_URL = (import.meta as any).env?.SANITY_STUDIO_DEPLOY_HOOK_URL as string | undefined

export function DeployTool() {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const deploy = useCallback(async () => {
    if (!HOOK_URL) {
      setStatus('error')
      setMessage('SANITY_STUDIO_DEPLOY_HOOK_URL is not set.')
      return
    }
    setStatus('deploying')
    setMessage('')
    try {
      const res = await fetch(HOOK_URL, { method: 'POST' })
      if (!res.ok) throw new Error(`Deploy hook returned ${res.status}`)
      setStatus('done')
      setMessage('Build triggered — the site will update in a minute or two.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Could not trigger the build.')
    }
  }, [])

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
