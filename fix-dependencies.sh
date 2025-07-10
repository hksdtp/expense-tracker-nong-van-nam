#!/bin/bash

echo "=== Fixing Dependencies for Vercel Deployment ==="

# Remove existing lockfile
echo "🗑️  Removing old lockfile..."
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

# Clean node_modules
echo "🧹 Cleaning node_modules..."
rm -rf node_modules

# Install dependencies with pnpm
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Verify lockfile was created
echo "✅ Checking if lockfile was created..."
if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ pnpm-lock.yaml created successfully"
else
    echo "❌ Failed to create pnpm-lock.yaml"
    exit 1
fi

# Add and commit the new lockfile
echo "📝 Adding lockfile to git..."
git add pnpm-lock.yaml package.json

echo "💾 Committing lockfile update..."
git commit -m "🔧 Fix: Update pnpm-lock.yaml for Vercel deployment

- Regenerated pnpm-lock.yaml to sync with package.json
- Fixed dependency mismatch causing Vercel build failure
- Added sharp dependency for image processing
- Updated @stagewise/toolbar-next dependency"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Dependencies fixed and pushed to GitHub!"
echo "🔄 Vercel should now be able to deploy successfully."
