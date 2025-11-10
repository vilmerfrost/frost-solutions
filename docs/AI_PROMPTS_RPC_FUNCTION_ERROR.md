# AI Prompts for RPC Function Parameter Order Issue

## Problem
```
Failed to create invoice: Could not find the function public.insert_supplier_invoice(p_created_by, p_extracted_data, p_file_path, p_file_size, p_invoice_date, p_invoice_number, p_mime_type, p_ocr_confidence, p_ocr_data, p_original_filename, p_project_id, p_status, p_supplier_id, p_tenant_id) in the schema cache
```

The RPC function exists but Supabase can't match the function signature when parameters are passed in a different order than defined.

---

## PROMPT 1: GPT-5 / Claude Sonnet 4.5 (Technical Precision)

```
**Context:** Next.js 16 + Supabase (PostgREST) + PostgreSQL RPC functions

**Problem:** 
Supabase RPC call fails with "Could not find the function public.insert_supplier_invoice(...) in the schema cache" even though:
1. Function exists (verified via information_schema.routines)
2. Function signature matches expected parameters
3. Parameters are passed as object: `{ p_tenant_id: UUID, p_supplier_id: UUID, ... }`

**Error Details:**
- Function: `public.insert_supplier_invoice`
- Error: Function not found in schema cache
- Parameter order in error: p_created_by, p_extracted_data, p_file_path, p_file_size, p_invoice_date, p_invoice_number, p_mime_type, p_ocr_confidence, p_ocr_data, p_original_filename, p_project_id, p_status, p_supplier_id, p_tenant_id
- Actual function definition order: p_tenant_id, p_supplier_id, p_project_id, p_file_path, p_file_size, p_mime_type, p_original_filename, p_invoice_number, p_invoice_date, p_status, p_ocr_confidence, p_ocr_data, p_extracted_data, p_created_by

**Code:**
```typescript
const { data, error } = await admin.rpc('insert_supplier_invoice', {
  p_tenant_id: tenantId,
  p_supplier_id: supplierId,
  p_project_id: projectId,
  p_file_path: storagePath,
  p_file_size: fileBuffer.length,
  p_mime_type: mimeType || 'application/pdf',
  p_original_filename: fileName,
  p_invoice_number: invoiceNumber,
  p_invoice_date: ocr.fields?.invoiceDate || today,
  p_status: conf >= 70 ? 'pending_approval' : 'draft',
  p_ocr_confidence: conf,
  p_ocr_data: { text: ocr.text, confidence: conf },
  p_extracted_data: ocr.fields,
  p_created_by: createdBy
})
```

**Question:**
Why does PostgREST fail to match the function when parameters are passed as an object? Is parameter order significant in PostgREST RPC calls? What's the correct way to call PostgreSQL functions with named parameters via Supabase JS client? Provide a production-ready solution that ensures function matching regardless of parameter order.

**Requirements:**
- Must work with supabase-js client
- Must handle optional parameters (DEFAULT NULL)
- Must be type-safe
- Must work with PostgreSQL function overloading if applicable
```

---

## PROMPT 2: Gemini 2.5 (Supabase Expert)

```
**Role:** Senior Supabase/PostgREST expert

**Scenario:** 
PostgREST schema cache mismatch for RPC function calls. Function exists but Supabase JS client can't find it when calling via `.rpc()`.

**Technical Details:**
- Supabase project with custom RPC functions
- Function: `public.insert_supplier_invoice(p_tenant_id UUID, p_supplier_id UUID, ...)`
- Function verified to exist: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'insert_supplier_invoice'` returns result
- Function has 14 parameters, some with DEFAULT values
- Error: "Could not find the function ... in the schema cache"
- Parameter order differs between call and definition

**Supabase JS Call:**
```typescript
await supabase.rpc('insert_supplier_invoice', {
  p_tenant_id: '...',
  p_supplier_id: '...',
  // ... 12 more params
})
```

**PostgreSQL Function:**
```sql
CREATE OR REPLACE FUNCTION public.insert_supplier_invoice(
  p_tenant_id UUID,
  p_supplier_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_file_path TEXT,
  -- ... more params
)
```

**Questions:**
1. Does PostgREST cache function signatures? How does it match function calls?
2. Why would parameter order matter if we're using named parameters?
3. Is there a way to force PostgREST to refresh its schema cache?
4. Should we use positional parameters instead of named parameters?
5. Are there known issues with Supabase JS client and PostgreSQL function overloading?

**Provide:**
- Root cause analysis
- Immediate fix (workaround)
- Long-term solution
- Best practices for Supabase RPC functions with many parameters
```

---

## PROMPT 3: DeepSeek (Performance & Optimization)

```
**Task:** Fix Supabase RPC function call failure - schema cache mismatch

**Problem:**
PostgREST can't find RPC function when called via Supabase JS client. Function exists, parameters match, but schema cache lookup fails.

**Performance Context:**
- Function has 14 parameters (some optional with DEFAULT)
- Called frequently (invoice uploads)
- Current error rate: 100% (all calls fail)

**Code Pattern:**
```typescript
// Current (failing)
await admin.rpc('insert_supplier_invoice', { p_tenant_id, p_supplier_id, ... })

// Function definition
CREATE FUNCTION public.insert_supplier_invoice(
  p_tenant_id UUID,
  p_supplier_id UUID,
  p_project_id UUID DEFAULT NULL,
  ...
)
```

**Constraints:**
- Must maintain type safety
- Must handle optional parameters
- Must be performant (no extra round trips)
- Must work with Supabase JS v2

**Optimization Goals:**
1. Minimize schema cache lookups
2. Ensure function matching is deterministic
3. Reduce parameter overhead
4. Handle edge cases (NULL defaults, type coercion)

**Deliverables:**
1. Root cause (why schema cache fails)
2. Optimized solution (best performance)
3. Fallback solution (if optimization doesn't work)
4. Code example with error handling
5. Performance comparison (before/after)
```

---

## PROMPT 4: Kimi K2 (Creative Solutions)

```
**Challenge:** Supabase RPC function call fails due to schema cache mismatch

**The Mystery:**
- Function exists ✅
- Parameters match ✅  
- But PostgREST says "function not found" ❌

**Error Message:**
```
Could not find the function public.insert_supplier_invoice(
  p_created_by, p_extracted_data, p_file_path, ...
) in the schema cache
```

**Observation:**
Parameter order in error message differs from function definition. Error shows alphabetical-ish order, function defines logical order.

**Hypothesis:**
1. PostgREST sorts parameters alphabetically for cache key?
2. Supabase JS sends parameters in wrong order?
3. Schema cache needs refresh?
4. Function overloading confusion?

**Creative Solutions Needed:**
- Think outside the box
- Alternative approaches (not just "fix the call")
- Workarounds if PostgREST has bugs
- Creative ways to ensure function matching

**Ideas to Explore:**
- Use positional parameters instead?
- Create wrapper function with fewer parameters?
- Use JSONB parameter instead of 14 separate params?
- Direct SQL call bypassing PostgREST?
- Function overloading with different signatures?

**Deliver:**
- 3 creative solutions (ranked by practicality)
- Code examples for each
- Pros/cons
- Recommendation
```

---

## PROMPT 5: Perplexity (Research & Documentation)

```
**Research Task:** PostgREST schema cache and RPC function matching

**Question:**
How does PostgREST match RPC function calls when parameters are passed as named parameters? Does parameter order matter? What causes "function not found in schema cache" errors?

**Specific Context:**
- Supabase (PostgREST-based)
- PostgreSQL functions with DEFAULT parameters
- Supabase JS client `.rpc()` method
- Function has 14 parameters, some optional

**Research Areas:**
1. PostgREST function matching algorithm
2. Schema cache invalidation mechanisms
3. Named vs positional parameter handling
4. Known issues/bugs with function overloading
5. Supabase-specific RPC call behavior

**Sources Needed:**
- PostgREST official documentation
- GitHub issues/discussions
- Supabase community forums
- PostgreSQL function call best practices

**Deliver:**
- Comprehensive explanation of how PostgREST matches functions
- Common causes of schema cache mismatches
- Solutions/workarounds from community
- Links to relevant documentation/issues
- Step-by-step debugging guide
```

---

## PROMPT 6: Mistral Large / Llama 3.1 (Black Horse - Alternative Perspective)

```
**Problem:** Supabase RPC function call fails - "function not found in schema cache"

**Technical Stack:**
- Next.js 16
- Supabase (PostgREST)
- PostgreSQL 15+
- TypeScript

**Error:**
```
Could not find the function public.insert_supplier_invoice(
  p_created_by, p_extracted_data, p_file_path, ...
) in the schema cache
```

**Function Definition:**
```sql
CREATE FUNCTION public.insert_supplier_invoice(
  p_tenant_id UUID,
  p_supplier_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_file_path TEXT,
  ...
)
```

**Call Pattern:**
```typescript
await supabase.rpc('insert_supplier_invoice', {
  p_tenant_id: uuid,
  p_supplier_id: uuid,
  // ... object with named params
})
```

**Alternative Approaches to Consider:**
1. Is this a PostgREST limitation we should work around?
2. Should we redesign the function signature (fewer params, JSONB)?
3. Is there a better pattern for complex RPC calls in Supabase?
4. Should we use database views + direct table access instead?
5. Could this be a Supabase JS client bug we should report?

**Provide:**
- Critical analysis of current approach
- Alternative architectural patterns
- Pros/cons of each approach
- Recommendation with reasoning
- Migration path if we change approach
```

---

## Usage Instructions

1. **Copy each prompt** to the respective AI
2. **Wait for responses**
3. **Compare solutions** - look for common patterns
4. **Implement the most robust solution**
5. **Test thoroughly** before deploying

## Expected Outcomes

- **GPT-5/Claude:** Technical deep-dive, precise fix
- **Gemini:** Supabase-specific solution, best practices
- **DeepSeek:** Performance-optimized approach
- **Kimi:** Creative workarounds, alternative patterns
- **Perplexity:** Research-backed explanation, community solutions
- **Mistral/Llama:** Critical analysis, architectural alternatives

## Next Steps After Getting Responses

1. Identify common solution patterns
2. Choose the most robust approach
3. Implement fix
4. Test with your actual function
5. Document the solution

