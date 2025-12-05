# TypeScript Collaborative Code Editor — Frontend

This folder contains the Angular frontend for the TypeScript Collaborative Code Editor (editor UI, CodeMirror 6 integration, and the Gemini AI service used for autocompletion).

This README focuses on how to configure and run the frontend application locally.

## Features

- Real-time collaborative editor built with CodeMirror 6 and Yjs (CRDT).
- Room-based collaboration (e.g. `/room/my-team-room`).
- AI-powered autocompletion via Gemini (configured in the environment file).
- Shared undo/redo and cursor awareness across connected clients.

## Requirements

- Node.js v18 or higher
- npm
- (Optional) `@angular/cli` if you prefer global `ng` usage

## Project layout (this folder)

- `frontend/` — Root for the frontend workspace.
  - `frontend/` — The actual Angular app (source, assets, env files).
  - `backend/` — Optional helper backend (if present in your repo)

> NOTE: In this repo the Angular app is located at `frontend/frontend`.

## Configure Gemini API Key

The app may call the Gemini API directly from the client for demo purposes. For local testing add your API key in the environment file located at:

```
frontend/frontend/src/environments/environment.ts
```

Open that file and add your key and model settings, for example:

```ts
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_GEMINI_API_KEY',
  geminiModel: 'gemini-2.0-flash'
};
```

Security note: Storing API keys in client-side code is insecure for production. Use a server-side proxy for any real deployment.

## Install dependencies

Open PowerShell and run:

```powershell
cd C:\Users\yanin\Desktop\TypeScript-Code-Editor\frontend\frontend
npm install
```

If you prefer using the top-level `frontend` folder, adjust paths accordingly.

## Start the frontend (development)

Recommended: run the local Yjs WebSocket server and the Angular app.

1) Start the Yjs WebSocket server (in a separate terminal):

```powershell
npx y-websocket-server --port 1234
```

2) Start the Angular app (frontend):

```powershell
cd C:\Users\yanin\Desktop\TypeScript-Code-Editor\frontend\frontend
npm run start
# or
ng serve --open
```

The app will be available at `http://localhost:4200` by default.

## Create or join a room

Open a room URL in the browser to collaborate:

```
http://localhost:4200/room/daily-standup
```

Open the same URL in another tab to test real-time sync and AI suggestions.

## Troubleshooting

- If you see WebSocket connection errors, verify the Yjs server is running on `ws://localhost:1234` and the port matches the app configuration.
- If AI suggestions fail, confirm your `geminiApiKey` is correct and not rate-limited.
- For CodeMirror-related deprecation warnings, check `package.json` and the CodeMirror 6 migration docs.

## Tests & Build

- Run unit tests (if available):

```powershell
cd frontend/frontend
npm test
```

- Build production bundle:

```powershell
cd frontend/frontend
npm run build
```

## Contributing

Please follow the repository-level contributing guidelines. Typical workflow:

```bash
git checkout -b feature/your-feature
git commit -m "Add feature"
git push origin feature/your-feature
```

## License

Distributed under the MIT License.
