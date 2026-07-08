// Cloudflare Pages Function on the STUDIO project — POST /api/deploy
//
// WHY THIS EXISTS
// 1. CORS: the Cloudflare Deploy Hooks API does not return Access-Control-Allow-Origin,
//    so a browser fetch() to it fails with "Failed to fetch" even though the hook
//    fires (status 200). Calling this same-origin endpoint instead avoids CORS entirely.
// 2. Secrecy: the hook URL is a bearer credential — anyone holding it can trigger
//    unlimited production builds. Kept here as a runtime secret (note: NO
//    SANITY_STUDIO_ prefix, so it is never baked into the Studio's browser bundle).
//
// AUTH: the caller must present a Sanity auth token, which we validate against the
// project-scoped Sanity API. A token that isn't valid for THIS project is rejected,
// so the endpoint can't be used by a random visitor who finds the URL.
//
// REQUIRED ENV (on the Studio's Pages project):
//   DEPLOY_HOOK_URL   — secret. The Cloudflare deploy hook URL for the SITE project.
//   SANITY_PROJECT_ID — plain text. Used to scope token validation.

interface Env {
  DEPLOY_HOOK_URL: string
  SANITY_PROJECT_ID: string
}

// Typed inline rather than via `PagesFunction` from @cloudflare/workers-types:
// that package's globals clash with the DOM lib the Studio needs. Request and
// Response already exist in the DOM lib, so this is equivalent and conflict-free.
interface Context {
  request: Request
  env: Env
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Validate the token against this Sanity project. Returns the user id, or null. */
async function verifySanityUser(token: string, projectId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const user = (await res.json()) as { id?: string }
    return user?.id ?? null
  } catch {
    return null
  }
}

// Single catch-all handler: unambiguous method dispatch. (Exporting both
// `onRequest` and `onRequestPost` from one file has ambiguous precedence.)
export const onRequest = async ({ request, env }: Context): Promise<Response> => {
  // Mirror the deploy hook's own behaviour: only POST is accepted. Opening this
  // URL in a browser (a GET) returns 405 rather than triggering a build.
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  if (!env.DEPLOY_HOOK_URL || !env.SANITY_PROJECT_ID) {
    console.error('Deploy proxy misconfigured: DEPLOY_HOOK_URL or SANITY_PROJECT_ID missing')
    return json({ error: 'Deploy is not configured on the server.' }, 500)
  }

  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) {
    return json({ error: 'Not authenticated.' }, 401)
  }

  const userId = await verifySanityUser(token, env.SANITY_PROJECT_ID)
  if (!userId) {
    return json({ error: 'Not authorised to trigger a deploy.' }, 403)
  }

  try {
    const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
    if (!res.ok) {
      console.error('Deploy hook returned', res.status)
      return json({ error: `Deploy hook returned ${res.status}.` }, 502)
    }
    console.log(`Deploy triggered by Sanity user ${userId}`)
    return json({ success: true }, 200)
  } catch (err) {
    console.error('Deploy hook request failed:', err)
    return json({ error: 'Could not reach the deploy hook.' }, 502)
  }
}
