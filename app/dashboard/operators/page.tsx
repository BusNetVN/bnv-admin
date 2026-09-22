import { OperatorsCrud } from "@/components/operators/operators-crud"
import { listCompanies } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"

export default async function OperatorsPage() {
  try {
    const companies = await listCompanies()
    return <OperatorsCrud companies={companies} />
  } catch (error) {
    return (
      <OperatorsCrud
        companies={[]}
        loadError={loadErrorMessage(error, "core")}
      />
    )
  }
}
