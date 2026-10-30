import type { AccountType } from "@/types/users"

export type AdminSession = {
  username: string
  access_token: string
  refresh_token: string
}

export type LoginAccount = {
  username: string
  account_type: AccountType
  is_active: boolean
  full_name: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: "Bearer"
  expires_in: string
  account: LoginAccount
}

export type AuthSession = {
  account: LoginAccount | null
  accessToken: string | null
  refreshToken: string | null
  tokenType: "Bearer" | null
  expiresAt: number | null
}

export type AuthStore = AuthSession & {
  setSession: (response: LoginResponse, remember: boolean) => void
  /** Stores rotated tokens from /refresh, keeping the current "remember me" storage. */
  updateTokens: (response: LoginResponse) => void
  clearSession: () => void
  /** The access token while it is still valid, otherwise null (it may be refreshable). */
  getAccessToken: () => string | null
}
