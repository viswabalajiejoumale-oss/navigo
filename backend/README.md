Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Set environment variables:

- `DIALOGFLOW_PROJECT_ID` — your Dialogflow project ID
- `GOOGLE_APPLICATION_CREDENTIALS` — path to service account JSON with Dialogflow permissions
- `OPENROUTER_API_KEY` — your OpenRouter API key
- `OPENROUTER_MODEL` — optional, defaults to `openrouter/auto`
- `TTS_PROVIDER` — optional, set to `voicerss` for external TTS
- `VOICERSS_API_KEY` — optional, required if `TTS_PROVIDER=voicerss`

3. Start server:

```bash
npm start
```

Endpoints

- `POST /dialogflow` { text, sessionId? } -> { response, intent }
- `POST /login` { username, password } -> { id, username, token }
- `POST /assistant` { text, language?, userProfile?, currentTransportMode?, expenses?, appContext? } -> { response, configured }
- `POST /tts` { text, language? } -> audio/mpeg (when configured)

Notes

- This demo server stores users in memory; use a proper database and secure auth for production.
- The `/dialogflow` proxy expects server-side credentials; do not expose service account on the client.
