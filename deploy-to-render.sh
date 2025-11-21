#!/bin/bash

##############################################################################
# Render Deployment Helper Script for STT App
#
# This script prepares your app for Render deployment by:
# 1. Cleaning up git (removing .env)
# 2. Generating secure keys
# 3. Providing deployment instructions
##############################################################################

set -e

echo "🚀 STT App - Render Deployment Helper"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file needs to be removed
if [ -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Found backend/.env file${NC}"
    read -p "Remove from git history? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git rm --cached backend/.env 2>/dev/null || true
        if ! grep -q "backend/.env" .gitignore; then
            echo "backend/.env" >> .gitignore
        fi
        git add .gitignore
        git commit -m "Remove .env file with sensitive data" || true
        echo -e "${GREEN}✓ Removed .env from git${NC}"
    fi
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}✗ render.yaml not found!${NC}"
    echo "Please create render.yaml in project root directory"
    exit 1
fi
echo -e "${GREEN}✓ render.yaml found${NC}"

# Check requirements.txt
if [ ! -f "backend/requirements.txt" ]; then
    echo -e "${RED}✗ backend/requirements.txt not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ requirements.txt found${NC}"

# Generate secure keys
echo ""
echo -e "${BLUE}📝 Generating Secure Keys${NC}"
echo "============================="
echo ""

SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

echo -e "${YELLOW}Copy these values to Render Dashboard:${NC}"
echo ""
echo -e "${GREEN}SECRET_KEY:${NC}"
echo "$SECRET_KEY"
echo ""
echo -e "${GREEN}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""

# Prompt for API keys
echo -e "${BLUE}🔑 API Keys${NC}"
echo "============"
echo ""
echo "Enter your API keys (or press Enter to skip):"
echo ""

read -p "OPENAI_API_KEY (sk-...): " OPENAI_KEY
read -p "DEEPGRAM_API: " DEEPGRAM_KEY
read -p "ANTHROPIC_API_KEY (optional, sk-ant-...): " ANTHROPIC_KEY

# Verify git status
echo ""
echo -e "${BLUE}📦 Git Status${NC}"
echo "=============="
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Uncommitted changes detected:${NC}"
    git status --short
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Render deployment" || true
    fi
fi

# Push to GitHub
echo ""
echo -e "${BLUE}🔄 Pushing to GitHub${NC}"
echo "===================="
read -p "Push to GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git push origin "$BRANCH"
    echo -e "${GREEN}✓ Pushed to GitHub${NC}"
fi

# Provide next steps
echo ""
echo -e "${GREEN}✅ Preparation Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "==========="
echo ""
echo "1. Go to https://render.com/dashboard"
echo ""
echo "2. Click 'New +' → 'Web Service'"
echo ""
echo "3. Connect your GitHub account and select this repository"
echo ""
echo "4. Configure the service:"
echo "   - Name: stt-backend"
echo "   - Environment: Python 3"
echo "   - Region: (choose closest to you)"
echo ""
echo "5. Build & Start Commands (if not using render.yaml):"
echo "   Build: pip install -r backend/requirements.txt"
echo "   Start: gunicorn --chdir backend wsgi:app --log-file -"
echo ""
echo "6. Add Environment Variables:"
echo "   SECRET_KEY: $SECRET_KEY"
echo "   JWT_SECRET: $JWT_SECRET"
if [ -n "$OPENAI_KEY" ]; then
    echo "   OPENAI_API_KEY: $OPENAI_KEY"
fi
if [ -n "$DEEPGRAM_KEY" ]; then
    echo "   DEEPGRAM_API: $DEEPGRAM_KEY"
fi
if [ -n "$ANTHROPIC_KEY" ]; then
    echo "   ANTHROPIC_API_KEY: $ANTHROPIC_KEY"
fi
echo "   FLASK_ENV: production"
echo "   FLASK_DEBUG: 0"
echo ""
echo "7. If using render.yaml:"
echo "   → PostgreSQL database will be created automatically"
echo ""
echo "8. If NOT using render.yaml:"
echo "   → Create PostgreSQL service manually"
echo "   → Add DATABASE_URL to environment variables"
echo ""
echo "9. After deployment completes:"
echo "   → Go to Shell tab"
echo "   → Run: python -m flask db upgrade"
echo "   → Run: python seed_data.py (optional)"
echo ""
echo "10. Update frontend React Native app:"
echo "    → Set API URL to your Render app URL"
echo "    → Rebuild APK/IPA"
echo ""
echo -e "${YELLOW}For detailed guide, see: RENDER_DEPLOYMENT.md${NC}"
echo ""
