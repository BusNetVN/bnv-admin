export type Province = {
  id: string
  code: string
  name: string
  type: string
  status: boolean
}

export type Ward = {
  id: string
  province_uuid: string | null
  province_code: string | null
  code: string
  name: string
  type: string
  status: boolean
}
