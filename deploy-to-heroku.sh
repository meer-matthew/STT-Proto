#!/bin/bash

# STT App - Heroku Deployment Script
# This script automates the Heroku deployment process

set -e  # Exit on error

echo "🚀 STT App - Heroku Deployment Script"
echo "======================================="
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it:"
    echo "   brew tap heroku/brew && brew install heroku"
    exit 1
fi

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged into Heroku. Running: heroku login"
    heroku login
fi

# Get app name
read -p "📱 Enter your Heroku app name (or press Enter to create new): " APP_NAME

if [ -z "$APP_NAME" ]; then
    read -p "📱 Enter new app name (must be unique): " APP_NAME
    echo "Creating Heroku app: $APP_NAME"
    heroku create $APP_NAME
else
    echo "Using existing app: $APP_NAME"
fi

echo ""
echo "⚙️  Setting environment variables..."
echo ""

# Generate secure keys
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# Set environment variables
heroku config:set \
    FLASK_ENV=production \
    SECRET_KEY=$SECRET_KEY \
    JWT_SECRET=$JWT_SECRET \
    JWT_EXPIRATION_HOURS=24 \
    PORT=5000 \
    -a $APP_NAME

echo ""
echo "🗄️  Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:hobby-dev -a $APP_NAME

echo ""
echo "🔑 Important: Set your API keys!"
echo "   ❗ Deepgram API Key:"
read -p "   Enter DEEPGRAM_API_KEY: " DEEPGRAM_KEY
heroku config:set DEEPGRAM_API_KEY=$DEEPGRAM_KEY -a $APP_NAME

echo ""
echo "   Or OpenAI API Key (if using):"
read -p "   Enter OPENAI_API_KEY (or press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    heroku config:set OPENAI_API_KEY=$OPENAI_KEY -a $APP_NAME
    heroku config:set AI_PROVIDER=openai -a $APP_NAME
fi

echo ""
echo "📦 Deploying to Heroku..."
echo ""

# Add Heroku remote
git remote remove heroku 2>/dev/null || true
heroku git:remote -a $APP_NAME

# Deploy
git push heroku main

echo ""
echo "🔄 Running database migrations..."
heroku run python -m flask db upgrade -a $APP_NAME

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📱 Your backend URL:"
echo "   https://$APP_NAME.herokuapp.com"
echo ""
echo "📝 Next steps:"
echo "   1. Update src/config/api.config.ts with your Heroku URL"
echo "   2. Rebuild APK: npm run build-android-release"
echo "   3. Test the app on a device"
echo ""
echo "📊 Monitor your app:"
echo "   heroku logs --tail -a $APP_NAME"
echo "   heroku open -a $APP_NAME"
echo ""
