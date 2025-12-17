# 🚀 Deploy to Vercel with Supabase

## Quick Setup (5 minutes)

### Step 1: Get Supabase Connection String

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **Connection pooling** (Session mode)
6. Copy the URL (it looks like this):

```
postgresql://postgres.ahrunadgrvyrmvhhxokt:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

7. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 2: Deploy to Vercel

1. Push your code to GitHub:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your GitHub repository

4. **Add Environment Variables** (click "Add" for each):

```env
NODE_ENV=production
API_PREFIX=/api

# Supabase Database URL (use your connection pooling URL)
DATABASE_URL=postgresql://postgres.ahrunadgrvyrmvhhxokt:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

5. Click **Deploy** 🚀

6. Wait 2-3 minutes ⏳

7. Done! Your API is live 🎉

### Step 3: Test Your Deployment

```bash
# Test API
curl https://your-app.vercel.app/api

# Open Swagger docs
open https://your-app.vercel.app/api/docs
```

---

## Supabase Connection Modes

### 🔵 Connection Pooling (Recommended for Vercel)

```
Port: 6543
URL: postgresql://...@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

✅ **Use this for serverless deployments** (Vercel, AWS Lambda, etc.)

- Better performance
- Handles connection limits
- Optimized for serverless

### 🟢 Direct Connection

```
Port: 5432
URL: postgresql://...@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

❌ **Don't use for Vercel**

- Can hit connection limits
- Slower cold starts
- Not optimized for serverless

---

## Environment Variables Explained

| Variable         | Value                     | Notes                                   |
| ---------------- | ------------------------- | --------------------------------------- |
| `DATABASE_URL`   | Your Supabase pooling URL | **Use port 6543** with `pgbouncer=true` |
| `NODE_ENV`       | `production`              | Switches to production mode             |
| `API_PREFIX`     | `/api`                    | Your API prefix                         |
| `JWT_SECRET`     | 32+ character string      | Generate with `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d`                      | Token expiration time                   |
| `JWT_ALGORITHM`  | `HS256`                   | JWT signing algorithm                   |

---

## Generate Secure JWT Secret

### Option 1: Using OpenSSL

```bash
openssl rand -base64 32
```

### Option 2: Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Online Generator

Visit [randomkeygen.com](https://randomkeygen.com/) and use "CodeIgniter Encryption Keys"

---

## Vercel Environment Variables Setup

### Method 1: Via Dashboard (Recommended)

1. Go to your Vercel project
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://...` (your full connection string)
   - Environment: Select **Production**
5. Click **Save**

### Method 2: Via CLI

```bash
vercel env add DATABASE_URL production
# Paste your connection string when prompted

vercel env add JWT_SECRET production
# Paste your JWT secret when prompted
```

---

## Troubleshooting

### ❌ "Error: password authentication failed"

**Solution**:

- Double-check your password in the connection string
- Get fresh connection string from Supabase dashboard
- Ensure there are no special characters that need URL encoding

### ❌ "Error: connection timeout"

**Solution**:

- Make sure you're using **connection pooling** (port 6543)
- Verify `pgbouncer=true` is in the URL
- Check Supabase project is not paused

### ❌ "Error: too many connections"

**Solution**:

- You're using direct connection (port 5432) instead of pooling
- Switch to connection pooling URL (port 6543)

### ❌ "Cold starts are slow"

**Solution**:

- Normal for serverless (1-2s first request)
- Connection pooling helps reduce this
- Consider Vercel Pro for better performance

---

## Database Migrations

### ⚠️ Important: Never use `DB_SYNCHRONIZE=true` in production

Run migrations via Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Create a new query
4. Paste your migration SQL
5. Click **Run**

Or use TypeORM migrations:

```bash
# Generate migration locally
npm run typeorm migration:generate -- -n MigrationName

# Run against Supabase (set DATABASE_URL locally first)
npm run typeorm migration:run
```

---

## CORS Configuration

Update CORS in `src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000', // For local testing
  ],
  credentials: true,
});
```

---

## Monitoring & Logs

### View Deployment Logs

1. Go to Vercel Dashboard
2. Click your deployment
3. Click **Logs** tab

### View Supabase Logs

1. Go to Supabase Dashboard
2. Click **Database** → **Query Performance**
3. Monitor slow queries and connections

---

## Cost & Limits

### Supabase Free Tier

- ✅ 500MB database
- ✅ Unlimited API requests
- ✅ Connection pooling included
- ⚠️ 2GB bandwidth/month

### Vercel Free Tier

- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions included
- ⚠️ Slower cold starts vs Pro

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all endpoints
3. ✅ Update frontend API URL
4. ✅ Set up monitoring
5. ✅ Configure custom domain (optional)

---

## Helpful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Docs - Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Full Deployment Guide](./DEPLOYMENT.md)

---

**Questions?** Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) or [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
