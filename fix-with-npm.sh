#!/bin/bash

echo "=== Alternative: Fix Dependencies with npm ==="

# Remove pnpm lockfile
echo "🗑️  Removing pnpm lockfile..."
rm -f pnpm-lock.yaml

# Create package-lock.json with npm
echo "📦 Installing with npm to create package-lock.json..."
npm install

# Remove pnpm-lock.yaml from git if it exists
echo "🧹 Cleaning up git..."
git rm -f pnpm-lock.yaml 2>/dev/null || true

# Add npm lockfile
echo "📝 Adding npm lockfile..."
git add package-lock.json package.json

echo "💾 Committing npm lockfile..."
git commit -m "🔧 Fix: Switch to npm for Vercel deployment

- Removed pnpm-lock.yaml causing deployment issues
- Added package-lock.json for npm-based deployment
- Fixed dependency sync issues
- Vercel should now deploy successfully with npm"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Switched to npm and pushed to GitHub!"
echo "🔄 Vercel should now deploy with npm instead of pnpm."
