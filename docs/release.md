# Release: compatibility matrix and alpha checklist

This is an **alpha — not stable, not published**. `@nuxt-ui-genui/*` 0.1.0 is the first public-facing version; the API is unstable and the packages are not on npm yet.

## Compatibility matrix

| Dependency | Minimum | Verified by |
| --- | --- | --- |
| Node.js | >=20.19 | CI matrix (20.19.0, 22.x); verified locally on the same ranges. |
| pnpm | 9+ | Lockfile `pnpm-lock.yaml` is version 9.0; CI pins pnpm@9. |
| Nuxt | >=4.1 | Peer floors: `@nuxt-ui-genui/components` and `@nuxt-ui-genui/nuxt` declare `nuxt >=4.1.0`. |
| Nuxt UI | >=4.12 | Peer floor: `@nuxt-ui-genui/components` declares `@nuxt/ui >=4.12.0`; all development runs `@nuxt/ui@4.12.0`. |
| Vue | >=3.5 | `vue` peer is `>=3.5.0` in `@nuxt-ui-genui/{components,nuxt,chat,ai-sdk,chat-ui}`; development runs 3.5.45. |
| `@openuidev/lang-core` | ^0.4.1 | Installed 0.4.1; in `dependencies` of all packages. |
| `@openuidev/vue-lang` | ^0.4.2 | Installed 0.4.2; pre-1.0 renderer — see SSR limitation. |
| Zod | 4 (`^4.0.0`) | Installed 4.6.7. |

### Peer ranges as declared

| Package | nuxt | @nuxt/ui | vue |
| --- | --- | --- | --- |
| `@nuxt-ui-genui/components` | >=4.1.0 | >=4.12.0 | >=3.5.0 |
| `@nuxt-ui-genui/nuxt` | >=4.1.0 | – | >=3.5.0 |
| `@nuxt-ui-genui/chat-ui` | – | >=4.0.0 (not yet narrowed) | >=3.5.0 |
| `@nuxt-ui-genui/chat`, `@nuxt-ui-genui/ai-sdk` | – | – | >=3.5.0 |
| `@nuxt-ui-genui/core`, `@nuxt-ui-genui/server` | – | – | – |

## SSR limitation

The Vue OpenUI renderer is pre-1.0 and renders an empty wrapper under `renderToString` — it mounts only client-side. The playground is configured `ssr: false` for this reason; hosts must keep `ssr: false` until SSR is verified upstream.

## Provider verification status

- **Generic OpenAI-compatible gateway: verified.** The default local gateway (`http://127.0.0.1:8317/v1`, with `GENAI_BASE_URL`/`GENAI_API_KEY`) is verified: dev and prod servers answer 200 and a real streaming run renders the full card with no reload.
- **OpenUI Cloud: documented, not verified.** The OpenUI Cloud path (`GENAI_PROVIDER=openui-cloud`; gateway base URL `https://api.thesys.dev/v1/embed`, endpoint `POST .../chat/completions`) has **not** been exercised against the live gateway during this alpha: no live cloud request was made and no key value is stored in any repo file. The manual smoke procedure is documented in [docs/openui-cloud-smoke.md](docs/openui-cloud-smoke.md) and is the only sanctioned cloud check before release.
- No hosted provider is claimed as tested.

## Alpha release checklist (in order)

1. Bump `version` in all seven `packages/*/package.json` (currently 0.1.0).
2. Add the release entry to the changelog (create or update a root `CHANGELOG.md`; no changelog file exists yet).
3. `pnpm build` — exit 0.
4. `pnpm verify:release` — `build + verify:packages + verify:consumer`; all steps must exit 0.
5. Mock-mode smoke: start the playground with `GENAI_MOCK=1` (e.g. `GENAI_MOCK=1 OPENUI_TELEMETRY_DISABLED=1 pnpm dev`) — the Operations Center badge reads `mock · deterministic` and one prompt streams a program.
6. Manual cloud smoke: per [docs/openui-cloud-smoke.md](docs/openui-cloud-smoke.md) — user creates the key, sets `apps/playground/.env` (gitignored; key never committed), runs `pnpm dev`, the badge reads `openui cloud · <model>`, and one prompt renders a streamed program. Optional but required before an OpenUI Cloud release claim.
7. Obtain **explicit approval** from the team before publishing.
8. Tag the release as `alpha` (e.g. `git tag alpha` on the release commit) and, if approved, publish with `npm publish --tag alpha` for the seven packages.

## Rollback notes

Nothing is published by default: the checklist ends at the `alpha` tag; publishing is a separate approval-gated step. To roll back an unpublished alpha:

- Revert the version bumps and changelog entry (`git revert` the release commit).
- Restore the lockfile if it changed: `git checkout -- pnpm-lock.yaml`, then `pnpm install`.

To roll back an accidentally published package: unpublish via npm within the unpublish window and delete the local `alpha` tags. All release changes are local commits — nothing was pushed, merged, or published without explicit approval.

## Reminder

**No push, publish, or live OpenUI Cloud request happens without explicit user approval.** This document is a release checklist, not a license to publish.
