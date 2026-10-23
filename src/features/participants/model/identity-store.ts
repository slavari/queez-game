import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { SteamProfile } from '@/features/steam-profile/model/types'
import { createSecureId } from '@/shared/lib/ids'

type IdentityState = {
  profile: SteamProfile | null
  sessionId: string
  hostedRoomId: string | null
  setProfile: (profile: SteamProfile | null) => void
  setHostedRoomId: (roomId: string | null) => void
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      profile: null,
      sessionId: createSecureId('participant-', 20),
      hostedRoomId: null,
      setProfile: (profile) => set({ profile }),
      setHostedRoomId: (hostedRoomId) => set({ hostedRoomId }),
    }),
    {
      name: 'game-pick-identity',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ profile, sessionId, hostedRoomId }) => ({ profile, sessionId, hostedRoomId }),
    },
  ),
)
