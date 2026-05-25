# Vercel Deployment Guide

## Quick Start (5 minutes)

This guide will get your Task Manager app running on Vercel's global serverless platform.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier available)
- ✅ PostgreSQL database (Neon recommended - free tier available)

## 1️⃣ Set Up Your Database (5 min)

### Using Neon (Recommended)

1. Visit https://neon.tech
2. Click "Sign Up" with your GitHub account
3. Create a new project
4. Copy the **connection string** (looks like: `postgresql://user:password@host/database`)
5. Note this as your `POSTGRES_URL`
6. The connection string is the same for `POSTGRES_URL_NON_POOLING`

### Alternative Database Providers

- **Railway**: https://railway.app (simple, good free tier)
- **Supabase**: https://supabase.com (includes auth)
- **DigitalOcean**: https://www.digitalocean.com/products/managed-databases
- **AWS RDS**: https://aws.amazon.com/rds (more features, paid)

## 2️⃣ Prepare Your Code

```bash
# Make sure all code is committed and pushed to GitHub
git add .
git commit -m "Add frontend and prepare for Vercel deployment"
git push origin main
```

## 3️⃣ Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended for first time)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Framework: **Next.js** (should auto-detect)
5. Click "Deploy"
6. Wait for build to complete ✅

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to your Vercel account
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## 4️⃣ Configure Environment Variables

### In Vercel Dashboard:

1. Go to your project
2. Click **Settings**
3. Go to **Environment Variables**
4. Add these variables:

| Name | Value | Example |
|------|-------|---------|
| `POSTGRES_URL` | Your database connection string | `postgresql://user:pass@host/db` |
| `POSTGRES_URL_NON_POOLING` | Same as above (non-pooling) | `postgresql://user:pass@host/db` |
| `ADMIN_API_KEY` | Your admin secret (min 32 chars) | `sk-admin-abc123def456ghi789jkl012` |
| `NODE_ENV` | `production` | `production` |

### Generate a Strong Admin Key

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 5️⃣ Run Database Migrations

After adding environment variables, you need to run migrations:

### Option A: Using Vercel CLI (Recommended)

```bash
# Pull environment from Vercel
vercel env pull

# Run migrations with the production database
npm run migrate

# You should see: "Database migration completed."
```

### Option B: Neon Web Console (if using Neon)

1. Go to your Neon project
2. Click "SQL Editor"
3. Paste the SQL from `sql/migrate.ts` and execute

### Option C: Database Provider Dashboard

Use your provider's SQL editor to manually run the migration SQL.

## 6️⃣ Create Your First API Key

After migrations are complete, create an API key for yourself:

```bash
# Get your Vercel deployment URL
VERCEL_URL="https://your-project.vercel.app"

# Create API key
curl -X POST $VERCEL_URL/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-api-key-from-env" \
  -d '{"label":"my-key"}'

# Response will include your new API key - save it!
```

Or use the admin panel in your browser:
1. Visit `https://your-project.vercel.app/admin`
2. Enter your `ADMIN_API_KEY`
3. Create a new API key
4. Copy and save it

## 7️⃣ Start Using Your App!

1. **Open your app**: `https://your-project.vercel.app`
2. **Login**: Paste your API key
3. **Create tasks**: Start managing!

## 🔗 Useful Links

- **Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/dashboard/[project]/settings
- **API Documentation**: https://your-project.vercel.app/api/docs
- **OpenAPI Spec**: https://your-project.vercel.app/api/openapi

## 📊 Monitoring

### View Logs
1. Go to your Vercel project
2. Click **Deployments**
3. Click on the latest deployment
4. Click **Logs** tab

### Monitor Performance
1. Go to **Analytics** tab
2. View request metrics, status codes, response times

### Set Up Alerts
1. Go to **Settings** → **Alerts**
2. Configure notifications for errors

## 🆘 Troubleshooting

### 502 Bad Gateway Errors

**Cause**: Database connection failed

**Solutions**:
- Verify `POSTGRES_URL` is correct
- Check database is running and accessible
- Whitelist Vercel IPs in your database firewall
- Wait 30 seconds and refresh (might be cold start)

### Migrations Failing

```bash
# Try running migrations locally first
npm run migrate

# Check if database is accessible
npm run typecheck
```

### API Keys Not Working

- Verify you created the API key correctly
- Check the `X-API-Key` header is spelled correctly
- Make sure you're using the non-admin API key for tasks endpoint

### Slow First Load

This is normal! Vercel serverless functions have a "cold start":
- First request: 1-3 seconds
- Subsequent requests: <100ms
- Auto-scales as traffic increases

## 🔐 Security Checklist

- [ ] `ADMIN_API_KEY` is strong (32+ random characters)
- [ ] Environment variables are set in Vercel (not hardcoded)
- [ ] Database has firewall/security rules
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] You've rotated any leaked API keys
- [ ] Database backups are enabled

## 📈 Next Steps

### Custom Domain
1. Go to project **Settings**
2. Click **Domains**
3. Add your custom domain
4. Update DNS records per Vercel instructions

### Auto-Deployments
1. Settings → **Git** 
2. Automatic deployments from main branch enabled by default

### Staging Environment
1. Create a `staging` branch
2. Deploy from that branch for testing
3. Merge to `main` when ready for production

### Backup & Disaster Recovery
- Enable database backups from your provider
- Regularly export API keys list
- Test recovery procedures

## 💬 Support

**Issues?** Check:
1. Vercel Dashboard → Logs
2. Database provider's documentation
3. API documentation: `/api/docs`
4. GitHub Issues

## 🎉 You're Done!

Your Task Manager is now live on Vercel! Share your deployment URL with team members and start collaborating.

```
🚀 https://your-project.vercel.app
```

---

**Next**: Create API keys for team members in the admin panel!
