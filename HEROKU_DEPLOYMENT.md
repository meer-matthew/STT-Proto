# Heroku Deployment Guide

This guide will help you deploy your STT backend to Heroku.

## Prerequisites

1. **Heroku Account** - Create at https://www.heroku.com
2. **Heroku CLI** - Install from https://devcenter.heroku.com/articles/heroku-cli
3. **Git** - Already installed in your project

## Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Verify installation
heroku --version
```

## Step 2: Login to Heroku

```bash
heroku login
# Opens browser to authenticate
```

## Step 3: Create Heroku App

```bash
cd /Users/matthewmeer/WebstormProjects/STT

# Create a new Heroku app (choose unique name)
heroku create your-app-name

# Or connect to existing app
heroku apps:info -a your-app-name
```

## Step 4: Configure Environment Variables

Set all required environment variables on Heroku:

```bash
# Core Configuration
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
heroku config:set JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
heroku config:set JWT_EXPIRATION_HOURS=24

# AI Provider (Important!)
heroku config:set DEEPGRAM_API_KEY=your-deepgram-api-key
# OR if using OpenAI
heroku config:set OPENAI_API_KEY=sk-your-openai-api-key
heroku config:set AI_PROVIDER=openai

# Database (Heroku provides PostgreSQL)
# After adding PostgreSQL add-on (see Step 5)

# Server
heroku config:set PORT=5000

# Verify settings
heroku config
```

## Step 5: Add PostgreSQL Database (Recommended)

SQLite won't work well on Heroku (read-only filesystem). Use PostgreSQL instead:

```bash
# Add free tier PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Get database URL (automatic)
heroku config:get DATABASE_URL

# This will show something like:
# postgres://user:password@host:port/database
```

## Step 6: Prepare Backend for Heroku

Files already created:
- ✅ `Procfile` - Tells Heroku how to run the app
- ✅ `runtime.txt` - Python version specification

## Step 7: Initialize Git (if not done)

```bash
cd /Users/matthewmeer/WebstormProjects/STT

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for Heroku deployment"

# Add Heroku remote
heroku git:remote -a your-app-name
```

## Step 8: Deploy to Heroku

```bash
# Deploy
git push heroku main

# Or if on different branch
git push heroku yourbranch:main

# Watch logs
heroku logs --tail
```

## Step 9: Run Database Migrations

```bash
# Run Flask migrations on Heroku
heroku run python -m flask db upgrade

# Or seed initial data (optional)
heroku run python seed_data.py
```

## Step 10: Update APK Configuration

Update your React Native app to use the new Heroku URL:

```typescript
// src/config/api.config.ts
export const API_CONFIG = {
    BASE_URL: 'https://your-app-name.herokuapp.com',
    AUTH_URL: 'https://your-app-name.herokuapp.com/api/auth',
    // ... rest of config
};
```

Then rebuild APK:
```bash
npm run build-android-release
```

## Verification Steps

### Test Backend is Running

```bash
# Get app URL
heroku open

# Or test API directly
curl https://your-app-name.herokuapp.com/health

# Check logs
heroku logs --tail
```

### Test from React Native

1. Rebuild APK with new URL
2. Install on device/emulator
3. Create account and test recording
4. Check Heroku logs for any errors

## Common Issues & Solutions

### Issue: "Application Error"
```bash
# Check logs
heroku logs --tail

# Rebuild with new settings
git push heroku main
```

### Issue: Database Connection Error
```bash
# Verify DATABASE_URL is set
heroku config:get DATABASE_URL

# Check if migrations ran
heroku run python -c "from app import db; print(db.engine)"

# Re-run migrations
heroku run python -m flask db upgrade
```

### Issue: "Gunicorn failed to start"
```bash
# Check Procfile syntax
cat Procfile

# Verify app structure
heroku run python -c "from app import create_app; print('OK')"
```

### Issue: API Key Not Working
```bash
# Verify all keys are set
heroku config

# Common missing keys:
heroku config:set DEEPGRAM_API_KEY=your-key
heroku config:set OPENAI_API_KEY=your-key
```

## Database Management

### View Database
```bash
# Access PostgreSQL
heroku pg:psql

# List tables
\dt

# Exit
\q
```

### Reset Database
```bash
# Drop and recreate
heroku pg:reset DATABASE

# Re-run migrations
heroku run python -m flask db upgrade
```

### Backup Database
```bash
# Create backup
heroku pg:backups:capture

# Download
heroku pg:backups:download

# List backups
heroku pg:backups
```

## Performance & Monitoring

### View App Stats
```bash
# CPU and memory usage
heroku ps

# Restart dyno if needed
heroku ps:restart
```

### View Error Logs
```bash
# Real-time logs
heroku logs --tail

# Specific number of lines
heroku logs -n 100

# Filter by error
heroku logs --tail | grep ERROR
```

### Monitor Performance
```bash
# View metrics
heroku metrics
```

## Maintenance

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Update message"

# Deploy
git push heroku main
```

### Scale Dynos (if needed)
```bash
# Current
heroku ps

# Upgrade (paid)
heroku dyno:type standard-1x
```

### View All Config
```bash
# See all environment variables
heroku config

# Or in browser
# Open https://dashboard.heroku.com/apps/your-app-name/settings
```

## Success! 🎉

Your backend is now deployed to Heroku!

**App URL:** `https://your-app-name.herokuapp.com`

**Next Steps:**
1. Update APK with this URL
2. Test recording and transcription
3. Share APK with testers
4. Monitor Heroku logs for issues

## Support

- **Heroku Docs:** https://devcenter.heroku.com/articles/getting-started-with-python
- **Flask Deployment:** https://flask.palletsprojects.com/deployment/
- **Troubleshooting:** Run `heroku logs --tail` to debug issues
