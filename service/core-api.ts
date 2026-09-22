import { cookies } from "next/headers"

import { parseAdminSession, SESSION_COOKIE } from "@/lib/auth"

const CORE_API_URL =
  process.env.CORE_API_URL ??
  process.env.NEXT_PUBLIC_CORE_API_URL ??
  "http://localhost:8080/core"

const IDENTITY_API_URL =
  process.env.IDENTITY_API_URL ??
  process.env.NEXT_PUBLIC_IDENTITY_API_URL ??
  "http://localhost:8080/identity"

export class CoreApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    const message = Array.isArray(body.message)
      ? body.message.join(" ")
      : body.message
    return message || `Yêu cầu thất bại (${response.status}).`
  } catch {
    return `Yêu cầu thất bại (${response.status}).`
  }
}

async function accessToken() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  return parseAdminSession(raw)?.access_token ?? null
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  baseUrl = CORE_API_URL
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = await accessToken()
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers,
    })
  } catch {
    throw new CoreApiError("Không kết nối được máy chủ. Vui lòng thử lại.", 0)
  }

  if (!response.ok) {
    throw new CoreApiError(await parseError(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function identityRequest<T>(path: string, init?: RequestInit) {
  return request<T>(path, init, IDENTITY_API_URL)
}

export function loadErrorMessage(
  error: unknown,
  service: "identity" | "core"
) {
  if (error instanceof CoreApiError && error.status > 0) {
    return error.message
  }

  return service === "identity"
    ? "Không kết nối được máy chủ identity. Vui lòng thử lại."
    : "Không kết nối được máy chủ core. Vui lòng thử lại."
}
