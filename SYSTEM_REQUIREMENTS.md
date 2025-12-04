# FastLink Platform - System Requirements & Performance Guide

## Minimum System Requirements

### Development Environment
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **RAM**: 8GB minimum (16GB recommended)
- **CPU**: Dual-core 2.0GHz+ (Quad-core recommended)
- **Disk Space**: 2GB free space for node_modules
- **OS**: Windows 10/11, macOS 10.15+, or Linux

### Production Environment
- **RAM**: 4GB minimum (8GB+ recommended for 500 daily users)
- **CPU**: 2+ cores (4+ cores recommended)
- **Node.js**: v18+ or v20+ (LTS version)
- **Database**: Supabase (managed PostgreSQL)

## Performance Optimization Checklist

### 1. Development Mode Performance Issues

**Problem**: Next.js dev mode is slower than production
**Solutions**:
- Use production build for testing: `npm run build && npm start`
- Disable source maps in dev (add to `next.config.js`):
  ```js
  productionBrowserSourceMaps: false,
  ```

### 2. Bundle Size Optimization

**Current optimizations in place**:
- ✅ Package import optimization for `lucide-react` and `@radix-ui/react-icons`
- ✅ Console removal in production
- ✅ Compression enabled
- ✅ Webpack fs fallback for client bundle

**Additional recommendations**:
- Use dynamic imports for heavy components
- Lazy load charts and analytics
- Code split large dependencies

### 3. Database Query Optimization

**Check Supabase**:
- Ensure proper indexing on frequently queried columns
- Use `select()` to only fetch needed fields
- Implement pagination for large datasets
- Cache frequently accessed data

### 4. React Performance

**Already implemented**:
- ✅ `useMemo` for expensive computations
- ✅ `useCallback` for event handlers
- ✅ Parallel API calls with `Promise.all`

**Additional recommendations**:
- Use `React.memo` for expensive components
- Implement virtual scrolling for long lists
- Debounce search inputs
- Throttle scroll events

### 5. Memory Management

**Issues to check**:
- Memory leaks from event listeners
- Unclosed database connections
- Large state objects in React
- Unnecessary re-renders

### 6. Network Optimization

**Recommendations**:
- Enable HTTP/2
- Use CDN for static assets
- Implement service workers for caching
- Optimize image sizes and formats

## Quick Performance Fixes

### 1. Clear Next.js Cache
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run dev
```

### 2. Rebuild Dependencies
```bash
# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 3. Check for Memory Leaks
- Open Chrome DevTools → Performance tab
- Record while using the app
- Check for memory growth over time

### 4. Disable Unnecessary Features in Dev
Add to `.env.local`:
```
NEXT_PUBLIC_DISABLE_ANALYTICS=true
NEXT_PUBLIC_DISABLE_GSAP=true
```

## Performance Monitoring

### Check Current Performance
1. **Lighthouse Audit**: Run in Chrome DevTools
2. **Network Tab**: Check bundle sizes and load times
3. **Performance Tab**: Identify slow components
4. **React DevTools Profiler**: Find re-render issues

### Metrics to Monitor
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Common Lag Causes

1. **Too many re-renders**: Check React DevTools Profiler
2. **Large bundle size**: Analyze with `npm run build`
3. **Slow database queries**: Check Supabase query performance
4. **Memory leaks**: Monitor memory usage in DevTools
5. **Heavy animations**: Disable GSAP in dev mode
6. **Large images**: Optimize and use Next.js Image component
7. **Blocking API calls**: Use loading states and parallel requests

## Recommended Development Setup

### For Best Performance:
1. Use **Node.js v20 LTS**
2. Use **npm** (not yarn/pnpm) for consistency
3. Close other heavy applications
4. Use **SSD** instead of HDD
5. Increase Node.js memory limit:
   ```bash
   # Windows PowerShell
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   npm run dev
   ```

### Environment Variables
Ensure these are set in `.env.local`:
```
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Production Build Performance

For production, always use:
```bash
npm run build
npm start
```

This is **significantly faster** than `npm run dev` because:
- Optimized bundle
- No hot reloading overhead
- Production optimizations enabled
- Better caching

## Troubleshooting Lag

### Step 1: Identify the Issue
- Is it slow on initial load? → Bundle size issue
- Is it slow during navigation? → Route optimization needed
- Is it slow during interactions? → React re-render issue
- Is it slow on data fetching? → Database/API issue

### Step 2: Check System Resources
- Open Task Manager (Windows) or Activity Monitor (Mac)
- Check CPU and RAM usage
- Close unnecessary applications

### Step 3: Optimize Based on Issue
- Bundle size → Code splitting
- Re-renders → Memoization
- Database → Query optimization
- Memory → Fix leaks

## Expected Performance

### Development Mode
- Initial load: 3-5 seconds
- Page navigation: 1-2 seconds
- API calls: 200-500ms

### Production Mode
- Initial load: 1-2 seconds
- Page navigation: < 500ms
- API calls: 100-300ms

If performance is worse than this, investigate the specific bottleneck.
