import { useEffect, useRef, useState } from 'react'

import {
  SteamProfileError,
  fetchSteamProfile,
} from '@/features/steam-profile/api/fetch-steam-profile'
import type { SteamProfile } from '@/features/steam-profile/model/types'
import { useIdentityStore } from '@/features/participants/model/identity-store'

const errorMessages = {
  INVALID_URL: 'Enter a valid Steam Community profile URL.',
  CONFIGURATION_MISSING: 'Steam profile lookup is not configured yet.',
  PROFILE_NOT_FOUND:
    'This Steam profile could not be found or does not expose public profile data.',
  STEAM_UNAVAILABLE: 'Steam is temporarily unavailable. Please try again.',
  STEAM_TIMEOUT: 'Steam took too long to respond. Please try again.',
  INVALID_RESPONSE: 'Steam returned an unexpected response. Please try again later.',
} as const

type SteamProfileFormProps = {
  onConfirmed: (profile: SteamProfile) => void
  confirmLabel?: string
}

export function SteamProfileForm({
  onConfirmed,
  confirmLabel = 'Continue',
}: SteamProfileFormProps) {
  const storedProfile = useIdentityStore((state) => state.profile)
  const setStoredProfile = useIdentityStore((state) => state.setProfile)
  const [profile, setProfile] = useState<SteamProfile | null>(storedProfile)
  const [profileUrl, setProfileUrl] = useState(storedProfile?.profileUrl ?? '')
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>(
    storedProfile ? 'SUCCESS' : 'IDLE',
  )
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const loadProfile = async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('LOADING')
    setError(null)

    try {
      const loadedProfile = await fetchSteamProfile(profileUrl, { signal: controller.signal })
      setProfile(loadedProfile)
      setStatus('SUCCESS')
    } catch (caughtError) {
      if (controller.signal.aborted) return
      const code = caughtError instanceof SteamProfileError ? caughtError.code : 'STEAM_UNAVAILABLE'
      setError(errorMessages[code])
      setStatus('ERROR')
      setProfile(null)
    }
  }

  const changeProfile = () => {
    setProfile(null)
    setStatus('IDLE')
    setError(null)
  }

  if (status === 'SUCCESS' && profile) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.045] p-4">
          <img
            src={profile.avatarUrl}
            alt=""
            className="size-16 rounded-xl bg-slate-800 object-cover ring-1 ring-white/15"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-white">{profile.nickname}</p>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-cyan-300 hover:text-cyan-200"
            >
              Open Steam profile ↗
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setStoredProfile(profile)
            onConfirmed(profile)
          }}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-4 font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={changeProfile}
          className="w-full rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Use a different profile
        </button>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void loadProfile()
      }}
    >
      <div>
        <label htmlFor="steam-profile-url" className="text-sm font-semibold text-slate-200">
          Steam profile URL
        </label>
        <input
          id="steam-profile-url"
          type="url"
          required
          value={profileUrl}
          onChange={(event) => setProfileUrl(event.target.value)}
          placeholder="https://steamcommunity.com/id/username"
          autoComplete="url"
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300/15 bg-red-400/8 px-3 py-2 text-sm text-red-100"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'LOADING'}
        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-4 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-65"
      >
        {status === 'LOADING' ? 'Loading Steam profile…' : 'Load Steam profile'}
      </button>
      <p className="text-xs leading-5 text-slate-500">
        Game Pick reads public profile data only. It never asks for your Steam password.
      </p>
    </form>
  )
}
