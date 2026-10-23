import { normalizeSteamProfileUrl } from './steam-profile-url'

describe('normalizeSteamProfileUrl', () => {
  it('normalizes vanity URLs with whitespace, query and trailing slash', () => {
    expect(
      normalizeSteamProfileUrl('  https://steamcommunity.com/id/some_user/?utm_source=test  '),
    ).toEqual({
      type: 'vanity',
      value: 'some_user',
      canonicalUrl: 'https://steamcommunity.com/id/some_user/',
    })
  })

  it('normalizes numeric Steam ID URLs', () => {
    expect(
      normalizeSteamProfileUrl('https://steamcommunity.com/profiles/76561197960287930'),
    ).toEqual({
      type: 'steamid',
      value: '76561197960287930',
      canonicalUrl: 'https://steamcommunity.com/profiles/76561197960287930/',
    })
  })

  it('rejects arbitrary hosts and invalid paths', () => {
    expect(normalizeSteamProfileUrl('https://example.com/id/user')).toBeNull()
    expect(normalizeSteamProfileUrl('https://steamcommunity.com/groups/example')).toBeNull()
  })
})
