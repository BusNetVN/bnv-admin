import type { ApiEnvelope, ApiErrorResponse } from "@/types/api"
import type { LoginResponse } from "@/types/auth"
import { useAuthStore } from "@/stores/auth-store"

const REFRESH_PATH = "/api/admin/auth/refresh"
const REFRESH_LOCK = "bnv-admin-auth-refresh"
/** The server rejected the refresh token itself; anything else (5xx, offline) may be retried. */
const REJECTED_REFRESH_STATUSES = new Set([400, 401, 403])
const SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."

export const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL ??
  "http://localhost:8080/core"

export class CoreApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof CoreApiError ? error.message : fallback
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>
    return body.error?.message || `Yêu cầu thất bại (${response.status}).`
  } catch {
    return `Yêu cầu thất bại (${response.status}).`
  }
}

export async function accessToken() {
  if (typeof window === "undefined") {
    return null
  }

  const { getAccessToken, refreshToken } = useAuthStore.getState()
  return getAccessToken() ?? (refreshToken ? refreshAccessToken() : null)
}

let pendingRefresh: Promise<string | null> | null = null

/**
 * Exchanges the refresh token for new tokens. The server revokes the whole session when a
 * refresh token is used twice, so concurrent callers (and other tabs) share one refresh.
 */
export function refreshAccessToken() {
  pendingRefresh ??= withRefreshLock(rotateTokens).finally(() => {
    pendingRefresh = null
  })
  return pendingRefresh
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, task)
  }
  return task()
}

async function rotateTokens() {
  const knownRefreshToken = useAuthStore.getState().refreshToken
  // Another tab may have rotated the tokens while this one waited for the lock.
  await useAuthStore.persist.rehydrate()
  const { refreshToken, getAccessToken, updateTokens, clearSession } =
    useAuthStore.getState()
  if (!refreshToken) {
    return null
  }
  if (refreshToken !== knownRefreshToken && getAccessToken()) {
    return getAccessToken()
  }

  try {
    const response = await request<LoginResponse>(
      REFRESH_PATH,
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      CORE_API_URL,
      false
    )
    updateTokens(response)
    return response.access_token
  } catch (error) {
    if (error instanceof CoreApiError && REJECTED_REFRESH_STATUSES.has(error.status)) {
      clearSession()
      return null
    }
    throw error
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.replace("/")
  }
}

async function send(
  url: string,
  init: RequestInit | undefined,
  headers: Headers
) {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      headers,
    })
  } catch {
    throw new CoreApiError("Không kết nối được máy chủ. Vui lòng thử lại.", 0)
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  baseUrl = CORE_API_URL,
  authenticate = true
): Promise<T> {
  const url = `${baseUrl}${path}`
  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const useSession = authenticate && !headers.has("Authorization")
  if (useSession) {
    const token = await accessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  let response = await send(url, init, headers)

  if (useSession && response.status === 401) {
    const token = useAuthStore.getState().refreshToken
      ? await refreshAccessToken()
      : null
    if (!token) {
      useAuthStore.getState().clearSession()
      redirectToLogin()
      throw new CoreApiError(SESSION_EXPIRED_MESSAGE, 401)
    }
    headers.set("Authorization", `Bearer ${token}`)
    response = await send(url, init, headers)
  }

  if (!response.ok) {
    throw new CoreApiError(await parseError(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json()
  return (isApiEnvelope<T>(body) ? body.data : body) as T
}

function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "data" in body
  )
}

export function loadErrorMessage(error: unknown) {
  if (error instanceof CoreApiError && error.status > 0) {
    return error.message
  }

  return "Không kết nối được máy chủ core. Vui lòng thử lại."
}
