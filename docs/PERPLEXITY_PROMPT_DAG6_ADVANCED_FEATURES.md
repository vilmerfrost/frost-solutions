# Perplexity Pro Researcher Prompt - Dag 6: Advanced Features

## Prompt för Perplexity Pro Researcher

```
Jag utvecklar en byggprojektmanagement-applikation (SaaS, multi-tenant) byggd med Next.js 16, React, TypeScript, Supabase (PostgreSQL), och Tailwind CSS. Appen hanterar projekt, tidsrapportering, fakturering, kunder, anställda, schemaläggning, och integrationer (Fortnox/Visma).

Jag behöver research om AVANCERADE FUNKTIONER för dag 6 av utvecklingen. Fokusera på:

## 1. WORKFLOW AUTOMATION & BUSINESS LOGIC
- Best practices för att implementera automatiserade workflows i projektmanagement-appar
- Exempel: Auto-generera fakturor från tidsrapporter, automatisk projektstatus-uppdatering, reminder-system
- Pattern för event-driven architecture i Next.js/Supabase
- Database triggers vs application-level automation - när använda vad
- Real-time notifications och webhooks för workflow events

## 2. AVANCERAD RAPPORTERING & ANALYTICS
- Dashboard-design patterns för byggbranschen (KPI:er, trends, förutsägelser)
- Data aggregation strategies för stora datasets (time entries, invoices, projects)
- Export-funktionalitet (PDF, Excel, CSV) med formatering
- Scheduled reports (email, weekly/monthly summaries)
- Custom report builder - låt användare skapa egna rapporter

## 3. AVANCERAD SCHEMALÄGGNING & RESOURCE MANAGEMENT
- Conflict detection algorithms för schemaläggning
- Multi-resource scheduling (anställda, utrustning, material)
- Recurring schedules och templates
- Calendar integration (Google Calendar, Outlook)
- Drag-and-drop scheduling UI patterns
- Capacity planning och workload balancing

## 4. PERMISSIONS & ROLE-BASED ACCESS CONTROL (RBAC)
- Hierarkiska roller (Super Admin, Admin, Project Manager, Employee, Client)
- Granular permissions (read/write/delete per resource type)
- Tenant-level vs user-level permissions
- Row Level Security (RLS) patterns i Supabase för komplexa permissions
- Permission inheritance och delegation

## 5. DOCUMENT MANAGEMENT & FILE HANDLING
- File upload/storage strategies (Supabase Storage vs S3)
- Document versioning
- File preview (PDF, images, Office docs) i browser
- Document templates och auto-generation
- File sharing och access control
- OCR för fakturor och dokument

## 6. MOBILE-FIRST FEATURES
- Progressive Web App (PWA) implementation för offline support
- Mobile-optimized time tracking (geolocation, photo capture)
- Push notifications för mobile
- Offline-first data sync patterns
- Camera integration för dokumentation

## 7. API & WEBHOOKS
- RESTful API design patterns för SaaS
- Webhook system för third-party integrations
- API rate limiting och authentication
- GraphQL vs REST för internal API
- API versioning strategies

## 8. ADVANCED SEARCH & FILTERING
- Full-text search implementation (PostgreSQL vs Elasticsearch)
- Faceted search UI patterns
- Saved searches och filters
- Search across multiple tables/entities
- Auto-complete och search suggestions

## 9. NOTIFICATION SYSTEM
- Real-time notifications (Supabase Realtime vs WebSockets)
- Notification preferences per user
- Email notifications med templates
- In-app notification center
- Notification batching och digest emails

## 10. BUDGET & FINANCIAL MANAGEMENT
- Budget tracking och alerts
- Cost forecasting och predictions
- Multi-currency support
- Financial reporting (P&L, cash flow)
- Integration med accounting systems (Fortnox/Visma) för bi-directional sync

## 11. PROJECT TEMPLATES & CLONING
- Project template system
- Template marketplace eller library
- Clone project with dependencies
- Standardized workflows per project type

## 12. COLLABORATION FEATURES
- Comments och mentions på projects/tasks
- Activity feed/timeline
- @mentions och notifications
- Team chat eller integration med Slack/Teams
- Shared workspaces

## 13. CUSTOMIZATION & WHITE-LABELING
- Tenant branding (logos, colors, domain)
- Custom fields per tenant
- Configurable workflows
- UI theme customization
- Custom domain per tenant

## 14. DATA MIGRATION & IMPORT/EXPORT
- Bulk import strategies (CSV, Excel)
- Data validation och error handling
- Migration tools för onboarding
- Export all tenant data (GDPR compliance)
- Backup och restore functionality

## 15. PERFORMANCE & SCALABILITY
- Database optimization för multi-tenant (indexing, partitioning)
- Caching strategies (Redis, application-level)
- CDN för static assets
- Database connection pooling
- Query optimization patterns

## SPECIFIKA FRÅGOR:
1. Vilka av dessa features är MEST värdefulla för byggbranschen?
2. Vilka är enklast att implementera med Next.js 16 + Supabase?
3. Vilka patterns och libraries rekommenderas för varje kategori?
4. Vad är cost-effective approaches (gratis/låg kostnad) för SaaS?
5. Vilka features ger bäst ROI för användare?

Ge konkreta exempel, code patterns, och rekommendationer baserat på moderna best practices (2024-2025).
```

## Användning

Kopiera prompten ovan och skicka till Perplexity Pro Researcher. Resultatet kommer ge dig:
- Research om avancerade features
- Implementation patterns
- Cost-effective solutions
- Prioriteringar för byggbranschen

Baserat på resultatet kan vi sedan skapa en detaljerad implementation plan för dag 6.

