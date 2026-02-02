export interface CreateWebhookForm {
  event: string
  target_url: string
  enabled: boolean
}

export interface TestResult {
  webhookId: string
  success: boolean
  message: string
}
