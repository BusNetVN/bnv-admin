"use client"

import { use, useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { UsersCrud } from "@/components/users/users-crud"
import type { Company } from "@/types/companies"
import type { Role } from "@/types/roles"
import type { User } from "@/types/users"
import { getCompany } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"
import { listRoles } from "@/service/roles"
import { listUsers } from "@/service/users"

export default function CompanyUsersPage({
  params,
}: PageProps<"/dashboard/companies/[companyId]/users">) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<Company>()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [loadedCompany, loadedUsers, loadedRoles] = await Promise.all([
        getCompany(companyId),
        listUsers({ companyUuid: companyId }),
        listRoles({ companyUuid: companyId }),
      ])
      setCompany(loadedCompany)
      setUsers(loadedUsers)
      setRoles(loadedRoles)
      setLoadError(undefined)
    } catch (error) {
      setCompany(undefined)
      setUsers([])
      setRoles([])
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
        <span className="sr-only">Đang tải người dùng...</span>
      </div>
    )
  }

  return (
    <UsersCrud
      users={users}
      companies={company ? [company] : []}
      roles={roles}
      scope={{ company }}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
