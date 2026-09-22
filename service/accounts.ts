import type { Account, AccountPayload } from "@/lib/accounts"
import { identityRequest } from "@/service/core-api"

export function listAccounts(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return identityRequest<Account[]>(`/api/accounts${suffix}`)
}

export function createAccount(payload: AccountPayload) {
  return identityRequest<Account>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateAccount(id: string, payload: AccountPayload) {
  return identityRequest<Account>(`/api/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteAccount(id: string) {
  return identityRequest<{ id: string; username: string }>(`/api/accounts/${id}`, {
    method: "DELETE",
  })
}
