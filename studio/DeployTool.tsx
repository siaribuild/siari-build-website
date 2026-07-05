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
import { Card, Stack, Button, Text, Flex, Box, Badge } from '@sanity/ui'
import { RocketIcon } from '@sanity/icons'

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
