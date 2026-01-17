# PDF Chinese Font Fixer - 项目记忆

## 项目概述
AI 驱动的 PDF 中文字体修复工具，使用 Google Gemini AI 重构模糊的中文字符。

## 技术栈
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Router v7, i18next
- **Backend**: Python FastAPI, Pydantic, Google Generative AI
- **Auth**: Google OAuth + JWT
- **Payment**: Lemon Squeezy

## 项目结构
```
frontend/   - React SPA (port 5173)
backend/    - FastAPI API (port 8000)
```

## 关键配置

### 域名
- Production: worktool.dev
- Support email: support@worktool.dev

### 定价
- $0.50/页 按量付费
- 1 页免费试用
- 批量优惠: 10页(-10%), 50页(-20%), 200页(-30%)

### 退款政策
- 已使用积分: 不可退
- 未使用余额: 7天内可退 (扣手续费)

## API 端点
- POST `/api/auth/google` - Google OAuth 登录
- GET `/api/auth/me` - 当前用户信息
- POST `/api/files/upload` - 上传文件
- POST `/api/files/process` - AI 处理
- POST `/api/webhooks/lemonsqueezy` - 支付回调

## 开发命令
```bash
# 安装运行时
mise install

# Frontend
cd frontend && npm run dev

# Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

## 注意事项
- Gemini SDK 已迁移到 `google.genai`（当前使用旧版 `google.generativeai`）
- 生产环境需配置 CORS `frontend_url` 设置
- Google OAuth 需要配置正确的 redirect URI
