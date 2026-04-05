import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { callOpenRouter } from '@/lib/ai/openrouter'

const SYSTEM_PROMPT =
  'Du är en svensk byggdokumentexpert. Baserat på filnamnet och filtypen, föreslå relevanta taggar för detta byggdokument. Returnera en JSON-array med max 5 taggar på svenska.'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, docId } = await params

    // Fetch the document
    const { data: doc, error: fetchError } = await auth.admin
      .from('project_documents')
      .select('id, file_name, mime_type')
      .eq('id', docId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (fetchError || !doc) return apiError('Document not found', 404)

    const userPrompt = `Filnamn: ${doc.file_name}\nFiltyp: ${doc.mime_type || 'okänd'}`

    const result = await callOpenRouter(SYSTEM_PROMPT, userPrompt, {
      jsonMode: true,
      maxTokens: 256,
    })

    // The result should be a JSON array of tags, or an object with a tags key
    const tags: string[] = Array.isArray(result)
      ? result.slice(0, 5)
      : Array.isArray(result?.tags)
        ? result.tags.slice(0, 5)
        : []

    // Update the document with the generated tags
    const { data: updated, error: updateError } = await auth.admin
      .from('project_documents')
      .update({ tags })
      .eq('id', docId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (updateError || !updated) return apiError('Failed to update document tags', 500)

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
