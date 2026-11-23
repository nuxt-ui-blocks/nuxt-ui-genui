# Changelog

## 0.1.0-alpha.1 - 2026-11-22

First alpha release. API is unstable; publish under the `alpha` npm tag only.

### Features

- Selectable playground provider: `GENAI_PROVIDER=mock`, `GENAI_PROVIDER=openai-compatible`, or `GENAI_PROVIDER=openui-cloud`. Existing behavior when the variable is unset is unchanged.
- OpenUI Cloud mode uses the fixed Gateway base URL `https://api.thesys.dev/v1/embed`, requires `THESYS_API_KEY` on the server and an explicit `GENAI_MODEL`, and sends one `cloud: true` OpenUI system prompt per request.
- `/api/provider` reports the active provider and model without exposing credentials; the playground badge shows `openui cloud · <model>`.
- Package tarball and clean-consumer verification scripts, plus a GitHub Actions CI workflow that runs build, typecheck, tests, and release checks without secrets.
- `docs/release.md` compatibility matrix and alpha release checklist; `docs/openui-cloud-smoke.md` manual cloud procedure.

### Fixes

- Account for UTF-8 argument bytes and standalone CR when parsing streams.
- Ship `LICENSE` in all seven published tarballs and narrow the tested Nuxt/Nuxt UI peer floors in `components` and `nuxt`.

### Documentation

- Document provider selection, precedence, the demo-only warning, and the alpha/SSR limitations.
- Record the live OpenUI Cloud verification with `google/gemini-3.1-flash-lite-free` in the release notes.
