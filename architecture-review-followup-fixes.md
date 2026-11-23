# Architecture review follow-up fixes

## Goal

Correct the remaining edge cases identified in commit `7bfd078`: enforce tool
argument limits in actual bytes, support all SSE line terminators, and keep
tool error hooks from breaking responses.

## Tasks

- [x] **1. Fix tool argument byte accounting**  
  Update `packages/server/src/tool-handler.ts` to measure serialized arguments
  with UTF-8 byte length (`TextEncoder`), while preserving the existing 413
  response. Add a Unicode regression test in
  `packages/server/test/tool-handler.test.ts`.

- [x] **2. Support all SSE line endings**  
  Update `packages/core/src/stream.ts` line buffering to recognize LF, CRLF,
  and standalone CR terminators without breaking chunk boundaries, final
  unterminated events, comments, or `[DONE]`. Add standalone-CR tests in
  `packages/core/test/stream.test.ts`.

- [x] **3. Isolate tool error hook failures**  
  Update `packages/server/src/tool-handler.ts` so exceptions from `mapError`
  fall back to the generic 500 response, and exceptions from
  `onUnexpectedError` do not prevent that response. Add regression tests for
  both callbacks throwing.

- [x] **4. Verify the fixes**  
  Run targeted core and server tests, then run:
  `OPENUI_TELEMETRY_DISABLED=1 pnpm build`,
  `OPENUI_TELEMETRY_DISABLED=1 pnpm typecheck`, and
  `OPENUI_TELEMETRY_DISABLED=1 pnpm test`.

## Done when

- [x] `maxArgsBytes` measures UTF-8 bytes.
- [x] SSE parsing handles LF, CRLF, and CR streams.
- [x] Tool error hooks cannot cause the handler to reject unexpectedly.
- [x] Regression tests cover all three fixes.
- [x] Build, typecheck, and the full test suite pass.
