export type ResponseMeta = {
  request_id: string
  latency_ms: number
  endpoint: string
  timestamp: string
}

/** Every core-service response: `data` on success, `error` on failure. */
export type ApiEnvelope<T> = {
  success: boolean
  data: T
  meta: ResponseMeta
}

export type ApiErrorResponse = {
  success: false
  error: {
    /** e.g. "NOT_FOUND", "VALIDATION_FAILED"; the HTTP status carries the number. */
    code: string
    message: string
  }
}
