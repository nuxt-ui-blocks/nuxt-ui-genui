# OpenUI Cloud demo integration and release hardening

## Intent

Make the playground prove that this Nuxt GenUI package can work with OpenUI
Cloud, without turning OpenUI Cloud into a required runtime dependency or
changing the provider-neutral package contracts. At the same time, add the
minimum release checks needed before publishing an alpha package.

The demo should make provider choice explicit:

- `GENAI_PROVIDER=mock` for deterministic, offline development and CI.
- `GENAI_PROVIDER=openai-compatible` for the existing generic live gateway.
- `GENAI_PROVIDER=openui-cloud` for the opt-in OpenUI Cloud path.

The existing mock and generic gateway behavior must remain unchanged.

## Goals

- Add an OpenUI Cloud provider path to `apps/playground` only.
- Keep `THESYS_API_KEY` server-only; never expose it through client runtime
  config, rendered HTML, logs, or API responses.
- Reuse the existing plain OpenUI Lang and optional AI SDK adapter boundaries.
- Support both the playground's plain-text response and AI SDK UI-message
  stream negotiation where the current route supports both.
- Add mocked provider-contract tests that run without credentials.
- Add a documented, manually-run live smoke procedure for OpenUI Cloud.
- Add release validation for package builds, package metadata, and clean
  consumer installation before publishing.
- Keep the project positioned as a focused Nuxt integration, not as parity with
  the entire OpenUI monorepo or the turnkey shadcn example.

## Non-goals

- Do not add OpenUI Cloud to `@nuxt-ui-genui/core`, `server`, `chat`, or
  `components`.
- Do not make OpenUI Cloud a dependency of published packages.
- Do not replace the existing generic OpenAI-compatible provider.
- Do not add provider-specific authentication, persistence, rate limiting, or
  authorization to the reusable server helpers.
- Do not claim SSR support; the playground remains client-rendered until the
  upstream Vue renderer supports useful SSR output.
- Do not build the shadcn example's backend tool loop, thread persistence,
  observability system, or full application shell.
- Do not run live cloud requests in ordinary CI.

## Constraints

- Nuxt 4 and Nuxt UI 4 remain the supported application target.
- `@openuidev/vue-lang` remains behind the project's adapter/public APIs.
- Core/server package boundaries remain provider-neutral and free of Vue SFC
  imports and AI SDK imports.
- The cloud credential is supplied by the user in a server environment as
  `THESYS_API_KEY`; the agent must not handle or print the value.
- OpenUI Cloud API details must be confirmed against current official
  documentation and the installed SDK/types before implementation.
- Existing `GENAI_*` environment resolution remains playground-local.
- The public release remains alpha/preview until clean-consumer validation and
  provider verification are complete.

## Approaches considered

### A. Selectable playground backend — chosen

Route provider selection through a playground-local resolver. The default
remains the current behavior, while `GENAI_PROVIDER=openui-cloud` selects a
server-only cloud adapter. The adapter returns the same normalized output
shapes used by the route, so the client and package contracts do not change.

This gives users one demo for comparing providers, keeps CI deterministic, and
limits cloud-specific code to the application boundary.

### B. Replace the generic provider with OpenUI Cloud

Rejected. It would make the demo key-dependent, weaken provider neutrality,
and make local reproduction harder without improving the reusable packages.

### C. Add a separate cloud example application

Deferred. A second app would duplicate the current chat/rendering path before
there is evidence that OpenUI Cloud requires materially different UI or
orchestration. The selectable backend can expose such differences first.

## Chosen design

### Provider routing

Create a playground-local provider resolver under
`apps/playground/server/utils/` (exact file names to be determined during
planning). It will:

1. Resolve `GENAI_PROVIDER`, with the current behavior preserved when the
   variable is absent.
2. Route `mock` to the existing deterministic programs.
3. Route `openai-compatible` to the current injected base URL/model/key path.
4. Route `openui-cloud` to a small server-only adapter using the current
   OpenUI Cloud-supported request/response contract.
5. Return a clear configuration error for an unknown provider or a missing
   cloud credential.

Provider selection must not be accepted from an untrusted client query or
request body. It is deployment configuration, not a user-controlled model
capability.

### Secret handling

`THESYS_API_KEY` is read only in Nitro server code. It must not be placed in
`runtimeConfig.public`, imported by client code, or included in diagnostics.
Missing credentials produce a clear server-side configuration response without
revealing secret names beyond the documented configuration guidance.

The live smoke procedure will use a locally supplied environment variable or
untracked `.env` file. No credential is committed, echoed, or pasted into
tests.

### Response contract

The cloud adapter will normalize its output into the existing playground
route's plain OpenUI Lang text path and, where applicable, its AI SDK
UI-message stream path. The client-facing chat protocol and component
allowlist remain unchanged.

If the cloud API exposes a feature not represented by the current route, the
implementation will fail clearly rather than silently downgrade or fabricate
support.

### Tests

Credential-free tests will cover:

- provider selection and default preservation;
- unknown-provider and missing-credential errors;
- mocked OpenUI Cloud request construction without logging the key;
- successful normalization of a mocked cloud response into OpenUI text;
- both route response formats, if the cloud adapter participates in both;
- no client/public bundle access to `THESYS_API_KEY`.

The live smoke will be separate from CI and will verify a real cloud request,
an OpenUI program response, and rendering in the built playground. It will be
documented as optional and will not be represented as an always-green test.

### Release hardening

Before publishing an alpha package, add or document:

- CI for build, typecheck, and tests on supported Node/pnpm versions;
- package tarball/clean-consumer validation for every publishable package;
- a compatibility matrix for Nuxt, Nuxt UI, Vue, OpenUI Lang, Node, and pnpm;
- a release checklist covering versioning, changelog, generated `dist`, and
  smoke verification;
- explicit demo-only wording for the playground route's missing auth,
  rate-limit, and production middleware concerns.

These checks are release infrastructure and documentation; they do not move
host-owned security responsibilities into the reusable handlers.

## Open questions for implementation

- Confirm the current OpenUI Cloud endpoint, request format, response format,
  and supported streaming negotiation from official documentation before
  coding.
- Confirm whether the existing `@openuidev/ai-sdk` adapter can represent the
  cloud response directly or whether a playground-only HTTP adapter is needed.
- Decide the exact precedence when legacy `GENAI_LIVE` and the new
  `GENAI_PROVIDER` are both set; the plan should preserve backward
  compatibility and document the result.

## Acceptance criteria

- The playground continues to work offline with `GENAI_PROVIDER=mock`.
- The existing generic live path still works unchanged.
- `GENAI_PROVIDER=openui-cloud` uses a server-only `THESYS_API_KEY` and
  successfully renders a real cloud-generated OpenUI program during the
  optional manual smoke.
- Automated tests pass without cloud credentials.
- Build, typecheck, package validation, and the documented release checklist
  are green before publishing.
- No core package gains a cloud-specific dependency or provider-specific
  contract.
