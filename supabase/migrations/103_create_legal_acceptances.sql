-- ============================================================================
-- Migration: Create legal_acceptances table
-- ============================================================================
-- Creates table for tracking legal document acceptances (Terms, Privacy, DPA, SLA)
-- Includes full audit trail with IP address, user agent, and timestamp
-- ============================================================================

-- Create legal_acceptances table
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'dpa', 'sla')),
    document_version TEXT NOT NULL CHECK (document_version ~ '^v\d+\.\d+$'),
    ip_address TEXT,
    user_agent TEXT,
    acceptance_method TEXT DEFAULT 'api' CHECK (acceptance_method IN ('signup', 'checkout', 'api', 'manual')),
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one acceptance per user per document type per version
    CONSTRAINT unique_user_document_version UNIQUE (user_id, document_type, document_version)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_id ON public.legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_tenant_id ON public.legal_acceptances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_document_type ON public.legal_acceptances(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_accepted_at ON public.legal_acceptances(accepted_at DESC);

-- Enable RLS
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own acceptances
CREATE POLICY "Users can view their own acceptances"
    ON public.legal_acceptances
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own acceptances
CREATE POLICY "Users can insert their own acceptances"
    ON public.legal_acceptances
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can view all acceptances (for admin dashboard)
-- Note: This assumes you have an admin role check function
-- Adjust based on your admin role implementation
CREATE POLICY "Admins can view all acceptances"
    ON public.legal_acceptances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE public.legal_acceptances IS 'Tracks user acceptance of legal documents (Terms, Privacy, DPA, SLA) with full audit trail';
COMMENT ON COLUMN public.legal_acceptances.document_type IS 'Type of legal document: terms, privacy, dpa, sla';
COMMENT ON COLUMN public.legal_acceptances.document_version IS 'Version of the document (format: v1.0, v2.0, etc.)';
COMMENT ON COLUMN public.legal_acceptances.acceptance_method IS 'How the acceptance was recorded: signup, checkout, api, manual';
