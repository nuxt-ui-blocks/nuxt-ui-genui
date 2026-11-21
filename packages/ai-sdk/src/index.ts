import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, simulateReadableStream, stepCountIs, streamText } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import type { UIMessage } from 'ai'

/**
 * Fully injected live options. The adapter never reads `process.env`: the host
 * resolves its own env (the playground uses `apps/playground/server/utils/genai.ts`)
 * and passes the result here.
 */
export interface GenUILiveOptions {
  /** Generic OpenAI-compatible endpoint + key. Anything hosted is NOT verified by this library. */
  apiKey: string
  baseURL?: string
  model: string
}

export interface StreamGenUIOptions {
  /** System prompt generated from the serialized library spec (never hand-written). */
  systemPrompt: string
  /** Raw UIMessage[] payload from the client. */
  messages: UIMessage[]
  /**
   * When present, the live provider path is used (opt-in; never verified against a hosted provider
   * by this library's own CI). When absent, `mockProgram` streams through the same streamText path —
   * the deterministic demo, clearly not AI.
   */
  live?: GenUILiveOptions
  /**
   * The OpenUI Lang program text the mock path streams token-by-token.
   *
   * The mock path is **stateless**: it streams this text verbatim and never looks at
   * `messages`, so the output does not depend on the conversation. Hosts that want a
   * prompt-dependent demo pick the program themselves (the playground matches the last
   * user message with `pickProgram`) before calling `streamGenUI`.
   */
  mockProgram?: string
  /** Live-path tool-step cap; demo path always uses stepCountIs(1). */
  stopAfter?: number
}

/**
 * Stream errors must not leak upstream provider details (endpoint, model, key hints)
 * into the browser. The real error is logged server-side; the client gets a generic
 * message it can show.
 */
const streamOnError = (e: unknown) => {
  console.error('[genui] model stream failed', e)
  return 'The model request failed. Check the server logs for details.'
}

/**
 * Shared Vercel AI SDK → UI-message-stream wiring. Both the playground and consumers of this
 * package use this one path so the deterministic demo and the live path cannot drift apart.
 * Returns the same Response type `streamText` produces for `toUIMessageStreamResponse`.
 */
export async function streamGenUI(options: StreamGenUIOptions) {
  const { systemPrompt, messages, live, mockProgram, stopAfter = 5 } = options
  const converted = await convertToModelMessages(messages)

  if (live) {
    const openai = createOpenAI({ apiKey: live.apiKey, baseURL: live.baseURL })
    const result = streamText({
      model: openai.chat(live.model),
      system: systemPrompt,
      messages: converted,
      stopWhen: stepCountIs(stopAfter),
      temperature: 0
    })
    return result.toUIMessageStreamResponse({ onError: streamOnError })
  }

  const result = streamText({
    model: createMockModel(mockProgram ?? ''),
    system: systemPrompt,
    messages: converted,
    stopWhen: stepCountIs(1)
  })
  return result.toUIMessageStreamResponse({ onError: streamOnError })
}

/**
 * Stream the same program as **plain text** instead of the AI SDK's UI-message-stream
 * protocol.
 *
 * This is the format the framework's own chat client speaks, and the one every
 * other agent backend can produce (LangGraph, Google ADK, Mastra, AG-UI, ...).
 * A host that wants the AI SDK protocol keeps using `streamGenUI`.
 */
export async function streamGenUIText(options: StreamGenUIOptions) {
  const { systemPrompt, messages, live, mockProgram, stopAfter = 5 } = options
  const converted = await convertToModelMessages(messages)

  if (live) {
    const openai = createOpenAI({ apiKey: live.apiKey, baseURL: live.baseURL })
    const result = streamText({
      model: openai.chat(live.model),
      system: systemPrompt,
      messages: converted,
      stopWhen: stepCountIs(stopAfter),
      temperature: 0
    })
    return result.toTextStreamResponse()
  }

  const result = streamText({
    model: createMockModel(mockProgram ?? ''),
    system: systemPrompt,
    messages: converted,
    stopWhen: stepCountIs(1)
  })
  return result.toTextStreamResponse()
}

/** The deterministic model: streams `program` verbatim, line by line. */
function createMockModel(program: string) {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 'txt' },
          ...program.split('\n').map((l) => ({ type: 'text-delta' as const, id: 'txt', delta: l + '\n' })),
          { type: 'text-end', id: 'txt' },
          { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage: {
              inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 0, text: 0, reasoning: undefined } } }
        ]
      })
    })
  })
}

