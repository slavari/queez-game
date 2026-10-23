import { createSteamProfileReference, parseSteamProfileXml } from './steam'

const publicProfileXml = `<?xml version="1.0"?>
<profile>
  <steamID64>76561197960287930</steamID64>
  <steamID><![CDATA[Rabscuttle &amp; Friends]]></steamID>
  <avatarFull><![CDATA[https://avatars.fastly.steamstatic.com/avatar_full.jpg]]></avatarFull>
</profile>`

describe('Steam Worker parser', () => {
  it('validates references and builds the Steam URL itself', () => {
    expect(createSteamProfileReference('vanity', 'valid_name')).toEqual({
      type: 'vanity',
      value: 'valid_name',
      profileUrl: 'https://steamcommunity.com/id/valid_name/',
    })
    expect(createSteamProfileReference('steamid', '76561197960287930')).not.toBeNull()
    expect(createSteamProfileReference('vanity', 'https://example.com')).toBeNull()
  })

  it('normalizes the required public Steam fields', () => {
    const reference = createSteamProfileReference('vanity', 'gabelogannewell')
    expect(reference).not.toBeNull()
    if (!reference) return

    expect(parseSteamProfileXml(publicProfileXml, reference)).toEqual({
      steamId: '76561197960287930',
      nickname: 'Rabscuttle & Friends',
      avatarUrl: 'https://avatars.fastly.steamstatic.com/avatar_full.jpg',
      profileUrl: 'https://steamcommunity.com/id/gabelogannewell/',
    })
  })

  it('rejects error and incomplete responses', () => {
    const reference = createSteamProfileReference('vanity', 'missing')
    expect(reference).not.toBeNull()
    if (!reference) return

    expect(
      parseSteamProfileXml('<profile><error>Profile not found</error></profile>', reference),
    ).toBeNull()
    expect(
      parseSteamProfileXml(
        '<profile><steamID64>76561197960287930</steamID64></profile>',
        reference,
      ),
    ).toBeNull()
  })
})
