"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { UsersCrud } from "@/components/users/users-crud"
import type { Company } from "@/types/companies"
import type { Role } from "@/types/roles"
import type { User } from "@/types/users"
import { listCompanies } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"
import { listRoles } from "@/service/roles"
import { listUsers } from "@/service/users"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setUsers(await listUsers())
      setLoadError(undefined)
    } catch (error) {
      setLoadError(loadErrorMessage(error))
    }

    try {
      setRoles(await listRoles())
    } catch {
      setRoles([])
    }

    try {
      setCompanies(await listCompanies())
    } catch {
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

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
      companies={companies}
      roles={roles}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
