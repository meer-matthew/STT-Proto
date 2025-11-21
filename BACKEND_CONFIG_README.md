# Backend Configuration Guide

This guide explains how to switch between local development and live Render backend.

## Quick Start

### 🔧 Edit `src/config/backend-config.json`

Change the `current` value:

**For Local Testing:**
```json
{
  "environment": "development",
  "current": "development",
  "backends": {
    "development": {
      "url": "http://192.168.68.101:5001",
      "description": "Local backend (your machine)"
    },
    "live": {
      "url": "https://stt-proto-1.onrender.com",
      "description": "Live Render backend"
    }
  }
}
```

**For Live Testing:**
```json
{
  "environment": "production",
  "current": "live",
  "backends": {
    "development": {
      "url": "http://192.168.68.101:5001",
      "description": "Local backend (your machine)"
    },
    "live": {
      "url": "https://stt-proto-1.onrender.com",
      "description": "Live Render backend"
    }
  }
}
```

## Running the App

### Local Backend (Your Machine)

1. **Update config:**
   ```json
   "current": "development"
   ```

2. **Run your backend** on your machine:
   ```bash
   cd backend
   python run.py
   ```

3. **Run the app:**
   ```bash
   npm run android    # or npm run ios
   ```

### Live Render Backend

1. **Update config:**
   ```json
   "current": "live"
   ```

2. **Run the app:**
   ```bash
   npm run android    # or npm run ios
   ```
   No backend server needed - connects to Render!

## How It Works

The app reads `backend-config.json` and uses the URL specified in `backends[current]`.

**Priority Order:**
1. `backend-config.json` - **You control this manually** ✅
2. Environment variables - `RENDER_APP_URL` or `HEROKU_APP_URL`
3. Auto-detection - Android emulator/iOS simulator/physical device

## Common Tasks

### Task: Test against local backend
```bash
# 1. Edit src/config/backend-config.json
"current": "development"

# 2. Start your local backend
cd backend && python run.py

# 3. Run the app
npm run android
```

### Task: Test against live Render backend
```bash
# 1. Edit src/config/backend-config.json
"current": "live"

# 2. Run the app
npm run android
```

### Task: Build production APK for Render
```bash
# 1. Make sure current is set to "live"
# 2. Build release APK
npm run build-android-release
```

## Updating the Backend URL

If you deploy to a different Render URL or change your local IP:

1. Edit `src/config/backend-config.json`
2. Update the URL under the corresponding backend
3. Example:
   ```json
   "development": {
     "url": "http://192.168.68.105:5001",  // New local IP
     "description": "Local backend"
   }
   ```
4. Save and restart your app

## Debugging

Check the console logs to see which backend is being used:

```
🚀 Using development backend: http://192.168.68.101:5001
```
or
```
🚀 Using live backend: https://stt-proto-1.onrender.com
```

## Tips

- ✅ Always run `npm run detect-ip` after changing networks to update local IP
- ✅ Keep `backend-config.json` in git with development as default
- ✅ No rebuild needed when switching backends - just edit the config and restart
- ⚠️ Make sure your local backend is running if using `development` config
- ⚠️ Make sure Render backend is deployed and running for `live` config
