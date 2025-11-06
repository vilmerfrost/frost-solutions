-- ========================================
-- HELPER FUNCTIONS FOR INTEGRATIONS
-- ========================================
-- Dessa funktioner låter oss skriva till app.integrations via Supabase RPC
-- eftersom Supabase PostgREST inte kan skriva direkt till app schema

-- Function för att skapa eller uppdatera en integration
-- Om det redan finns en integration med samma provider och tenant_id,
-- uppdateras den istället för att skapa en ny (förhindrar dubbletter)
CREATE OR REPLACE FUNCTION public.create_integration(
  p_tenant_id uuid,
  p_provider text,
  p_status text,
  p_client_id text,
  p_client_secret_encrypted text,
  p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  v_integration_id uuid;
BEGIN
  -- Försök hitta befintlig integration med samma provider och tenant_id
  SELECT id INTO v_integration_id
  FROM app.integrations
  WHERE tenant_id = p_tenant_id
    AND provider = p_provider
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_integration_id IS NOT NULL THEN
    -- Uppdatera befintlig integration istället för att skapa ny
    UPDATE app.integrations
    SET 
      status = p_status,
      client_id = p_client_id,
      client_secret_encrypted = p_client_secret_encrypted,
      updated_at = now()
    WHERE id = v_integration_id;
    
    RETURN v_integration_id;
  ELSE
    -- Skapa ny integration om ingen finns
    INSERT INTO app.integrations (
      tenant_id,
      provider,
      status,
      client_id,
      client_secret_encrypted,
      created_by
    )
    VALUES (
      p_tenant_id,
      p_provider,
      p_status,
      p_client_id,
      p_client_secret_encrypted,
      p_created_by
    )
    RETURNING id INTO v_integration_id;
    
    RETURN v_integration_id;
  END IF;
END;
$$;

-- Function för att uppdatera integration status
CREATE OR REPLACE FUNCTION public.update_integration_status(
  p_integration_id uuid,
  p_status text,
  p_access_token_encrypted text DEFAULT NULL,
  p_refresh_token_encrypted text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_scope text DEFAULT NULL,
  p_last_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  UPDATE app.integrations
  SET 
    status = p_status,
    access_token_encrypted = COALESCE(p_access_token_encrypted, access_token_encrypted),
    refresh_token_encrypted = COALESCE(p_refresh_token_encrypted, refresh_token_encrypted),
    expires_at = COALESCE(p_expires_at, expires_at),
    scope = COALESCE(p_scope, scope),
    last_error = COALESCE(p_last_error, last_error),
    updated_at = now()
  WHERE id = p_integration_id;
END;
$$;

-- Function för att disconnecta en integration (sätter tokens till NULL)
CREATE OR REPLACE FUNCTION public.disconnect_integration(
  p_integration_id uuid,
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  -- Verifiera att integrationen tillhör rätt tenant
  IF NOT EXISTS (
    SELECT 1 FROM app.integrations 
    WHERE id = p_integration_id 
    AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Integration hittades inte eller tillhör inte rätt tenant';
  END IF;
  
  -- Sätt status till disconnected och ta bort tokens
  UPDATE app.integrations
  SET 
    status = 'disconnected',
    access_token_encrypted = NULL,
    refresh_token_encrypted = NULL,
    expires_at = NULL,
    last_error = NULL,
    updated_at = now()
  WHERE id = p_integration_id
    AND tenant_id = p_tenant_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_integration TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_integration_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_integration TO authenticated;

COMMENT ON FUNCTION public.create_integration IS 'Skapar en ny integration i app.integrations';
COMMENT ON FUNCTION public.update_integration_status IS 'Uppdaterar status och tokens för en integration';
COMMENT ON FUNCTION public.disconnect_integration IS 'Kopplar bort en integration genom att sätta status till disconnected och ta bort alla tokens';

