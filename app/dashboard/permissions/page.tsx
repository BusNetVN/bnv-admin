"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { PermissionsCrud } from "@/components/permissions/permissions-crud"
import type { PermissionGroup } from "@/types/permissions"
import { listPermissionGroups } from "@/service/permissions"
import { loadErrorMessage } from "@/service/core-api"

export default function PermissionsPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setGroups(await listPermissionGroups())
      setLoadError(undefined)
    } catch (error) {
      setGroups([])
      setLoadError(loadErrorMessage(error))
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
        <span className="sr-only">Đang tải chức năng...</span>
      </div>
    )
  }

  return (
    <PermissionsCrud
      groups={groups}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
