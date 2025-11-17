# Heroku Quick Start Guide

## 🚀 Fastest Way to Deploy (5 minutes)

### 1. Install Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
```

### 2. Run Deployment Script
```bash
cd /Users/matthewmeer/WebstormProjects/STT
chmod +x deploy-to-heroku.sh
./deploy-to-heroku.sh
```

The script will:
- ✅ Create Heroku app
- ✅ Set environment variables
- ✅ Add PostgreSQL database
- ✅ Prompt for API keys (Deepgram/OpenAI)
- ✅ Deploy code
- ✅ Run migrations

### 3. Update APK Configuration

After deployment, you'll get a URL like: `https://your-app-name.herokuapp.com`

Update your config:
```typescript
// src/config/api.config.ts
export const API_CONFIG = {
    BASE_URL: 'https://your-app-name.herokuapp.com',
    AUTH_URL: 'https://your-app-name.herokuapp.com/api/auth',
    // ... rest
};
```

### 4. Rebuild APK
```bash
npm run build-android-release
```

Done! 🎉

---

## 📋 Manual Deployment (if script doesn't work)

### Step 1: Login
```bash
heroku login
```

### Step 2: Create App
```bash
heroku create your-unique-app-name
```

### Step 3: Add Database
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 4: Set Environment Variables
```bash
# Generate secure keys
heroku config:set SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
heroku config:set JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# Set other vars
heroku config:set FLASK_ENV=production
heroku config:set DEEPGRAM_API_KEY=your-deepgram-key
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set AI_PROVIDER=openai

# Verify
heroku config
```

### Step 5: Deploy
```bash
git add .
git commit -m "Prepare for Heroku deployment"
heroku git:remote -a your-app-name
git push heroku main
```

### Step 6: Setup Database
```bash
heroku run python -m flask db upgrade
```

### Step 7: Test
```bash
heroku open
heroku logs --tail
```

---

## 🔧 After Deployment Commands

### View Live Logs
```bash
heroku logs --tail
```

### Open App in Browser
```bash
heroku open
```

### Check App Status
```bash
heroku ps
heroku config
```

### Update Code
```bash
git push heroku main
```

### Reset Database (CAREFUL!)
```bash
heroku pg:reset DATABASE
heroku run python -m flask db upgrade
```

### SSH into Dyno
```bash
heroku ps:exec
```

---

## 💰 Pricing

- **Free Tier:**
  - ❌ Now discontinued (as of Nov 2022)

- **Hobby Tier:**
  - ✅ $5/month per dyno (web server)
  - ✅ $9/month for Hobby PostgreSQL
  - ✅ Total: ~$14/month minimum

- **Upgrade Options:**
  - Standard: $25/month
  - Performance: $50+/month

---

## ⚠️ Important Notes

1. **Database:** SQLite won't work on Heroku (read-only filesystem). Use PostgreSQL.

2. **API Keys:** Never commit `.env` file. Set all keys via `heroku config:set`

3. **Costs:** Free tier is gone. Budget ~$15-20/month for basic setup.

4. **Dyno Sleep:** App will sleep after 30 mins of inactivity on hobby plan.

5. **Logs:** Free dyno logs rotate after 24 hours. Use `heroku logs --tail` for live logs.

---

## 🐛 Troubleshooting

### "Application Error"
```bash
heroku logs --tail
# Check for Python/Flask errors
```

### "Permission denied" (database)
```bash
# Re-run migrations
heroku run python -m flask db upgrade

# Check if DATABASE_URL is set
heroku config:get DATABASE_URL
```

### "Gunicorn failed to start"
```bash
# Test app locally
python backend/run.py

# Check Procfile
cat backend/Procfile
```

### API key not working
```bash
# Verify key is set
heroku config | grep DEEPGRAM

# Test API directly
heroku run python -c "import os; print(os.getenv('DEEPGRAM_API_KEY'))"
```

---

## 📞 Support

- **Heroku Docs:** https://devcenter.heroku.com
- **Check Status:** https://status.heroku.com
- **Heroku Support:** https://help.heroku.com

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App loads without error: `heroku open`
- [ ] Logs show no errors: `heroku logs --tail`
- [ ] Database exists: `heroku pg:psql`
- [ ] API key is set: `heroku config | grep DEEPGRAM`
- [ ] APK updated with new URL
- [ ] APK successfully logs in
- [ ] Can record and transcribe

All ✅? You're ready! 🚀
