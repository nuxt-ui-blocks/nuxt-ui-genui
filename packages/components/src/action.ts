import { z } from 'zod/v4'
import { BuiltinActionType } from '@openuidev/lang-core'

const continueConversationAction = z.object({
  type: z.literal(BuiltinActionType.ContinueConversation),
  context: z.string().optional()
})
const openUrlAction = z.object({
  type: z.literal(BuiltinActionType.OpenUrl),
  url: z.string()
})
const customAction = z.object({
  // Built-in types must satisfy their own schema (e.g. open_url needs a url), so the
  // catch-all branch refuses them. Without this the union accepted `{ type: 'open_url' }`
  // with no url and the builtin branches could never reject anything.
  type: z.string().refine(
    (t) => t !== BuiltinActionType.OpenUrl && t !== BuiltinActionType.ContinueConversation,
    { message: 'Builtin action types must match their own schema (open_url requires a url).' }
  ),
  params: z.record(z.string(), z.any()).optional()
})

// `Action([...])` in a program is a Lang AST expression; the runtime evaluates it
// to `{ steps: [...] }` (e.g. `@Set($x, y)`, `@Run(q)`, `@ToAssistant("msg")`) before
// it reaches a component. The host SFC must pass the plan through to
// `useTriggerAction` (vue-lang executes it), so the schema must accept it.
const actionPlan = z.object({
  steps: z.array(z.unknown())
})

export const actionSchema = z.union([openUrlAction, continueConversationAction, customAction, actionPlan]).optional()
export type GenUIAction = z.infer<typeof actionSchema>
