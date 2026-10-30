"use client"

import { create } from "zustand"
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware"

import type { AuthSession, AuthStore } from "@/types/auth"

const STORAGE_KEY = "bnv-admin-auth"
/** Treat the access token as expired slightly early so it never expires mid-request. */
const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30_000
let rememberSession = true

const authStorage: StateStorage = {
  getItem(name) {
    if (typeof window === "undefined") {
      return null
    }

    const persistentValue = window.localStorage.getItem(name)
    if (persistentValue) {
      rememberSession = true
      return persistentValue
    }

    const temporaryValue = window.sessionStorage.getItem(name)
    if (temporaryValue) {
      rememberSession = false
    }
    return temporaryValue
  },
  setItem(name, value) {
    if (typeof window === "undefined") {
      return
    }

    const storage = rememberSession ? window.localStorage : window.sessionStorage
    const otherStorage = rememberSession
      ? window.sessionStorage
      : window.localStorage
    otherStorage.removeItem(name)
    storage.setItem(name, value)
  },
  removeItem(name) {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.removeItem(name)
    window.sessionStorage.removeItem(name)
  },
}

function parseExpiresIn(value: string) {
  const match = /^(\d+)([smhd])$/i.exec(value.trim())
  if (!match) {
    throw new Error(`Thời hạn access token không hợp lệ: ${value}`)
  }

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  const multiplier =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60_000
        : unit === "h"
          ? 3_600_000
          : 86_400_000

  return amount * multiplier
}

export const useAuthStore = create<AuthStore>()(
  persist<AuthStore, [], [], AuthSession>(
    (set, get) => ({
      account: null,
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      setSession: (response, remember) => {
        rememberSession = remember
        get().updateTokens(response)
      },
      updateTokens: (response) => {
        set({
          account: response.account,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          tokenType: response.token_type,
          expiresAt: Date.now() + parseExpiresIn(response.expires_in),
        })
      },
      clearSession: () => {
        set({
          account: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          expiresAt: null,
        })
        authStorage.removeItem(STORAGE_KEY)
      },
      getAccessToken: () => {
        const { accessToken, expiresAt } = get()
        if (!accessToken || !expiresAt) {
          return null
        }
        if (expiresAt - ACCESS_TOKEN_EXPIRY_SKEW_MS <= Date.now()) {
          return null
        }
        return accessToken
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: ({
        account,
        accessToken,
        refreshToken,
        tokenType,
        expiresAt,
      }) => ({ account, accessToken, refreshToken, tokenType, expiresAt }),
    }
  )
)
