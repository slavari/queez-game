import worker from './index'

const env = {
  ALLOWED_ORIGINS: 'https://slavari.github.io,http://localhost:5173',
}

const xml = `<profile>
  <steamID64>76561197960287930</steamID64>
  <steamID><![CDATA[Rabscuttle]]></steamID>
  <avatarFull><![CDATA[https://avatars.fastly.steamstatic.com/avatar.jpg]]></avatarFull>
</profile>`

describe('Steam profile Worker endpoint', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns a normalized real-source response with CORS for an allowed origin', async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(
      new Response(xml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      }),
    )
    vi.stubGlobal('fetch', upstreamFetch)

    const response = await worker.fetch(
      new Request('https://worker.example/profile?type=vanity&value=gabelogannewell', {
        headers: { Origin: 'http://localhost:5173' },
      }),
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    await expect(response.json()).resolves.toMatchObject({
      profile: { steamId: '76561197960287930', nickname: 'Rabscuttle' },
    })
    expect(upstreamFetch).toHaveBeenCalledWith(
      'https://steamcommunity.com/id/gabelogannewell/?xml=1',
      expect.objectContaining({ redirect: 'manual' }),
    )
  })

  it('rejects untrusted origins before contacting Steam', async () => {
    const upstreamFetch = vi.fn()
    vi.stubGlobal('fetch', upstreamFetch)

    const response = await worker.fetch(
      new Request('https://worker.example/profile?type=vanity&value=gabelogannewell', {
        headers: { Origin: 'https://evil.example' },
      }),
      env,
    )

    expect(response.status).toBe(403)
    expect(upstreamFetch).not.toHaveBeenCalled()
  })

  it('rejects upstream redirects instead of following them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: 'https://example.com/' },
        }),
      ),
    )

    const response = await worker.fetch(
      new Request('https://worker.example/profile?type=vanity&value=gabelogannewell'),
      env,
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: 'INVALID_STEAM_RESPONSE' })
  })
})
