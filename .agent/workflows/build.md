---
description: How to build production assets for deployment
---

## Production Build

### Build Frontend
// turbo
```bash
cd frontend && npm run build
```

Output will be in `frontend/dist/`

### Build Backend (Docker)
```bash
cd backend
docker build -t pdf-font-fixer-api .
```

### Deploy Checklist
- [ ] Set production environment variables
- [ ] Configure domain DNS (worktool.dev)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production frontend URL
- [ ] Set up Lemon Squeezy webhook endpoint
- [ ] Test Google OAuth with production redirect URIs
