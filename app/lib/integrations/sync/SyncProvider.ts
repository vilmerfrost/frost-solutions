// app/lib/integrations/sync/SyncProvider.ts

import type {
  SyncResult,
  Conflict,
  ResolutionStrategy,
  MappedFrostData,
  AccountingProvider,
} from '@/types/integrations';

/**
 * SyncProvider: Abstract base class for sync providers
 * 
 * This defines the contract for syncing with external accounting systems.
 * Each provider (Fortnox, Visma) implements this interface.
 */
export abstract class SyncProvider {
  protected tenantId: string;
  protected config: any; // Specific config for this provider (API keys, version)

  constructor(tenantId: string, config: any) {
    this.tenantId = tenantId;
    this.config = config;
  }

  // --- Core CRUD ---

  // Fetches a resource from the external system
  abstract getExternalResource(
    resourceType: string,
    externalId: string
  ): Promise<any>;

  // Creates a resource in the external system
  abstract createExternalResource(
    resourceType: string,
    data: MappedFrostData
  ): Promise<any>;

  // Updates a resource...
  abstract updateExternalResource(
    resourceType: string,
    externalId: string,
    data: MappedFrostData
  ): Promise<any>;

  // Deletes a resource...
  abstract deleteExternalResource(
    resourceType: string,
    externalId: string
  ): Promise<void>;

  // --- Mapping (Schema Evolution Handling) ---

  // Maps external data to our internal Frost model
  // This is CRITICAL for schema evolution.
  abstract mapToFrost(
    resourceType: string,
    externalData: any
  ): Partial<MappedFrostData>;

  // Maps Frost data to the external system's model
  abstract mapFromFrost(resourceType: string, frostData: any): any;

  // --- Conflict Handling (Wraps ConflictResolver) ---

  // Detects conflicts between two versions
  abstract detectConflicts(
    frostData: any,
    externalData: any
  ): Promise<Conflict[]>;

  // --- Authentication ---

  abstract getApiClient(): Promise<any>; // Returns an initialized API client
}

