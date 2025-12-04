# Webpack Error Fix - Step by Step

## Error
```
Cannot read properties of undefined (reading 'call')
at requireModule (webpack-internal:///1530:100:27)
```

## Root Cause
This is a Next.js 15.5.6 + React 19 compatibility issue with webpack module loading, possibly triggered by:
- Experimental package optimizations
- Corrupted build cache
- Node modules issues

## Complete Fix Steps

### Step 1: Stop Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running

### Step 2: Clear All Caches
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Clear node_modules (if needed)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

### Step 3: Reinstall
```powershell
# Reinstall dependencies
npm install
```

### Step 4: Restart Dev Server
```powershell
npm run dev
```

## What Was Changed

1. ✅ **Disabled experimental optimizePackageImports** - This was causing webpack module resolution issues
2. ✅ **Cleared .next cache** - Removed corrupted build files
3. ✅ **Cleared npm cache** - Ensured clean package installation

## Alternative: Use Production Build

If dev mode still has issues, use production build:
```powershell
npm run build
npm start
```

Production builds are more stable and don't have the same webpack issues.

## If Error Persists

1. **Check Node.js version**: Should be v18+ or v20 LTS
   ```powershell
   node --version
   ```

2. **Update Next.js** (if needed):
   ```powershell
   npm install next@latest
   ```

3. **Full clean reinstall**:
   ```powershell
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   npm run dev
   ```

4. **Check for conflicting packages**:
   ```powershell
   npm outdated
   npm audit
   ```

## Prevention

- Don't use experimental features unless necessary
- Clear .next cache when switching branches
- Use production builds for testing performance
- Keep dependencies updated










