// app/lib/repositories/factoring.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FactoringApplication, CreateFactoringApplicationInput } from '@/lib/domain/factoring/types';
import { NotFoundError } from '@/lib/utils/errors';
import { Result, ok, err, asyncTry } from '@/lib/utils/result';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FactoringRepository');

export interface IFactoringRepository {
 create(input: CreateFactoringApplicationInput, tenantId: string): Promise<Result<FactoringApplication, Error>>;
 findById(id: string, tenantId: string): Promise<Result<FactoringApplication, Error>>;
 findByInvoiceId(invoiceId: string, tenantId: string): Promise<Result<FactoringApplication | null, Error>>;
 update(id: string, data: Partial<FactoringApplication>, tenantId: string): Promise<Result<FactoringApplication, Error>>;
 list(tenantId: string, filters?: FactoringListFilters): Promise<Result<FactoringApplication[], Error>>;
}

export interface FactoringListFilters {
 status?: string;
 provider?: string;
 limit?: number;
 offset?: number;
}

export class FactoringRepository implements IFactoringRepository {
 constructor(private readonly db: SupabaseClient) {}

 async create(
  input: CreateFactoringApplicationInput,
  tenantId: string
 ): Promise<Result<FactoringApplication, Error>> {
  logger.info('Creating factoring application', { tenantId, invoiceId: input.invoice_id });

  return asyncTry(async () => {
   const { data, error } = await this.db
    .schema('app')
    .from('factoring_applications')
    .insert({
     tenant_id: tenantId,
     invoice_id: input.invoice_id,
     provider: input.provider,
     invoice_amount: input.invoice_amount,
     status: 'draft',
    })
    .select()
    .single();

   if (error) {
    logger.error('Failed to create application', error, { tenantId, input });
    throw error;
   }

   logger.info('Application created', { applicationId: data.id });
   return data as FactoringApplication;
  });
 }

 async findById(
  id: string,
  tenantId: string
 ): Promise<Result<FactoringApplication, Error>> {
  logger.debug('Finding application by ID', { id, tenantId });

  return asyncTry(async () => {
   const { data, error } = await this.db
    .schema('app')
    .from('factoring_applications')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

   if (error || !data) {
    throw new NotFoundError('FactoringApplication', id);
   }

   return data as FactoringApplication;
  });
 }

 async findByInvoiceId(
  invoiceId: string,
  tenantId: string
 ): Promise<Result<FactoringApplication | null, Error>> {
  logger.debug('Finding application by invoice', { invoiceId, tenantId });

  return asyncTry(async () => {
   const { data, error } = await this.db
    .schema('app')
    .from('factoring_applications')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

   if (error) {
    throw error;
   }

   return data as FactoringApplication | null;
  });
 }

 async update(
  id: string,
  data: Partial<FactoringApplication>,
  tenantId: string
 ): Promise<Result<FactoringApplication, Error>> {
  logger.info('Updating application', { id, tenantId });

  return asyncTry(async () => {
   const { data: updated, error } = await this.db
    .schema('app')
    .from('factoring_applications')
    .update({
     ...data,
     updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

   if (error || !updated) {
    throw new NotFoundError('FactoringApplication', id);
   }

   logger.info('Application updated', { id });
   return updated as FactoringApplication;
  });
 }

 async list(
  tenantId: string,
  filters: FactoringListFilters = {}
 ): Promise<Result<FactoringApplication[], Error>> {
  logger.debug('Listing applications', { tenantId, filters });

  return asyncTry(async () => {
   let query = this.db
    .schema('app')
    .from('factoring_applications')
    .select('*')
    .eq('tenant_id', tenantId);

   if (filters.status) {
    query = query.eq('status', filters.status);
   }

   if (filters.provider) {
    query = query.eq('provider', filters.provider);
   }

   query = query
    .order('created_at', { ascending: false })
    .limit(filters.limit || 50)
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

   const { data, error } = await query;

   if (error) {
    throw error;
   }

   return (data || []) as FactoringApplication[];
  });
 }
}

