"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { CompaniesCrud } from "@/components/companies/companies-crud"
import type { Company } from "@/types/companies"
import { listCompanies } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setCompanies(await listCompanies())
      setLoadError(undefined)
    } catch (error) {
      setCompanies([])
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
        <span className="sr-only">Đang tải nhà xe...</span>
      </div>
    )
  }

  return (
    <CompaniesCrud
      companies={companies}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
