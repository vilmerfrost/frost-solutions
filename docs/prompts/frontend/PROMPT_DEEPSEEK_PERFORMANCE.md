# ⚡ DEEPSEEK: PERFORMANCE & OPTIMIZATION

**Frost Solutions - OCR Document Processing Frontend**  
**Developer:** Frontend Team - Performance Specialist  
**Date:** November 2025

---

Du är en frontend-utvecklare som optimerar performance för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Next.js 16 App Router
- React 19
- TypeScript
- React Query
- Virtual scrolling libraries

**UPPGIFT: Optimera Frontend Performance**

### 1. Code Splitting & Lazy Loading

**Krav:**
- Route-based code splitting
- Component lazy loading
- Dynamic imports för heavy components
- Reduce initial bundle size
- Load components on demand

**Targets:**
- Initial bundle < 200KB (gzipped)
- Route chunks < 100KB each
- Lazy load OCR components
- Lazy load heavy libraries

### 2. Image Optimization

**Krav:**
- Optimize uploaded images
- Use Next.js Image component
- Lazy load images
- Responsive images
- WebP format support
- Blur placeholders

**Implementation:**
- Use `next/image` för all images
- Generate thumbnails för file previews
- Lazy load images below fold
- Use blur data URLs för placeholders

### 3. Virtual Scrolling

**Krav:**
- Virtual scrolling för long lists
- Delivery notes list
- Invoices list
- Form submissions list
- Material items list

**Libraries:**
- `@tanstack/react-virtual` eller `react-window`
- Handle 1000+ items smoothly
- Maintain scroll position
- Fast filtering och sorting

### 4. React Optimization

**Krav:**
- Memoization för expensive components
- useMemo för expensive calculations
- useCallback för event handlers
- React.memo för pure components
- Prevent unnecessary re-renders

**Optimizations:**
- Memoize OCR result components
- Memoize form field components
- Memoize list items
- Optimize context providers
- Reduce prop drilling

### 5. Bundle Size Optimization

**Krav:**
- Analyze bundle size
- Remove unused dependencies
- Tree shaking
- Minimize CSS
- Optimize fonts

**Tools:**
- `@next/bundle-analyzer`
- Webpack bundle analyzer
- Identify heavy dependencies
- Replace med lighter alternatives

### 6. Performance Monitoring

**Krav:**
- Track Core Web Vitals
- Monitor component render times
- Track API call performance
- Measure user interactions
- Performance budgets

**Metrics:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- TTI (Time to Interactive) < 3.5s

**Implementation Guidelines:**
1. **Measure First:** Use React DevTools Profiler
2. **Optimize Hot Paths:** Focus on frequently used components
3. **Lazy Load:** Load code only when needed
4. **Memoize:** Prevent unnecessary recalculations
5. **Virtualize:** Handle large lists efficiently
6. **Monitor:** Track performance metrics

**Code Quality:**
- Performance budgets enforced
- Bundle size tracked
- Core Web Vitals monitored
- Render performance optimized
- Memory leaks prevented

**Visa mig optimized frontend med performance best practices implementerade.**

---

**Backend API:** Se `BACKEND_DEVELOPER_PROMPTS.md`  
**Components:** Se GPT-5 prompt för component structure

