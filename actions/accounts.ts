"use server"

import { revalidatePath } from "next/cache"

import type { Account, AccountPayload } from "@/lib/accounts"
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/service/accounts"
import { CoreApiError } from "@/service/core-api"

const ACCOUNTS_PATH = "/dashboard/accounts"

export type AccountActionResult =
  | { ok: true; data: Account }
  | { ok: false; message: string }

export type DeleteAccountActionResult =
  | { ok: true; data: { id: string; username: string } }
  | { ok: false; message: string }

function fail(error: unknown, fallback: string): { ok: false; message: string } {
  return {
    ok: false,
    message: error instanceof CoreApiError ? error.message : fallback,
  }
}

export async function createAccountAction(
  payload: AccountPayload
): Promise<AccountActionResult> {
  try {
    const data = await createAccount(payload)
    revalidatePath(ACCOUNTS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được tài khoản. Thử lại sau.")
  }
}

export async function updateAccountAction(
  id: string,
  payload: AccountPayload
): Promise<AccountActionResult> {
  try {
    const data = await updateAccount(id, payload)
    revalidatePath(ACCOUNTS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được tài khoản. Thử lại sau.")
  }
}

export async function deleteAccountAction(
  id: string
): Promise<DeleteAccountActionResult> {
  try {
    const data = await deleteAccount(id)
    revalidatePath(ACCOUNTS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không xóa được tài khoản. Thử lại sau.")
  }
}
