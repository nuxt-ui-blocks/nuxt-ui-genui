# Architecture review fixes

## Goal

Harden the existing provider-neutral architecture without replacing it: make
stream parsing interoperable, protect generic server handlers from abusive
input, avoid leaking tool failures, and make custom component selection match
its documented API.

## Tasks

- [x] **1. Establish the contracts and baseline**  
  Confirm the public behavior for SSE events, request limits, tool errors, and
  custom component selection. Record current targeted test results before
  editing. Keep authentication, authorization, and rate limiting as host
  responsibilities; this plan only adds reusable validation and safety hooks.

- [x] **2. Replace the line-based SSE parser**  
  Update `packages/core/src/stream.ts` to parse complete SSE events: support
  optional whitespace, multiple `data:` lines joined with `\n`, blank-line
  termination, comments/other fields, `[DONE]`, and a final unterminated event.
  Preserve both plain and detailed chunk APIs and existing delta/snapshot
  behavior. Add tests in `packages/core/test/stream.test.ts` for multiline,
  whitespace-prefixed, split-chunk, comments, and `[DONE]` events.

- [x] **3. Add configurable request and message limits**  
  Extend the shared server HTTP parsing path and
  `createGenUIChatHandler`/`createGenUIToolHandler` with configurable limits
  for body bytes, message count, message characters, and tool argument size.
  Reject oversized payloads with a stable `413` response, malformed payloads
  with `400`, and avoid buffering beyond the configured maximum. Preserve
  `Request.signal` forwarding. Document that auth, authorization, rate
  limiting, and endpoint method routing remain host-owned. Add tests for
  content-length and streamed oversized bodies, oversized messages, and normal
  requests.

- [x] **4. Make tool failures safe by default**  
  Change `packages/server/src/tool-handler.ts` to log or expose an
  application-supplied error identifier while returning a generic client
  message. Add an optional safe error mapper for expected domain errors.
  Keep unknown tools rejected and preserve executor abort signals. Update
  tests so raw exception text is not returned by default, while mapped
  user-safe errors remain supported. Document that argument validation can be
  supplied per tool and is not replaced by the name allowlist.

- [x] **5. Fix custom component selection semantics**  
  Update `packages/components/src/index.ts` so `components` can select names
  from `extraComponents` as documented without adding the same definition
  twice. Deduplicate the final definition list by component name while still
  rejecting genuinely conflicting definitions. Align the TypeScript type with
  the runtime contract, preserve Card child union/key order, and add tests for
  selecting a custom component, renderer attachment, duplicate custom names,
  and the existing append behavior.

- [x] **6. Verify and document the hardening**  
  Run targeted core, server, and components tests; rebuild packages before
  Nuxt tests; then run `pnpm build`, `pnpm typecheck`, and `pnpm test`
  sequentially with `OPENUI_TELEMETRY_DISABLED=1`. Run a playground
  production smoke test for plain text, SSE, mock/live chat, and a custom
  component. Update package READMEs with limits/error behavior and record any
  intentionally host-owned security controls.

## Done when

- [x] Valid SSE streams are parsed without dropped or reordered OpenUI text.
- [x] Publicly exposed handlers can enforce bounded request and prompt sizes.
- [x] Tool exceptions do not leak raw internal messages by default.
- [x] Selecting an extra component by name works exactly once.
- [x] Targeted and root verification commands complete successfully.

## Scope notes

- Do not introduce a new runtime or replace the current package boundaries.
- Do not couple `core` or `server` to Vue, Nuxt, or an AI SDK.
- Keep provider-specific adapters optional, following the existing OpenUI-style
  separation.
