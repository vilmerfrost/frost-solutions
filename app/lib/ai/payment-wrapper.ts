// app/lib/ai/payment-wrapper.ts
// Payment wrapper for AI functions - checks balance and charges credits

import { createAdminClient } from '@/utils/supabase/admin';

// AI feature types for pricing
export type AIFeature = 
  | 'supplier_invoice_ocr'
  | 'delivery_note_ocr'
  | 'receipt_ocr'
  | 'rot_rut_summary'
  | 'project_insights'
  | 'payroll_validation'
  | 'monthly_report';

// Result types
export interface BalanceCheckResult {
  hasBalance: boolean;
  currentBalance: number;
  requiredAmount: number;
  featureName: string;
}

export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  amountCharged?: number;
  error?: string;
}

export interface AICallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
  balanceAfter?: number;
  chargeSkipped?: boolean;
}

/**
 * Check if tenant has sufficient balance for an AI feature
 */
export async function checkAIBalance(
  tenantId: string,
  feature: AIFeature
): Promise<BalanceCheckResult> {
  const admin = createAdminClient();
  
  const { data, error } = await admin.rpc('check_ai_balance', {
    p_tenant_id: tenantId,
    p_feature: feature,
  });

  if (error) {
    console.error('[PaymentWrapper] Balance check error:', error);
    throw new Error(`Kunde inte kontrollera saldo: ${error.message}`);
  }

  const row = data?.[0];
  return {
    hasBalance: row?.has_balance ?? false,
    currentBalance: Number(row?.current_balance ?? 0),
    requiredAmount: Number(row?.required_amount ?? 2),
    featureName: row?.feature_name ?? feature,
  };
}

/**
 * Charge credits for AI feature usage
 */
export async function chargeAICredits(
  tenantId: string,
  feature: AIFeature,
  description?: string,
  metadata?: Record<string, any>
): Promise<ChargeResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('charge_ai_credits', {
    p_tenant_id: tenantId,
    p_feature: feature,
    p_description: description,
    p_metadata: metadata ?? {},
  });

  if (error) {
    console.error('[PaymentWrapper] Charge error:', error);
    return {
      success: false,
      error: `Kunde inte debitera krediter: ${error.message}`,
    };
  }

  const row = data?.[0];
  return {
    success: row?.success ?? false,
    transactionId: row?.transaction_id,
    newBalance: Number(row?.new_balance ?? 0),
    amountCharged: Number(row?.amount_charged ?? 0),
    error: row?.error_message,
  };
}

/**
 * Get current balance for tenant
 */
export async function getAIBalance(tenantId: string): Promise<{
  balance: number;
  totalSpent: number;
  totalToppedUp: number;
}> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc('get_or_create_ai_credits', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('[PaymentWrapper] Get balance error:', error);
    throw new Error(`Kunde inte hämta saldo: ${error.message}`);
  }

  return {
    balance: Number(data?.balance ?? 0),
    totalSpent: Number(data?.total_spent ?? 0),
    totalToppedUp: Number(data?.total_topped_up ?? 0),
  };
}

/**
 * Wrap an AI function call with payment check and charge
 * This is the main function to use for all AI features
 */
export async function withPayment<T>(
  tenantId: string,
  feature: AIFeature,
  aiFunction: () => Promise<T>,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
    skipPayment?: boolean; // For testing or free tier
  }
): Promise<AICallResult<T>> {
  const { description, metadata, skipPayment } = options ?? {};

  // Skip payment check if disabled
  if (skipPayment || process.env.AI_PAYMENT_DISABLED === 'true') {
    console.log('[PaymentWrapper] Payment skipped for:', feature);
    try {
      const data = await aiFunction();
      return { success: true, data, chargeSkipped: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check balance first
  try {
    const balance = await checkAIBalance(tenantId, feature);
    
    if (!balance.hasBalance) {
      console.log('[PaymentWrapper] Insufficient balance:', {
        tenantId,
        feature,
        current: balance.currentBalance,
        required: balance.requiredAmount,
      });
      
      return {
        success: false,
        error: `Otillräckligt saldo (${balance.currentBalance.toFixed(2)} kr). ` +
               `${balance.featureName} kostar ${balance.requiredAmount.toFixed(2)} kr. ` +
               `Ladda på ditt konto för att fortsätta.`,
        balanceAfter: balance.currentBalance,
      };
    }
  } catch (error: any) {
    console.error('[PaymentWrapper] Balance check failed:', error);
    return {
      success: false,
      error: `Kunde inte kontrollera saldo: ${error.message}`,
    };
  }

  // Execute AI function
  let result: T;
  try {
    result = await aiFunction();
  } catch (error: any) {
    console.error('[PaymentWrapper] AI function failed:', error);
    return {
      success: false,
      error: `AI-funktionen misslyckades: ${error.message}`,
    };
  }

  // Charge credits after successful execution
  const charge = await chargeAICredits(tenantId, feature, description, {
    ...metadata,
    executedAt: new Date().toISOString(),
  });

  if (!charge.success) {
    // AI function succeeded but charging failed - log but still return result
    console.error('[PaymentWrapper] Charging failed but AI succeeded:', charge.error);
    return {
      success: true,
      data: result,
      error: `Varning: AI-funktionen lyckades men debiteringen misslyckades. ${charge.error}`,
      balanceAfter: charge.newBalance,
    };
  }

  console.log('[PaymentWrapper] AI call successful:', {
    feature,
    tenantId,
    transactionId: charge.transactionId,
    amountCharged: charge.amountCharged,
    newBalance: charge.newBalance,
  });

  return {
    success: true,
    data: result,
    transactionId: charge.transactionId,
    balanceAfter: charge.newBalance,
  };
}

/**
 * Check if AI payments are enabled
 */
export function isPaymentEnabled(): boolean {
  return process.env.AI_PAYMENT_DISABLED !== 'true';
}

/**
 * Get feature display name
 */
export function getFeatureDisplayName(feature: AIFeature): string {
  const names: Record<AIFeature, string> = {
    supplier_invoice_ocr: 'Leverantörsfaktura OCR',
    delivery_note_ocr: 'Följesedel OCR',
    receipt_ocr: 'Kvitto OCR',
    rot_rut_summary: 'ROT/RUT Sammanfattning',
    project_insights: 'Projektinsikter',
    payroll_validation: 'Lönevalidering',
    monthly_report: 'Månadsrapport',
  };
  return names[feature] ?? feature;
}

