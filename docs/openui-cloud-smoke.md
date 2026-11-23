# OpenUI Cloud smoke check (manual)

An optional, user-run manual check. It is not part of CI and requires a real user-created key.

1. **Create a key** with `npx @openuidev/cli@latest generate-api-key` or the [key console](https://console.thesys.dev/keys).
2. **Set `apps/playground/.env`** (gitignored; the key is never committed):

   ```bash
   GENAI_PROVIDER=openui-cloud
   THESYS_API_KEY=<your key>
   GENAI_MODEL=openai/gpt-5
   ```

   `GENAI_MODEL` is required for the cloud provider and uses `{provider}/{model}` ids. See the [OpenUI Cloud gateway model catalog](https://www.openui.com/cloud/gateway/models) for the current ids.
3. **Run `pnpm dev`** and confirm the badge in the Operations Center reads `openui cloud · <model>`.
4. **Send one prompt** and verify a streamed OpenUI program renders.

Notes:

- A missing `THESYS_API_KEY` or `GENAI_MODEL` answers with a 503 configuration error rather than streaming.
- No key value belongs in issues, transcripts, or tests.
- The playground chat route is a demo, not a production template — no auth, authorization, rate limiting, or production middleware.
