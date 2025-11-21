# Render Deployment - Quick Start (5 Minutes)

Get your STT app running on Render in 5 minutes!

## Prerequisites
- Render account (free at https://render.com)
- Your code pushed to GitHub
- `.env` file removed from git

## Quick Steps

### 1. Clean Up Git (2 minutes)
```bash
# Remove .env if committed
git rm --cached backend/.env 2>/dev/null || true
echo "backend/.env" >> .gitignore
git commit -m "Remove .env file" 2>/dev/null || true
git push origin main
```

### 2. Create Service on Render (2 minutes)
1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select your repository
5. Fill in:
   - **Name**: `stt-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend wsgi:app --log-file -`

### 3. Add Environment Variables (1 minute)
Click **"Advanced"** and add:
```
SECRET_KEY=<generate: openssl rand -hex 32>
JWT_SECRET=<generate: openssl rand -hex 32>
OPENAI_API_KEY=your-key-here
DEEPGRAM_API=your-key-here
FLASK_ENV=production
FLASK_DEBUG=0
```

### 4. Deploy Database
If using `render.yaml`, PostgreSQL creates automatically.

Otherwise, manually create PostgreSQL service and add the `DATABASE_URL` to environment variables.

### 5. Run Migrations (After deployment completes)
In Render Dashboard → Service → **Shell** tab:
```bash
python -m flask db upgrade
```

## Done! ✅

Your app is live at: `https://your-app-name.onrender.com`

## Update Frontend
```bash
# Update API config to use Render URL
# Then rebuild and redeploy React Native app
```

## Troubleshooting
- **Build fails**: Check `backend/requirements.txt`
- **Database error**: Verify `DATABASE_URL` in environment variables
- **App crashes**: Check logs in Render Dashboard

See `RENDER_DEPLOYMENT.md` for detailed guide.