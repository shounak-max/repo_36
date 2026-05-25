# 🚀 DEPLOYMENT QUICKSTART

Your Task Manager is fully built and ready to deploy! Follow these steps to get it live on Vercel.

## ⏱️ Time Required: ~15 minutes

---

## 📋 Checklist

- [ ] Code is pushed to GitHub
- [ ] Database created and connection string ready
- [ ] Vercel account created
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Run migrations
- [ ] Create first API key
- [ ] Test the app

---

## 🔧 Step-by-Step Deployment

### Step 1: Push Code to GitHub (2 min)

```bash
cd d:\gitfork\repo_36

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Full-stack Task Manager with frontend and backend"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/task-manager.git

# Push
git push -u origin main
```

### Step 2: Set Up PostgreSQL Database (5 min)

**Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create a new project
4. Copy the connection string
5. You now have both `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` (use the same string for both)

**Option B: Other Providers**
- Railway: https://railway.app
- Supabase: https://supabase.com
- DigitalOcean: https://www.digitalocean.com

### Step 3: Deploy to Vercel (3 min)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Framework: **Next.js** (auto-selected)
5. Click **Deploy**
6. Wait ~3-5 minutes for build to complete

### Step 4: Configure Environment Variables (2 min)

1. Click **Settings** in your Vercel dashboard
2. Go to **Environment Variables**
3. Add these 4 variables:

| Variable | Value |
|----------|-------|
| `POSTGRES_URL` | Your database connection string from Step 2 |
| `POSTGRES_URL_NON_POOLING` | Same as POSTGRES_URL |
| `ADMIN_API_KEY` | Generate strong secret: `openssl rand -hex 32` |
| `NODE_ENV` | `production` |

4. Click **Save**

### Step 5: Run Migrations (2 min)

```bash
# Pull environment variables from Vercel
vercel env pull

# Run migrations
npm run migrate

# You should see: "Database migration completed."
```

### Step 6: Redeploy (1 min)

```bash
# Deploy to production
vercel --prod
```

Or through Vercel dashboard:
1. Go to **Deployments**
2. Click the "..." on latest deployment
3. Select **Redeploy**

### Step 7: Create Your First API Key (1 min)

```bash
# Get your Vercel URL (shown in dashboard)
VERCEL_URL="https://your-project-name.vercel.app"

# Create API key
curl -X POST $VERCEL_URL/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY_FROM_STEP_4" \
  -d '{"label":"my-key"}'

# Save the "key" value!
```

Or use the web UI:
1. Go to `https://your-project-name.vercel.app/admin`
2. Enter your `ADMIN_API_KEY` from Step 4
3. Create a new key
4. **Copy and save the key!**

### Step 8: Test Your App (1 min)

1. Open `https://your-project-name.vercel.app`
2. Enter the API key from Step 7
3. Create a task
4. ✅ Done!

---

## 🎯 Your Deployment URL

After Vercel deploys, your app is live at:

```
https://YOUR_PROJECT_NAME.vercel.app
```

Example: `https://task-manager-app.vercel.app`

---

## 📱 Share Your App

```
Dashboard: https://YOUR_PROJECT_NAME.vercel.app
Admin: https://YOUR_PROJECT_NAME.vercel.app/admin
API Docs: https://YOUR_PROJECT_NAME.vercel.app/api/docs
```

---

## 🔑 API Key Management

### Create Keys for Your Team

```bash
curl -X POST https://your-url.vercel.app/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"label":"team-member-name"}'
```

### Revoke Keys (if compromised)

```bash
curl -X DELETE https://your-url.vercel.app/api/admin/api-keys/{key_id} \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

---

## 📊 Monitoring Your Deployment

### View Logs
1. Go to Vercel Dashboard
2. Click your project
3. Go to **Deployments**
4. Click latest deployment
5. Click **Logs** tab

### Check Performance
1. Go to **Analytics** tab
2. View:
   - Request count
   - Response times
   - Status codes
   - Errors

### Set Up Alerts
1. Go to **Settings** → **Alerts**
2. Configure notifications for:
   - High error rate
   - High latency
   - Build failures

---

## 🆘 Quick Troubleshooting

### App shows 502 error
```bash
# Problem: Database connection failed
# Solution:
# 1. Verify POSTGRES_URL is correct
# 2. Check database is running
# 3. Whitelist Vercel IPs in firewall
# 4. Wait 30 seconds and refresh
```

### API says "Unauthorized"
```bash
# Problem: Wrong or missing API key
# Check:
# 1. X-API-Key header is spelled correctly
# 2. API key is valid (create new one if needed)
# 3. Using API key, not admin key
```

### Migrations failed
```bash
# Run locally first to test
npm run migrate

# If that fails:
# 1. Check POSTGRES_URL_NON_POOLING is set
# 2. Verify database user has permissions
# 3. Check database is accessible
```

---

## 🔒 Security Reminders

✅ **Do these:**
- Use strong `ADMIN_API_KEY` (32+ random chars)
- Set environment variables in Vercel (never hardcode)
- Keep backup of API keys
- Monitor access logs
- Rotate keys periodically

❌ **Don't do these:**
- Commit `.env` file to GitHub
- Share API keys in chat
- Use same keys for local and production
- Disable database backups

---

## 📚 Useful Links

| Resource | URL |
|----------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Project Settings** | https://vercel.com/dashboard/[project]/settings |
| **API Documentation** | https://YOUR_URL.vercel.app/api/docs |
| **OpenAPI Spec** | https://YOUR_URL.vercel.app/api/openapi |
| **Health Check** | https://YOUR_URL.vercel.app/health |

---

## 🎉 You're Live!

Your Task Manager is now running on Vercel's global serverless platform:

✅ Auto-scaling
✅ Global CDN
✅ Zero DevOps
✅ Free SSL
✅ Auto-deployments from GitHub

### Next Steps:
1. Share the dashboard URL with your team
2. Create API keys for each team member
3. Start managing tasks!

---

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information.
