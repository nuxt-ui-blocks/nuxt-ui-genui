export type ChatStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; ui: string; meta: { mode: 'chat'; model: string; validated: true } }
  | { type: 'error'; issues: string[]; reason: 'boundary' | 'provider' | 'config' }

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function parseFrame(frame: string): ChatStreamEvent | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null
  const data = JSON.parse(dataLines.join('\n')) as Record<string, any>
  if (event === 'chunk') return { type: 'chunk', text: String(data.text ?? '') }
  if (event === 'done') {
    return { type: 'done', ui: String(data.ui ?? ''), meta: data.meta }
  }
  if (event === 'error') {
    return {
      type: 'error',
      issues: Array.isArray(data.issues) ? data.issues : ['Unknown error.'],
      reason: (data.reason as 'boundary' | 'provider' | 'config') ?? 'provider'
    }
  }
  return null
}

export async function streamChat(
  body: { messages: ChatMessage[] },
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  const response = await fetch('/api/genui/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify(body)
  })

  if (!response.ok || !response.body) {
    let detail: string | undefined
    try {
      const data = (await response.json()) as {
        statusMessage?: string
        message?: string
        data?: { error?: string; issues?: string[] }
      }
      detail =
        data?.data?.error ??
        data?.data?.issues?.join('\n') ??
        data?.statusMessage ??
        data?.message
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail ?? `Request failed with status ${response.status}.`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx = buffer.indexOf('\n\n')
    while (idx !== -1) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const parsed = parseFrame(frame)
      if (parsed) onEvent(parsed)
      idx = buffer.indexOf('\n\n')
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    const parsed = parseFrame(buffer)
    if (parsed) onEvent(parsed)
  }
}
