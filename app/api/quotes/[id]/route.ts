import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { extractErrorMessage } from '@/lib/errorUtils'
import { canTransition } from '@/lib/quotes/workflow'
import { logQuoteChange } from '@/lib/quotes/approval'

export const runtime = 'nodejs'

// Hjälpfunktion för strukturerad loggning
function logError(context: string, error: any, metadata?: Record<string, any>) {
  console.error(`[API Error] ${context}`, {
    error: error?.message || error,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

// Hjälpfunktion för att skapa error responses
function createErrorResponse(message: string, status: number, details?: any) {
  return NextResponse.json(
    {
      error: message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const startTime = Date.now()
  
  try {
    // VIKTIGT: Next.js 16 kan ha async params
    const params = await Promise.resolve(context.params)
    const quoteId = params.id

    // Step 0: Validate params
    if (!quoteId) {
      logError('GET /api/quotes/[id]', 'Missing quote ID in params', { 
        rawParams: params,
        url: req.url 
      })
      return createErrorResponse('Missing quote ID', 400, { params })
    }

    if (!isValidUUID(quoteId)) {
      logError('GET /api/quotes/[id]', 'Invalid UUID format', { quoteId })
      return createErrorResponse('Invalid quote ID format', 400, { quoteId })
    }

    console.log(`[API] ✅ GET /api/quotes/${quoteId} - Request received`, {
      url: req.url,
      timestamp: new Date().toISOString(),
    })

    // Step 1: Tenant validation med detaljerad logging
    const tenantId = await getTenantId()
    
    if (!tenantId) {
      logError('GET /api/quotes/[id]', 'No tenant ID found - User may not be authenticated', { 
        quoteId,
        headers: {
          cookie: req.headers.get('cookie') ? 'present' : 'missing',
          authorization: req.headers.get('authorization') ? 'present' : 'missing',
        }
      })
      return createErrorResponse(
        'Unauthorized: No tenant found. Please log in again.',
        401,
        { hint: 'Tenant ID could not be resolved from JWT, cookie, or user_roles' }
      )
    }

    console.log(`[API] ✅ Tenant validated`, {
      quoteId,
      tenantId,
      tenantIdLength: tenantId.length,
    })

    const admin = createAdminClient()

    // Step 2: Fetch quote with detailed error handling
    let quote
    try {
      console.log(`[API] 🔍 Fetching quote from database...`, { quoteId, tenantId })

      const { data: quoteData, error: quoteError } = await admin
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (quoteError) {
        logError('GET /api/quotes/[id] - Database query error', quoteError, { 
          quoteId, 
          tenantId,
          errorCode: quoteError.code,
          errorDetails: quoteError.details,
        })
        throw new Error(`Database error: ${quoteError.message}`)
      }

      if (!quoteData) {
        // Log detailed info för debugging
        console.warn(`[API] ⚠️ Quote not found`, { 
          quoteId, 
          tenantId,
          hint: 'Quote may not exist, or belongs to different tenant'
        })

        // Försök hitta quote utan tenant filter för debugging (endast i dev)
        if (process.env.NODE_ENV === 'development') {
          const { data: anyQuote } = await admin
            .from('quotes')
            .select('id, tenant_id')
            .eq('id', quoteId)
            .maybeSingle()

          if (anyQuote) {
            console.warn(`[API] 🔍 Quote exists but tenant mismatch!`, {
              quoteId,
              quoteTenantId: anyQuote.tenant_id,
              userTenantId: tenantId,
            })
          } else {
            console.warn(`[API] 🔍 Quote does not exist in database at all`, { quoteId })
          }
        }

        logError('GET /api/quotes/[id]', 'Quote not found or unauthorized', { 
          quoteId, 
          tenantId 
        })
        return createErrorResponse(
          'Quote not found or you do not have access to it',
          404,
          { quoteId, tenantId: process.env.NODE_ENV === 'development' ? tenantId : undefined }
        )
      }

      quote = quoteData
      console.log(`[API] ✅ Quote fetched successfully`, { 
        quoteId, 
        status: quote.status,
        customerIdPresent: !!quote.customer_id,
        projectIdPresent: !!quote.project_id,
      })
    } catch (error: any) {
      logError('GET /api/quotes/[id] - Quote fetch exception', error, { quoteId, tenantId })
      return createErrorResponse(
        'Failed to fetch quote',
        500,
        { originalError: error.message }
      )
    }

    // Step 3: Fetch related data in parallel with individual error handling
    console.log(`[API] 🔍 Fetching related data...`, { 
      quoteId,
      willFetchItems: true,
      willFetchCustomer: !!quote.customer_id,
      willFetchProject: !!quote.project_id,
    })

    const [itemsResult, customerResult, projectResult] = await Promise.allSettled([
      // Items
      admin
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true })
        .then(res => ({ data: res.data, error: res.error })),
      
      // Customer (optional)
      quote.customer_id
        ? admin
            .from('clients')
            .select('id, name, email')
            .eq('id', quote.customer_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()
            .then(res => ({ data: res.data, error: res.error }))
        : Promise.resolve({ data: null, error: null }),
      
      // Project (optional)
      quote.project_id
        ? admin
            .from('projects')
            .select('id, name')
            .eq('id', quote.project_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()
            .then(res => ({ data: res.data, error: res.error }))
        : Promise.resolve({ data: null, error: null }),
    ])

    // Process items result
    let items = []
    if (itemsResult.status === 'fulfilled') {
      if (itemsResult.value.error) {
        logError('GET /api/quotes/[id] - Items fetch', itemsResult.value.error, {
          quoteId,
          tenantId,
        })
        console.warn(`[API] ⚠️ Failed to fetch items, continuing with empty array`)
      } else {
        items = itemsResult.value.data || []
        console.log(`[API] ✅ Items fetched: ${items.length}`)
      }
    } else {
      logError('GET /api/quotes/[id] - Items fetch rejected', itemsResult.reason, {
        quoteId,
        tenantId,
      })
    }

    // Process customer result
    let customer = null
    if (customerResult.status === 'fulfilled') {
      if (customerResult.value.error) {
        logError('GET /api/quotes/[id] - Customer fetch', customerResult.value.error, {
          quoteId,
          customerId: quote.customer_id,
        })
        console.warn(`[API] ⚠️ Failed to fetch customer data`)
      } else {
        customer = customerResult.value.data
        console.log(`[API] ✅ Customer fetched: ${customer?.name || 'N/A'}`)
      }
    } else {
      logError('GET /api/quotes/[id] - Customer fetch rejected', customerResult.reason, {
        quoteId,
        customerId: quote.customer_id,
      })
    }

    // Process project result
    let project = null
    if (projectResult.status === 'fulfilled') {
      if (projectResult.value.error) {
        logError('GET /api/quotes/[id] - Project fetch', projectResult.value.error, {
          quoteId,
          projectId: quote.project_id,
        })
        console.warn(`[API] ⚠️ Failed to fetch project data`)
      } else {
        project = projectResult.value.data
        console.log(`[API] ✅ Project fetched: ${project?.name || 'N/A'}`)
      }
    } else {
      logError('GET /api/quotes/[id] - Project fetch rejected', projectResult.reason, {
        quoteId,
        projectId: quote.project_id,
      })
    }

    // Assemble response
    const response = {
      ...quote,
      items,
      customer,
      project,
    }

    const duration = Date.now() - startTime
    console.log(`[API] ✅ GET /api/quotes/${quoteId} completed successfully`, {
      duration: `${duration}ms`,
      itemsCount: items.length,
      hasCustomer: !!customer,
      hasProject: !!project,
      responseSize: JSON.stringify(response).length,
    })

    return NextResponse.json({ data: response })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logError('GET /api/quotes/[id] - Unexpected error', error, {
      duration: `${duration}ms`,
      errorType: error?.constructor?.name,
    })

    return createErrorResponse(
      'An unexpected error occurred while fetching the quote',
      500,
      {
        message: error?.message,
        type: error?.constructor?.name,
      }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quoteId } = await params
  const startTime = Date.now()

  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      logError('PUT /api/quotes/[id]', 'No tenant ID found', { quoteId })
      return createErrorResponse('Unauthorized: No tenant found', 401)
    }

    console.log(`[API] PUT /api/quotes/${quoteId}`, { tenantId })

    const body = await req.json()

    // Validate body
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request body', 400)
    }

    const admin = createAdminClient()

    // Verify quote exists and belongs to tenant
    const { data: existingQuote, error: fetchError } = await admin
      .from('quotes')
      .select('id, status')
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (fetchError || !existingQuote) {
      logError('PUT /api/quotes/[id]', 'Quote not found or unauthorized', {
        quoteId,
        tenantId,
        error: fetchError,
      })
      return createErrorResponse('Quote not found', 404)
    }

    // Status transition guard
    if (body.status) {
      if (!canTransition(existingQuote.status, body.status)) {
        logError('PUT /api/quotes/[id]', 'Invalid status transition', {
          quoteId,
          from: existingQuote.status,
          to: body.status,
        })
        return createErrorResponse(
          `Ogiltig transition: ${existingQuote.status} -> ${body.status}`,
          400
        )
      }
    }

    // Update quote
    const { data: updatedQuote, error: updateError } = await admin
      .from('quotes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError) {
      logError('PUT /api/quotes/[id]', updateError, { quoteId, tenantId, body })
      return createErrorResponse(
        'Failed to update quote',
        500,
        { originalError: updateError.message }
      )
    }

    // Get user for history
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await logQuoteChange(tenantId, quoteId, 'updated', body, user?.id)

    const duration = Date.now() - startTime
    console.log(`[API] PUT /api/quotes/${quoteId} completed`, {
      duration: `${duration}ms`,
      updatedFields: Object.keys(body),
    })

    return NextResponse.json({ data: updatedQuote })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logError('PUT /api/quotes/[id] - Unexpected error', error, {
      quoteId,
      duration: `${duration}ms`,
    })

    return createErrorResponse(
      'An unexpected error occurred',
      500,
      { message: error?.message }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quoteId } = await params
  const startTime = Date.now()

  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      logError('DELETE /api/quotes/[id]', 'No tenant ID found', { quoteId })
      return createErrorResponse('Unauthorized: No tenant found', 401)
    }

    console.log(`[API] DELETE /api/quotes/${quoteId}`, { tenantId })

    const admin = createAdminClient()

    // Verify quote exists and belongs to tenant
    const { data: existingQuote, error: fetchError } = await admin
      .from('quotes')
      .select('id, status')
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (fetchError || !existingQuote) {
      logError('DELETE /api/quotes/[id]', 'Quote not found or unauthorized', {
        quoteId,
        tenantId,
        error: fetchError,
      })
      return createErrorResponse('Quote not found', 404)
    }

    // Optional: Prevent deletion of accepted quotes
    if (existingQuote.status === 'accepted') {
      logError('DELETE /api/quotes/[id]', 'Cannot delete accepted quote', {
        quoteId,
        status: existingQuote.status,
      })
      return createErrorResponse(
        'Cannot delete accepted quotes',
        400,
        { status: existingQuote.status }
      )
    }

    // Delete quote (items will be cascade deleted)
    const { error: deleteError } = await admin
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      logError('DELETE /api/quotes/[id]', deleteError, { quoteId, tenantId })
      return createErrorResponse(
        'Failed to delete quote',
        500,
        { originalError: deleteError.message }
      )
    }

    // Get user for history
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await logQuoteChange(tenantId, quoteId, 'updated', { deleted: true }, user?.id)

    const duration = Date.now() - startTime
    console.log(`[API] DELETE /api/quotes/${quoteId} completed`, {
      duration: `${duration}ms`,
    })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logError('DELETE /api/quotes/[id] - Unexpected error', error, {
      quoteId,
      duration: `${duration}ms`,
    })

    return createErrorResponse(
      'An unexpected error occurred',
      500,
      { message: error?.message }
    )
  }
}
