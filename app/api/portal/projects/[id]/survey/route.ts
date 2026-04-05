import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

const SURVEY_QUESTIONS = [
  {
    id: 'overall_satisfaction',
    question: 'Hur nojd ar du med projektet overlag?',
    type: 'rating' as const,
    scale: { min: 1, max: 5 },
  },
  {
    id: 'quality',
    question: 'Hur bedomeer du kvaliteten pa utfort arbete?',
    type: 'rating' as const,
    scale: { min: 1, max: 5 },
  },
  {
    id: 'communication',
    question: 'Hur nojd ar du med kommunikationen under projektet?',
    type: 'rating' as const,
    scale: { min: 1, max: 5 },
  },
  {
    id: 'timeliness',
    question: 'Levererades projektet inom utlovad tidsram?',
    type: 'rating' as const,
    scale: { min: 1, max: 5 },
  },
  {
    id: 'value_for_money',
    question: 'Hur bedomeer du forhallandet mellan pris och kvalitet?',
    type: 'rating' as const,
    scale: { min: 1, max: 5 },
  },
  {
    id: 'would_recommend',
    question: 'Hur sannolikt ar det att du rekommenderar oss till andra? (NPS)',
    type: 'rating' as const,
    scale: { min: 0, max: 10 },
  },
  {
    id: 'comments',
    question: 'Ovriga kommentarer eller forslag pa forbattringar?',
    type: 'text' as const,
  },
]

const surveyResponseSchema = z.object({
  responses: z.array(
    z.object({
      question_id: z.string(),
      rating: z.number().optional(),
      text: z.string().optional(),
    })
  ),
})

/**
 * GET /api/portal/projects/[id]/survey
 * Returns survey questions for a completed project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // Verify project belongs to customer
    const { data: project } = await auth.admin
      .from('projects')
      .select('id, status, metadata')
      .eq('id', projectId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!project) {
      return apiError('Project not found', 404)
    }

    // Check if survey already submitted
    const meta = (project.metadata as Record<string, unknown>) ?? {}
    const existingSurvey = meta.survey_response as Record<string, unknown> | undefined

    return apiSuccess({
      questions: SURVEY_QUESTIONS,
      already_submitted: !!existingSurvey,
      submitted_at: existingSurvey?.submitted_at ?? null,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/portal/projects/[id]/survey
 * Customer submits survey responses. Stored as JSONB on the project.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: projectId } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = surveyResponseSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    // Fetch project
    const { data: project } = await auth.admin
      .from('projects')
      .select('id, metadata')
      .eq('id', projectId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!project) {
      return apiError('Project not found', 404)
    }

    const meta = (project.metadata as Record<string, unknown>) ?? {}

    if (meta.survey_response) {
      return apiError('Survey has already been submitted for this project', 409)
    }

    // Calculate NPS and average rating
    const ratings = parsed.data.responses
      .filter((r) => r.rating !== undefined)
      .map((r) => r.rating!)

    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null

    const npsResponse = parsed.data.responses.find((r) => r.question_id === 'would_recommend')
    const npsScore = npsResponse?.rating ?? null

    const surveyData = {
      responses: parsed.data.responses,
      submitted_at: new Date().toISOString(),
      submitted_by: auth.user.id,
      portal_user_email: auth.user.email,
      average_rating: avgRating,
      nps_score: npsScore,
    }

    const { error: updateErr } = await auth.admin
      .from('projects')
      .update({
        metadata: { ...meta, survey_response: surveyData },
      })
      .eq('id', projectId)

    if (updateErr) {
      return apiError('Failed to save survey response', 500)
    }

    return apiSuccess({
      message: 'Tack for din feedback!',
      average_rating: avgRating,
    }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
