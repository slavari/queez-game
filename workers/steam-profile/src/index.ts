import { createSteamProfileReference, parseSteamProfileXml } from './steam'

type Env = {
  ALLOWED_ORIGINS: string
}

const MAX_RESPONSE_BYTES = 128 * 1024
const STEAM_TIMEOUT_MS = 6_000

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin')
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())

  if (!origin || !allowedOrigins.includes(origin)) return {}

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(request: Request, env: Env, body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function readLimitedBody(response: Response) {
  const declaredSize = Number(response.headers.get('Content-Length') ?? 0)
  if (declaredSize > MAX_RESPONSE_BYTES) throw new Error('RESPONSE_TOO_LARGE')
  if (!response.body) throw new Error('EMPTY_RESPONSE')

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const result = await reader.read()
    if (result.done) break
    const chunk = result.value as Uint8Array

    total += chunk.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('RESPONSE_TOO_LARGE')
    }
    chunks.push(chunk)
  }

  const combined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(combined)
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())

    if (origin && !allowedOrigins.includes(origin)) {
      return json(request, env, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    if (request.method !== 'GET' || url.pathname !== '/profile') {
      return json(request, env, { error: 'NOT_FOUND' }, 404)
    }

    const reference = createSteamProfileReference(
      url.searchParams.get('type'),
      url.searchParams.get('value'),
    )
    if (!reference) return json(request, env, { error: 'INVALID_INPUT' }, 400)

    const steamUrl = `${reference.profileUrl}?xml=1`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), STEAM_TIMEOUT_MS)

    try {
      const response = await fetch(steamUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/xml,text/xml' },
        redirect: 'manual',
        cf: { cacheEverything: true, cacheTtl: 300 },
      })

      if (response.status >= 300 && response.status < 400) {
        return json(request, env, { error: 'INVALID_STEAM_RESPONSE' }, 502)
      }
      if (response.status === 404) {
        return json(request, env, { error: 'PROFILE_NOT_FOUND' }, 404)
      }
      if (!response.ok) {
        return json(request, env, { error: 'STEAM_UNAVAILABLE' }, 502)
      }

      const contentType = response.headers.get('Content-Type') ?? ''
      if (!contentType.includes('xml')) {
        return json(request, env, { error: 'INVALID_STEAM_RESPONSE' }, 502)
      }

      const xml = await readLimitedBody(response)
      const profile = parseSteamProfileXml(xml, reference)
      if (!profile) return json(request, env, { error: 'PROFILE_NOT_FOUND' }, 404)

      return json(request, env, { profile })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return json(request, env, { error: 'STEAM_TIMEOUT' }, 504)
      }
      console.error(
        'Steam profile lookup failed:',
        error instanceof Error ? error.message : 'Unknown upstream error',
      )
      return json(request, env, { error: 'STEAM_UNAVAILABLE' }, 502)
    } finally {
      clearTimeout(timeout)
    }
  },
} satisfies ExportedHandler<Env>
