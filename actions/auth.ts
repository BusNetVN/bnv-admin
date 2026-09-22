"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE } from "@/lib/auth"

export type LoginState = {
  error: string
} | null

const IDENTITY_API_URL =
  process.env.IDENTITY_API_URL ??
  process.env.NEXT_PUBLIC_IDENTITY_API_URL ??
  "http://localhost:8002"

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0]
    }
  }

  return fallback
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const remember = formData.get("remember") === "on"

  if (!username || !password) {
    return { error: "Vui lòng nhập tên đăng nhập và mật khẩu." }
  }

  let response: Response
  try {
    response = await fetch(`${IDENTITY_API_URL}/api/auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        client: "admin",
      }),
    })
  } catch {
    return {
      error:
        "Không kết nối được identity-service. Kiểm tra service đang chạy ở cổng 8002.",
    }
  }

  const payload = (await response.json().catch(() => null)) as {
    access_token?: string
    refresh_token?: string
    account?: { username?: string; account_type?: string }
    message?: string | string[]
  } | null

  if (!response.ok) {
    return {
      error: errorMessage(payload, "Tên đăng nhập hoặc mật khẩu không đúng."),
    }
  }

  if (
    !payload?.access_token ||
    payload.account?.account_type !== "SYSTEM_ADMIN"
  ) {
    return { error: "Tài khoản không có quyền truy cập hệ thống quản trị." }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    SESSION_COOKIE,
    JSON.stringify({
      username: payload.account.username ?? username.toLowerCase(),
      access_token: payload.access_token,
      refresh_token: payload.refresh_token ?? "",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    }
  )

  redirect("/dashboard")
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect("/")
}
