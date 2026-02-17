#!/bin/bash

# Hostel Management System - Quick Deployment Script
# This script prepares your project for Render deployment

echo "🚀 Hostel Management System - Deployment Preparation"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ .env created - Please update with your values"
else
    echo "✅ .env file exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if MongoDB is accessible
echo ""
echo "🔍 Checking MongoDB connection..."
node -e "
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Please check your MONGODB_URI in .env file');
    process.exit(1);
  });
" || echo "⚠️  MongoDB check skipped"

# Create admin user
echo ""
echo "👤 Creating admin user..."
node create-admin.js || echo "⚠️  Admin creation skipped (may already exist)"

# Git add all files
echo ""
echo "📝 Staging files for commit..."
git add .

# Show git status
echo ""
echo "📊 Git Status:"
git status --short

echo ""
echo "=================================================="
echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Review staged files above"
echo "2. Commit: git commit -m 'Ready for deployment'"
echo "3. Add remote: git remote add origin YOUR_GITHUB_URL"
echo "4. Push: git push -u origin main"
echo "5. Deploy on Render (see DEPLOYMENT-GUIDE.md)"
echo ""
echo "📖 Full guide: DEPLOYMENT-GUIDE.md"
echo "=================================================="
