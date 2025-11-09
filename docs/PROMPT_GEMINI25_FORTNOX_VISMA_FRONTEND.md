# 🎯 PROMPT FÖR GEMINI 2.5: DATA VISUALIZATION & ANALYTICS UI

## 📊 UPPGIFT: DATA VISUALIZATION & ANALYTICS DASHBOARD FÖR INTEGRATIONS

### Kontext

Du är Gemini 2.5 och ska implementera **data visualization och analytics dashboard** för Fortnox/Visma integration. Backend är redan implementerad med sync logs och metrics, och nu behöver du skapa **production-ready visualization components** med charts, graphs, och analytics.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict mode)
- **Charts**: Recharts eller Chart.js
- **UI Library**: React + Tailwind CSS
- **Data Fetching**: React Query

### Befintlig Struktur

- Vi har `app/components/` för UI components
- Vi använder Tailwind för styling
- Vi har React Query hooks för data fetching
- Vi har dark mode support

### Backend API Endpoints (Redan Implementerade)

- `GET /api/integrations/status` - Get sync status, logs, and statistics
- Sync logs innehåller: success/error counts, duration_ms, timestamps

### Dina Specifika Uppgifter

#### 1. **Sync Statistics Dashboard** (Högsta prioritet)
- Skapa `SyncStatisticsDashboard.tsx` - Huvuddashboard
- Visa total syncs, success rate, error rate
- Visa syncs per provider (Fortnox vs Visma)
- Visa syncs över tid (line chart)
- Visa syncs per resource type (pie chart)
- Date range picker för historisk data

#### 2. **Performance Metrics Visualization** (Hög prioritet)
- Skapa `PerformanceMetricsChart.tsx` - Visa performance metrics
- Line chart för sync duration över tid
- Bar chart för API call counts per provider
- Rate limit usage gauge/meter
- Throughput visualization
- Error rate trend

#### 3. **Sync Logs Analytics** (Hög prioritet)
- Skapa `SyncLogsAnalytics.tsx` - Analysera sync logs
- Filterable table med advanced filters
- Export functionality (CSV, JSON)
- Group by provider, status, date
- Aggregate statistics (avg duration, success rate)
- Error analysis (most common errors, error trends)

#### 4. **Real-time Status Widget** (Hög prioritet)
- Skapa `RealTimeStatusWidget.tsx` - Real-time status
- Live sync status indicators
- Active syncs counter
- Queue depth indicator
- Recent syncs feed
- Auto-refresh med React Query polling

#### 5. **Historical Trends Analysis** (Medel prioritet)
- Skapa `HistoricalTrends.tsx` - Historiska trender
- Compare sync performance över tid
- Identify patterns (peak times, error spikes)
- Forecast future sync needs
- Export reports

### Specifika Implementation-Krav

1. **Charts**: Använd Recharts eller Chart.js för visualizations
2. **Responsive**: Charts ska fungera på mobile och desktop
3. **Dark Mode**: Full dark mode support för charts
4. **Performance**: Lazy load charts, virtualize large datasets
5. **Accessibility**: Screen reader support, keyboard navigation

### Önskad Output

1. **SyncStatisticsDashboard Component**
   ```typescript
   // app/components/integrations/analytics/SyncStatisticsDashboard.tsx
   - Total syncs card
   - Success rate card
   - Error rate card
   - Syncs over time chart
   - Syncs by provider pie chart
   - Date range picker
   ```

2. **PerformanceMetricsChart Component**
   ```typescript
   // app/components/integrations/analytics/PerformanceMetricsChart.tsx
   - Sync duration line chart
   - API calls bar chart
   - Rate limit usage gauge
   - Throughput visualization
   - Error rate trend
   ```

3. **SyncLogsAnalytics Component**
   ```typescript
   // app/components/integrations/analytics/SyncLogsAnalytics.tsx
   - Filterable table
   - Export buttons
   - Group by controls
   - Aggregate statistics
   - Error analysis
   ```

4. **RealTimeStatusWidget Component**
   ```typescript
   // app/components/integrations/analytics/RealTimeStatusWidget.tsx
   - Live status indicators
   - Active syncs counter
   - Queue depth
   - Recent syncs feed
   - Auto-refresh
   ```

### Exempel Implementation

```typescript
// Exempel: Sync Statistics Dashboard med Recharts
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function SyncStatisticsDashboard() {
  const { data: status } = useSyncStatus();

  const chartData = status?.recentLogs?.map(log => ({
    date: new Date(log.created_at).toLocaleDateString(),
    success: log.status === 'success' ? 1 : 0,
    error: log.status === 'error' ? 1 : 0,
  })) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <h3>Syncs Over Time</h3>
        <LineChart width={500} height={300} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="success" stroke="#10b981" />
          <Line type="monotone" dataKey="error" stroke="#ef4444" />
        </LineChart>
      </Card>
      {/* More charts... */}
    </div>
  );
}
```

### Fokusområden

- ✅ **Data Visualization**: Clear, informative charts and graphs
- ✅ **Analytics**: Deep insights into sync performance
- ✅ **Performance**: Optimized rendering, lazy loading
- ✅ **User Experience**: Intuitive filters, exports, real-time updates

### Viktigt

- Använd Recharts eller Chart.js för charts
- Implementera ALLA visualizations med full functionality
- Fokusera på data insights och analytics
- Optimera för performance med stora datasets

---

**Fokus**: Data visualization, analytics dashboard, performance metrics, historical trends. Lösningen ska ge användare djupa insikter i sync performance.

