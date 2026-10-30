export type ApiErrorResponse = {
  message?: string | string[]
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}
