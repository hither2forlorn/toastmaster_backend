# 🚀 Vercel Deployment Checklist

## Before Deployment

### ✅ Code Preparation

- [ ] All code committed to Git
- [ ] Repository pushed to GitHub
- [ ] No sensitive data in code (passwords, keys, etc.)
- [ ] `.env` file is in `.gitignore`

### ✅ Database Setup

- [ ] Production PostgreSQL database created
- [ ] Database connection details saved securely
- [ ] Database allows external connections
- [ ] SSL is enabled on database
- [ ] Initial schema/tables created (if needed)

### ✅ Environment Variables Ready

Copy these from your database provider:

- [ ] `DB_HOST`
- [ ] `DB_PORT`
- [ ] `DB_USERNAME`
- [ ] `DB_PASSWORD`
- [ ] `DB_NAME`

Generate secure secrets:

- [ ] `JWT_SECRET` (minimum 32 characters)

## During Deployment

### ✅ Vercel Setup

- [ ] Signed in to [vercel.com](https://vercel.com)
- [ ] Connected GitHub account
- [ ] Imported repository
- [ ] All environment variables added
- [ ] Build settings verified (auto-detected)

## After Deployment

### ✅ Testing

- [ ] Deployment succeeded (check Vercel dashboard)
- [ ] API endpoint responds: `https://your-app.vercel.app/api`
- [ ] Swagger docs accessible: `https://your-app.vercel.app/api/docs`
- [ ] Test authentication endpoints
- [ ] Test database operations

### ✅ Configuration

- [ ] Update CORS origins in code (if needed)
- [ ] Update frontend API URL to Vercel URL
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified (automatic)

### ✅ Monitoring

- [ ] Check Vercel logs for errors
- [ ] Monitor database connections
- [ ] Set up error tracking (optional: Sentry, etc.)

## Common Issues & Solutions

### Issue: "Database connection failed"

**Solution**:

- Check environment variables are set correctly
- Ensure database allows connections from Vercel IPs
- Verify SSL settings in production factory

### Issue: "Cold start is slow"

**Solution**:

- Normal for serverless (1-2s on first request)
- Consider Vercel Pro for better performance
- Use a cron job to keep function warm

### Issue: "Module not found"

**Solution**:

- Run `pnpm install` locally
- Commit `pnpm-lock.yaml`
- Redeploy

### Issue: "CORS errors"

**Solution**:

- Update `origin` in `main.ts` or `main.serverless.ts`
- Add your frontend domain to allowed origins

## Need Help?

1. Check [Vercel Logs](https://vercel.com/docs/observability/runtime-logs)
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Check [NestJS Docs](https://docs.nestjs.com)

---

## Quick Commands

```bash
# Test production build locally
NODE_ENV=production npm run build
NODE_ENV=production npm run start:prod

# Deploy via CLI
vercel --prod

# Check Vercel logs
vercel logs [deployment-url]
```

---

**Last Updated**: December 17, 2025
