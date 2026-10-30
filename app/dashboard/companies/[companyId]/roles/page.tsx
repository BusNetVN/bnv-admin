"use client"

import { use, useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { RolesCrud } from "@/components/roles/roles-crud"
import type { Company } from "@/types/companies"
import type { PermissionGroup } from "@/types/permissions"
import type { Role } from "@/types/roles"
import { getCompany } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"
import { listPermissionGroups } from "@/service/permissions"
import { listRoles } from "@/service/roles"

export default function CompanyRolesPage({
  params,
}: PageProps<"/dashboard/companies/[companyId]/roles">) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<Company>()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [loadedCompany, loadedRoles, loadedGroups] = await Promise.all([
        getCompany(companyId),
        listRoles({ companyUuid: companyId }),
        listPermissionGroups(),
      ])
      setCompany(loadedCompany)
      setRoles(loadedRoles)
      setPermissionGroups(loadedGroups)
      setLoadError(undefined)
    } catch (error) {
      setCompany(undefined)
      setRoles([])
      setPermissionGroups([])
      setLoadError(loadErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6" role="status">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Đang tải vai trò...</span>
      </div>
    )
  }

  return (
    <RolesCrud
      company={company}
      roles={roles}
      permissionGroups={permissionGroups}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
