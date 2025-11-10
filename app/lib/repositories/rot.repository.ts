// app/lib/repositories/rot.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RotApplication, CreateRotApplicationInput } from '@/lib/domain/rot/types';
import { NotFoundError } from '@/lib/utils/errors';
import { Result, ok, err, asyncTry } from '@/lib/utils/result';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RotRepository');

export interface IRotRepository {
  create(input: CreateRotApplicationInput, tenantId: string, userId: string): Promise<Result<RotApplication, Error>>;
  findById(id: string, tenantId: string): Promise<Result<RotApplication, Error>>;
  update(id: string, data: Partial<RotApplication>, tenantId: string): Promise<Result<RotApplication, Error>>;
  list(tenantId: string): Promise<Result<RotApplication[], Error>>;
}

export class RotRepository implements IRotRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(
    input: CreateRotApplicationInput,
    tenantId: string,
    userId: string
  ): Promise<Result<RotApplication, Error>> {
    logger.info('Creating ROT application', { tenantId, invoiceId: input.invoice_id });

    return asyncTry(async () => {
      const { data, error } = await this.db
        .schema('app')
        .from('rot_applications')
        .insert({
          tenant_id: tenantId,
          invoice_id: input.invoice_id,
          customer_id: input.customer_id,
          work_type: input.work_type,
          property_designation: input.property_designation,
          apartment_number: input.apartment_number,
          labor_cost: input.labor_cost,
          material_cost: input.material_cost,
          total_amount: input.labor_cost + input.material_cost,
          work_start_date: input.work_start_date,
          work_end_date: input.work_end_date,
          invoice_date: input.invoice_date,
          customer_personnummer: input.customer_personnummer,
          customer_name: input.customer_name,
          customer_address: input.customer_address,
          customer_postal_code: input.customer_postal_code,
          customer_city: input.customer_city,
          status: 'draft',
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create application', error);
        throw error;
      }

      logger.info('Application created', { applicationId: data.id });
      return data as RotApplication;
    });
  }

  async findById(id: string, tenantId: string): Promise<Result<RotApplication, Error>> {
    return asyncTry(async () => {
      const { data, error } = await this.db
        .schema('app')
        .from('rot_applications')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        throw new NotFoundError('RotApplication', id);
      }

      return data as RotApplication;
    });
  }

  async update(
    id: string,
    updateData: Partial<RotApplication>,
    tenantId: string
  ): Promise<Result<RotApplication, Error>> {
    return asyncTry(async () => {
      const { data, error } = await this.db
        .schema('app')
        .from('rot_applications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error || !data) {
        throw new NotFoundError('RotApplication', id);
      }

      return data as RotApplication;
    });
  }

  async list(tenantId: string): Promise<Result<RotApplication[], Error>> {
    return asyncTry(async () => {
      const { data, error } = await this.db
        .schema('app')
        .from('rot_applications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as RotApplication[];
    });
  }
}

