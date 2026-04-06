import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { parseBody, apiError, apiSuccess, handleRouteError } from '@/lib/api'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, LoginSchema)
    if (parsed.error) return parsed.error

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return apiError('Supabase auth is not configured', 503)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error || !data.session || !data.user) {
      return apiError('Invalid email or password', 401)
    }

    const appMeta = data.user.app_metadata as Record<string, string | undefined>
    const tenantId = appMeta?.tenant_id

    if (!tenantId) {
      return apiError('User account is not associated with a tenant. Contact support.', 403)
    }

    return apiSuccess({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? parsed.data.email,
        tenantId,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
