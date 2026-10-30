"use client"

import { use, useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { OfficesCrud } from "@/components/offices/offices-crud"
import type { Company } from "@/types/companies"
import type { Office } from "@/types/offices"
import { getCompany } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"
import { listOffices } from "@/service/offices"

export default function CompanyOfficesPage({
  params,
}: PageProps<"/dashboard/companies/[companyId]/offices">) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<Company>()
  const [offices, setOffices] = useState<Office[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [loadedCompany, loadedOffices] = await Promise.all([
        getCompany(companyId),
        listOffices({ companyUuid: companyId }),
      ])
      setCompany(loadedCompany)
      setOffices(loadedOffices)
      setLoadError(undefined)
    } catch (error) {
      setCompany(undefined)
      setOffices([])
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
        <span className="sr-only">Đang tải văn phòng...</span>
      </div>
    )
  }

  return (
    <OfficesCrud
      company={company}
      offices={offices}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
