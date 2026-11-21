import { promises as fs } from 'node:fs'
import path from 'node:path'
import { z } from 'zod/v4'

export const operationSchema = z.object({
  formId: z.string().min(1).max(200),
  values: z.record(z.string(), z.unknown())
})
export type GenUIOperationInput = z.infer<typeof operationSchema>

export interface AuditEvent extends GenUIOperationInput {
  ts: number
}

const auditFile = () => path.join(process.cwd(), '.data', 'audit.jsonl')

export async function recordOperation(input: GenUIOperationInput, file = auditFile()): Promise<AuditEvent> {
  const event: AuditEvent = { ts: Date.now(), formId: input.formId, values: input.values }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.appendFile(file, JSON.stringify(event) + '\n', 'utf8')
  return event
}

export async function listOperations(limit = 50, file = auditFile()): Promise<AuditEvent[]> {
  let raw: string
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch {
    return []
  }
  const events: AuditEvent[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const parsed = operationSchema.extend({ ts: z.number() }).parse(JSON.parse(trimmed))
      events.push(parsed as AuditEvent)
    } catch {
      /* a corrupt line never breaks the audit feed */
    }
  }
  return events.slice(-limit).reverse()
}
