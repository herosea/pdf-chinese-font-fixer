# PDF Chinese Font Fixer

AI-powered PDF Chinese font repair tool. Fix and enhance Chinese characters in your NotebookLM PDFs using Google Gemini AI.

🌐 **Website**: [worktool.dev](https://worktool.dev)

## Features

- 🤖 **AI-Powered Repair** - Gemini AI reconstructs blurry Chinese text
- 🎨 **4K Ultra HD Output** - Crystal-clear quality for print and display
- 📄 **Multiple Formats** - Export as PDF, PowerPoint, or ZIP
- 🌍 **Bilingual UI** - Chinese and English support
- 💳 **Pay-per-use** - $0.50/page with 1 free trial page

## Project Structure

```
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── i18n/         # Translations
│   │   └── services/     # API client
│   └── package.json
│
└── backend/           # Python FastAPI
    ├── app/
    │   ├── routers/      # API endpoints
    │   ├── services/     # Business logic
    │   └── main.py
    └── requirements.txt
```

## Quick Start

### Prerequisites
- [mise](https://mise.jdx.dev/) - Runtime version manager
- [uv](https://docs.astral.sh/uv/) - Python package manager

### Development

```bash
# Install runtimes (Node 22 + Python 3.12)
mise install

# Frontend
cd frontend
npm install
npm run dev

# Backend (in another terminal)
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### Environment Variables

```bash
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# backend/.env
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_jwt_secret
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Router, i18next

**Backend**: FastAPI, Pydantic, Google Generative AI, python-jose (JWT)

## License

MIT
