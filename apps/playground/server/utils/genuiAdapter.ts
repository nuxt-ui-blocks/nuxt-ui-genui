import { z } from 'zod/v4'
import { SalesDashboardSchema, componentSpecs } from 'nuxt-ui-genui-core'
import type { GenUIAdapterInput, GenUIAdapterMessage } from 'nuxt-ui-genui-core'

export const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1)
      })
    )
    .min(1)
})

export class AdapterConfigError extends Error {}

export function buildSystemPrompt(): string {
  const shape = Object.entries(SalesDashboardSchema.shape)
    .map(([key, value]) => `- ${key}: ${(value as z.ZodTypeAny).description ?? '(no description)'}`)
    .join('\n')

  return [
    `You generate OpenUI Lang for the following registered components only:`,
    ...componentSpecs.map((spec) => `- ${spec.name}: ${spec.description}`),
    ``,
    `Emit EXACTLY one line and nothing else. No prose before or after. No code fences.`,
    `Your reply MUST begin with the literal characters "root = ". Never omit the "root = " prefix.`,
    `Shape: root = SalesDashboard("<title>", "<description>", [<metrics>], [<orders>])`,
    `Arguments are positional JSON values in this EXACT Zod property order:`,
    shape,
    `metrics: at most 4 entries of { "label": string, "value": string, "change"?: string, "trend"?: "up" | "down" | "neutral" }.`,
    `orders: at most 8 entries of { "id": string, "customer": string, "total": string, "status": "Completed" | "Pending" | "Cancelled" }.`,
    `Use realistic business data. Do not include markdown. Do not reference any other component.`
  ].join('\n')
}

export function extractUi(text: string): string {
  const trimmed = text.trim()
  const fence = trimmed.match(/^```(?:\w+)?\n([\s\S]*?)\n```$/)
  return (fence?.[1] ?? trimmed).trim()
}

export function splitPositionalArgs(source: string): string[] {
  const match = source.match(/^root\s*=\s*SalesDashboard\s*\(([\s\S]*)\)\s*$/)
  if (!match) {
    throw new Error('Output must be a single `root = SalesDashboard(...)` statement.')
  }

  const args: string[] = []
  let depth = 0
  let inString = false
  let escaped = false
  let current = ''

  for (const ch of match[1] ?? '') {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }
    if (inString) {
      current += ch
      if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      current += ch
      continue
    }
    if (ch === '[' || ch === '{') {
      depth += 1
      current += ch
      continue
    }
    if (ch === ']' || ch === '}') {
      depth -= 1
      current += ch
      continue
    }
    if (ch === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) args.push(current.trim())
  return args
}

export type ValidateResult = { ok: true; ui: string } | { ok: false; issues: string[] }

export function validateUi(text: string): ValidateResult {
  try {
    const ui = extractUi(text)
    const args = splitPositionalArgs(ui)
    if (args.length !== 4) {
      return {
        ok: false,
        issues: [`Expected exactly 4 positional arguments (title, description, metrics, orders), got ${args.length}.`]
      }
    }
    const assembled = {
      title: JSON.parse(args[0]!) as unknown,
      description: JSON.parse(args[1]!) as unknown,
      metrics: JSON.parse(args[2]!) as unknown,
      orders: JSON.parse(args[3]!) as unknown
    }
    const parsed = SalesDashboardSchema.safeParse(assembled)
    if (!parsed.success) {
      return {
        ok: false,
        issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      }
    }
    return { ok: true, ui }
  } catch (error) {
    return { ok: false, issues: [error instanceof Error ? error.message : String(error)] }
  }
}

export type GenUiModel = (input: {
  system: string
  messages: GenUIAdapterMessage[]
}) => Promise<{ text: string }>

export type ChatAdapterResult =
  | { ok: true; ui: string; meta: { mode: 'chat'; model: string; validated: true } }
  | { ok: false; issues: string[] }

export async function generateUi(
  input: GenUIAdapterInput,
  model?: GenUiModel
): Promise<ChatAdapterResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const modelName = process.env.OPENAI_MODEL
  if (!apiKey || !modelName) {
    throw new AdapterConfigError(
      'OPENAI_API_KEY and OPENAI_MODEL must be set (see .env.example). No default model is provided.'
    )
  }

  const run: GenUiModel =
    model ??
    (async ({ system, messages }) => {
      const [{ generateText }, { openai }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/openai')
      ])
      const result = await generateText({
        model: openai(modelName),
        system,
        messages
      })
      return { text: result.text }
    })

  const { text } = await run({ system: buildSystemPrompt(), messages: input.messages })
  const validated = validateUi(text)

  return validated.ok
    ? { ok: true, ui: validated.ui, meta: { mode: 'chat', model: modelName, validated: true } }
    : { ok: false, issues: validated.issues }
}
