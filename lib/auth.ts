export const SESSION_COOKIE = "bnv_admin_session"

export type AdminSession = {
  username: string
  access_token: string
  refresh_token: string
}

export function parseAdminSession(raw: string | undefined | null): AdminSession | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (!parsed.username || !parsed.access_token) {
      return null
    }

    return {
      username: parsed.username,
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token ?? "",
    }
  } catch {
    return null
  }
}
