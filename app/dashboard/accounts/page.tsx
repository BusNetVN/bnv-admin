import { AccountsCrud } from "@/components/accounts/accounts-crud"
import type { Account } from "@/lib/accounts"
import type { Operator } from "@/lib/operators"
import { listAccounts } from "@/service/accounts"
import { listCompanies } from "@/service/companies"
import { loadErrorMessage } from "@/service/core-api"

export default async function AccountsPage() {
  let accounts: Account[] = []
  let companies: Operator[] = []
  let loadError: string | undefined

  try {
    accounts = await listAccounts()
  } catch (error) {
    loadError = loadErrorMessage(error, "identity")
  }

  try {
    companies = await listCompanies()
  } catch {
    companies = []
  }

  return (
    <AccountsCrud
      accounts={accounts}
      companies={companies}
      loadError={loadError}
    />
  )
}
