"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'

export default function ClientProjectsFallback() {
 const [projects, setProjects] = useState<any[] | null>(null)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const { tenantId } = useTenant()

 useEffect(() => {
  async function fetchProjects() {
   setLoading(true)
   try {
    if (!tenantId) {
     setError('Ingen tenant vald. Logga in eller välj tenant först.')
     setProjects([])
     setLoading(false)
     return
    }

    // Try a detailed select first; if the schema differs (missing columns)
    // fall back to a safer select('*') or minimal fields.
    let data: any = null
    let error: any = null

    const trySelect = async (sel: string) => {
     return await supabase
      .from('projects')
      .select(sel)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    }

    // Preferred shape (matches server UI), but may fail if column missing
    ;({ data, error } = await trySelect('id, name, customer_name, created_at, base_rate_sek, budgeted_hours'))

    if (error && /does not exist/i.test(String(error.message ?? JSON.stringify(error)))) {
     // Try select '*' which is more tolerant
     ;({ data, error } = await trySelect('*'))
    }

    if (error && /does not exist/i.test(String(error.message ?? JSON.stringify(error)))) {
     // Final fallback: minimal fields
     ;({ data, error } = await trySelect('id, name, created_at'))
    }

    if (error) {
     setError(error.message ?? JSON.stringify(error))
     setProjects([])
    } else {
     setProjects(data ?? [])
    }
   } catch (err: any) {
    setError(String(err))
   } finally {
    setLoading(false)
   }
  }

  if (tenantId) {
   fetchProjects()
  }
 }, [tenantId])

 if (loading) return <div className="mt-4">Hämtar projekt…</div>
 if (error) return <div className="mt-4 text-red-600">Fel: {error}</div>
 if (!projects || projects.length === 0)
  return <div className="mt-4">Inga projekt hittades för den valda tenanten.</div>

 return (
  <div className="mt-4 space-y-3">
   {projects.map((p) => (
    <div key={p.id} className="rounded-[8px] border bg-white p-4 sm:p-5">
     <div className="text-lg font-semibold">{p.name}</div>
     <div className="text-sm text-gray-600">{p.customer_name || 'Kund saknas'}</div>
    </div>
   ))}
  </div>
 )
}
