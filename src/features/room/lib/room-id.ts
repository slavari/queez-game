import { createSecureId } from '@/shared/lib/ids'

export const ROOM_ID_PATTERN = /^gp-[a-z0-9]{24}$/

export function createRoomId() {
  return createSecureId('gp-', 24)
}

export function isRoomId(value: string) {
  return ROOM_ID_PATTERN.test(value)
}

export function createRoomInviteUrl(roomId: string, location = window.location) {
  if (!isRoomId(roomId)) throw new Error('Invalid room ID')

  return `${location.origin}${location.pathname}${location.search}#/room/${roomId}`
}

export function parseRoomReference(value: string): string | null {
  const trimmed = value.trim()
  if (isRoomId(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    const match = url.hash.match(/^#\/room\/([^/?#]+)\/?$/)
    const roomId = match?.[1] ? decodeURIComponent(match[1]) : null
    return roomId && isRoomId(roomId) ? roomId : null
  } catch {
    return null
  }
}
