import { SteamProfileError, fetchSteamProfile } from './fetch-steam-profile'

const profile = {
  steamId: '76561197960287930',
  nickname: 'Public Player',
  avatarUrl: 'https://avatars.fastly.steamstatic.com/avatar.jpg',
  profileUrl: 'https://steamcommunity.com/id/public-player/',
}

describe('fetchSteamProfile', () => {
  it('returns a validated Worker response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ profile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      fetchSteamProfile('https://steamcommunity.com/id/public-player', {
        apiBaseUrl: 'https://worker.example',
        fetcher,
      }),
    ).resolves.toEqual(profile)
  })

  it('maps not-found responses to a safe domain error', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'PROFILE_NOT_FOUND' }), { status: 404 }),
      )

    await expect(
      fetchSteamProfile('https://steamcommunity.com/id/missing', {
        apiBaseUrl: 'https://worker.example',
        fetcher,
      }),
    ).rejects.toMatchObject<Partial<SteamProfileError>>({ code: 'PROFILE_NOT_FOUND' })
  })

  it('maps network failures without leaking the raw error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('socket details'))

    await expect(
      fetchSteamProfile('https://steamcommunity.com/id/public-player', {
        apiBaseUrl: 'https://worker.example',
        fetcher,
      }),
    ).rejects.toMatchObject<Partial<SteamProfileError>>({ code: 'STEAM_UNAVAILABLE' })
  })
})
