# 🎯 PROMPT FÖR GEMINI 2.5: SYNC ARCHITECTURE & CONFLICT RESOLUTION

## 🏗️ UPPGIFT: LONG-TERM SYNC ARCHITECTURE DESIGN

### Kontext

Du är Gemini 2.5 och ska designa **robust, skalbar sync architecture** för Fortnox/Visma integration. Du har Perplexity's research guide, men nu ska du skapa en **future-proof arkitektur** som hanterar edge cases, conflict resolution och schema evolution.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Database**: Supabase (PostgreSQL)
- **Background Jobs**: Supabase Edge Functions eller pg_cron
- **Queue System**: PostgreSQL-based queue (eller BullMQ)

### Perplexity Research Guide

Du har tillgång till komplett research guide med:
- ✅ Sync strategies (webhooks + polling)
- ✅ Conflict resolution patterns
- ✅ Idempotency keys
- ✅ Error handling

### Dina Specifika Uppgifter

#### 1. **Sync Architecture Design** (Högsta prioritet)
- Designa hybrid sync-strategi (webhooks + polling fallback)
- Implementera sync queue system för reliable processing
- Designa sync state machine (pending → processing → completed/failed)
- Handle concurrent syncs (mutex/locking)
- Designa incremental sync (delta sync) för performance

#### 2. **Conflict Resolution** (Högsta prioritet)
- Implementera conflict detection logic
- Designa conflict resolution strategies:
  - Last-write-wins (by timestamp)
  - Manual merge (for critical fields)
  - Source priority (Frost vs Fortnox/Visma)
- Handle bidirectional sync conflicts
- User notification för conflicts som kräver manual resolution

#### 3. **Edge Cases & Schema Evolution** (Hög prioritet)
- Handle schema changes under sync (migration during export)
- Handle deleted resources (soft delete vs hard delete)
- Handle partial failures (some invoices sync, others fail)
- Handle network interruptions mid-sync
- Handle API version changes (Fortnox/Visma API updates)

#### 4. **Scalability Design** (Hög prioritet)
- Designa för stora datasets (1000+ invoices per sync)
- Batch processing strategies
- Parallel sync för multiple tenants
- Database indexing strategy för sync performance
- Caching strategies för frequently accessed data

#### 5. **Long-term Maintainability** (Hög prioritet)
- Designa för att lägga till nya providers (inte bara Fortnox/Visma)
- Abstract sync interface för provider-agnostic code
- Plugin architecture för nya sync strategies
- Configuration-driven sync (tenant-specific sync rules)

### Specifika Arkitektur-Krav

1. **Provider Abstraction**: Abstract base class för sync providers
2. **Strategy Pattern**: Olika sync strategies (webhook, polling, manual)
3. **State Machine**: Tydlig sync state management
4. **Queue System**: Reliable queue för sync jobs
5. **Monitoring**: Built-in monitoring och alerting

### Önskad Output

1. **Sync Architecture Diagram**
   - Flow diagram för sync process
   - State transitions
   - Error recovery paths

2. **Abstract Sync Provider**
   ```typescript
   export abstract class SyncProvider {
     abstract syncCustomer(customerId: string): Promise<SyncResult>
     abstract syncInvoice(invoiceId: string): Promise<SyncResult>
     abstract detectConflicts(resource: any): Promise<Conflict[]>
     abstract resolveConflict(conflict: Conflict, strategy: ResolutionStrategy): Promise<void>
   }
   ```

3. **Conflict Resolution System**
   ```typescript
   export class ConflictResolver {
     async detectConflicts(frostData: any, externalData: any): Promise<Conflict[]>
     async resolveConflicts(conflicts: Conflict[], strategy: ResolutionStrategy): Promise<void>
     async requestManualResolution(conflict: Conflict): Promise<void>
   }
   ```

4. **Sync Queue System**
   ```typescript
   export class SyncQueue {
     async enqueue(job: SyncJob): Promise<void>
     async processQueue(): Promise<void>
     async retryFailedJobs(): Promise<void>
   }
   ```

5. **State Machine**
   ```typescript
   export class SyncStateMachine {
     transition(job: SyncJob, newState: SyncState): void
     canTransition(from: SyncState, to: SyncState): boolean
   }
   ```

### Edge Cases att Hantera

1. **Schema Evolution**
   - Scenario: Migration körs under sync
   - Solution: Version-aware sync, graceful degradation

2. **Concurrent Modifications**
   - Scenario: Invoice ändras i både Frost och Fortnox samtidigt
   - Solution: Conflict detection och resolution strategy

3. **Partial Failures**
   - Scenario: 10 invoices, 8 synkar, 2 failar
   - Solution: Individual job tracking, retry failed only

4. **Network Interruptions**
   - Scenario: Sync avbryts mitt i processen
   - Solution: Transactional sync, rollback on failure

5. **API Version Changes**
   - Scenario: Fortnox uppdaterar API, breaking changes
   - Solution: Version detection, adapter pattern

### Fokusområden

- ✅ **Long-term**: Arkitektur som fungerar i 5+ år
- ✅ **Scalability**: Hantera 1000+ tenants, 10000+ invoices
- ✅ **Maintainability**: Lätt att lägga till nya providers
- ✅ **Edge Cases**: Hantera alla edge cases gracefully

### Exempel Implementation

```typescript
// Exempel: Conflict detection med schema evolution support
export class ConflictDetector {
  async detectConflicts(
    frostResource: FrostInvoice,
    externalResource: FortnoxInvoice,
    schemaVersion: string
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Version-aware conflict detection
    if (schemaVersion === 'v1') {
      // Old schema logic
    } else if (schemaVersion === 'v2') {
      // New schema logic
    }

    // Detect field-level conflicts
    if (frostResource.total !== externalResource.Total) {
      conflicts.push({
        field: 'total',
        frostValue: frostResource.total,
        externalValue: externalResource.Total,
        timestamp: {
          frost: frostResource.updated_at,
          external: externalResource.LastModified
        }
      });
    }

    return conflicts;
  }
}
```

### Viktigt

- Tänk på long-term maintainability
- Designa för schema evolution
- Hantera alla edge cases
- Fokusera på skalbarhet och performance

---

**Fokus**: Long-term architecture, conflict resolution, edge cases, scalability. Lösningen ska vara future-proof och hantera alla edge cases gracefully.

