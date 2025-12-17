# ⚡ Quick Render Deployment Steps

## 1️⃣ Supabase Setup (2 min)

```bash
1. Go to Supabase SQL Editor
2. Run the full schema from RENDER_DEPLOYMENT.md
3. Copy connection pooling URL (port 6543)
4. URL-encode password: @ → %40, # → %23
```

## 2️⃣ Push to GitHub (1 min)

```bash
git push origin main
```

## 3️⃣ Render Dashboard (5 min)

```
1. https://dashboard.render.com
2. New + → Web Service
3. Connect GitHub repo
4. Configure:
   - Build: npm install && npm run build
   - Start: NODE_ENV=production node dist/main
   - Port: 10000
```

## 4️⃣ Environment Variables

```env
DATABASE_URL=postgresql://postgres.xxx:password@...pooler.supabase.com:6543/postgres?pgbouncer=true
NODE_ENV=production
PORT=10000
API_PREFIX=/api
JWT_SECRET=<run: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

## 5️⃣ Deploy & Test

```bash
# Wait 3-5 minutes, then test:
curl https://your-service.onrender.com/api

# Open Swagger:
https://your-service.onrender.com/api/docs
```

---

## 🔑 Key Points

✅ Use **Connection pooling** (port 6543), not direct (5432)
✅ URL-encode special chars in password
✅ NODE_ENV=production is critical
✅ Free tier spins down after 15 min (first request slow)
✅ Upgrade to Starter ($7/mo) to stay always-on

---

## 📁 Files Changed

- ✅ `src/database/database-production.factory.ts` (Created)
- ✅ `src/app.module.ts` (Auto-switches based on NODE_ENV)
- ✅ `package.json` (Updated start:prod script)
- ✅ `.env.render` (Template for env vars)
- ✅ `RENDER_DEPLOYMENT.md` (Full guide)

---

**Ready to deploy! Follow RENDER_DEPLOYMENT.md for detailed steps.**
