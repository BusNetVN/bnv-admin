"use client"

import { use, useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { RoutesCrud } from "@/components/routes/routes-crud"
import type { Company } from "@/types/companies"
import type { Route } from "@/types/routes"
import { getCompany } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"
import { listRoutes } from "@/service/routes"

export default function CompanyRoutesPage({
  params,
}: PageProps<"/dashboard/companies/[companyId]/routes">) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<Company>()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [loadedCompany, loadedRoutes] = await Promise.all([
        getCompany(companyId),
        listRoutes({ companyUuid: companyId }),
      ])
      setCompany(loadedCompany)
      setRoutes(loadedRoutes)
      setLoadError(undefined)
    } catch (error) {
      setCompany(undefined)
      setRoutes([])
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
        <span className="sr-only">Đang tải tuyến xe...</span>
      </div>
    )
  }

  return (
    <RoutesCrud
      company={company}
      routes={routes}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
