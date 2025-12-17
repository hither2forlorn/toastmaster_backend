# Toastmaster Backend - Quick Deploy Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Prepare Your Database

Choose a PostgreSQL provider:

- **[Supabase](https://supabase.com)** ⭐ Easiest setup! → [Use Supabase Guide](./SUPABASE_DEPLOYMENT.md)
- **[Neon](https://neon.tech)** (Serverless, Free tier)
- **[Railway](https://railway.app)**

**Using Supabase?** Follow the [dedicated Supabase guide](./SUPABASE_DEPLOYMENT.md) for easier setup with `DATABASE_URL`.

**Using other providers?** Get your connection details:

```
Host: xxx.aws.neon.tech
Port: 5432
Username: your-username
Password: your-password
Database: toastmaster_prod
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Add Environment Variables** (Important!):

#### Option A: Using DATABASE_URL (Supabase, Neon, Railway)

```env
NODE_ENV=production
API_PREFIX=/api

# Database connection string (recommended)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT - Generate a secure secret!
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

#### Option B: Using Individual DB Variables

```env
NODE_ENV=production
API_PREFIX=/api

# Your Production Database
DB_HOST=your-db-host.neon.tech
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=toastmaster_prod
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT - Generate a secure secret!
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

4. Click **Deploy**
5. Wait 2-3 minutes ⏳
6. Done! 🎉 Your API is live at `https://your-app.vercel.app/api`

### Step 4: Test Your Deployment

```bash
# Health check
curl https://your-app.vercel.app/api

# Swagger docs
open https://your-app.vercel.app/api/docs
```

---

## 📁 Project Structure

```
src/
├── main.ts                    # Local development entry
├── main.serverless.ts         # Vercel serverless entry
├── database/
│   ├── database.factory.ts    # Local DB config
│   └── database-production.factory.ts  # Production DB config
```

- **Local Dev**: Uses `main.ts` + `database.factory.ts`
- **Production**: Uses `main.serverless.ts` + `database-production.factory.ts`

---

## 🔧 Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# API available at: http://localhost:8000/api
# Swagger docs at: http://localhost:8000/api/docs
```

---

## ⚠️ Important Notes

### Database Migrations

**Never** use `DB_SYNCHRONIZE=true` in production!

Run migrations manually:

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run on production
npm run typeorm migration:run
```

### CORS

Update allowed origins in `main.ts`:

```typescript
app.enableCors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true,
});
```

### Environment Variables

- **Development**: Uses `.env`
- **Production**: Uses `.env.production` (for local testing) or Vercel environment variables

---

## 🐛 Troubleshooting

### Cold Starts

First request may be slow (1-2s). This is normal for serverless.

### Database Connection Issues

Check:

1. Database allows external connections
2. Correct connection string
3. SSL is enabled in production factory

### Deployment Fails

Check Vercel logs:

1. Go to your deployment
2. Click "Logs" tab
3. Look for error messages

---

## 📦 Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + TypeORM
- **Deployment**: Vercel (Serverless)
- **Auth**: JWT

---

## 🔗 Useful Links

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Vercel Docs](https://vercel.com/docs)
- [NestJS Docs](https://docs.nestjs.com)
