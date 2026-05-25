# Task Manager - Full Stack Application

A modern, full-stack Task Manager application with REST API backend and responsive frontend UI. Built with Next.js, TypeScript, and PostgreSQL. Deployable to Vercel with serverless functions.

## Features

### Backend
- Task CRUD endpoints with filtering, pagination, sorting, and status transition enforcement
- API-key authentication with bcrypt hashes and revocation support
- Per-key sliding-window rate limiting
- Aggregate task statistics
- OpenAPI 3.1.0 specification
- Health check endpoint
- JSON request logging with method, path, status, latency, and key id

### Frontend
- Beautiful, responsive dashboard for task management
- Admin panel for API key management
- Real-time status updates
- Task filtering and sorting
- Statistics dashboard showing task counts and metrics
- Secure local API key storage
- Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Styling**: CSS Modules
- **Authentication**: API Key based
- **Deployment**: Vercel Serverless Functions

## Local Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd repo_36

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL
docker compose up -d postgres

# Run migrations
npm run migrate

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Creating Your First API Key

1. Visit `http://localhost:3000/admin`
2. Enter your `ADMIN_API_KEY` from `.env` (default: `replace-with-a-long-random-admin-secret`)
3. Create a new API key with a label (e.g., "local-dev")
4. Copy the generated key (you'll only see it once!)
5. Visit `http://localhost:3000` and login with your API key
6. Start managing tasks!

## Routes

### Frontend
- `GET /` - Dashboard (requires API key)
- `GET /admin` - Admin panel (requires admin key)

### Backend API
- `GET /health` - Health check
- `GET /api/openapi` - OpenAPI 3.1.0 specification
- `GET /api/docs` - Swagger UI documentation

### Task Management
- `GET /api/tasks` - List all tasks (paginated)
  - Query params: `status`, `priority`, `page`, `limit`, `sort`
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{id}` - Get task by ID
- `PUT /api/tasks/{id}` - Replace entire task
- `PATCH /api/tasks/{id}` - Partially update task
- `DELETE /api/tasks/{id}` - Delete a task
- `GET /api/tasks/stats` - Get task statistics

### Admin
- `POST /api/admin/api-keys` - Create new API key
- `DELETE /api/admin/api-keys/{key_id}` - Revoke an API key

### Authentication
All API endpoints (except `/health`, `/api/openapi`, `/api/docs`) require authentication:
- Include `X-API-Key: <your-api-key>` header for regular tasks
- Include `X-Admin-Key: <admin-key>` header for admin operations

## Deployment to Vercel

### Prerequisites
- Vercel account (free tier available)
- PostgreSQL database (e.g., from Neon, Railway, or Supabase)
- GitHub repository with this code

### Step-by-Step Deployment

#### 1. Prepare Your Database

Choose a PostgreSQL hosting provider:
- **Neon** (recommended): https://neon.tech (free tier available)
- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **Amazon RDS**: https://aws.amazon.com/rds
- **DigitalOcean**: https://www.digitalocean.com

Create a new PostgreSQL database and get your connection strings:
- `POSTGRES_URL` - Regular connection string (pooling)
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection (for migrations)

#### 2. Set Up Repository

```bash
# Push code to GitHub
git remote add origin <github-repo-url>
git push -u origin main
```

#### 3. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel
```

Or use the web interface:
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select Next.js as framework
4. Leave default settings and click Deploy

#### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add the following variables:

```env
POSTGRES_URL=postgresql://user:password@host:5432/database
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database
ADMIN_API_KEY=your-super-secret-admin-key-min-32-chars
NODE_ENV=production
```

**Important**: Use different values for `ADMIN_API_KEY` than your local setup!

#### 5. Run Migrations on Production

After setting environment variables:

```bash
# Option A: Using Vercel CLI
vercel env pull
npm run migrate

# Option B: SSH into Vercel (for Pro plan)
# Or use a migration service/tool from your database provider
```

For **Neon** users, you can run migrations directly from their dashboard SQL editor.

#### 6. Redeploy

After migrations complete, redeploy:

```bash
vercel --prod
```

#### 7. Access Your App

Your app is now live! Get the deployment URL from Vercel dashboard.

```
https://your-project.vercel.app
```

### Post-Deployment

1. **Create an API Key**:
   - Visit `https://your-project.vercel.app/admin`
   - Enter your `ADMIN_API_KEY`
   - Create a new API key for yourself
   - Save it securely

2. **Start Using the App**:
   - Visit `https://your-project.vercel.app`
   - Login with your API key
   - Create and manage tasks!

3. **Monitor Deployment**:
   - Check Vercel Dashboard for logs
   - View performance metrics
   - Set up alerts for errors

## Environment Variables

### Required (Production)
```env
POSTGRES_URL=postgresql://...              # Primary connection
POSTGRES_URL_NON_POOLING=postgresql://...  # For migrations
ADMIN_API_KEY=your-admin-secret-key        # Min 32 characters
NODE_ENV=production                        # Always set to production
```

### Optional
```env
API_KEY_SALT_ROUNDS=12                     # Bcrypt salt rounds (default: 12)
RATE_LIMIT_WINDOW_MS=60000                 # Rate limit window in ms (default: 60s)
RATE_LIMIT_MAX=100                         # Max requests per window (default: 100)
```

## API Examples

### Using cURL

```bash
# Get health status
curl https://your-project.vercel.app/health

# Create API key (admin only)
curl -X POST https://your-project.vercel.app/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{"label":"mobile-app"}'

# List tasks
curl https://your-project.vercel.app/api/tasks \
  -H "X-API-Key: your-api-key"

# Create task
curl -X POST https://your-project.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Deploy to Vercel",
    "description": "Get the app running in production",
    "priority": "high",
    "status": "pending"
  }'

# Update task status
curl -X PATCH https://your-project.vercel.app/api/tasks/{id} \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"status": "completed"}'
```

### Using JavaScript

```javascript
const API_KEY = "your-api-key";
const BASE_URL = "https://your-project.vercel.app";

// Get all tasks
const response = await fetch(`${BASE_URL}/api/tasks`, {
  headers: { "X-API-Key": API_KEY },
});
const tasks = await response.json();

// Create task
const newTask = await fetch(`${BASE_URL}/api/tasks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  body: JSON.stringify({
    name: "My Task",
    priority: "high",
  }),
});
```

## Troubleshooting

### 404 on Frontend Routes
- Ensure you're accessing `/` and `/admin` paths
- Check that Node.js runtime is set in Vercel

### Database Connection Errors
- Verify `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` are correct
- Check database firewall rules allow Vercel IPs
- Ensure database is not sleeping (some providers have auto-sleep)

### Migration Failures
- Run migrations locally first: `npm run migrate`
- Check `POSTGRES_URL_NON_POOLING` is set correctly
- Verify database user has necessary permissions

### API Key Issues
- Ensure `ADMIN_API_KEY` environment variable is set
- Check API key format (should be alphanumeric string)
- Make sure `X-API-Key` and `X-Admin-Key` headers are spelled correctly

## Development

```bash
# Run development server
npm run dev

# Run tests
npm run test

# Run type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

## Security Notes

⚠️ **Important Security Practices**:

1. **Never commit `.env` file** - Use `.env.example` template
2. **Use strong `ADMIN_API_KEY`** - At least 32 random characters
3. **Rotate API keys regularly** - Revoke old keys and create new ones
4. **Use HTTPS only** - Vercel provides free SSL certificates
5. **Set database firewall** - Restrict access to known IPs
6. **Monitor logs** - Check Vercel Dashboard for suspicious activity
7. **Use environment variables** - Never hardcode secrets

## License

MIT

