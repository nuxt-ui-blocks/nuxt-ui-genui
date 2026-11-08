export interface GenUIAdapterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
export interface GenUIAdapterInput {
  messages: GenUIAdapterMessage[]
}
export interface GenUIAdapterResult {
  ui: string
  meta?: Record<string, unknown>
}
export interface GenUIModelAdapter {
  generate(input: GenUIAdapterInput): Promise<GenUIAdapterResult>
}
