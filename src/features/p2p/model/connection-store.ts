import { create } from 'zustand'

export type ConnectionPhase =
  | 'IDLE'
  | 'STARTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'HOST_UNAVAILABLE'
  | 'REJECTED'
  | 'ERROR'

type ConnectionState = {
  phase: ConnectionPhase
  message: string | null
  setConnection: (phase: ConnectionPhase, message?: string | null) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  phase: 'IDLE',
  message: null,
  setConnection: (phase, message = null) => set({ phase, message }),
  reset: () => set({ phase: 'IDLE', message: null }),
}))
