"use server"

import { revalidatePath } from "next/cache"

import type { Operator, OperatorInput } from "@/lib/operators"
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/service/companies"
import { CoreApiError } from "@/service/core-api"

const OPERATORS_PATH = "/dashboard/operators"

export type CompanyActionResult =
  | { ok: true; data: Operator }
  | { ok: false; message: string }

export type DeleteCompanyActionResult =
  | { ok: true; data: { id: string } }
  | { ok: false; message: string }

function fail(error: unknown, fallback: string): { ok: false; message: string } {
  return {
    ok: false,
    message: error instanceof CoreApiError ? error.message : fallback,
  }
}

export async function createCompanyAction(
  payload: OperatorInput
): Promise<CompanyActionResult> {
  try {
    const data = await createCompany(payload)
    revalidatePath(OPERATORS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được nhà xe. Thử lại sau.")
  }
}

export async function updateCompanyAction(
  id: string,
  payload: OperatorInput
): Promise<CompanyActionResult> {
  try {
    const data = await updateCompany(id, payload)
    revalidatePath(OPERATORS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không lưu được nhà xe. Thử lại sau.")
  }
}

export async function deleteCompanyAction(
  id: string
): Promise<DeleteCompanyActionResult> {
  try {
    const data = await deleteCompany(id)
    revalidatePath(OPERATORS_PATH)
    return { ok: true, data }
  } catch (error) {
    return fail(error, "Không xóa được nhà xe. Thử lại sau.")
  }
}
