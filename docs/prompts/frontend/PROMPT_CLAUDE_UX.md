# 🎨 CLAUDE: UX DESIGN & ACCESSIBILITY

**Frost Solutions - OCR Document Processing Frontend**  
**Developer:** Frontend Team - UX Specialist  
**Date:** November 2025

---

Du är en UX-designer och frontend-utvecklare som implementerar användarvänligt och tillgängligt UI för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Next.js 16 App Router
- React 19
- Tailwind CSS
- shadcn/ui
- Radix UI (för accessibility)

**UPPGIFT: Implementera UX & Accessibility**

### 1. Swedish Language Support

**Krav:**
- Alla texter på svenska
- Svenska datumformat (DD.MM.YYYY)
- Svenska beloppformat (1 234,56 SEK)
- Svenska felmeddelanden
- Tooltips och help texts på svenska

**Implementation:**
- Use i18n library (next-intl eller react-i18next)
- Swedish locale för dates och numbers
- Translation keys för all user-facing text
- Context-aware error messages

### 2. Accessibility (WCAG 2.1 AA)

**Krav:**
- Keyboard navigation för alla interaktioner
- Screen reader support (ARIA labels)
- Focus management
- Color contrast (min 4.5:1)
- Focus indicators
- Skip links
- Alt texts för images

**Components:**
- Accessible file upload (keyboard navigable)
- Accessible forms (proper labels, error messages)
- Accessible modals (focus trap, ESC to close)
- Accessible tables (headers, captions)

### 3. Mobile Responsive Design

**Krav:**
- Mobile-first approach
- Touch-friendly targets (min 44x44px)
- Responsive layouts
- Mobile-optimized file upload
- Swipe gestures (optional)
- Bottom sheets för mobile

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 4. User Feedback & Error Messages

**Krav:**
- Clear success messages
- Helpful error messages
- Loading states
- Empty states
- Validation feedback
- Toast notifications

**Error Messages:**
- Swedish language
- Actionable (tells user what to do)
- Context-aware
- Non-technical language
- Link to help docs (optional)

### 5. Loading States & Skeletons

**Krav:**
- Skeleton loaders för content
- Spinners för actions
- Progress indicators för long operations
- Optimistic updates där möjligt
- Perceived performance optimization

**Components:**
- SkeletonCard för lists
- SkeletonForm för forms
- ProgressBar för uploads
- Spinner för buttons

### 6. Design System

**Krav:**
- Consistent color palette
- Typography scale
- Spacing system
- Component variants
- Dark mode support (optional)

**Colors:**
- Primary: Blue (Frost brand)
- Success: Green
- Warning: Yellow/Orange
- Error: Red
- Neutral: Gray scale

**Typography:**
- Headings: Inter eller system font
- Body: Inter eller system font
- Monospace: för codes/numbers

**Implementation Guidelines:**
1. **Accessibility First:** All components måste vara accessible
2. **Mobile First:** Design för mobile, enhance för desktop
3. **Swedish Language:** All user-facing text på svenska
4. **Error Handling:** Helpful, actionable error messages
5. **Loading States:** Always show loading state, never blank screen
6. **Feedback:** Immediate feedback för alla actions

**Code Quality:**
- WCAG 2.1 AA compliance
- Keyboard navigation tested
- Screen reader tested
- Color contrast verified
- Mobile tested

**Visa mig komplett UX implementation med accessibility och Swedish language support.**

---

**Backend API:** Se `BACKEND_DEVELOPER_PROMPTS.md`  
**Components:** Se GPT-5 prompt för component structure

