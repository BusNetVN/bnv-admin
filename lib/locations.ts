export function locationAddress(
  detail: string,
  wardName?: string | null,
  provinceName?: string | null
) {
  return [detail.trim(), wardName?.trim(), provinceName?.trim()]
    .filter(Boolean)
    .join(", ")
}
