"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { PointsCrud } from "@/components/points/points-crud"
import type { Province } from "@/types/locations"
import type { Company } from "@/types/companies"
import type { Point } from "@/types/points"
import { loadErrorMessage } from "@/service/core-api"
import { listCompanies } from "@/service/companies"
import { listProvinces } from "@/service/locations"
import { listSharedPoints } from "@/service/points"

export default function PointsPage() {
  const [points, setPoints] = useState<Point[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [loadedProvinces, loadedCompanies] = await Promise.all([
        listProvinces(),
        listCompanies(),
      ])
      setProvinces(loadedProvinces)
      setCompanies(loadedCompanies)
      setLoadError(undefined)
    } catch (error) {
      setProvinces([])
      setCompanies([])
      setPoints([])
      setLoadError(loadErrorMessage(error))
      setLoading(false)
      return
    }

    try {
      setPoints(await listSharedPoints())
    } catch (error) {
      setPoints([])
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
        <span className="sr-only">Đang tải điểm dừng...</span>
      </div>
    )
  }

  return (
    <PointsCrud
      points={points}
      provinces={provinces}
      companies={companies}
      loadError={loadError}
      onRefresh={loadData}
    />
  )
}
