import { createRoomId, createRoomInviteUrl, isRoomId, parseRoomReference } from './room-id'

describe('room identifiers', () => {
  it('generates URL-safe, high-entropy identifiers', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createRoomId()))
    expect(ids.size).toBe(100)
    expect([...ids].every(isRoomId)).toBe(true)
  })

  it('builds and parses GitHub Pages hash invitations', () => {
    const roomId = 'gp-1234567890abcdefghijklmn'
    const location = {
      origin: 'https://slavari.github.io',
      pathname: '/queez-game/',
      search: '',
    } as Location
    const invite = createRoomInviteUrl(roomId, location)

    expect(invite).toBe(`https://slavari.github.io/queez-game/#/room/${roomId}`)
    expect(parseRoomReference(invite)).toBe(roomId)
    expect(parseRoomReference(roomId)).toBe(roomId)
  })
})
