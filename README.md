# ChatGPT-like App via OpenRouter

A modern, responsive chat app using React + Vite + Tailwind on the frontend and Node.js/Express on the backend. The backend securely proxies requests to OpenRouter using an API key from environment variables. Chat history is stored entirely on the client via `localStorage`.

## Features
- Modern, mobile-friendly UI with TailwindCSS
- Smooth scrollable chat with distinct user/AI bubbles
- Message box fixed at the bottom; Enter to send, Shift+Enter for newline
- Typing indicator while waiting for AI response
- Persistent chat history via `localStorage` and a button to clear history
- Graceful error messages on API failures

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS
- Backend: Node.js, Express, Axios
- API Provider: OpenRouter (`https://openrouter.ai`)

## Project Structure
```
backend/   # Express server, /api/chat proxy to OpenRouter
frontend/  # React + Vite + Tailwind app
```

## Prerequisites
- Node.js 18+
- An OpenRouter API key (`https://openrouter.ai/keys`)

## Setup

### 1) Backend
```
cd backend
copy .env.example .env   # Windows PowerShell/cmd
# Edit .env and set OPENROUTER_API_KEY
npm install
npm run dev
```
- The server listens on `http://localhost:3001` by default.
- The `ORIGIN` in `.env` controls CORS (defaults to `http://localhost:5173`).
- Health check: `GET http://localhost:3001/health`

Environment variables (`backend/.env`):
```
OPENROUTER_API_KEY=YOUR_KEY_HERE
HTTP_REFERER=http://localhost:5173
APP_TITLE=Local ChatGPT via OpenRouter
PORT=3001
ORIGIN=http://localhost:5173
```

### 2) Frontend
```
cd frontend
npm install
npm run dev
```
- App runs at `http://localhost:5173`.
- Vite dev server proxies `/api` and `/health` to the backend.

## Usage
1. Open the frontend in your browser.
2. Type a message and press Enter to send (Shift+Enter for newline).
3. Responses come back after the backend calls OpenRouter.
4. Click "Clear" to remove chat history from local storage.

## Notes
- All conversation data is kept in the browser; no external database is used.
- The backend only forwards messages and returns the assistant’s text.
- You can change the model by sending `model` in the request from the frontend (defaults to `openai/gpt-4o-mini`).

## Deploying
- Ensure `OPENROUTER_API_KEY` is set on the server.
- Build frontend: `cd frontend && npm run build` and serve `dist/` statically.
- Start backend: `cd backend && npm start`.

## License
MIT
