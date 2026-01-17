---
description: How to run development servers for frontend and backend
---

## Development Setup

### Prerequisites
- mise (runtime version manager)
- uv (Python package manager)

### Install Runtimes
// turbo
```bash
mise install
```

### Start Backend Server
// turbo
```bash
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
```

### Start Frontend Dev Server (in another terminal)
// turbo
```bash
cd frontend && npm install && npm run dev
```

### Environment Setup
Copy example env files and fill in your credentials:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Required variables:
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (frontend)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (backend)
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET_KEY` - Secret for JWT tokens
