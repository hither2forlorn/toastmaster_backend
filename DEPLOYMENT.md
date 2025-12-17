# Vercel Deployment Guide

## Prerequisites

1. **Production Database**: Set up a PostgreSQL database (Neon, Supabase, Railway, etc.)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Setup Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Update Database for Production

If using `DatabaseProductionFactory`, update `app.module.ts`:

```typescript
import { DatabaseProductionFactory } from './database/database-production.factory';

TypeOrmModule.forRootAsync({
  useClass: process.env.NODE_ENV === 'production'
    ? DatabaseProductionFactory
    : DatabaseFactory,
  inject: [ConfigService],
}),
```

### 3. Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```
PORT=8000
API_PREFIX=/api
SWAGGER_PATH=/api/docs

# Database
DB_HOST=your-neon-or-supabase-host.aws.neon.tech
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=toastmaster_prod
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT
JWT_SECRET=your-production-jwt-secret-change-this
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256

# Node
NODE_ENV=production
```

### 4. Update package.json

Add build script for Vercel:

```json
"scripts": {
  "vercel-build": "nest build"
}
```

### 5. Deploy to Vercel

**Option A: Via GitHub (Recommended)**

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect NestJS
5. Click "Deploy"

**Option B: Via CLI**

```bash
vercel --prod
```

## Important Notes

### Database Synchronize

⚠️ **NEVER** set `DB_SYNCHRONIZE=true` in production!

Run migrations manually:

```bash
# Create migration locally
npm run typeorm migration:generate -- -n MigrationName

# Run migrations on production DB
npm run typeorm migration:run
```

### CORS Configuration

Update allowed origins in `main.ts` or `main.serverless.ts`:

```typescript
app.enableCors({
  origin: ['https://your-frontend-domain.com', 'https://your-app.vercel.app'],
  credentials: true,
});
```

### Database Connection Pooling

For serverless, keep connection pool small (already configured in `DatabaseProductionFactory`).

### Cold Starts

First request after inactivity may be slow (~1-2s). Consider:

- Using a cron job to keep the function warm
- Upgrading to Vercel Pro for better performance

## Recommended Database Providers

- **Neon** - Serverless PostgreSQL (Free tier available)
- **Supabase** - PostgreSQL with auto-scaling
- **Railway** - Simple PostgreSQL hosting
- **AWS RDS** - Production-grade (more expensive)

## Testing Production Build Locally

```bash
# Build the project
npm run build

# Set environment
export NODE_ENV=production

# Run production build
npm run start:prod
```

## Monitoring

- View logs in Vercel dashboard under "Deployments" → "Logs"
- Set up error tracking (Sentry, etc.)
- Monitor database performance

## Rollback

If deployment fails, Vercel keeps previous versions:

1. Go to "Deployments"
2. Click on a previous working deployment
3. Click "Promote to Production"
