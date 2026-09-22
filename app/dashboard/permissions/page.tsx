import { PermissionsCrud } from "@/components/permissions/permissions-crud"
import type { PermissionGroup } from "@/lib/permissions"
import { listPermissionGroups } from "@/service/permissions"
import { loadErrorMessage } from "@/service/core-api"

export default async function PermissionsPage() {
  let groups: PermissionGroup[] = []
  let loadError: string | undefined

  try {
    groups = await listPermissionGroups()
  } catch (error) {
    loadError = loadErrorMessage(error, "identity")
  }

  return <PermissionsCrud groups={groups} loadError={loadError} />
}
