import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa client (privat eller företag)
 * Använder service role för att kringgå RLS
 * Supports enhanced fields for both private and corporate customers
 */
export async function POST(req: Request) {
 try {
  const body = await req.json()
  const { 
   tenantId, 
   name, 
   email, 
   phone, 
   address, 
   orgNumber, 
   clientType,
   // Enhanced private customer fields
   firstName,
   lastName,
   personalId,
   propertyDesignation,
   streetAddress,
   postalCode,
   city,
   workSameAsHome,
   workStreetAddress,
   workPostalCode,
   workCity,
   // Enhanced company fields
   website,
   invoiceSameAsMain,
   invoiceStreetAddress,
   invoicePostalCode,
   invoiceCity,
   contactPersonName,
   contactPersonEmail,
   contactPersonPhone,
   contactPersonTitle,
   // Common
   notes,
  } = body

  if (!tenantId || !name) {
   return NextResponse.json(
    { error: 'tenantId and name are required' },
    { status: 400 }
   )
  }

  // Använd service role för att kringgå RLS
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' },
    { status: 500 }
   )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Verify tenant exists before creating client
  const { data: tenantCheck, error: tenantCheckError } = await supabase
   .from('tenants')
   .select('id')
   .eq('id', tenantId)
   .maybeSingle()

  if (tenantCheckError || !tenantCheck) {
   return NextResponse.json(
    { error: `Tenant with ID ${tenantId} does not exist. Please ensure you have completed onboarding.` },
    { status: 400 }
   )
  }

  // Build client payload with all fields
  const clientPayload: any = {
   tenant_id: tenantId,
   name,
   email: email || null,
   phone: phone || null,
   client_type: clientType || 'company',
  }

  // Legacy address field (combined) - use structured address if available
  if (address) {
   clientPayload.address = address
  } else if (streetAddress && postalCode && city) {
   clientPayload.address = `${streetAddress}, ${postalCode} ${city}`
  }

  // Private customer fields
  if (clientType === 'private') {
   if (firstName) clientPayload.first_name = firstName
   if (lastName) clientPayload.last_name = lastName
   if (personalId) clientPayload.personal_id = personalId
   if (propertyDesignation) clientPayload.property_designation = propertyDesignation
   
   // Home/main address
   if (streetAddress) clientPayload.street_address = streetAddress
   if (postalCode) clientPayload.postal_code = postalCode
   if (city) clientPayload.city = city
   
   // Work address
   clientPayload.work_same_as_home = workSameAsHome !== false
   if (!workSameAsHome) {
    if (workStreetAddress) clientPayload.work_street_address = workStreetAddress
    if (workPostalCode) clientPayload.work_postal_code = workPostalCode
    if (workCity) clientPayload.work_city = workCity
   }
  }

  // Company fields
  if (clientType === 'company') {
   if (orgNumber) clientPayload.org_number = orgNumber.trim()
   if (website) clientPayload.website = website
   
   // HQ address
   if (streetAddress) clientPayload.street_address = streetAddress
   if (postalCode) clientPayload.postal_code = postalCode
   if (city) clientPayload.city = city
   
   // Invoice address
   clientPayload.invoice_same_as_main = invoiceSameAsMain !== false
   if (!invoiceSameAsMain) {
    if (invoiceStreetAddress) clientPayload.invoice_street_address = invoiceStreetAddress
    if (invoicePostalCode) clientPayload.invoice_postal_code = invoicePostalCode
    if (invoiceCity) clientPayload.invoice_city = invoiceCity
   }
   
   // Contact person
   if (contactPersonName) clientPayload.contact_person_name = contactPersonName
   if (contactPersonEmail) clientPayload.contact_person_email = contactPersonEmail
   if (contactPersonPhone) clientPayload.contact_person_phone = contactPersonPhone
   if (contactPersonTitle) clientPayload.contact_person_title = contactPersonTitle
  }

  // Common fields
  if (notes) clientPayload.notes = notes

  // Try to insert with all fields first
  let result = await supabase
   .from('clients')
   .insert([clientPayload])
   .select('id')
   .single()

  // If new columns don't exist, fallback to basic insert
  if (result.error && result.error.code === '42703') {
   console.warn('Some columns do not exist, falling back to basic insert:', result.error.message)
   
   const basicPayload: any = {
    tenant_id: tenantId,
    name,
    email: email || null,
    phone: phone || null,
    address: address || (streetAddress ? `${streetAddress}, ${postalCode} ${city}` : null),
   }
   
   if (clientType === 'company' && orgNumber) {
    basicPayload.org_number = orgNumber.trim()
   }

   result = await supabase
    .from('clients')
    .insert([basicPayload])
    .select('id')
    .single()
  }

  if (result.error) {
   console.error('Error creating client:', result.error)
   return NextResponse.json(
    { error: result.error.message },
    { status: 400 }
   )
  }

  return NextResponse.json({
   clientId: result.data.id,
  })
 } catch (err: any) {
  console.error('Error in create-client API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}
