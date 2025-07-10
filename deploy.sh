#!/bin/bash
# Deployment script for Nông Văn Năm

echo "🚀 Deploying Expense Tracker for Nông Văn Năm..."

# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel
vercel --prod --name="expense-tracker-nong-van-nam"

echo "✅ Deployment complete!"
