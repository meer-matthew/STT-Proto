# Deploying STT App to Render

This guide walks you through deploying your STT application to Render, a modern cloud platform that's an excellent alternative to Heroku.

## Why Render?

- **Simple**: Infrastructure as Code with render.yaml
- **Affordable**: Free tier available with PostgreSQL
- **Secure**: Built-in environment variable management
- **Scalable**: Easy to upgrade as your app grows
- **No credit card required** for initial deployment

## Prerequisites

1. **Render Account** - Sign up at https://render.com
2. **GitHub Repository** - Your code must be in a Git repository (GitHub, GitLab, etc.)
3. **Git installed locally**
4. **A working backend** - Following the current setup with Flask and SQLAlchemy

## Step 1: Prepare Your Repository

### 1.1 Ensure .env is NOT committed

```bash
# Check if .env is tracked
git status

# If backend/.env is in the repo, remove it
git rm --cached backend/.env

# Add to .gitignore if not already there
echo "backend/.env" >> .gitignore

# Commit these changes
git add .gitignore
git commit -m "Remove .env file with sensitive data"
```

### 1.2 Verify render.yaml exists

The `render.yaml` file should be in your repository root directory. It defines:
- Web service configuration
- PostgreSQL database configuration
- Environment variables
- Build and start commands

```bash
ls render.yaml  # Should output: render.yaml
```

### 1.3 Update requirements.txt (if needed)

Ensure Deepgram SDK is included:

```bash
grep deepgram backend/requirements.txt
# If not found, add it:
echo "deepgram-sdk>=3.5.0" >> backend/requirements.txt
git add backend/requirements.txt
git commit -m "Add deepgram-sdk to dependencies"
```

### 1.4 Push to GitHub

Make sure all changes are pushed to your GitHub repository:

```bash
git push origin main  # or your default branch
```

## Step 2: Connect GitHub to Render

1. Go to https://render.com/dashboard
2. Click **"New +"** button
3. Select **"Web Service"**
4. Click **"Connect account"** under GitHub
5. Authorize Render to access your GitHub repositories
6. Select your STT repository

## Step 3: Configure Web Service

### 3.1 Basic Information

| Field | Value |
|-------|-------|
| **Name** | `stt-backend` (or your preferred name) |
| **Environment** | `Python 3` |
| **Region** | Select closest to your users |
| **Branch** | `main` (or your default branch) |

### 3.2 Build Command

If `render.yaml` is present, Render will automatically use it. Otherwise, set:

```bash
pip install -r backend/requirements.txt
```

### 3.3 Start Command

```bash
gunicorn --chdir backend wsgi:app --log-file -
```

### 3.4 Instance Type

- **Free Plan**: Includes 750 hours/month (sufficient for development)
- **Paid Plans**: Available when you scale

### 3.5 Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** for each:

```
SECRET_KEY=<generate-with: openssl rand -hex 32>
JWT_SECRET=<generate-with: openssl rand -hex 32>
FLASK_ENV=production
FLASK_DEBUG=0
OPENAI_API_KEY=sk-your-key-here
DEEPGRAM_API=your-deepgram-key-here
```

## Step 4: Create PostgreSQL Database

### Option A: Using render.yaml (Recommended)

If you're using `render.yaml`, the database will be created automatically.

### Option B: Manual Creation

1. From Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name**: `stt-postgres`
   - **Database**: `stt_db`
   - **User**: `stt_user`
   - **Region**: Same as your web service
   - **PostgreSQL Version**: 14

4. Render will provide a `DATABASE_URL` connection string
5. Add to your web service environment variables:
   ```
   DATABASE_URL=<copy-from-postgres-service>
   ```

## Step 5: Deploy

1. Click **"Create Web Service"** (if not using render.yaml)
2. Render will start deploying automatically
3. Watch the logs in the **"Logs"** tab

## Step 6: Run Database Migrations

After successful deployment:

1. Click on your web service
2. Go to **"Shell"** tab
3. Run the following commands:

```bash
python -m flask db upgrade
python seed_data.py  # Optional: seed test data
```

## Step 7: Verify Deployment

### Check Deployment Status

- In Render Dashboard, verify the service shows **"Live"** (green)
- Click the service URL to test the API

### Test API Health Check

```bash
# Replace YOUR_RENDER_URL with your actual Render app URL
curl https://your-app-name.onrender.com/api/health

# Should return: {"status": "healthy"}
```

### View Logs

1. Click on your web service
2. Go to **"Logs"** tab
3. Look for any errors or warnings

## Step 8: Update Frontend Configuration

Update your React Native app to use the Render URL:

### Option A: Environment Variable

Set in your build configuration:

```bash
HEROKU_APP_URL=https://your-app-name.onrender.com
```

### Option B: Direct Update

Edit `src/config/api.config.ts`:

```typescript
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## Step 9: Deploy Frontend

Once the backend is running on Render, rebuild and redeploy your React Native app:

```bash
npm run android  # For Android
# or
npm run ios      # For iOS
```

## Common Issues & Solutions

### Issue: Build Fails with "Python module not found"

**Solution**: Check `backend/requirements.txt` includes all dependencies

```bash
pip freeze > backend/requirements.txt
```

### Issue: Database Connection Error

**Solution**: Verify `DATABASE_URL` environment variable is set correctly

```bash
# In Render Dashboard, go to Service → Environment
# Ensure DATABASE_URL is populated from PostgreSQL service
```

### Issue: "PORT already in use"

**Solution**: Render automatically assigns PORT=10000. Remove any hardcoded port settings.

### Issue: Static Files Not Serving

**Solution**: Frontend is a separate React Native app. Not needed for backend-only service.

### Issue: Timeout During Build

**Solution**: Free tier builds may take up to 15 minutes. Wait and check logs.

## Production Recommendations

### 1. Enable Auto-Deployment

In Render Dashboard:
1. Go to Service Settings
2. Enable **"Auto-deploy"** for the main branch
3. Your app will redeploy on every push to GitHub

### 2. Monitor Performance

- Use Render's built-in monitoring
- Check **"Metrics"** tab for CPU, memory, and bandwidth usage

### 3. Upgrade Database (When Needed)

```bash
# Free PostgreSQL has limits. Upgrade to paid plan for production
# Visit Service → PostgreSQL → Change Plan
```

### 4. Enable HTTPS (Automatic)

Render provides free SSL/TLS certificates. Your URL will be:

```
https://your-app-name.onrender.com
```

### 5. Custom Domain (Optional)

To use your own domain:
1. Go to Service Settings
2. Add Custom Domain
3. Update DNS records at your domain registrar

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| FLASK_ENV | `production` | Yes |
| FLASK_DEBUG | `0` | Yes |
| SECRET_KEY | `abc123...` (generate) | Yes |
| JWT_SECRET | `def456...` (generate) | Yes |
| DATABASE_URL | Set automatically | Yes |
| OPENAI_API_KEY | `sk-...` | If using OpenAI |
| DEEPGRAM_API | `...key...` | If using Deepgram |
| ANTHROPIC_API_KEY | `sk-ant-...` | If using Claude |
| PORT | `10000` | Auto-set |

## Useful Render Commands

### View Logs
```bash
# Via Render Dashboard: Service → Logs
```

### Connect to Database
```bash
# Get connection info from PostgreSQL service details
# Use psql or database client
```

### Restart Service
```bash
# Via Render Dashboard: Service → Manual Deploy → Deploy Latest Commit
```

### View Environment Variables
```bash
# Via Render Dashboard: Service → Environment
```

## Cost Comparison

| Service | Cost | Storage | Compute |
|---------|------|---------|---------|
| Render (Free) | $0 | 0.4GB PostgreSQL | Shared, 750 hrs/mo |
| Render (Standard) | $7/mo | 1GB PostgreSQL | Dedicated, unlimited |
| Heroku (Eco) | $5/mo | 1GB PostgreSQL | Shared, 1000 hrs/mo |

## Next Steps

1. ✅ Deploy to Render using this guide
2. ✅ Update frontend with new API URL
3. ✅ Test all API endpoints
4. ✅ Enable auto-deployment for continuous deployment
5. ✅ Set up monitoring and logging
6. ✅ Configure custom domain (optional)

## Support & Resources

- **Render Documentation**: https://render.com/docs
- **Flask Deployment**: https://flask.palletsprojects.com/en/2.3.x/deploying/
- **PostgreSQL Guide**: https://render.com/docs/databases

## Troubleshooting

If you encounter issues:

1. **Check logs** in Render Dashboard
2. **Verify environment variables** are set
3. **Test locally** to ensure code works:
   ```bash
   cd backend
   python run.py
   ```
4. **Check git history** for recent changes
5. **Review render.yaml** syntax

For more help, visit the [Render Discord community](https://discord.gg/render).