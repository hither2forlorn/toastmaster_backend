# 🎯 Quick Reference - Vercel Deployment

## Environment Check

| Environment    | Entry File           | Database Factory                 | Config File     |
| -------------- | -------------------- | -------------------------------- | --------------- |
| **Local Dev**  | `main.ts`            | `database.factory.ts`            | `.env`          |
| **Production** | `main.serverless.ts` | `database-production.factory.ts` | Vercel Env Vars |

## Required Environment Variables

```bash
# Copy this to Vercel Dashboard > Settings > Environment Variables

NODE_ENV=production
API_PREFIX=/api

# Database (Get from Neon/Supabase)
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT (Generate secure 32+ char secret)
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

## Commands

```bash
# Local Development
pnpm run start:dev

# Build
pnpm run build

# Production (local test)
NODE_ENV=production pnpm run start:prod

# Deploy to Vercel
vercel --prod
```

## Deployment URL Structure

```
Production: https://your-app.vercel.app/api
Swagger:    https://your-app.vercel.app/api/docs
```

## Database Providers

- **[Neon](https://neon.tech)** - Free tier, serverless PostgreSQL
- **[Supabase](https://supabase.com)** - Free tier, managed PostgreSQL
- **[Railway](https://railway.app)** - $5/month, simple setup

## Troubleshooting

| Issue               | Solution                              |
| ------------------- | ------------------------------------- |
| DB connection fails | Check SSL enabled, verify credentials |
| Cold starts slow    | Normal (1-2s), upgrade Vercel Pro     |
| CORS errors         | Update `origin` in `main.ts`          |
| Build fails         | Check `vercel-build` script exists    |

## Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
- [Full Documentation](./DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

---

**Files to Review Before Deploy**:

1. ✅ `vercel.json` - Deployment config
2. ✅ `src/main.serverless.ts` - Serverless entry
3. ✅ `src/database/database-production.factory.ts` - DB config
4. ✅ Environment variables set in Vercel

**Deploy Now**: [vercel.com/new](https://vercel.com/new)
