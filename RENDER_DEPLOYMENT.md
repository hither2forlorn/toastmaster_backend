# 🚀 Render Deployment Guide - Toastmaster Backend

## Prerequisites

- ✅ Supabase account with database created
- ✅ GitHub repository ready
- ✅ Render account (free tier works!)

---

## Step 1: Prepare Supabase Database (5 minutes)

### 1.1 Get Your Connection String

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **Project Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. Select **Connection pooling** tab (Important!)
5. Choose **Transaction** mode
6. Copy the connection string - looks like:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
7. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password
   - If your password has special characters like `@`, `#`, `&`, encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `&` → `%26`

### 1.2 Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    club_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create club_member table
CREATE TABLE IF NOT EXISTS club_member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, club_id)
);

-- Create agenda_templates table
CREATE TABLE IF NOT EXISTS agenda_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create agenda_template_items table
CREATE TABLE IF NOT EXISTS agenda_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES agenda_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create agendas table
CREATE TABLE IF NOT EXISTS agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create agenda_items table
CREATE TABLE IF NOT EXISTS agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agenda_id UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clubs_owner ON clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_club_member_user ON club_member(user_id);
CREATE INDEX IF NOT EXISTS idx_club_member_club ON club_member(club_id);
CREATE INDEX IF NOT EXISTS idx_agenda_templates_club ON agenda_templates(club_id);
CREATE INDEX IF NOT EXISTS idx_agenda_template_items_template ON agenda_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_agendas_club ON agendas(club_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_agenda ON agenda_items(agenda_id);
```

4. Click **Run** to execute the schema
5. Verify tables: Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

---

## Step 2: Push Code to GitHub (2 minutes)

```bash
# Make sure all changes are committed
git add .
git commit -m "Configure for Render deployment with Supabase"
git push origin main
```

---

## Step 3: Create Render Web Service (5 minutes)

### 3.1 Create New Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository `toastmaster_backend`
4. Click **Connect**

### 3.2 Configure Build Settings

Fill in these details:

| Field              | Value                                  |
| ------------------ | -------------------------------------- |
| **Name**           | `toastmaster-api` (or your choice)     |
| **Region**         | Choose closest to your Supabase region |
| **Branch**         | `main`                                 |
| **Root Directory** | Leave empty                            |
| **Runtime**        | `Node`                                 |
| **Build Command**  | `npm install && npm run build`         |
| **Start Command**  | `NODE_ENV=production node dist/main`   |

### 3.3 Select Instance Type

- **Free** tier works for testing
- **Starter** ($7/month) recommended for production

---

## Step 4: Add Environment Variables (3 minutes)

Scroll down to **Environment Variables** section and add these:

### Required Variables:

| Key                | Value                                      | Notes                  |
| ------------------ | ------------------------------------------ | ---------------------- |
| `DATABASE_URL`     | Your Supabase connection string            | From Step 1.1          |
| `NODE_ENV`         | `production`                               | Critical!              |
| `PORT`             | `10000`                                    | Render's default       |
| `API_PREFIX`       | `/api`                                     | API route prefix       |
| `KEEP_ALIVE_URL`   | `https://toastmaster-api.onrender.com`     | Your Render URL        |
| `HOST`             | `0.0.0.0`                                  | Bind to all interfaces |
| `CORS_ORIGIN`      | `https://your-frontend.vercel.app`         | Your frontend URL      |
| `JWT_SECRET`       | Generate secure secret                     | See below              |
| `JWT_EXPIRES_IN`   | `7d`                                       | Token expiry           |
| `JWT_ALGORITHM`    | `HS256`                                    | JWT algorithm          |

### Generate JWT_SECRET:

Run this in your terminal:

```bash
openssl rand -base64 32
```

Copy the output (e.g., `xK9mP2vN4bQ8rT5wY7zL1aS3dF6gH9jK`) and use it as `JWT_SECRET`

### Example DATABASE_URL:

```
postgresql://postgres.ahrunadgrvyrmvhhxokt:MyPass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Important**: Make sure your password is URL-encoded if it contains special characters!

---

## Step 5: Deploy! (2 minutes)

1. Click **Create Web Service** at the bottom
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your app
   - Start the server
3. Wait 3-5 minutes for first deployment

---

## Step 6: Test Your API (2 minutes)

Once deployed, Render gives you a URL like:

```
https://toastmaster-api.onrender.com
```

### Test Endpoints:

#### Health Check:

```bash
curl https://toastmaster-api.onrender.com/api
```

Expected response:

```json
{
  "message": "Welcome to Toastmaster API",
  "version": "1.0.0"
}
```

#### Swagger Documentation:

Open in browser:

```
https://toastmaster-api.onrender.com/api/docs
```

You should see Swagger UI with all endpoints!

#### Test User Registration:

```bash
curl -X POST https://toastmaster-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User"
  }'
```

---

## 🎉 Success Checklist

- ✅ Supabase database created and schema loaded
- ✅ Render web service created
- ✅ All environment variables added (including `KEEP_ALIVE_URL`)
- ✅ Deployment shows "Live" status
- ✅ API health check responds
- ✅ Swagger docs load
- ✅ Can register/login users
- ✅ **Auto Keep-Alive enabled** - Service stays awake automatically! 🚀

---

## 🔄 Keep-Alive Feature (Prevents Spin Down)

### How It Works

Render's free tier **spins down after 15 minutes** of inactivity. Your app now has an **automatic keep-alive** system:

- 🤖 **Cron job runs every 10 minutes** (automatically)
- 🏓 Pings the `/api/health` endpoint
- ✅ Keeps service awake without manual intervention
- 📊 Logs each ping in Render logs

### What You Need

Just add the `KEEP_ALIVE_URL` environment variable:

```env
KEEP_ALIVE_URL=https://toastmaster-api.onrender.com
```

Replace with your actual Render URL after deployment!

### Monitor Keep-Alive

Check Render logs to see keep-alive pings:

```
✅ Keep-alive ping successful (245ms) - Service staying awake
```

### Important Notes

⚠️ **Free Tier Limits:**
- Render free tier has 750 hours/month
- Keep-alive uses ~720 hours/month (24/7)
- You have ~30 hours buffer
- Upgrade to Starter ($7/mo) for unlimited uptime

💡 **Disable Keep-Alive:**
To disable, simply remove `KEEP_ALIVE_URL` env var or set `NODE_ENV` to something other than `production`.

---

## 🔧 Troubleshooting

### Build Fails

**Check Render Logs** (Logs tab in dashboard):

```
Common issues:
- Missing dependencies → Check package.json
- TypeScript errors → Run `npm run build` locally
- Node version mismatch → Add NODE_VERSION env var
```

### Database Connection Fails

```bash
Error: "unable to connect to database"

Solutions:
1. Verify DATABASE_URL is correct
2. Check password is URL-encoded
3. Ensure using port 6543 (pooler), not 5432
4. Verify pgbouncer=true is in URL
5. Check Supabase database is running
```

### App Crashes on Start

```bash
Check Render logs for:
- Missing environment variables
- Database connection errors
- Port binding issues (must use PORT env var)
```

### 503 Service Unavailable

```
Free tier Render services spin down after 15 min of inactivity.
First request after inactivity takes 30-60 seconds to spin up.
Upgrade to Starter plan ($7/mo) to avoid this.
```

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Rebuilds app
# 3. Deploys if successful
# 4. Keeps old version running until new one is ready
```

---

## 🚀 Post-Deployment

### Update CORS for Frontend

When you have a frontend, update CORS in `src/main.ts`:

```typescript
app.enableCors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true,
});
```

Then commit and push to redeploy.

### Custom Domain (Optional)

1. Go to Render dashboard → Your service
2. Click **Settings** → **Custom Domain**
3. Add your domain (e.g., `api.yourapp.com`)
4. Update DNS records at your domain registrar
5. Render automatically provisions SSL certificate

---

## 📊 Monitoring

### View Logs

1. Go to your service in Render
2. Click **Logs** tab
3. Watch real-time logs or filter by date

### Metrics

1. Click **Metrics** tab
2. View:
   - CPU usage
   - Memory usage
   - Request counts
   - Response times

---

## 💡 Tips

1. **Free tier limitations**:
   - Spins down after 15 min inactivity
   - 750 hours/month free
   - Shared CPU/memory

2. **Starter tier benefits** ($7/mo):
   - Always on (no spin down)
   - Dedicated resources
   - Better performance

3. **Database pooling**:
   - Always use port 6543 (pooler) for Supabase
   - Never use port 5432 (direct connection)

4. **Environment variables**:
   - Can be updated without redeploying
   - Changes take effect on next request
   - Sensitive values are encrypted

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **NestJS Docs**: https://docs.nestjs.com

---

**Your Toastmaster API is now live on Render! 🎊**

API Base URL: `https://your-service.onrender.com/api`
Swagger Docs: `https://your-service.onrender.com/api/docs`
