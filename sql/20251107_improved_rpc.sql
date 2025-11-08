-- sql/20251107_improved_rpc.sql
-- Förbättrad RPC-funktion med korrekt datumfiltrering och schema-hantering
-- Detta ersätter den tidigare funktionen med bättre error handling och logging

-- Ta bort gamla funktionen om den finns
DROP FUNCTION IF EXISTS get_tenant_dashboard_analytics(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS app.get_tenant_dashboard_analytics(uuid, timestamptz, timestamptz);

-- Skapa funktionen i PUBLIC schema med korrekt typ-hantering
CREATE OR REPLACE FUNCTION public.get_tenant_dashboard_analytics(
    p_tenant_id uuid,
    p_start_date date,  -- Ändrat från timestamptz till date för enklare filtrering
    p_end_date date      -- Ändrat från timestamptz till date för enklare filtrering
)
RETURNS TABLE (
    total_hours numeric,
    active_projects bigint,
    total_entries bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count bigint;
    v_debug_info text;
BEGIN
    -- Debug: Räkna totala entries för tenant (för logging)
    SELECT COUNT(*) INTO v_count
    FROM public.time_entries
    WHERE tenant_id = p_tenant_id;
    
    -- Logga för debugging (syns i Supabase logs)
    RAISE NOTICE 'RPC Debug: Tenant % has % total entries', p_tenant_id, v_count;
    
    -- Huvudquery med explicit date casting och COALESCE för null-säkerhet
    RETURN QUERY
    SELECT
        -- Om hours_total är i SEKUNDER: dividera med 3600 för att få timmar
        -- Om hours_total är i TIMMAR: ta bort /3600.0
        -- Justera baserat på din databas-struktur
        COALESCE(SUM(te.hours_total) / 3600.0, 0)::numeric AS total_hours,
        COALESCE(COUNT(DISTINCT te.project_id), 0)::bigint AS active_projects,
        COALESCE(COUNT(*)::bigint, 0) AS total_entries
    FROM public.time_entries te
    WHERE 
        te.tenant_id = p_tenant_id
        -- Explicit date casting för att säkerställa korrekt jämförelse
        AND te.date::date >= p_start_date
        AND te.date::date <= p_end_date;
    
    -- Logga resultatet
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'RPC Debug: Returned % rows for date range % to %', v_count, p_start_date, p_end_date;
    
    RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_analytics(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_analytics(uuid, date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_dashboard_analytics(uuid, date, date) TO service_role;

-- Kommentar: Om du behöver funktionen i 'app' schema istället, kör:
-- CREATE SCHEMA IF NOT EXISTS app;
-- CREATE OR REPLACE FUNCTION app.get_tenant_dashboard_analytics(...) ...;
-- Och uppdatera API-routen att använda 'app.get_tenant_dashboard_analytics'

