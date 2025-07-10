# Cloudinary Setup Guide

## 🎯 Overview
This guide helps you set up Cloudinary for image upload functionality in the Vietnamese Expense Tracking application.

## 📋 Prerequisites
- Cloudinary account (free tier available)
- Access to your project's environment variables

## 🚀 Setup Steps

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials
1. Login to your Cloudinary dashboard
2. Go to **Dashboard** → **Account Details**
3. Copy the following values:
   - **Cloud Name**
   - **API Key** 
   - **API Secret**

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Install Dependencies
The `cloudinary` package is already added to package.json:

```bash
npm install cloudinary
```

## 🎨 Features Implemented

### macOS-Style Upload Interface
- **Clean Design**: Matches macOS/iOS design system
- **Two Options**: "Take Photo" and "Choose File"
- **Smooth Animations**: 60fps transitions with ease-in-out
- **Backdrop Blur**: iOS-style vibrancy effects
- **Rounded Corners**: 24px border-radius for modern look

### Cloudinary Integration
- **Auto Optimization**: Quality and format optimization
- **Image Transformation**: Automatic resizing (max 1200x1200)
- **Organized Storage**: Files stored in `expense-receipts` folder
- **Tagging**: Images tagged with `receipt` and `expense-tracking`

### Upload Features
- **Progress Indicator**: Real-time upload progress
- **File Validation**: Type and size validation (max 10MB)
- **Error Handling**: Comprehensive error messages
- **Mobile Support**: Camera capture on mobile devices

## 🔧 Configuration Options

### Image Transformations
The upload API applies these transformations:
- **Size Limit**: 1200x1200 pixels maximum
- **Quality**: Auto-optimized
- **Format**: Auto-selected (WebP, AVIF, etc.)

### Upload Settings
- **Max File Size**: 10MB
- **Accepted Formats**: All image types
- **Storage Folder**: `expense-receipts`
- **Tags**: `receipt`, `expense-tracking`

## 🎯 Usage

### In Components
```tsx
import { MacOSReceiptUpload } from '@/components/macos-receipt-upload'

// Use in your component
<MacOSReceiptUpload
  isOpen={showUpload}
  onClose={() => setShowUpload(false)}
  onImageUpload={(imageUrl) => {
    // Handle uploaded image URL
    console.log('Uploaded:', imageUrl)
  }}
/>
```

### API Endpoint
The upload endpoint is available at `/api/upload-cloudinary`:
- **Method**: POST
- **Body**: FormData with `file` field
- **Response**: JSON with `secure_url` and metadata

## 🔒 Security

### Environment Variables
- Never commit `.env.local` to version control
- Use different credentials for development/production
- Rotate API secrets regularly

### Upload Restrictions
- File type validation (images only)
- File size limits (10MB max)
- Automatic image optimization
- Secure HTTPS URLs

## 🎨 Design System

### macOS/iOS Style Guide
- **Colors**: Neutral grays with subtle transparency
- **Typography**: SF Pro Display font family
- **Spacing**: 16px, 24px, 32px grid system
- **Shadows**: Subtle depth with backdrop-blur
- **Animations**: 200ms duration with ease-in-out

### Component Structure
```
MacOSReceiptUpload/
├── Header (with back/close buttons)
├── Content Area
│   ├── Upload Progress (when uploading)
│   └── Upload Options (when idle)
│       ├── Take Photo (camera icon)
│       └── Choose File (folder icon)
└── Hidden File Inputs
```

## 🚀 Deployment

### Vercel Environment Variables
Add these to your Vercel project settings:
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Production Considerations
- Use separate Cloudinary environments for dev/prod
- Enable auto-backup for uploaded images
- Set up monitoring for upload failures
- Configure CDN settings for optimal performance

## 📱 Mobile Optimization

### Touch-Friendly Design
- **Button Size**: Minimum 44px touch targets
- **Spacing**: Generous padding for easy tapping
- **Feedback**: Visual feedback on touch interactions

### Camera Integration
- **Environment Camera**: Rear camera for receipt capture
- **File Picker**: Gallery access for existing photos
- **Progressive Enhancement**: Works without camera access

## 🎉 Benefits Over Google Drive

### Performance
- **Faster Uploads**: Optimized for image handling
- **Auto Optimization**: Automatic compression and format selection
- **CDN Delivery**: Global content delivery network

### Features
- **Image Transformations**: On-the-fly resizing and optimization
- **Multiple Formats**: Support for modern formats (WebP, AVIF)
- **Analytics**: Upload and delivery analytics
- **Backup**: Automatic backup and redundancy

### Developer Experience
- **Simple API**: Easy-to-use REST API
- **Rich SDKs**: Comprehensive JavaScript SDK
- **Documentation**: Excellent documentation and examples
- **Free Tier**: Generous free tier for development
