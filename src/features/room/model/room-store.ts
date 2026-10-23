import { create } from 'zustand'

import type { RoomSnapshot } from '@/features/room/model/types'

type RoomState = {
  room: RoomSnapshot | null
  applySnapshot: (room: RoomSnapshot) => void
  reset: () => void
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  applySnapshot: (room) => {
    const current = get().room
    if (current && current.id === room.id && current.version >= room.version) return
    set({ room })
  },
  reset: () => set({ room: null }),
}))
