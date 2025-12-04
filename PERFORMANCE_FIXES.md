# Quick Performance Fixes for FastLink

## Immediate Actions to Reduce Lag

### 1. Increase Node.js Memory Limit
```powershell
# Windows PowerShell - Run before npm run dev
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

Or create a `.env.local` file:
```
NODE_OPTIONS=--max-old-space-size=4096
```

### 2. Use Production Build for Testing
Development mode is slower. Test with production build:
```bash
npm run build
npm start
```

### 3. Disable Source Maps in Development
Add to `next.config.js`:
```js
productionBrowserSourceMaps: false,
```

### 4. Clear Cache and Rebuild
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear node_modules (optional, if issues persist)
Remove-Item -Recurse -Force node_modules
npm install

# Restart dev server
npm run dev
```

### 5. Check for Memory Leaks
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Use the app for 30 seconds
5. Stop recording
6. Check for memory growth

### 6. Optimize Database Queries
Ensure Supabase queries:
- Only select needed fields
- Use proper indexes
- Implement pagination
- Cache results when possible

### 7. Reduce Bundle Size
Check bundle size:
```bash
npm run build
```

Look for large dependencies and consider:
- Dynamic imports
- Code splitting
- Removing unused dependencies

### 8. Disable Heavy Features in Dev
Temporarily disable GSAP animations:
```js
// In components using GSAP
if (process.env.NODE_ENV === 'production') {
  // GSAP code
}
```

## System Requirements Check

### Minimum for Development:
- **RAM**: 8GB (16GB recommended)
- **CPU**: 2+ cores (4+ recommended)
- **Node.js**: v18+ (v20 LTS recommended)
- **Disk**: SSD recommended

### Check Your System:
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check available RAM (Windows)
systeminfo | findstr /C:"Total Physical Memory"
```

## Quick Diagnostic Commands

### Check for Issues:
```bash
# Check for outdated packages
npm outdated

# Check bundle size
npm run build

# Check for security issues
npm audit

# Clear all caches
npm cache clean --force
```

## If Still Lagging

1. **Close other applications** (browsers, IDEs, etc.)
2. **Restart your computer**
3. **Use a different browser** (Chrome, Firefox, Edge)
4. **Check antivirus** - may be scanning node_modules
5. **Disable browser extensions** - can slow down dev server
6. **Use production build** instead of dev mode for testing

## Performance Monitoring

### Chrome DevTools:
1. **Network Tab**: Check load times
2. **Performance Tab**: Record and analyze
3. **Lighthouse**: Run audit for scores
4. **Memory Tab**: Check for leaks

### Next.js Analytics:
Add to see performance metrics:
```js
// next.config.js
experimental: {
  instrumentationHook: true,
}
```










