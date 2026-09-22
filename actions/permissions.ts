"use server"

import { revalidatePath } from "next/cache"

import type {
  Permission,
  PermissionGroup,
  PermissionGroupPayload,
  PermissionPayload,
} from "@/lib/permissions"
import {
  createPermission,
  createPermissionGroup,
  deletePermission,
  deletePermissionGroup,
  updatePermission,
  updatePermissionGroup,
} from "@/service/permissions"
import { CoreApiError } from "@/service/core-api"

const PERMISSIONS_PATH = "/dashboard/permissions"

export type PermissionGroupActionResult =
  | { ok: true; data: PermissionGroup }
  | { ok: false; message: string }

export type PermissionActionResult =
  | { ok: true; data: Permission }
  | { ok: false; message: string }

export type DeleteActionResult =
  | { ok: true; data: { id: string; code: string; name: string } }
  | { ok: false; message: string }

function fail(error: unknown, fallback: string): { ok: false; message: string } {
  return {
    ok: false,
    message: error instanceof CoreApiError ? error.message : fallback,
  }
}

export async function createPermissionGroupAction(
  payload: PermissionGroupPayload
): Promise<PermissionGroupActionResult> {
  try {
    const data = await createPermissionGroup(payload)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được nhóm chức năng. Thử lại sau.")
  }
}

export async function updatePermissionGroupAction(
  id: string,
  payload: PermissionGroupPayload
): Promise<PermissionGroupActionResult> {
  try {
    const data = await updatePermissionGroup(id, payload)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được nhóm chức năng. Thử lại sau.")
  }
}

export async function deletePermissionGroupAction(
  id: string
): Promise<DeleteActionResult> {
  try {
    const data = await deletePermissionGroup(id)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không xóa được nhóm chức năng. Thử lại sau.")
  }
}

export async function createPermissionAction(
  groupId: string,
  payload: PermissionPayload
): Promise<PermissionActionResult> {
  try {
    const data = await createPermission(groupId, payload)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được chức năng. Thử lại sau.")
  }
}

export async function updatePermissionAction(
  id: string,
  payload: PermissionPayload
): Promise<PermissionActionResult> {
  try {
    const data = await updatePermission(id, payload)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được chức năng. Thử lại sau.")
  }
}

export async function deletePermissionAction(
  id: string
): Promise<DeleteActionResult> {
  try {
    const data = await deletePermission(id)
    revalidatePath(PERMISSIONS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không xóa được chức năng. Thử lại sau.")
  }
}
