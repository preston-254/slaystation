# 🔄 iOS Cache Fix - Instructions

## Problem
iOS Safari aggressively caches web pages, showing old versions of:
- Social media icons
- Reels/videos section
- CSS and JavaScript files

## Solution Applied

### 1. **Cache-Busting Headers**
- Added `no-cache` headers for HTML files in `firebase.json`
- Prevents browsers from caching HTML pages

### 2. **Version Query Parameters**
- Added `?v=20250124` to all CSS and JS files
- Forces browsers to reload when version changes

### 3. **Meta Tags**
- Added cache-control meta tags in HTML
- Specifically targets iOS Safari

### 4. **App Version Check**
- JavaScript checks for version changes
- Automatically clears cache and reloads if version updated

### 5. **Updated Font Awesome**
- Upgraded from 6.4.0 to 6.5.1
- Ensures latest social media icons

## For Users on iOS

If you still see old content:

### Method 1: Hard Refresh
1. Open Safari on iOS
2. Go to your website
3. Tap and hold the refresh button
4. Select "Reload Without Content Blockers"

### Method 2: Clear Safari Cache
1. Settings → Safari
2. Clear History and Website Data
3. Reload the website

### Method 3: Private Browsing
1. Open Safari in Private mode
2. Visit the website
3. This bypasses all cache

## For Developers

To update the version and force refresh:
1. Change `APP_VERSION` in `index.html` (line ~592)
2. Change `?v=20250124` in all CSS/JS links
3. Deploy - users will automatically get the new version

---

**Current Version:** 20250124
**Last Updated:** After iOS cache fix

