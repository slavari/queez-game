import { parseClientMessage, parseServerMessage, PROTOCOL_VERSION } from './messages'

const profile = {
  steamId: '76561197960287930',
  nickname: 'Player',
  avatarUrl: 'https://avatars.fastly.steamstatic.com/avatar.jpg',
  profileUrl: 'https://steamcommunity.com/id/player/',
}

describe('P2P protocol validation', () => {
  it('accepts a valid join request without accepting a guest-supplied role', () => {
    const message = {
      version: PROTOCOL_VERSION,
      type: 'JOIN_REQUEST',
      payload: { participantId: 'participant-123456', profile, role: 'HOST' },
    }

    expect(parseClientMessage(message)).toMatchObject({ type: 'JOIN_REQUEST' })
    expect(parseClientMessage(message)).not.toHaveProperty('payload.role')
  })

  it('rejects unknown and oversized messages', () => {
    expect(parseClientMessage({ version: 1, type: 'BECOME_HOST', payload: {} })).toBeNull()
    expect(
      parseClientMessage({
        version: 1,
        type: 'JOIN_REQUEST',
        payload: {
          participantId: 'participant-123456',
          profile: { ...profile, nickname: 'x'.repeat(20_000) },
        },
      }),
    ).toBeNull()
  })

  it('rejects malformed room snapshots', () => {
    expect(
      parseServerMessage({
        version: 1,
        type: 'ROOM_SNAPSHOT',
        payload: { room: { id: 'bad', version: 0, participants: [] } },
      }),
    ).toBeNull()
  })
})
