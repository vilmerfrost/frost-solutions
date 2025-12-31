--
-- PostgreSQL database dump
--

\restrict Qr2mxQjb3aVVTQNSznUPE384Yac1fEtmRIDgPKu7yuitqZCjGCwDe8i9qmkJeOV

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA app;


ALTER SCHEMA app OWNER TO postgres;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: approve_time_entries_all(uuid, uuid, date, date); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS TABLE(id uuid, approval_status text, approved_at timestamp with time zone, approved_by uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  UPDATE public.time_entries t
  SET 
    approval_status = 'approved',
    approved_at = NOW(),
    approved_by = p_employee_id
  WHERE t.tenant_id = p_tenant_id
    AND t.approval_status IS DISTINCT FROM 'approved'  -- Handles both NULL and 'pending'
    AND (p_start_date IS NULL OR t.date >= p_start_date)
    AND (p_end_date IS NULL OR t.date <= p_end_date)
  RETURNING t.id, t.approval_status, t.approved_at, t.approved_by;
END;
$$;


ALTER FUNCTION app.approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: FUNCTION approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date, p_end_date date); Type: COMMENT; Schema: app; Owner: postgres
--

COMMENT ON FUNCTION app.approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date, p_end_date date) IS 'Bulk approve time entries. Uses UPDATE ... RETURNING to ensure read-after-write consistency and avoid replica lag.';


--
-- Name: check_permission(uuid, uuid, text, text); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.check_permission(p_user_id uuid, p_tenant_id uuid, p_resource text, p_action text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  v_role := app.get_user_role(p_user_id, p_tenant_id);

  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM app.role_permissions
    WHERE role = v_role
      AND (
        (resource = p_resource AND action = p_action)
        OR (resource = '*' AND action = 'manage')
      )
  ) INTO v_has_permission;

  RETURN COALESCE(v_has_permission, FALSE);
END;
$$;


ALTER FUNCTION app.check_permission(p_user_id uuid, p_tenant_id uuid, p_resource text, p_action text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    employee_id uuid,
    project_id uuid,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_minutes integer DEFAULT 0,
    ob_type text,
    hours_total numeric(10,2) DEFAULT 0,
    amount_total numeric(10,2) DEFAULT 0,
    is_billed boolean DEFAULT false,
    user_id uuid DEFAULT gen_random_uuid(),
    start_location_lat numeric(10,8),
    start_location_lng numeric(11,8),
    end_location_lat numeric(10,8),
    end_location_lng numeric(11,8),
    work_site_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    hours numeric DEFAULT 0,
    approval_status text DEFAULT 'pending'::text NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid
);


ALTER TABLE public.time_entries OWNER TO postgres;

--
-- Name: create_time_entry_from_schedule(uuid); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.create_time_entry_from_schedule(p_schedule_id uuid) RETURNS public.time_entries
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_sched public.schedule_slots%ROWTYPE;
  v_hours numeric(6,2);
  v_te public.time_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_sched
  FROM public.schedule_slots
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'schedule % not found', p_schedule_id USING ERRCODE = 'NO_DATA_FOUND';
  END IF;

  IF v_sched.status <> 'completed' THEN
    -- Create only when completed; silently return existing if any
    SELECT * INTO v_te FROM public.time_entries WHERE source_schedule_id = p_schedule_id;
    RETURN v_te;
  END IF;

  v_hours := EXTRACT(EPOCH FROM (v_sched.end_time - v_sched.start_time)) / 3600.0;

  -- Upsert by source_schedule_id to ensure idempotency
  INSERT INTO public.time_entries (
    tenant_id, employee_id, project_id, "date", hours, description,
    source_schedule_id, is_auto_generated, status
  )
  VALUES (
    v_sched.tenant_id, v_sched.employee_id, v_sched.project_id,
    (v_sched.start_time AT TIME ZONE 'UTC')::date,
    v_hours,
    'Auto-genererad från schema',
    v_sched.id, true, 'draft'
  )
  ON CONFLICT (source_schedule_id)
  DO UPDATE SET
    hours = EXCLUDED.hours,
    project_id = EXCLUDED.project_id,
    "date" = EXCLUDED."date",
    description = EXCLUDED.description,
    is_auto_generated = true,
    updated_at = now()
  RETURNING * INTO v_te;

  RETURN v_te;
END;
$$;


ALTER FUNCTION app.create_time_entry_from_schedule(p_schedule_id uuid) OWNER TO postgres;

--
-- Name: current_auth_uid(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.current_auth_uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT auth.uid();
$$;


ALTER FUNCTION app.current_auth_uid() OWNER TO postgres;

--
-- Name: current_employee_id(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.current_employee_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT e.id
  FROM public.employees e
  WHERE e.auth_user_id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION app.current_employee_id() OWNER TO postgres;

--
-- Name: current_role(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app."current_role"() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::json->>'role', 'employee');
$$;


ALTER FUNCTION app."current_role"() OWNER TO postgres;

--
-- Name: current_tenant_id(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.current_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'tenant_id')::uuid;
$$;


ALTER FUNCTION app.current_tenant_id() OWNER TO postgres;

--
-- Name: dashboard_stats(uuid, date); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.dashboard_stats(p_tenant uuid, p_since date) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    AS $$
SELECT jsonb_build_object(
  'projects', jsonb_build_object(
    'active', COALESCE((
      SELECT count(*)::int 
      FROM projects 
      WHERE tenant_id = p_tenant AND status = 'active'
    ), 0),
    'totalBudgetedHours', COALESCE((
      SELECT sum(budgeted_hours)::numeric 
      FROM projects 
      WHERE tenant_id = p_tenant
    ), 0)
  ),
  'time', jsonb_build_object(
    'hoursTotal', COALESCE((
      SELECT sum(hours_total)::numeric 
      FROM time_entries 
      WHERE tenant_id = p_tenant AND date >= p_since
    ), 0),
    'unbilledHours', COALESCE((
      SELECT sum(hours_total)::numeric 
      FROM time_entries 
      WHERE tenant_id = p_tenant 
      AND date >= p_since 
      AND NOT is_billed
    ), 0)
  ),
  'invoices', jsonb_build_object(
    'revenue', COALESCE((
      SELECT sum(amount)::numeric 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status = 'paid'
    ), 0),
    'unpaidCount', COALESCE((
      SELECT count(*)::int 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status IN ('sent', 'draft')
    ), 0),
    'unpaidAmount', COALESCE((
      SELECT sum(amount)::numeric 
      FROM invoices 
      WHERE tenant_id = p_tenant 
      AND issue_date >= p_since 
      AND status IN ('sent', 'draft')
    ), 0)
  ),
  'employees', jsonb_build_object(
    'total', COALESCE((
      SELECT count(*)::int 
      FROM employees 
      WHERE tenant_id = p_tenant
    ), 0)
  )
);
$$;


ALTER FUNCTION app.dashboard_stats(p_tenant uuid, p_since date) OWNER TO postgres;

--
-- Name: schedule_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    project_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    shift_type text DEFAULT 'day'::text,
    transport_time_minutes integer DEFAULT 0,
    CONSTRAINT chk_max_duration CHECK (((end_time - start_time) <= '12:00:00'::interval)),
    CONSTRAINT chk_time_order CHECK ((end_time > start_time)),
    CONSTRAINT schedule_slots_shift_type_check CHECK ((shift_type = ANY (ARRAY['day'::text, 'night'::text, 'evening'::text, 'weekend'::text, 'other'::text]))),
    CONSTRAINT schedule_slots_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT schedule_slots_transport_time_minutes_check CHECK ((transport_time_minutes >= 0))
);


ALTER TABLE public.schedule_slots OWNER TO postgres;

--
-- Name: COLUMN schedule_slots.shift_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_slots.shift_type IS 'Type of shift: day (06:00-18:00), evening (18:00-22:00), night (22:00-06:00), weekend, or other';


--
-- Name: COLUMN schedule_slots.transport_time_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_slots.transport_time_minutes IS 'Transport time in minutes between schedule slots or from home to work site';


--
-- Name: find_schedule_conflicts(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid DEFAULT NULL::uuid) RETURNS SETOF public.schedule_slots
    LANGUAGE sql STABLE
    AS $$
  SELECT s.*
  FROM public.schedule_slots s
  WHERE s.tenant_id = p_tenant_id
    AND s.employee_id = p_employee_id
    AND s.status <> 'cancelled'
    AND tstzrange(s.start_time, s.end_time) && tstzrange(p_start, p_end)
    AND (p_exclude_id IS NULL OR s.id <> p_exclude_id);
$$;


ALTER FUNCTION app.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) OWNER TO postgres;

--
-- Name: get_existing_columns(text, text, text[]); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) RETURNS TABLE(column_name text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT c.column_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = p_table_schema
    AND c.table_name   = p_table_name
    AND c.column_name  = ANY(p_candidates);
$$;


ALTER FUNCTION app.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) OWNER TO postgres;

--
-- Name: FUNCTION get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]); Type: COMMENT; Schema: app; Owner: postgres
--

COMMENT ON FUNCTION app.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) IS 'Returns list of existing columns from candidates array. Used for dynamic payroll export column detection.';


--
-- Name: get_user_role(uuid, uuid); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.get_user_role(p_user_id uuid, p_tenant_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM app.user_roles
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id
  LIMIT 1;

  RETURN COALESCE(v_role, 'employee');
END;
$$;


ALTER FUNCTION app.get_user_role(p_user_id uuid, p_tenant_id uuid) OWNER TO postgres;

--
-- Name: increment_ai_rate_limit(uuid, text, timestamp with time zone); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.increment_ai_rate_limit(p_tenant_id uuid, p_bucket_key text, p_window_start timestamp with time zone) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
    AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO app.ai_rate_limits(tenant_id, bucket_key, window_start, count)
  VALUES(p_tenant_id, p_bucket_key, p_window_start, 1)
  ON CONFLICT (tenant_id, bucket_key, window_start)
  DO UPDATE SET count = app.ai_rate_limits.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;


ALTER FUNCTION app.increment_ai_rate_limit(p_tenant_id uuid, p_bucket_key text, p_window_start timestamp with time zone) OWNER TO postgres;

--
-- Name: is_admin(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.is_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT app.current_role() = 'admin';
$$;


ALTER FUNCTION app.is_admin() OWNER TO postgres;

--
-- Name: next_work_order_number(uuid); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.next_work_order_number(p_tenant uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_year int := EXTRACT(YEAR FROM now())::int;
  v_counter int;
BEGIN
  INSERT INTO app.work_order_counters(tenant_id, year, counter)
  VALUES (p_tenant, v_year, 0)
  ON CONFLICT (tenant_id, year) DO NOTHING;

  UPDATE app.work_order_counters
  SET counter = counter + 1
  WHERE tenant_id = p_tenant AND year = v_year
  RETURNING counter INTO v_counter;

  RETURN format('WO-%s-%03s', v_year, v_counter);
END;
$$;


ALTER FUNCTION app.next_work_order_number(p_tenant uuid) OWNER TO postgres;

--
-- Name: set_search_path(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.set_search_path() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM set_config('search_path', 'public, app', true);
END;
$$;


ALTER FUNCTION app.set_search_path() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION app.set_updated_at() OWNER TO postgres;

--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION app.touch_updated_at() OWNER TO postgres;

--
-- Name: trg_schedule_completed(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.trg_schedule_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (TG_OP = 'UPDATE')
     AND NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM NEW.status)
  THEN
    PERFORM app.create_time_entry_from_schedule(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION app.trg_schedule_completed() OWNER TO postgres;

--
-- Name: trg_work_order_status_history(); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.trg_work_order_status_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO work_order_status_history(work_order_id, from_status, to_status, changed_by, reason)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.approved_by /* temporärt; uppdateras i API */, NULL);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION app.trg_work_order_status_history() OWNER TO postgres;

--
-- Name: user_in_tenant(uuid, text[]); Type: FUNCTION; Schema: app; Owner: postgres
--

CREATE FUNCTION app.user_in_tenant(p_tenant uuid, roles text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists (
    select 1 from app.user_roles ur
    where ur.tenant_id = p_tenant
      and ur.user_id = auth.uid()
      and (roles is null or ur.role = any(roles))
  );
$$;


ALTER FUNCTION app.user_in_tenant(p_tenant uuid, roles text[]) OWNER TO postgres;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: append_audit_event(uuid, text, uuid, text, uuid, uuid, jsonb, jsonb, text[], inet, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid DEFAULT NULL::uuid, p_employee_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_changed_fields text[] DEFAULT NULL::text[], p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        tenant_id,
        table_name,
        record_id,
        action,
        user_id,
        employee_id,
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_tenant_id,
        p_table_name,
        p_record_id,
        p_action,
        p_user_id,
        p_employee_id,
        p_old_values,
        p_new_values,
        p_changed_fields,
        p_ip_address,
        p_user_agent,
        p_metadata
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;


ALTER FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb) OWNER TO postgres;

--
-- Name: FUNCTION append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb) IS 'Funktion för att skapa audit events. Anropas från triggers eller API.';


--
-- Name: cleanup_expired_notifications(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_notifications() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_notifications() OWNER TO postgres;

--
-- Name: create_budget_alert(uuid, text, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_tenant_id UUID;
    v_budget_id UUID;
    v_alert_id UUID;
BEGIN
    -- Hämta tenant_id och budget_id
    SELECT pb.tenant_id, pb.id INTO v_tenant_id, v_budget_id
    FROM project_budgets pb
    WHERE pb.project_id = p_project_id;

    IF v_budget_id IS NULL THEN
        RAISE EXCEPTION 'No budget found for project: %', p_project_id;
    END IF;

    -- Kontrollera om alert redan finns för denna threshold
    SELECT id INTO v_alert_id
    FROM budget_alerts
    WHERE project_id = p_project_id
    AND alert_type = p_alert_type
    AND threshold_percentage = p_threshold_percentage
    AND status = 'active';

    IF v_alert_id IS NOT NULL THEN
        -- Uppdatera befintlig alert
        UPDATE budget_alerts
        SET current_percentage = p_current_percentage,
            created_at = NOW()
        WHERE id = v_alert_id;
        RETURN v_alert_id;
    END IF;

    -- Skapa ny alert
    INSERT INTO budget_alerts (
        tenant_id,
        project_id,
        budget_id,
        alert_type,
        threshold_percentage,
        current_percentage,
        status
    ) VALUES (
        v_tenant_id,
        p_project_id,
        v_budget_id,
        p_alert_type,
        p_threshold_percentage,
        p_current_percentage,
        'active'
    )
    RETURNING id INTO v_alert_id;

    RETURN v_alert_id;
END;
$$;


ALTER FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) OWNER TO postgres;

--
-- Name: FUNCTION create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) IS 'Skapar budget alert om threshold passerats';


--
-- Name: create_integration(uuid, text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
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


ALTER FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) OWNER TO postgres;

--
-- Name: FUNCTION create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) IS 'Skapar en ny integration i app.integrations';


--
-- Name: create_invoice_from_project(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_invoice_from_project(p_project_id uuid, p_due_days integer DEFAULT 30) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_tenant uuid;
  v_project record;
  v_number text;
  v_subtotal numeric(12,2);
  v_rot numeric(12,2);
  v_total numeric(12,2);
  v_invoice_id uuid;
  rec record;
begin
  -- Hämta projekt + tenant
  select p.*, p.tenant_id into v_project
  from public.projects p
  where p.id = p_project_id;

  if v_project.id is null then
    raise exception 'Project not found';
  end if;

  v_tenant := v_project.tenant_id;

  -- Bygg fakturanummer (enkelt för demo)
  v_number := 'INV-' || upper(substr(p_project_id::text,1,8));

  -- Räkna rader via v_invoice_lines (wow-gruppering)
  select coalesce(sum(amount_sek),0) into v_subtotal
  from public.v_invoice_lines vil
  where vil.project_id = p_project_id;

  v_rot := round(v_subtotal * 0.30, 2);
  v_total := greatest(0, v_subtotal - v_rot);

  insert into public.invoices(
    tenant_id, project_id, number, issue_date, due_date,
    customer_name, customer_email, customer_address, customer_orgnr,
    status, subtotal_sek, rot_amount_sek, total_due_sek, created_by
  ) values (
    v_tenant, p_project_id, v_number, current_date, current_date + make_interval(days => p_due_days),
    v_project.customer_name, v_project.customer_email, v_project.customer_address, v_project.customer_orgnr,
    'draft', v_subtotal, v_rot, v_total, auth.uid()
  )
  returning id into v_invoice_id;

  -- Spara kopia av raderna
  for rec in
    select description, quantity_hours, unit, rate_sek, amount_sek
    from public.v_invoice_lines
    where project_id = p_project_id
    order by description
  loop
    insert into public.invoice_lines(invoice_id, description, quantity, unit, rate_sek, amount_sek)
    values (v_invoice_id, rec.description, rec.quantity_hours, rec.unit, rec.rate_sek, rec.amount_sek);
  end loop;

  return v_invoice_id;
end;
$$;


ALTER FUNCTION public.create_invoice_from_project(p_project_id uuid, p_due_days integer) OWNER TO postgres;

--
-- Name: current_tenant_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_tenant_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Try to get tenant_id from JWT app_metadata
  RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: query employees table (legacy support during migration)
    RETURN (
      SELECT tenant_id 
      FROM employees 
      WHERE auth_user_id = auth.uid() 
      LIMIT 1
    );
END;
$$;


ALTER FUNCTION public.current_tenant_id() OWNER TO postgres;

--
-- Name: FUNCTION current_tenant_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_tenant_id() IS 'Returnerar tenant_id från JWT (app_metadata.tenant_id).';


--
-- Name: disconnect_integration(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
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


ALTER FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION disconnect_integration(p_integration_id uuid, p_tenant_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) IS 'Kopplar bort en integration genom att sätta status till disconnected och ta bort alla tokens';


--
-- Name: expire_old_quotes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.expire_old_quotes() RETURNS void
    LANGUAGE sql
    AS $$
  update public.quotes
    set status='expired'
  where status in ('sent','viewed')
    and valid_until is not null
    and valid_until < current_date
    and status <> 'expired';
$$;


ALTER FUNCTION public.expire_old_quotes() OWNER TO postgres;

--
-- Name: find_schedule_conflicts(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, start_time timestamp with time zone, end_time timestamp with time zone, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.start_time,
    s.end_time,
    s.status
  FROM public.schedule_slots s  -- Use public view instead of app.schedule_slots directly
  WHERE s.tenant_id = p_tenant_id
    AND s.employee_id = p_employee_id
    AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
    AND s.status != 'cancelled'
    AND (
      -- New slot starts during existing slot
      (p_start >= s.start_time AND p_start < s.end_time)
      OR
      -- New slot ends during existing slot
      (p_end > s.start_time AND p_end <= s.end_time)
      OR
      -- New slot completely contains existing slot
      (p_start <= s.start_time AND p_end >= s.end_time)
    )
  ORDER BY s.start_time;
END;
$$;


ALTER FUNCTION public.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) OWNER TO postgres;

--
-- Name: fuzzy_match_invoice_to_project(text, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date) RETURNS TABLE(project_id uuid, supplier_id uuid, supplier_name text, confidence numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH supplier_matches AS (
        SELECT 
            id,
            name,
            -- Beräkna likhet (0-1). Vi sätter en tröskel på 0.3
            similarity(name, p_supplier_name) AS supplier_confidence
        FROM suppliers
        WHERE similarity(name, p_supplier_name) > 0.3
        ORDER BY supplier_confidence DESC
        LIMIT 5
    )
    -- Hitta projekt från de matchade leverantörerna som var aktiva
    -- under fakturadatumet.
    SELECT 
        p.id AS project_id,
        sm.id AS supplier_id,
        sm.name AS supplier_name,
        -- Viktad poäng (t.ex. 80% leverantör, 20% datum)
        (sm.supplier_confidence * 0.8) + 0.2 AS confidence
    FROM projects p
    JOIN supplier_matches sm ON p.supplier_id = sm.id
    WHERE p_invoice_date BETWEEN p.start_date AND p.end_date
    ORDER BY confidence DESC
    LIMIT 3;
END;
$$;


ALTER FUNCTION public.fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date) OWNER TO postgres;

--
-- Name: generate_quote_number(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_quote_number(p_tenant uuid) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  y text := to_char(current_date, 'YYYY');
  next_num int;
begin
  select coalesce(max((regexp_match(q.quote_number,'[0-9]+$'))[1]::int), 0) + 1
  into next_num
  from public.quotes q
  where q.tenant_id = p_tenant
    and q.quote_number like ('OF-'||y||'-%');

  return 'OF-'||y||'-'||lpad(next_num::text, 3, '0');
end $_$;


ALTER FUNCTION public.generate_quote_number(p_tenant uuid) OWNER TO postgres;

--
-- Name: get_budget_usage(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_budget_usage(p_project_id uuid) RETURNS TABLE(budget_hours numeric, budget_material numeric, budget_total numeric, used_hours numeric, used_material numeric, used_total numeric, hours_percentage numeric, material_percentage numeric, total_percentage numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_budget project_budgets%ROWTYPE;
    v_used_hours NUMERIC := 0;
    v_used_material NUMERIC := 0;
BEGIN
    -- Hämta budget
    SELECT * INTO v_budget
    FROM project_budgets
    WHERE project_id = p_project_id;

    IF v_budget.id IS NULL THEN
        -- Ingen budget satt, returnera 0
        RETURN QUERY SELECT 
            0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
            0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
            0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;

    -- Beräkna använda timmar (summa av time_entries)
    SELECT COALESCE(SUM(hours_total), 0) INTO v_used_hours
    FROM time_entries
    WHERE project_id = p_project_id
    AND is_billed = false; -- Endast obetalda timmar

    -- Beräkna användt material (summa av material_entries)
    -- Notera: material_entries kan saknas, använd 0 som fallback
    SELECT COALESCE(SUM(total_amount), 0) INTO v_used_material
    FROM material_entries
    WHERE project_id = p_project_id;

    -- Returnera resultat
    RETURN QUERY SELECT
        v_budget.budget_hours,
        v_budget.budget_material,
        v_budget.budget_total,
        v_used_hours,
        v_used_material,
        v_used_hours + v_used_material AS used_total,
        CASE 
            WHEN v_budget.budget_hours > 0 
            THEN (v_used_hours / v_budget.budget_hours * 100)
            ELSE 0 
        END AS hours_percentage,
        CASE 
            WHEN v_budget.budget_material > 0 
            THEN (v_used_material / v_budget.budget_material * 100)
            ELSE 0 
        END AS material_percentage,
        CASE 
            WHEN v_budget.budget_total > 0 
            THEN ((v_used_hours + v_used_material) / v_budget.budget_total * 100)
            ELSE 0 
        END AS total_percentage;
END;
$$;


ALTER FUNCTION public.get_budget_usage(p_project_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_budget_usage(p_project_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_budget_usage(p_project_id uuid) IS 'Beräknar budget usage för ett projekt (timmar + material)';


--
-- Name: get_current_tenant(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_current_tenant() RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT tenant_id
  FROM public.employees
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION public.get_current_tenant() OWNER TO postgres;

--
-- Name: get_existing_columns(text, text, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) RETURNS TABLE(column_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Server-side default for schema if caller passes NULL/empty
  IF p_table_schema IS NULL OR btrim(p_table_schema) = '' THEN
    p_table_schema := 'public';
  END IF;

  -- Validate inputs
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RAISE EXCEPTION 'p_table_name must be provided and non-empty';
  END IF;

  IF p_candidates IS NULL OR array_length(p_candidates, 1) IS NULL THEN
    RAISE EXCEPTION 'p_candidates must be a non-empty text[]';
  END IF;

  -- Verify table exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = p_table_schema
      AND table_name = p_table_name
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE WARNING 'Table %.% does not exist', p_table_schema, p_table_name;
    RETURN;
  END IF;

  -- Return matching columns
  RETURN QUERY
  SELECT c.column_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = p_table_schema
    AND c.table_name   = p_table_name
    AND c.column_name  = ANY(p_candidates)
  ORDER BY c.ordinal_position;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error detecting columns for %.%: %', p_table_schema, p_table_name, SQLERRM;
    RETURN;
END;
$$;


ALTER FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) OWNER TO postgres;

--
-- Name: FUNCTION get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) IS 'Returns list of existing columns from candidates array. Validates inputs and handles missing tables gracefully.';


--
-- Name: get_feature_flag(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_flag_value BOOLEAN;
BEGIN
    SELECT CASE p_flag_name
        WHEN 'enable_bankid' THEN enable_bankid
        WHEN 'enable_peppol' THEN enable_peppol
        WHEN 'enable_customer_portal' THEN enable_customer_portal
        WHEN 'enable_budget_alerts' THEN enable_budget_alerts
        WHEN 'enable_ata_2_0' THEN enable_ata_2_0
        WHEN 'enable_audit_log' THEN enable_audit_log
        ELSE false
    END INTO v_flag_value
    FROM tenant_feature_flags
    WHERE tenant_id = p_tenant_id;

    -- Om ingen flag finns, returnera default baserat på flag_name
    IF v_flag_value IS NULL THEN
        RETURN CASE p_flag_name
            WHEN 'enable_customer_portal' THEN true
            WHEN 'enable_budget_alerts' THEN true
            WHEN 'enable_ata_2_0' THEN true
            WHEN 'enable_audit_log' THEN true
            ELSE false
        END;
    END IF;

    RETURN v_flag_value;
END;
$$;


ALTER FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) OWNER TO postgres;

--
-- Name: FUNCTION get_feature_flag(p_tenant_id uuid, p_flag_name text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) IS 'Hämtar feature flag för en tenant (returnerar default om flag saknas)';


--
-- Name: get_supplier_invoice(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_invoice JSONB;
BEGIN
  SELECT row_to_json(inv)::JSONB INTO v_invoice
  FROM app.supplier_invoices inv
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

  RETURN v_invoice;
END;
$$;


ALTER FUNCTION public.get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid) OWNER TO postgres;

--
-- Name: get_tenant_dashboard_analytics(uuid, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(total_hours numeric, active_projects bigint, total_entries bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: increment_ai_cache_hits(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_ai_cache_hits(p_key text, p_tenant_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE ai_cache
  SET hit_count = hit_count + 1
  WHERE key = p_key
    AND tenant_id = p_tenant_id;
END;
$$;


ALTER FUNCTION public.increment_ai_cache_hits(p_key text, p_tenant_id uuid) OWNER TO postgres;

--
-- Name: increment_public_link_views(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_public_link_views() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.event_type = 'viewed' THEN
        UPDATE public_links
        SET view_count = view_count + 1
        WHERE id = NEW.public_link_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.increment_public_link_views() OWNER TO postgres;

--
-- Name: insert_supplier_invoice(uuid, uuid, uuid, text, integer, text, text, text, date, text, numeric, jsonb, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.supplier_invoices (
    tenant_id, supplier_id, project_id, file_path, file_size_bytes,
    mime_type, original_filename, invoice_number, invoice_date, status,
    ocr_confidence, ocr_data, extracted_data, created_by
  )
  VALUES (
    tenant_id, supplier_id, project_id, file_path, file_size,
    mime_type, original_filename, invoice_number, invoice_date, status,
    ocr_confidence, ocr_data, extracted_data, created_by
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;


ALTER FUNCTION public.insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid) OWNER TO postgres;

--
-- Name: insert_supplier_invoice_v2(jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
    AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice JSONB;
  v_tenant_id UUID;
  v_supplier_id UUID;
  v_project_id UUID;
  v_file_path TEXT;
  v_file_size INTEGER;
  v_mime_type TEXT;
  v_original_filename TEXT;
  v_invoice_number TEXT;
  v_invoice_date DATE;
  v_status TEXT;
  v_ocr_confidence NUMERIC;
  v_ocr_data JSONB;
  v_extracted_data JSONB;
  v_created_by UUID;
BEGIN
  -- Extract parameters from JSONB
  v_tenant_id := (p_payload->>'p_tenant_id')::UUID;
  v_supplier_id := (p_payload->>'p_supplier_id')::UUID;
  v_project_id := NULLIF(p_payload->>'p_project_id', '')::UUID;
  v_file_path := p_payload->>'p_file_path';
  v_file_size := COALESCE((p_payload->>'p_file_size')::INTEGER, 0);
  v_mime_type := COALESCE(p_payload->>'p_mime_type', 'application/pdf');
  v_original_filename := p_payload->>'p_original_filename';
  v_invoice_number := NULLIF(p_payload->>'p_invoice_number', '');
  v_invoice_date := COALESCE(
    NULLIF(p_payload->>'p_invoice_date', '')::DATE,
    CURRENT_DATE
  );
  v_status := COALESCE(p_payload->>'p_status', 'pending_approval');
  v_ocr_confidence := NULLIF(p_payload->>'p_ocr_confidence', '')::NUMERIC;
  v_ocr_data := p_payload->'p_ocr_data';
  v_extracted_data := p_payload->'p_extracted_data';
  v_created_by := NULLIF(p_payload->>'p_created_by', '')::UUID;

  -- Validate required fields
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'p_tenant_id is required';
  END IF;
  
  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'p_supplier_id is required';
  END IF;
  
  IF v_file_path IS NULL OR v_file_path = '' THEN
    RAISE EXCEPTION 'p_file_path is required';
  END IF;

  -- Insert into app.supplier_invoices
  INSERT INTO app.supplier_invoices (
    tenant_id,
    supplier_id,
    project_id,
    file_path,
    file_size_bytes,
    mime_type,
    original_filename,
    invoice_number,
    invoice_date,
    status,
    ocr_confidence,
    ocr_data,
    extracted_data,
    created_by
  ) VALUES (
    v_tenant_id,
    v_supplier_id,
    v_project_id,
    v_file_path,
    v_file_size,
    v_mime_type,
    v_original_filename,
    v_invoice_number,
    v_invoice_date,
    v_status,
    v_ocr_confidence,
    v_ocr_data,
    v_extracted_data,
    v_created_by
  )
  RETURNING id INTO v_invoice_id;

  -- Log to history (transactional)
  INSERT INTO app.supplier_invoice_history (
    tenant_id,
    supplier_invoice_id,
    action,
    changed_by,
    data
  ) VALUES (
    v_tenant_id,
    v_invoice_id,
    'created',
    v_created_by,
    jsonb_build_object(
      'status', v_status,
      'file_path', v_file_path,
      'ocr_confidence', v_ocr_confidence,
      'invoice_number', v_invoice_number
    )
  );

  -- Return complete invoice
  SELECT jsonb_build_object(
    'id', id,
    'tenant_id', tenant_id,
    'supplier_id', supplier_id,
    'project_id', project_id,
    'file_path', file_path,
    'invoice_number', invoice_number,
    'invoice_date', invoice_date,
    'status', status,
    'ocr_confidence', ocr_confidence,
    'created_at', created_at
  ) INTO v_invoice
  FROM app.supplier_invoices
  WHERE id = v_invoice_id;

  RETURN v_invoice;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to insert supplier invoice: %', SQLERRM;
END;
$$;


ALTER FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) OWNER TO postgres;

--
-- Name: FUNCTION insert_supplier_invoice_v2(p_payload jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) IS 'Insert supplier invoice using JSONB payload. More robust than multi-parameter version.';


--
-- Name: jwt_tenant_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.jwt_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  with claims as (
    select nullif(current_setting('request.jwt.claims', true), '')::jsonb as c
  )
  select coalesce(
           (c->'app_metadata'->>'tenant_id')::uuid,
           (c->'user_metadata'->>'tenant_id')::uuid
         )
  from claims;
$$;


ALTER FUNCTION public.jwt_tenant_id() OWNER TO postgres;

--
-- Name: list_supplier_invoices(uuid, integer, integer, text, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.list_supplier_invoices(p_tenant_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_status text DEFAULT NULL::text, p_project_id uuid DEFAULT NULL::uuid, p_supplier_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_invoices JSONB;
  v_total INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*)::INTEGER INTO v_total
  FROM app.supplier_invoices
  WHERE tenant_id = p_tenant_id
    AND (p_status IS NULL OR status = p_status)
    AND (p_project_id IS NULL OR project_id = p_project_id)
    AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
    AND (
      p_search IS NULL
      OR invoice_number ILIKE '%' || p_search || '%'
      OR notes ILIKE '%' || p_search || '%'
    );

  -- Get invoices
  SELECT COALESCE(jsonb_agg(row_to_json(inv)), '[]'::JSONB) INTO v_invoices
  FROM (
    SELECT *
    FROM app.supplier_invoices
    WHERE tenant_id = p_tenant_id
      AND (p_status IS NULL OR status = p_status)
      AND (p_project_id IS NULL OR project_id = p_project_id)
      AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
      AND (
        p_search IS NULL
        OR invoice_number ILIKE '%' || p_search || '%'
        OR notes ILIKE '%' || p_search || '%'
      )
    ORDER BY invoice_date DESC, created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) inv;

  RETURN jsonb_build_object(
    'data', v_invoices,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;


ALTER FUNCTION public.list_supplier_invoices(p_tenant_id uuid, p_limit integer, p_offset integer, p_status text, p_project_id uuid, p_supplier_id uuid, p_search text) OWNER TO postgres;

--
-- Name: lock_payroll_period(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  update public.payroll_periods
  set status = 'locked',
      locked_at = now(),
      locked_by = p_user
  where id = p_period and tenant_id = p_tenant and status = 'open';
end $$;


ALTER FUNCTION public.lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) OWNER TO postgres;

--
-- Name: log_rot_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_rot_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.rot_status_history (
      rot_application_id,
      status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_rot_status_change() OWNER TO postgres;

--
-- Name: on_quote_items_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_quote_items_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- For DELETE triggers, use OLD; for INSERT/UPDATE use NEW. The trigger below is AFTER ... FOR EACH ROW,
  -- and we call recalc with the quote_id from NEW when available, otherwise from OLD.
  if TG_OP = 'DELETE' then
    perform public.recalc_quote_totals(old.quote_id);
  else
    perform public.recalc_quote_totals(new.quote_id);
  end if;
  return null;
end $$;


ALTER FUNCTION public.on_quote_items_change() OWNER TO postgres;

--
-- Name: on_supplier_invoice_item_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_supplier_invoice_item_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_invoice_id uuid;
begin
  -- Handle both INSERT/UPDATE (new) and DELETE (old)
  v_invoice_id := COALESCE(new.supplier_invoice_id, old.supplier_invoice_id);
  
  if v_invoice_id is not null then
    perform public.recalc_supplier_invoice_totals(v_invoice_id);
  end if;
  
  -- Return appropriate row based on operation
  return COALESCE(new, old);
end $$;


ALTER FUNCTION public.on_supplier_invoice_item_change() OWNER TO postgres;

--
-- Name: on_supplier_invoice_payment_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_supplier_invoice_payment_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_invoice_id uuid;
begin
  -- Handle both INSERT/UPDATE (new) and DELETE (old)
  v_invoice_id := COALESCE(new.supplier_invoice_id, old.supplier_invoice_id);
  
  if v_invoice_id is not null then
    perform public.recalc_supplier_invoice_totals(v_invoice_id);
  end if;
  
  -- Return appropriate row based on operation
  return COALESCE(new, old);
end $$;


ALTER FUNCTION public.on_supplier_invoice_payment_change() OWNER TO postgres;

--
-- Name: prevent_approval_regression(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_approval_regression() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Endast agera vid UPDATE operationer
  IF TG_OP = 'UPDATE' THEN
    -- Om någon försöker sätta approval_status till 'pending' när den redan är 'approved'
    IF NEW.approval_status = 'pending' AND OLD.approval_status = 'approved' THEN
      -- Behåll approved status och metadata
      NEW.approval_status := OLD.approval_status;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
      
      -- Logga varning (kan tas bort i produktion om önskat)
      RAISE WARNING 'Attempted to regress approval_status from approved to pending for entry % - prevented', OLD.id;
    END IF;
    
    -- Om någon försöker sätta status till 'pending' när den redan är 'approved' (legacy kolumn)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'status'
    ) THEN
      IF NEW.status = 'pending' AND OLD.status = 'approved' THEN
        NEW.status := OLD.status;
        RAISE WARNING 'Attempted to regress status from approved to pending for entry % - prevented', OLD.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_approval_regression() OWNER TO postgres;

--
-- Name: FUNCTION prevent_approval_regression(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_approval_regression() IS 'Förhindrar oavsiktlig regression av approval_status från approved till pending. Detta skyddar mot att offline sync eller andra operationer skriver över godkänd status.';


--
-- Name: recalc_quote_totals(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalc_quote_totals(p_quote_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_tenant uuid;
  v_sub numeric(14,2);
  v_disc numeric(14,2);
  v_tax numeric(14,2);
  v_total numeric(14,2);
begin
  select q.tenant_id into v_tenant from public.quotes q where q.id = p_quote_id;
  if v_tenant is null then return; end if;

  select
    coalesce(sum(qi.line_total),0),
    coalesce(sum(qi.discount_amount),0),
    coalesce(sum( round((qi.net_price) * (qi.vat_rate/100.0), 2) ), 0)
  into v_sub, v_disc, v_tax
  from public.quote_items qi
  where qi.quote_id = p_quote_id;

  v_total := (v_sub - v_disc) + v_tax;

  update public.quotes
  set subtotal = v_sub,
      discount_amount = v_disc,
      tax_amount = v_tax,
      total_amount = v_total
  where id = p_quote_id;
end $$;


ALTER FUNCTION public.recalc_quote_totals(p_quote_id uuid) OWNER TO postgres;

--
-- Name: recalc_supplier_invoice_totals(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalc_supplier_invoice_totals(p_invoice_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_sub numeric(14,2);
  v_tax numeric(14,2);
  v_total numeric(14,2);
  v_paid numeric(14,2);
begin
  select
    coalesce(sum(line_total),0),
    coalesce(sum(tax_amount),0)
  into v_sub, v_tax
  from public.supplier_invoice_items
  where supplier_invoice_id = p_invoice_id;

  v_total := v_sub + v_tax;

  select coalesce(sum(amount),0) into v_paid
  from public.supplier_invoice_payments
  where supplier_invoice_id = p_invoice_id;

  update public.supplier_invoices
  set amount_subtotal = v_sub,
      amount_tax = v_tax,
      amount_total = v_total,
      amount_paid = v_paid
  where id = p_invoice_id;
end $$;


ALTER FUNCTION public.recalc_supplier_invoice_totals(p_invoice_id uuid) OWNER TO postgres;

--
-- Name: reload_postgrest_schema(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reload_postgrest_schema() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
  RAISE NOTICE 'PostgREST schema reload notification sent';
END;
$$;


ALTER FUNCTION public.reload_postgrest_schema() OWNER TO postgres;

--
-- Name: set_invoice_status(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_invoice_status(p_invoice_id uuid, p_status text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if p_status not in ('draft','sent','paid','void') then
    raise exception 'Invalid status';
  end if;

  update public.invoices
     set status = p_status
   where id = p_invoice_id;

  if not found then
    raise exception 'Invoice not found';
  end if;
end;
$$;


ALTER FUNCTION public.set_invoice_status(p_invoice_id uuid, p_status text) OWNER TO postgres;

--
-- Name: set_tenant_from_jwt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_tenant_from_jwt() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.tenant_id is null then
    new.tenant_id := public.jwt_tenant_id();
  end if;
  return new;
end; $$;


ALTER FUNCTION public.set_tenant_from_jwt() OWNER TO postgres;

--
-- Name: set_tenant_id_from_jwt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_tenant_id_from_jwt() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if NEW.tenant_id is null then
    NEW.tenant_id := public.jwt_tenant_id();
  end if;
  return NEW;
end; $$;


ALTER FUNCTION public.set_tenant_id_from_jwt() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: set_user_id_from_jwt(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_user_id_from_jwt() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if NEW.user_id is null then
    NEW.user_id := auth.uid();
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION public.set_user_id_from_jwt() OWNER TO postgres;

--
-- Name: sync_employee_name(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_employee_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Om name uppdateras, synka till full_name om det är tomt
  IF TG_OP = 'UPDATE' AND NEW.name IS NOT NULL AND (NEW.full_name IS NULL OR NEW.full_name = '') THEN
    NEW.full_name = NEW.name;
  END IF;
  
  -- Om full_name uppdateras, synka till name om det är tomt
  IF TG_OP = 'UPDATE' AND NEW.full_name IS NOT NULL AND (NEW.name IS NULL OR NEW.name = '') THEN
    NEW.name = NEW.full_name;
  END IF;
  
  -- Vid INSERT, se till att båda är satta
  IF TG_OP = 'INSERT' THEN
    IF NEW.name IS NOT NULL AND (NEW.full_name IS NULL OR NEW.full_name = '') THEN
      NEW.full_name = NEW.name;
    ELSIF NEW.full_name IS NOT NULL AND (NEW.name IS NULL OR NEW.name = '') THEN
      NEW.name = NEW.full_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_employee_name() OWNER TO postgres;

--
-- Name: sync_time_entries_hours(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_time_entries_hours() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- keep hours equal to hours_total on INSERT/UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    NEW.hours := COALESCE(NEW.hours_total, 0);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_time_entries_hours() OWNER TO postgres;

--
-- Name: trigger_workflow_orchestrator(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_workflow_orchestrator() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Anropar en Edge Function 'workflow-trigger' med det nya jobbets ID
    PERFORM net.http_post(
        url    := 'https://<project_ref>.supabase.co/functions/v1/workflow-trigger',
        headers:= '{"Authorization": "Bearer <supabase_service_role_key>"}'::jsonb,
        body   := jsonb_build_object('execution_id', NEW.id)
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_workflow_orchestrator() OWNER TO postgres;

--
-- Name: unlock_payroll_period(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  update public.payroll_periods
  set status = 'open',
      locked_at = null,
      locked_by = null
  where id = p_period and tenant_id = p_tenant and status in ('locked','failed','exported');
end $$;


ALTER FUNCTION public.unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) OWNER TO postgres;

--
-- Name: update_ata_items_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ata_items_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ata_items_updated_at() OWNER TO postgres;

--
-- Name: update_ata_status_timeline(uuid, text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid DEFAULT NULL::uuid, p_comment text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_tenant_id UUID;
    v_timeline_entry JSONB;
BEGIN
    -- Hämta tenant_id från rot_application
    SELECT tenant_id INTO v_tenant_id
    FROM rot_applications
    WHERE id = p_rot_application_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Rot application not found: %', p_rot_application_id;
    END IF;

    -- Skapa timeline entry
    v_timeline_entry := jsonb_build_object(
        'status', p_status,
        'timestamp', NOW(),
        'user_id', p_user_id,
        'comment', p_comment
    );

    -- Lägg till i timeline array
    UPDATE rot_applications
    SET status_timeline = status_timeline || v_timeline_entry::jsonb
    WHERE id = p_rot_application_id;

    -- Logga audit event
    PERFORM append_audit_event(
        v_tenant_id,
        'rot_applications',
        p_rot_application_id,
        'update',
        p_user_id,
        NULL,
        NULL,
        jsonb_build_object('status', p_status, 'comment', p_comment),
        ARRAY['status_timeline'],
        NULL,
        NULL,
        jsonb_build_object('timeline_update', true)
    );
END;
$$;


ALTER FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text) OWNER TO postgres;

--
-- Name: FUNCTION update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text) IS 'Uppdaterar status_timeline i rot_applications och loggar audit event';


--
-- Name: update_client_search_text(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_client_search_text() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish_unaccent',
    COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.org_number,'')
  );
  RETURN NEW;
END$$;


ALTER FUNCTION public.update_client_search_text() OWNER TO postgres;

--
-- Name: update_integration_status(uuid, text, text, text, timestamp with time zone, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text DEFAULT NULL::text, p_refresh_token_encrypted text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_scope text DEFAULT NULL::text, p_last_error text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'app'
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


ALTER FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text) OWNER TO postgres;

--
-- Name: FUNCTION update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text) IS 'Uppdaterar status och tokens för en integration';


--
-- Name: update_project_budgets_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_project_budgets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_project_budgets_updated_at() OWNER TO postgres;

--
-- Name: update_project_search_text(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_project_search_text() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_text := to_tsvector('swedish_unaccent',
    COALESCE(NEW.name,'') || ' ' ||
    COALESCE(NEW.status::text,'')
  );
  RETURN NEW;
END$$;


ALTER FUNCTION public.update_project_search_text() OWNER TO postgres;

--
-- Name: update_public_links_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_public_links_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_public_links_updated_at() OWNER TO postgres;

--
-- Name: update_rot_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_rot_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_rot_updated_at() OWNER TO postgres;

--
-- Name: update_signatures_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_signatures_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_signatures_updated_at() OWNER TO postgres;

--
-- Name: update_supplier_invoice(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.supplier_invoices
  SET status = update_supplier_invoice.status,
      extracted_data = update_supplier_invoice.extracted_data,
      updated_at = NOW()
  WHERE id = invoice_id;
END;
$$;


ALTER FUNCTION public.update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb) OWNER TO postgres;

--
-- Name: update_tenant_feature_flags_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tenant_feature_flags_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tenant_feature_flags_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: validate_timesheets_for_payroll(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_timesheets_for_payroll(p_tenant uuid, p_period uuid) RETURNS TABLE(not_approved_count bigint)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  _count bigint;
  _has_status boolean;
  _has_approval_status boolean;
  _has_approved_at boolean;
begin
  -- Detect which approval-related columns exist on public.time_entries
  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'time_entries' and column_name = 'status'
  ) into _has_status;

  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'time_entries' and column_name = 'approval_status'
  ) into _has_approval_status;

  select exists(
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'time_entries' and column_name = 'approved_at'
  ) into _has_approved_at;

  if _has_status then
    execute format($f$
      select count(*)::bigint
      from public.time_entries te
      join public.payroll_periods pp on pp.id = %L and pp.tenant_id = %L
      where te.tenant_id = %L
        and te.date >= pp.start_date
        and te.date <= pp.end_date
        and coalesce(te.status,'draft') <> 'approved'
    $f$, p_period::text, p_tenant::text, p_tenant::text)
    into _count;
  elsif _has_approval_status then
    execute format($f$
      select count(*)::bigint
      from public.time_entries te
      join public.payroll_periods pp on pp.id = %L and pp.tenant_id = %L
      where te.tenant_id = %L
        and te.date >= pp.start_date
        and te.date <= pp.end_date
        and coalesce(te.approval_status,'draft') <> 'approved'
    $f$, p_period::text, p_tenant::text, p_tenant::text)
    into _count;
  elsif _has_approved_at then
    -- consider rows without approved_at as not approved
    execute format($f$
      select count(*)::bigint
      from public.time_entries te
      join public.payroll_periods pp on pp.id = %L and pp.tenant_id = %L
      where te.tenant_id = %L
        and te.date >= pp.start_date
        and te.date <= pp.end_date
        and te.approved_at is null
    $f$, p_period::text, p_tenant::text, p_tenant::text)
    into _count;
  else
    -- No approval column found — conservative default: count all entries in the period
    execute format($f$
      select count(*)::bigint
      from public.time_entries te
      join public.payroll_periods pp on pp.id = %L and pp.tenant_id = %L
      where te.tenant_id = %L
        and te.date >= pp.start_date
        and te.date <= pp.end_date
    $f$, p_period::text, p_tenant::text, p_tenant::text)
    into _count;
  end if;

  return query select _count as not_approved_count;
end;
$_$;


ALTER FUNCTION public.validate_timesheets_for_payroll(p_tenant uuid, p_period uuid) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: swedish_unaccent; Type: TEXT SEARCH CONFIGURATION; Schema: public; Owner: postgres
--

CREATE TEXT SEARCH CONFIGURATION public.swedish_unaccent (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR asciiword WITH swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR word WITH public.unaccent, swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR hword_part WITH public.unaccent, swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR hword_asciipart WITH swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR asciihword WITH swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR hword WITH public.unaccent, swedish_stem;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent
    ADD MAPPING FOR uint WITH simple;


ALTER TEXT SEARCH CONFIGURATION public.swedish_unaccent OWNER TO postgres;

--
-- Name: absences; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.absences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    absence_type text NOT NULL,
    reason text,
    approved boolean DEFAULT false,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT absences_absence_type_check CHECK ((absence_type = ANY (ARRAY['vacation'::text, 'sick'::text, 'other'::text]))),
    CONSTRAINT check_date_range CHECK ((end_date >= start_date))
);


ALTER TABLE app.absences OWNER TO postgres;

--
-- Name: ai_cache; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    cache_key text NOT NULL,
    cache_type text NOT NULL,
    response_data jsonb NOT NULL,
    model_used text,
    ttl_days integer DEFAULT 7 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT ai_cache_cache_type_check CHECK ((cache_type = ANY (ARRAY['invoice'::text, 'project-plan'::text, 'budget'::text, 'material'::text, 'kma'::text, 'summary'::text])))
);


ALTER TABLE app.ai_cache OWNER TO postgres;

--
-- Name: ai_chat_feedback; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_chat_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid,
    message_id uuid,
    rating text,
    reason text,
    feedback_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_chat_feedback_rating_check CHECK ((rating = ANY (ARRAY['positive'::text, 'negative'::text])))
);


ALTER TABLE app.ai_chat_feedback OWNER TO postgres;

--
-- Name: ai_conversation_summaries; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_conversation_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    summary text NOT NULL,
    message_range_start integer NOT NULL,
    message_range_end integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.ai_conversation_summaries OWNER TO postgres;

--
-- Name: ai_conversations; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title text,
    created_by uuid NOT NULL,
    token_used integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.ai_conversations OWNER TO postgres;

--
-- Name: ai_intent_history; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_intent_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    intent text NOT NULL,
    query_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.ai_intent_history OWNER TO postgres;

--
-- Name: ai_messages; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content jsonb NOT NULL,
    token_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['system'::text, 'user'::text, 'assistant'::text, 'tool'::text])))
);


ALTER TABLE app.ai_messages OWNER TO postgres;

--
-- Name: ai_rate_limits; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_rate_limits (
    tenant_id uuid NOT NULL,
    bucket_key text NOT NULL,
    window_start timestamp with time zone NOT NULL,
    count integer DEFAULT 0 NOT NULL
);


ALTER TABLE app.ai_rate_limits OWNER TO postgres;

--
-- Name: ai_response_cache; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ai_response_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    cache_key text NOT NULL,
    response jsonb NOT NULL,
    token_saved integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.ai_response_cache OWNER TO postgres;

--
-- Name: api_rate_limits; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.api_rate_limits (
    id bigint NOT NULL,
    tenant_id uuid NOT NULL,
    route text NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.api_rate_limits OWNER TO postgres;

--
-- Name: api_rate_limits_id_seq; Type: SEQUENCE; Schema: app; Owner: postgres
--

CREATE SEQUENCE app.api_rate_limits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE app.api_rate_limits_id_seq OWNER TO postgres;

--
-- Name: api_rate_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: app; Owner: postgres
--

ALTER SEQUENCE app.api_rate_limits_id_seq OWNED BY app.api_rate_limits.id;


--
-- Name: factoring_integrations; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.factoring_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider text NOT NULL,
    merchant_id text NOT NULL,
    api_key_id text NOT NULL,
    api_key_enc text NOT NULL,
    hmac_algo text DEFAULT 'sha256'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT factoring_integrations_provider_check CHECK ((provider = 'resurs'::text))
);


ALTER TABLE app.factoring_integrations OWNER TO postgres;

--
-- Name: factoring_offers; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.factoring_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    provider text NOT NULL,
    request_payload jsonb NOT NULL,
    response_payload jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    offer_amount numeric(18,2),
    fees numeric(18,2),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT factoring_offers_provider_check CHECK ((provider = 'resurs'::text)),
    CONSTRAINT factoring_offers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'offered'::text, 'accepted'::text, 'rejected'::text, 'failed'::text])))
);


ALTER TABLE app.factoring_offers OWNER TO postgres;

--
-- Name: factoring_payments; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.factoring_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    provider text NOT NULL,
    payout_amount numeric(18,2) NOT NULL,
    payout_date date NOT NULL,
    reference text,
    raw jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT factoring_payments_provider_check CHECK ((provider = 'resurs'::text))
);


ALTER TABLE app.factoring_payments OWNER TO postgres;

--
-- Name: factoring_webhooks; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.factoring_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider text NOT NULL,
    event_type text NOT NULL,
    signature text,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT factoring_webhooks_provider_check CHECK ((provider = 'resurs'::text))
);


ALTER TABLE app.factoring_webhooks OWNER TO postgres;

--
-- Name: idempotency_keys; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.idempotency_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    route text NOT NULL,
    key text NOT NULL,
    response jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.idempotency_keys OWNER TO postgres;

--
-- Name: integration_jobs; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.integration_jobs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    job_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    last_error text,
    scheduled_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT integration_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'success'::text, 'failed'::text, 'retry'::text])))
);


ALTER TABLE app.integration_jobs OWNER TO postgres;

--
-- Name: integration_mappings; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.integration_mappings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    entity_type text NOT NULL,
    local_id uuid NOT NULL,
    remote_id text NOT NULL,
    remote_extra jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.integration_mappings OWNER TO postgres;

--
-- Name: integrations; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.integrations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    provider text NOT NULL,
    status text DEFAULT 'disconnected'::text NOT NULL,
    client_id text NOT NULL,
    client_secret_encrypted text NOT NULL,
    access_token_encrypted text,
    refresh_token_encrypted text,
    scope text,
    expires_at timestamp with time zone,
    webhook_secret_encrypted text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_error text,
    last_synced_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT integrations_provider_check CHECK ((provider = ANY (ARRAY['fortnox'::text, 'visma_eaccounting'::text, 'visma_payroll'::text]))),
    CONSTRAINT integrations_status_check CHECK ((status = ANY (ARRAY['disconnected'::text, 'connected'::text, 'error'::text])))
);


ALTER TABLE app.integrations OWNER TO postgres;

--
-- Name: TABLE integrations; Type: COMMENT; Schema: app; Owner: postgres
--

COMMENT ON TABLE app.integrations IS 'OAuth-konfigurationer + krypterade tokens per tenant och provider.';


--
-- Name: ocr_processing_logs; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.ocr_processing_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    correlation_id text NOT NULL,
    doc_type text NOT NULL,
    file_path text,
    stage text NOT NULL,
    message text,
    level text DEFAULT 'info'::text NOT NULL,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ocr_processing_logs_doc_type_check CHECK ((doc_type = ANY (ARRAY['delivery_note'::text, 'invoice'::text, 'form'::text]))),
    CONSTRAINT ocr_processing_logs_level_check CHECK ((level = ANY (ARRAY['info'::text, 'warn'::text, 'error'::text])))
);


ALTER TABLE app.ocr_processing_logs OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_role_permissions_action CHECK ((action = ANY (ARRAY['create'::text, 'read'::text, 'update'::text, 'delete'::text, 'manage'::text]))),
    CONSTRAINT chk_role_permissions_role CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'manager'::text, 'employee'::text, 'client'::text])))
);


ALTER TABLE app.role_permissions OWNER TO postgres;

--
-- Name: rot_deduction_history; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.rot_deduction_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    rot_id uuid NOT NULL,
    action text NOT NULL,
    meta jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE app.rot_deduction_history OWNER TO postgres;

--
-- Name: rot_deductions; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.rot_deductions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    personal_identity_no bytea NOT NULL,
    rot_percentage integer NOT NULL,
    labor_amount_sek numeric(18,2) NOT NULL,
    material_amount_sek numeric(18,2) DEFAULT 0 NOT NULL,
    travel_amount_sek numeric(18,2) DEFAULT 0 NOT NULL,
    deduction_amount_sek numeric(18,2) NOT NULL,
    xml_payload xml,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rot_deductions_rot_percentage_check CHECK ((rot_percentage = ANY (ARRAY[30, 50]))),
    CONSTRAINT rot_deductions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'queued'::text, 'submitted'::text, 'accepted'::text, 'rejected'::text])))
);


ALTER TABLE app.rot_deductions OWNER TO postgres;

--
-- Name: schedule_slots; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.schedule_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    project_id uuid,
    work_site_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    shift_type text DEFAULT 'day'::text,
    transport_time_minutes integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_duration CHECK (((EXTRACT(epoch FROM (end_time - start_time)) / (3600)::numeric) <= (12)::numeric)),
    CONSTRAINT check_time_range CHECK ((end_time > start_time)),
    CONSTRAINT schedule_slots_shift_type_check CHECK ((shift_type = ANY (ARRAY['day'::text, 'night'::text, 'evening'::text, 'weekend'::text, 'other'::text]))),
    CONSTRAINT schedule_slots_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT schedule_slots_transport_time_minutes_check CHECK ((transport_time_minutes >= 0))
);


ALTER TABLE app.schedule_slots OWNER TO postgres;

--
-- Name: supplier_invoice_history; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.supplier_invoice_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    action text NOT NULL,
    changed_by uuid,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT supplier_invoice_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'approved'::text, 'rejected'::text, 'paid'::text, 'booked'::text, 'archived'::text, 'ocr_scanned'::text, 'markup_applied'::text, 'converted'::text])))
);


ALTER TABLE app.supplier_invoice_history OWNER TO postgres;

--
-- Name: supplier_invoices; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.supplier_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    project_id uuid,
    file_path text,
    file_size_bytes integer DEFAULT 0,
    mime_type text DEFAULT 'application/pdf'::text,
    original_filename text,
    invoice_number text,
    invoice_date date DEFAULT CURRENT_DATE,
    due_date date,
    status text DEFAULT 'pending_approval'::text,
    ocr_status text,
    ocr_confidence numeric(5,2),
    ocr_data jsonb,
    extracted_data jsonb,
    currency text DEFAULT 'SEK'::text,
    exchange_rate numeric(12,6) DEFAULT 1,
    amount_subtotal numeric(14,2) DEFAULT 0,
    amount_tax numeric(14,2) DEFAULT 0,
    amount_total numeric(14,2) DEFAULT 0,
    amount_paid numeric(14,2) DEFAULT 0,
    amount_remaining numeric(14,2) GENERATED ALWAYS AS (GREATEST((amount_total - amount_paid), (0)::numeric)) STORED,
    markup_total numeric(14,2) DEFAULT 0,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT supplier_invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'booked'::text, 'paid'::text, 'archived'::text, 'rejected'::text])))
);


ALTER TABLE app.supplier_invoices OWNER TO postgres;

--
-- Name: sync_logs; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.sync_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid,
    level text NOT NULL,
    message text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    operation text,
    direction text,
    resource_type text,
    resource_id text,
    status text,
    error_code text,
    error_message text,
    duration_ms integer,
    retry_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT sync_logs_level_check CHECK ((level = ANY (ARRAY['info'::text, 'warn'::text, 'error'::text])))
);


ALTER TABLE app.sync_logs OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_user_roles_role CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'manager'::text, 'employee'::text, 'client'::text])))
);


ALTER TABLE app.user_roles OWNER TO postgres;

--
-- Name: work_order_counters; Type: TABLE; Schema: app; Owner: postgres
--

CREATE TABLE app.work_order_counters (
    tenant_id uuid NOT NULL,
    year integer NOT NULL,
    counter integer DEFAULT 0 NOT NULL
);


ALTER TABLE app.work_order_counters OWNER TO postgres;

--
-- Name: TABLE work_order_counters; Type: COMMENT; Schema: app; Owner: postgres
--

COMMENT ON TABLE app.work_order_counters IS 'Per-tenant räknare för arbetsordernummer (WO-YYYY-NNN).';


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: absences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT absences_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT absences_type_check CHECK ((type = ANY (ARRAY['vacation'::text, 'sick'::text, 'other'::text]))),
    CONSTRAINT chk_absence_range CHECK ((end_date >= start_date))
);


ALTER TABLE public.absences OWNER TO postgres;

--
-- Name: accounting_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider text NOT NULL,
    status text NOT NULL,
    access_token_id uuid,
    refresh_token_id uuid,
    expires_at timestamp with time zone,
    scope text,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT accounting_integrations_provider_check CHECK ((provider = ANY (ARRAY['fortnox'::text, 'visma'::text]))),
    CONSTRAINT accounting_integrations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'error'::text, 'pending'::text])))
);


ALTER TABLE public.accounting_integrations OWNER TO postgres;

--
-- Name: aeta_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aeta_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    employee_id uuid,
    hours numeric(5,2),
    comment text,
    image_url text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    user_id uuid DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    admin_notes text,
    approved_by uuid,
    reviewed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    attachment_url text,
    attachment_name text,
    CONSTRAINT aeta_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.aeta_requests OWNER TO postgres;

--
-- Name: agent_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_audit (
    id bigint NOT NULL,
    ts timestamp with time zone DEFAULT now(),
    actor text NOT NULL,
    tool text NOT NULL,
    input_hash text NOT NULL,
    output_hash text NOT NULL,
    cost_sek numeric(10,2) DEFAULT 0,
    meta jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.agent_audit OWNER TO postgres;

--
-- Name: agent_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_audit_id_seq OWNER TO postgres;

--
-- Name: agent_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_audit_id_seq OWNED BY public.agent_audit.id;


--
-- Name: ai_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    key text NOT NULL,
    response text NOT NULL,
    tokens_saved integer NOT NULL,
    hit_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.ai_cache OWNER TO postgres;

--
-- Name: api_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_cache (
    key text NOT NULL,
    value jsonb,
    expires_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.api_cache OWNER TO postgres;

--
-- Name: ata_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ata_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    rot_application_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ata_items OWNER TO postgres;

--
-- Name: TABLE ata_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ata_items IS 'Radartiklar för ÄTA (beskrivning, kvantitet, pris)';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL,
    user_id uuid,
    employee_id uuid,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    ip_address inet,
    user_agent text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'view'::text, 'export'::text])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Generisk auditlogg för alla tabeller. Immutable (no update/delete).';


--
-- Name: COLUMN audit_logs.table_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.table_name IS 'Namn på tabellen som ändrades';


--
-- Name: COLUMN audit_logs.record_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.record_id IS 'ID på raden som ändrades';


--
-- Name: COLUMN audit_logs.changed_fields; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.changed_fields IS 'Array av fältnamn som ändrades (för update)';


--
-- Name: COLUMN audit_logs.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.metadata IS 'Extra metadata som JSON (t.ex. API endpoint, batch operation ID)';


--
-- Name: budget_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    project_id uuid NOT NULL,
    budget_id uuid NOT NULL,
    alert_type text NOT NULL,
    threshold_percentage numeric(5,2) NOT NULL,
    current_percentage numeric(5,2) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT budget_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['hours'::text, 'material'::text, 'total'::text]))),
    CONSTRAINT budget_alerts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'acknowledged'::text, 'resolved'::text])))
);


ALTER TABLE public.budget_alerts OWNER TO postgres;

--
-- Name: TABLE budget_alerts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.budget_alerts IS 'Aktiva budget-larm när trösklar passerats';


--
-- Name: COLUMN budget_alerts.alert_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.budget_alerts.alert_type IS 'Typ av larm: hours, material, eller total';


--
-- Name: COLUMN budget_alerts.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.budget_alerts.status IS 'active = nytt larm, acknowledged = sett, resolved = åtgärdat';


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    org_nr text,
    email text,
    phone text,
    address text,
    org_number text,
    archived boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    search_text tsvector,
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: COLUMN clients.archived; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clients.archived IS 'Om kunden är arkiverad';


--
-- Name: COLUMN clients.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clients.status IS 'Kundens status: active eller archived';


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    auth_user_id uuid,
    name text NOT NULL,
    role text DEFAULT 'worker'::text,
    hourly_rate numeric(10,2) DEFAULT 0,
    ob_evening numeric(10,2) DEFAULT 0,
    ob_night numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    full_name text,
    email text,
    base_rate_sek numeric(10,2) DEFAULT 360,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employees_role_check CHECK ((role = ANY (ARRAY['employee'::text, 'admin'::text, 'Employee'::text, 'Admin'::text])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: COLUMN employees.base_rate_sek; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employees.base_rate_sek IS 'Grundlön per timme i SEK (byggkollektivavtalet)';


--
-- Name: factoring_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factoring_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.factoring_requests OWNER TO postgres;

--
-- Name: gps_tracking_points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gps_tracking_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    time_entry_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    accuracy_meters integer,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gps_tracking_points OWNER TO postgres;

--
-- Name: integration_jobs; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.integration_jobs AS
 SELECT id,
    tenant_id,
    integration_id,
    job_type,
    payload,
    status,
    attempts,
    max_attempts,
    last_error,
    scheduled_at,
    started_at,
    finished_at,
    created_at,
    updated_at
   FROM app.integration_jobs;


ALTER VIEW public.integration_jobs OWNER TO postgres;

--
-- Name: VIEW integration_jobs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.integration_jobs IS 'Public view for Supabase PostgREST API access to app.integration_jobs';


--
-- Name: integration_mappings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.integration_mappings AS
 SELECT id,
    tenant_id,
    integration_id,
    entity_type,
    local_id,
    remote_id,
    remote_extra,
    created_at,
    updated_at
   FROM app.integration_mappings;


ALTER VIEW public.integration_mappings OWNER TO postgres;

--
-- Name: VIEW integration_mappings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.integration_mappings IS 'Public view for Supabase PostgREST API access to app.integration_mappings';


--
-- Name: integrations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.integrations AS
 SELECT id,
    tenant_id,
    provider,
    status,
    scope,
    last_error,
    last_synced_at,
    created_at,
    updated_at
   FROM app.integrations;


ALTER VIEW public.integrations OWNER TO postgres;

--
-- Name: VIEW integrations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.integrations IS 'Public view for Supabase PostgREST API access to app.integrations';


--
-- Name: invoice_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    description text,
    hours numeric(10,2),
    rate numeric(10,2),
    amount numeric(10,2)
);


ALTER TABLE public.invoice_lines OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    project_id uuid,
    client_id uuid,
    invoice_date date DEFAULT now(),
    due_date date,
    total_amount numeric(10,2) DEFAULT 0,
    status text DEFAULT 'draft'::text,
    user_id uuid DEFAULT gen_random_uuid(),
    amount numeric(10,2),
    issue_date date,
    customer_name text,
    created_at timestamp with time zone DEFAULT now(),
    factoring_id uuid,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: COLUMN invoices.customer_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invoices.customer_name IS 'Kundens namn (deprecated - använd client_id istället)';


--
-- Name: job_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_queue (
    id bigint NOT NULL,
    kind text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'queued'::text,
    attempts integer DEFAULT 0,
    last_error text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.job_queue OWNER TO postgres;

--
-- Name: job_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_queue_id_seq OWNER TO postgres;

--
-- Name: job_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_queue_id_seq OWNED BY public.job_queue.id;


--
-- Name: markup_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.markup_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    item_type text,
    supplier_id uuid,
    project_id uuid,
    min_amount numeric(14,2),
    max_amount numeric(14,2),
    markup_percent numeric(6,3) DEFAULT 0,
    markup_fixed numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.markup_rules OWNER TO postgres;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sku text,
    name text NOT NULL,
    category text,
    unit text DEFAULT 'st'::text NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    created_by uuid NOT NULL,
    recipient_id uuid,
    recipient_employee_id uuid,
    type text DEFAULT 'info'::text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: payroll_exports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_exports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    period_id uuid NOT NULL,
    provider text NOT NULL,
    format text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    error text,
    file_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payroll_exports_format_check CHECK ((format = ANY (ARRAY['paxml'::text, 'csv'::text]))),
    CONSTRAINT payroll_exports_provider_check CHECK ((provider = ANY (ARRAY['fortnox'::text, 'visma'::text]))),
    CONSTRAINT payroll_exports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text])))
);


ALTER TABLE public.payroll_exports OWNER TO postgres;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    locked_at timestamp with time zone,
    locked_by uuid,
    exported_at timestamp with time zone,
    exported_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    export_format text,
    CONSTRAINT payroll_periods_export_format_check CHECK ((export_format = ANY (ARRAY['fortnox-paxml'::text, 'visma-csv'::text]))),
    CONSTRAINT payroll_periods_status_check CHECK ((status = ANY (ARRAY['open'::text, 'locked'::text, 'exported'::text, 'failed'::text])))
);


ALTER TABLE public.payroll_periods OWNER TO postgres;

--
-- Name: payroll_sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    operation text NOT NULL,
    direction text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    status text NOT NULL,
    error_code text,
    error_message text,
    duration_ms integer,
    retry_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payroll_sync_logs_direction_check CHECK ((direction = ANY (ARRAY['push'::text, 'pull'::text, 'bidirectional'::text]))),
    CONSTRAINT payroll_sync_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text])))
);


ALTER TABLE public.payroll_sync_logs OWNER TO postgres;

--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    project_type text,
    customer_segment text,
    min_quantity numeric(12,3),
    max_quantity numeric(12,3),
    discount_percent numeric(6,3) DEFAULT 0,
    markup_percent numeric(6,3) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pricing_rules OWNER TO postgres;

--
-- Name: project_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    project_id uuid NOT NULL,
    budget_hours numeric(10,2) DEFAULT 0,
    budget_material numeric(10,2) DEFAULT 0,
    budget_total numeric(10,2) GENERATED ALWAYS AS ((budget_hours + budget_material)) STORED,
    alert_thresholds jsonb DEFAULT '[{"notify": true, "percentage": 70}, {"notify": true, "percentage": 90}]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.project_budgets OWNER TO postgres;

--
-- Name: TABLE project_budgets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.project_budgets IS 'Budgetramar per projekt (timmar + material)';


--
-- Name: COLUMN project_budgets.budget_total; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.project_budgets.budget_total IS 'Generated column: budget_hours + budget_material';


--
-- Name: COLUMN project_budgets.alert_thresholds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.project_budgets.alert_thresholds IS 'JSONB array med trösklar: [{"percentage": 70, "notify": true}]';


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    client_id uuid,
    name text NOT NULL,
    budget_hours numeric(10,2) DEFAULT 0,
    hourly_rate numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    user_id uuid DEFAULT gen_random_uuid(),
    customer_name text,
    created_at timestamp with time zone DEFAULT now(),
    base_rate_sek integer DEFAULT 360,
    budgeted_hours integer DEFAULT 0,
    budget integer,
    status text DEFAULT 'active'::text,
    search_text tsvector,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'completed'::text, 'archived'::text])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: public_link_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_link_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    public_link_id uuid NOT NULL,
    event_type text NOT NULL,
    ip_address inet,
    user_agent text,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT public_link_events_event_type_check CHECK ((event_type = ANY (ARRAY['viewed'::text, 'downloaded'::text, 'signed'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.public_link_events OWNER TO postgres;

--
-- Name: TABLE public_link_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.public_link_events IS 'Audit log för händelser på publika länkar';


--
-- Name: COLUMN public_link_events.event_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.public_link_events.event_data IS 'Extra metadata som JSON (t.ex. signeringsdata, download-filnamn)';


--
-- Name: public_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid NOT NULL,
    access_token text NOT NULL,
    password_hash text,
    expires_at timestamp with time zone,
    max_views integer,
    view_count integer DEFAULT 0,
    active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT public_links_resource_type_check CHECK ((resource_type = ANY (ARRAY['quote'::text, 'invoice'::text, 'ata'::text, 'project'::text, 'rot_application'::text])))
);


ALTER TABLE public.public_links OWNER TO postgres;

--
-- Name: TABLE public_links; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.public_links IS 'Publika länkar för delning av offerter, fakturor, ÄTA etc. med kunder';


--
-- Name: COLUMN public_links.access_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.public_links.access_token IS 'Unik token för åtkomst, kan vara JWT eller UUID';


--
-- Name: COLUMN public_links.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.public_links.password_hash IS 'bcrypt hash om länken är lösenordsskyddad';


--
-- Name: COLUMN public_links.max_views; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.public_links.max_views IS 'Max antal visningar innan länken inaktiveras (NULL = obegränsat)';


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    device_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: quote_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    approver_user_id uuid NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text,
    changed_at timestamp with time zone,
    CONSTRAINT quote_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.quote_approvals OWNER TO postgres;

--
-- Name: quote_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quote_history_event_type_check CHECK ((event_type = ANY (ARRAY['created'::text, 'updated'::text, 'status_changed'::text, 'sent'::text, 'viewed'::text, 'approved'::text, 'rejected'::text, 'duplicated'::text, 'converted'::text])))
);


ALTER TABLE public.quote_history OWNER TO postgres;

--
-- Name: quote_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    item_type text DEFAULT 'material'::text NOT NULL,
    name text NOT NULL,
    description text,
    quantity numeric(12,3) DEFAULT 1 NOT NULL,
    unit text DEFAULT 'st'::text NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(5,2) DEFAULT 0 NOT NULL,
    vat_rate numeric(5,2) DEFAULT 25 NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    line_total numeric(14,2) GENERATED ALWAYS AS (round((quantity * unit_price), 2)) STORED,
    discount_amount numeric(14,2) GENERATED ALWAYS AS (round(((quantity * unit_price) * (discount / 100.0)), 2)) STORED,
    net_price numeric(14,2) GENERATED ALWAYS AS ((round((quantity * unit_price), 2) - round(((quantity * unit_price) * (discount / 100.0)), 2))) STORED,
    CONSTRAINT quote_items_item_type_check CHECK ((item_type = ANY (ARRAY['material'::text, 'labor'::text, 'other'::text])))
);


ALTER TABLE public.quote_items OWNER TO postgres;

--
-- Name: TABLE quote_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.quote_items IS 'Radartiklar (labor/material/other) med genererade fält';


--
-- Name: quote_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    body jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quote_templates OWNER TO postgres;

--
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    project_id uuid,
    quote_number text NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    notes text,
    currency text DEFAULT 'SEK'::text NOT NULL,
    valid_until date,
    kma_enabled boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    email_sent_count integer DEFAULT 0 NOT NULL,
    opened_at timestamp with time zone,
    created_by uuid NOT NULL,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quotes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'sent'::text, 'viewed'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'archived'::text])))
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- Name: TABLE quotes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.quotes IS 'Offerter per tenant med totals och statusflöde';


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rate_limits (
    provider text NOT NULL,
    count integer DEFAULT 0,
    reset_time timestamp with time zone DEFAULT now(),
    window_size integer DEFAULT 60
);


ALTER TABLE public.rate_limits OWNER TO postgres;

--
-- Name: release_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.release_labels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    label_name text NOT NULL,
    description text,
    rules_snapshot jsonb NOT NULL,
    effective_from date NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.release_labels OWNER TO postgres;

--
-- Name: TABLE release_labels; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.release_labels IS 'Snapshots av regler (OB, ROT etc.) vid release för historisk referens';


--
-- Name: COLUMN release_labels.rules_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.release_labels.rules_snapshot IS 'JSON snapshot av regler vid release (t.ex. OB-nivåer, ROT-gränser)';


--
-- Name: research_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_chunks (
    id bigint NOT NULL,
    title text,
    url text,
    content text,
    embedding public.vector(1536),
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.research_chunks OWNER TO postgres;

--
-- Name: research_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.research_chunks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.research_chunks_id_seq OWNER TO postgres;

--
-- Name: research_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.research_chunks_id_seq OWNED BY public.research_chunks.id;


--
-- Name: resource_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_locks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    locked_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.resource_locks OWNER TO postgres;

--
-- Name: rot_api_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rot_api_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rot_application_id uuid,
    tenant_id uuid NOT NULL,
    api_endpoint text NOT NULL,
    http_method text NOT NULL,
    request_body jsonb,
    response_body jsonb,
    response_status integer,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rot_api_logs OWNER TO postgres;

--
-- Name: TABLE rot_api_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rot_api_logs IS 'Logg över alla API-anrop till Skatteverket för debugging och efterlevnad';


--
-- Name: rot_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rot_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    project_id uuid,
    client_id uuid,
    customer_person_number text,
    property_designation text NOT NULL,
    work_type text NOT NULL,
    work_cost_sek numeric(10,2) DEFAULT 0 NOT NULL,
    material_cost_sek numeric(10,2) DEFAULT 0 NOT NULL,
    total_cost_sek numeric(10,2) DEFAULT 0 NOT NULL,
    case_number text,
    reference_id text,
    submission_date timestamp with time zone,
    last_status_check timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    encrypted_person_number bytea,
    invoice_id uuid,
    signature_id uuid,
    invoice_mode text DEFAULT 'separate'::text,
    cost_frame numeric(10,2),
    photos text[],
    status_timeline jsonb DEFAULT '[]'::jsonb,
    parent_invoice_id uuid,
    CONSTRAINT chk_total_cost_consistency CHECK ((total_cost_sek = (work_cost_sek + material_cost_sek))),
    CONSTRAINT rot_applications_invoice_mode_check CHECK ((invoice_mode = ANY (ARRAY['separate'::text, 'add_to_main'::text]))),
    CONSTRAINT rot_applications_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'appealed'::text, 'closed'::text])))
);


ALTER TABLE public.rot_applications OWNER TO postgres;

--
-- Name: TABLE rot_applications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rot_applications IS 'ROT-avdrag ansökningar enligt Skatteverkets SKV 5017';


--
-- Name: COLUMN rot_applications.customer_person_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.customer_person_number IS 'Kundens personnummer (ska krypteras i produktion)';


--
-- Name: COLUMN rot_applications.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.status IS 'Status: draft, submitted, under_review, approved, rejected, appealed, closed';


--
-- Name: COLUMN rot_applications.encrypted_person_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.encrypted_person_number IS 'Krypterat personnummer (recommended for production storage)';


--
-- Name: COLUMN rot_applications.signature_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.signature_id IS 'FK till signatures-tabellen om ÄTA är signerad';


--
-- Name: COLUMN rot_applications.invoice_mode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.invoice_mode IS 'Om ÄTA ska faktureras separat eller läggas till i huvudfaktura';


--
-- Name: COLUMN rot_applications.cost_frame; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.cost_frame IS 'Kostnadsram för ÄTA';


--
-- Name: COLUMN rot_applications.photos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.photos IS 'Array av bild-URLs (Supabase Storage)';


--
-- Name: COLUMN rot_applications.status_timeline; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.status_timeline IS 'JSONB array med statusändringar: [{status, timestamp, user_id, comment}]';


--
-- Name: COLUMN rot_applications.parent_invoice_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rot_applications.parent_invoice_id IS 'FK till huvudfaktura om invoice_mode = add_to_main';


--
-- Name: rot_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rot_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rot_application_id uuid NOT NULL,
    status text NOT NULL,
    status_message text,
    rejection_reason text,
    decision_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rot_status_history OWNER TO postgres;

--
-- Name: TABLE rot_status_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rot_status_history IS 'Statushistorik för ROT-ansökningar';


--
-- Name: rot_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rot_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    personal_number_encrypted text,
    other_column_1 text,
    other_column_2 text
);


ALTER TABLE public.rot_submissions OWNER TO postgres;

--
-- Name: rot_submissions_secure; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.rot_submissions_secure AS
 SELECT id,
    tenant_id,
    created_at,
    updated_at,
        CASE
            WHEN ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['accountant'::text, 'admin'::text])) THEN personal_number_encrypted
            ELSE NULL::text
        END AS personal_number_encrypted,
    other_column_1,
    other_column_2
   FROM public.rot_submissions
  WHERE (tenant_id = (current_setting('app.current_tenant_id'::text))::uuid);


ALTER VIEW public.rot_submissions_secure OWNER TO postgres;

--
-- Name: signature_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signature_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    signature_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT signature_events_event_type_check CHECK ((event_type = ANY (ARRAY['sent'::text, 'viewed'::text, 'signed'::text, 'rejected'::text, 'expired'::text])))
);


ALTER TABLE public.signature_events OWNER TO postgres;

--
-- Name: TABLE signature_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.signature_events IS 'Audit log för signeringshändelser';


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    document_type text NOT NULL,
    document_id uuid NOT NULL,
    signer_role text NOT NULL,
    signer_user_id uuid,
    signer_email text,
    signature_method text DEFAULT 'email'::text NOT NULL,
    signature_hash text,
    signed_at timestamp with time zone,
    ip_address inet,
    user_agent text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT signatures_document_type_check CHECK ((document_type = ANY (ARRAY['quote'::text, 'ata'::text, 'work_order'::text, 'time_entry'::text, 'invoice'::text]))),
    CONSTRAINT signatures_signature_method_check CHECK ((signature_method = ANY (ARRAY['bankid'::text, 'email'::text, 'manual'::text]))),
    CONSTRAINT signatures_signer_role_check CHECK ((signer_role = ANY (ARRAY['customer'::text, 'employee'::text, 'admin'::text]))),
    CONSTRAINT signatures_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'signed'::text, 'rejected'::text, 'expired'::text])))
);


ALTER TABLE public.signatures OWNER TO postgres;

--
-- Name: TABLE signatures; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.signatures IS 'Signeringsspår för dokument (stub för BankID-integration i Fas 2)';


--
-- Name: COLUMN signatures.document_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.signatures.document_type IS 'Typ av dokument som signeras';


--
-- Name: COLUMN signatures.document_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.signatures.document_id IS 'ID på dokumentet (polymorphic FK)';


--
-- Name: COLUMN signatures.signature_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.signatures.signature_method IS 'Metod för signering (bankid/email/manual)';


--
-- Name: COLUMN signatures.signature_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.signatures.signature_hash IS 'SHA-256 hash av dokumentet vid signering (juridiskt bevismaterial)';


--
-- Name: supplier_invoice_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoice_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    item_id uuid,
    project_id uuid,
    cost_center text,
    amount numeric(14,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.supplier_invoice_allocations OWNER TO postgres;

--
-- Name: supplier_invoice_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoice_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    approver_user_id uuid NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text,
    changed_at timestamp with time zone,
    CONSTRAINT supplier_invoice_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.supplier_invoice_approvals OWNER TO postgres;

--
-- Name: supplier_invoice_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoice_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    action text NOT NULL,
    data jsonb,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supplier_invoice_history_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'approved'::text, 'rejected'::text, 'paid'::text, 'booked'::text, 'archived'::text, 'ocr_scanned'::text, 'markup_applied'::text, 'converted'::text])))
);


ALTER TABLE public.supplier_invoice_history OWNER TO postgres;

--
-- Name: supplier_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    item_type text DEFAULT 'material'::text NOT NULL,
    name text NOT NULL,
    description text,
    quantity numeric(12,3) DEFAULT 1 NOT NULL,
    unit text DEFAULT 'st'::text NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    vat_rate numeric(5,2) DEFAULT 25 NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    line_total numeric(14,2) GENERATED ALWAYS AS (round((quantity * unit_price), 2)) STORED,
    tax_amount numeric(14,2) GENERATED ALWAYS AS (round(((quantity * unit_price) * (vat_rate / 100.0)), 2)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supplier_invoice_items_item_type_check CHECK ((item_type = ANY (ARRAY['material'::text, 'labor'::text, 'transport'::text, 'other'::text])))
);


ALTER TABLE public.supplier_invoice_items OWNER TO postgres;

--
-- Name: supplier_invoice_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_invoice_id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_date date NOT NULL,
    method text DEFAULT 'bankgiro'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supplier_invoice_payments_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.supplier_invoice_payments OWNER TO postgres;

--
-- Name: supplier_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    project_id uuid,
    file_path text,
    file_size_bytes integer,
    mime_type text,
    original_filename text,
    invoice_number text,
    invoice_date date,
    status text DEFAULT 'pending_approval'::text,
    ocr_confidence numeric,
    ocr_data jsonb,
    extracted_data jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.supplier_invoices OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    org_number text,
    email text,
    phone text,
    default_payment_terms_days integer DEFAULT 30,
    currency text DEFAULT 'SEK'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: sync_job_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_job_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    operation text NOT NULL,
    provider text NOT NULL,
    payload jsonb,
    priority integer DEFAULT 5,
    tenant_id text NOT NULL,
    status text DEFAULT 'pending'::text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sync_job_queue OWNER TO postgres;

--
-- Name: sync_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    operation text NOT NULL,
    status text NOT NULL,
    retry_count integer DEFAULT 0,
    last_error text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sync_jobs_operation_check CHECK ((operation = ANY (ARRAY['push'::text, 'pull'::text]))),
    CONSTRAINT sync_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


ALTER TABLE public.sync_jobs OWNER TO postgres;

--
-- Name: sync_logs; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.sync_logs AS
 SELECT id,
    tenant_id,
    integration_id,
    level,
    message,
    context,
    created_at
   FROM app.sync_logs;


ALTER VIEW public.sync_logs OWNER TO postgres;

--
-- Name: VIEW sync_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.sync_logs IS 'Public view for Supabase PostgREST API access to app.sync_logs';


--
-- Name: sync_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    data jsonb,
    provider text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sync_metrics OWNER TO postgres;

--
-- Name: sync_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    operation text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    direction text NOT NULL,
    priority integer DEFAULT 5,
    retry_count integer DEFAULT 0,
    status text NOT NULL,
    payload jsonb NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sync_queue_direction_check CHECK ((direction = ANY (ARRAY['push'::text, 'pull'::text]))),
    CONSTRAINT sync_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


ALTER TABLE public.sync_queue OWNER TO postgres;

--
-- Name: tenant_feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    enable_bankid boolean DEFAULT false,
    enable_peppol boolean DEFAULT false,
    enable_customer_portal boolean DEFAULT true,
    enable_budget_alerts boolean DEFAULT true,
    enable_ata_2_0 boolean DEFAULT true,
    enable_audit_log boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_feature_flags OWNER TO postgres;

--
-- Name: TABLE tenant_feature_flags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tenant_feature_flags IS 'Feature flags per tenant för att aktivera/inaktivera funktioner';


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    org_nr text,
    created_at timestamp with time zone DEFAULT now(),
    onboarded boolean DEFAULT false,
    id uuid DEFAULT gen_random_uuid()
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: time_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    project_id text NOT NULL,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    hours numeric(5,2),
    type text DEFAULT 'work'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    employee_id uuid DEFAULT gen_random_uuid()
);


ALTER TABLE public.time_reports OWNER TO postgres;

--
-- Name: user_tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tenants (
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL
);


ALTER TABLE public.user_tenants OWNER TO postgres;

--
-- Name: v_absences; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_absences AS
 SELECT id,
    tenant_id,
    employee_id,
    start_date,
    end_date,
    type AS absence_type,
    reason,
    status,
    created_at,
    updated_at
   FROM public.absences;


ALTER VIEW public.v_absences OWNER TO postgres;

--
-- Name: v_project_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_project_summary AS
SELECT
    NULL::uuid AS id,
    NULL::uuid AS tenant_id,
    NULL::text AS name,
    NULL::numeric AS total_hours,
    NULL::numeric AS total_amount;


ALTER VIEW public.v_project_summary OWNER TO postgres;

--
-- Name: v_schedule_slots; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_schedule_slots AS
 SELECT id,
    tenant_id,
    employee_id,
    project_id,
    start_time,
    end_time,
    status,
    notes,
    shift_type,
    transport_time_minutes,
    created_by,
    created_at,
    updated_at
   FROM public.schedule_slots;


ALTER VIEW public.v_schedule_slots OWNER TO postgres;

--
-- Name: v_unbilled_time_entries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_unbilled_time_entries AS
 SELECT t.id,
    t.project_id,
    p.name AS project_name,
    e.name AS employee_name,
    t.date,
    t.hours_total,
    t.amount_total
   FROM ((public.time_entries t
     JOIN public.projects p ON ((p.id = t.project_id)))
     JOIN public.employees e ON ((e.id = t.employee_id)))
  WHERE (t.is_billed = false);


ALTER VIEW public.v_unbilled_time_entries OWNER TO postgres;

--
-- Name: work_order_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_order_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_order_id uuid NOT NULL,
    file_path text NOT NULL,
    thumbnail_path text,
    file_size_bytes integer,
    mime_type text,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_photo_maxsize CHECK (((file_size_bytes IS NULL) OR (file_size_bytes < 52428800)))
);


ALTER TABLE public.work_order_photos OWNER TO postgres;

--
-- Name: work_order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_order_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by uuid NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    reason text,
    CONSTRAINT chk_from_to_diff CHECK (((from_status IS NULL) OR (from_status <> to_status))),
    CONSTRAINT work_order_status_history_to_status_check CHECK ((to_status = ANY (ARRAY['new'::text, 'assigned'::text, 'in_progress'::text, 'awaiting_approval'::text, 'approved'::text, 'completed'::text])))
);


ALTER TABLE public.work_order_status_history OWNER TO postgres;

--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    number text NOT NULL,
    title text NOT NULL,
    description text,
    project_id uuid,
    assigned_to uuid,
    created_by uuid NOT NULL,
    status text NOT NULL,
    priority text NOT NULL,
    scheduled_date date,
    scheduled_start_time time without time zone,
    scheduled_end_time time without time zone,
    completed_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT work_orders_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text]))),
    CONSTRAINT work_orders_status_check CHECK ((status = ANY (ARRAY['new'::text, 'assigned'::text, 'in_progress'::text, 'awaiting_approval'::text, 'approved'::text, 'completed'::text])))
);


ALTER TABLE public.work_orders OWNER TO postgres;

--
-- Name: TABLE work_orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.work_orders IS 'Arbetsorder med statusflöde och planering.';


--
-- Name: COLUMN work_orders.number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_orders.number IS 'WO-YYYY-NNN; genereras via app.next_work_order_number.';


--
-- Name: COLUMN work_orders.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_orders.status IS 'new → assigned → in_progress → awaiting_approval → approved → completed';


--
-- Name: COLUMN work_orders.priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_orders.priority IS 'critical|high|medium|low';


--
-- Name: work_sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    radius_meters integer DEFAULT 100,
    auto_checkin_enabled boolean DEFAULT false,
    auto_checkin_distance integer DEFAULT 500,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.work_sites OWNER TO postgres;

--
-- Name: workflow_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    current_step text,
    file_path text,
    state_log jsonb[] DEFAULT ARRAY[]::jsonb[],
    result_data jsonb,
    error_message text,
    user_id uuid,
    tenant_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.workflow_executions REPLICA IDENTITY FULL;


ALTER TABLE public.workflow_executions OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: api_rate_limits id; Type: DEFAULT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.api_rate_limits ALTER COLUMN id SET DEFAULT nextval('app.api_rate_limits_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: agent_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_audit ALTER COLUMN id SET DEFAULT nextval('public.agent_audit_id_seq'::regclass);


--
-- Name: job_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_queue ALTER COLUMN id SET DEFAULT nextval('public.job_queue_id_seq'::regclass);


--
-- Name: research_chunks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_chunks ALTER COLUMN id SET DEFAULT nextval('public.research_chunks_id_seq'::regclass);


--
-- Name: absences absences_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.absences
    ADD CONSTRAINT absences_pkey PRIMARY KEY (id);


--
-- Name: ai_cache ai_cache_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_cache
    ADD CONSTRAINT ai_cache_pkey PRIMARY KEY (id);


--
-- Name: ai_cache ai_cache_tenant_id_cache_key_cache_type_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_cache
    ADD CONSTRAINT ai_cache_tenant_id_cache_key_cache_type_key UNIQUE (tenant_id, cache_key, cache_type);


--
-- Name: ai_chat_feedback ai_chat_feedback_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_chat_feedback
    ADD CONSTRAINT ai_chat_feedback_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_summaries ai_conversation_summaries_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_conversation_summaries
    ADD CONSTRAINT ai_conversation_summaries_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_intent_history ai_intent_history_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_intent_history
    ADD CONSTRAINT ai_intent_history_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_rate_limits ai_rate_limits_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_rate_limits
    ADD CONSTRAINT ai_rate_limits_pkey PRIMARY KEY (tenant_id, bucket_key, window_start);


--
-- Name: ai_response_cache ai_response_cache_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_response_cache
    ADD CONSTRAINT ai_response_cache_pkey PRIMARY KEY (id);


--
-- Name: ai_response_cache ai_response_cache_tenant_id_cache_key_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_response_cache
    ADD CONSTRAINT ai_response_cache_tenant_id_cache_key_key UNIQUE (tenant_id, cache_key);


--
-- Name: api_rate_limits api_rate_limits_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.api_rate_limits
    ADD CONSTRAINT api_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: factoring_integrations factoring_integrations_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_integrations
    ADD CONSTRAINT factoring_integrations_pkey PRIMARY KEY (id);


--
-- Name: factoring_integrations factoring_integrations_tenant_id_provider_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_integrations
    ADD CONSTRAINT factoring_integrations_tenant_id_provider_key UNIQUE (tenant_id, provider);


--
-- Name: factoring_offers factoring_offers_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_offers
    ADD CONSTRAINT factoring_offers_pkey PRIMARY KEY (id);


--
-- Name: factoring_offers factoring_offers_tenant_id_invoice_id_provider_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_offers
    ADD CONSTRAINT factoring_offers_tenant_id_invoice_id_provider_key UNIQUE (tenant_id, invoice_id, provider);


--
-- Name: factoring_payments factoring_payments_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_payments
    ADD CONSTRAINT factoring_payments_pkey PRIMARY KEY (id);


--
-- Name: factoring_webhooks factoring_webhooks_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_webhooks
    ADD CONSTRAINT factoring_webhooks_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_tenant_id_route_key_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.idempotency_keys
    ADD CONSTRAINT idempotency_keys_tenant_id_route_key_key UNIQUE (tenant_id, route, key);


--
-- Name: integration_jobs integration_jobs_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_jobs
    ADD CONSTRAINT integration_jobs_pkey PRIMARY KEY (id);


--
-- Name: integration_mappings integration_mappings_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_mappings
    ADD CONSTRAINT integration_mappings_pkey PRIMARY KEY (id);


--
-- Name: integration_mappings integration_mappings_tenant_id_integration_id_entity_type_l_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_mappings
    ADD CONSTRAINT integration_mappings_tenant_id_integration_id_entity_type_l_key UNIQUE (tenant_id, integration_id, entity_type, local_id);


--
-- Name: integration_mappings integration_mappings_tenant_id_integration_id_entity_type_r_key; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_mappings
    ADD CONSTRAINT integration_mappings_tenant_id_integration_id_entity_type_r_key UNIQUE (tenant_id, integration_id, entity_type, remote_id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: ocr_processing_logs ocr_processing_logs_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ocr_processing_logs
    ADD CONSTRAINT ocr_processing_logs_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: rot_deduction_history rot_deduction_history_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deduction_history
    ADD CONSTRAINT rot_deduction_history_pkey PRIMARY KEY (id);


--
-- Name: rot_deductions rot_deductions_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deductions
    ADD CONSTRAINT rot_deductions_pkey PRIMARY KEY (id);


--
-- Name: schedule_slots schedule_slots_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_history supplier_invoice_history_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoices supplier_invoices_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.supplier_invoices
    ADD CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_direction_check; Type: CHECK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE app.sync_logs
    ADD CONSTRAINT sync_logs_direction_check CHECK (((direction IS NULL) OR (direction = ANY (ARRAY['push'::text, 'pull'::text, 'bidirectional'::text])))) NOT VALID;


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_status_check; Type: CHECK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE app.sync_logs
    ADD CONSTRAINT sync_logs_status_check CHECK (((status IS NULL) OR (status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text])))) NOT VALID;


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: work_order_counters work_order_counters_pkey; Type: CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.work_order_counters
    ADD CONSTRAINT work_order_counters_pkey PRIMARY KEY (tenant_id, year);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: absences absences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT absences_pkey PRIMARY KEY (id);


--
-- Name: accounting_integrations accounting_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_integrations
    ADD CONSTRAINT accounting_integrations_pkey PRIMARY KEY (id);


--
-- Name: accounting_integrations accounting_integrations_tenant_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_integrations
    ADD CONSTRAINT accounting_integrations_tenant_id_provider_key UNIQUE (tenant_id, provider);


--
-- Name: aeta_requests aeta_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeta_requests
    ADD CONSTRAINT aeta_requests_pkey PRIMARY KEY (id);


--
-- Name: agent_audit agent_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_audit
    ADD CONSTRAINT agent_audit_pkey PRIMARY KEY (id);


--
-- Name: ai_cache ai_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_cache
    ADD CONSTRAINT ai_cache_pkey PRIMARY KEY (id);


--
-- Name: ai_cache ai_cache_tenant_id_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_cache
    ADD CONSTRAINT ai_cache_tenant_id_key_key UNIQUE (tenant_id, key);


--
-- Name: api_cache api_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_cache
    ADD CONSTRAINT api_cache_pkey PRIMARY KEY (key);


--
-- Name: ata_items ata_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ata_items
    ADD CONSTRAINT ata_items_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: budget_alerts budget_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: factoring_requests factoring_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factoring_requests
    ADD CONSTRAINT factoring_requests_pkey PRIMARY KEY (id);


--
-- Name: gps_tracking_points gps_tracking_points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gps_tracking_points
    ADD CONSTRAINT gps_tracking_points_pkey PRIMARY KEY (id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_queue job_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_queue
    ADD CONSTRAINT job_queue_pkey PRIMARY KEY (id);


--
-- Name: markup_rules markup_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markup_rules
    ADD CONSTRAINT markup_rules_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: materials materials_tenant_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_tenant_id_sku_key UNIQUE (tenant_id, sku);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payroll_exports payroll_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_exports
    ADD CONSTRAINT payroll_exports_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payroll_sync_logs payroll_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_sync_logs
    ADD CONSTRAINT payroll_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: schedule_slots prevent_double_booking; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_slots
    ADD CONSTRAINT prevent_double_booking EXCLUDE USING gist (employee_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE ((status <> 'cancelled'::text));


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: project_budgets project_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_pkey PRIMARY KEY (id);


--
-- Name: project_budgets project_budgets_project_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_key UNIQUE (project_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: public_link_events public_link_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_link_events
    ADD CONSTRAINT public_link_events_pkey PRIMARY KEY (id);


--
-- Name: public_links public_links_access_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT public_links_access_token_key UNIQUE (access_token);


--
-- Name: public_links public_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT public_links_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: quote_approvals quote_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_approvals
    ADD CONSTRAINT quote_approvals_pkey PRIMARY KEY (id);


--
-- Name: quote_history quote_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_history
    ADD CONSTRAINT quote_history_pkey PRIMARY KEY (id);


--
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- Name: quote_templates quote_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT quote_templates_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_tenant_id_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_tenant_id_quote_number_key UNIQUE (tenant_id, quote_number);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (provider);


--
-- Name: release_labels release_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_labels
    ADD CONSTRAINT release_labels_pkey PRIMARY KEY (id);


--
-- Name: research_chunks research_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_chunks
    ADD CONSTRAINT research_chunks_pkey PRIMARY KEY (id);


--
-- Name: resource_locks resource_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_locks
    ADD CONSTRAINT resource_locks_pkey PRIMARY KEY (id);


--
-- Name: rot_api_logs rot_api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_api_logs
    ADD CONSTRAINT rot_api_logs_pkey PRIMARY KEY (id);


--
-- Name: rot_applications rot_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_pkey PRIMARY KEY (id);


--
-- Name: rot_status_history rot_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_status_history
    ADD CONSTRAINT rot_status_history_pkey PRIMARY KEY (id);


--
-- Name: rot_submissions rot_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_submissions
    ADD CONSTRAINT rot_submissions_pkey PRIMARY KEY (id);


--
-- Name: schedule_slots schedule_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_slots
    ADD CONSTRAINT schedule_slots_pkey PRIMARY KEY (id);


--
-- Name: signature_events signature_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signature_events
    ADD CONSTRAINT signature_events_pkey PRIMARY KEY (id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_allocations supplier_invoice_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_allocations
    ADD CONSTRAINT supplier_invoice_allocations_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_approvals supplier_invoice_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_approvals
    ADD CONSTRAINT supplier_invoice_approvals_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_history supplier_invoice_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_items supplier_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_items
    ADD CONSTRAINT supplier_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoice_payments supplier_invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_payments
    ADD CONSTRAINT supplier_invoice_payments_pkey PRIMARY KEY (id);


--
-- Name: supplier_invoices supplier_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoices
    ADD CONSTRAINT supplier_invoices_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: sync_job_queue sync_job_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_job_queue
    ADD CONSTRAINT sync_job_queue_pkey PRIMARY KEY (id);


--
-- Name: sync_jobs sync_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_jobs
    ADD CONSTRAINT sync_jobs_pkey PRIMARY KEY (id);


--
-- Name: sync_metrics sync_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_metrics
    ADD CONSTRAINT sync_metrics_pkey PRIMARY KEY (id);


--
-- Name: sync_queue sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_flags tenant_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_pkey PRIMARY KEY (id);


--
-- Name: tenant_feature_flags tenant_feature_flags_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_id_unique UNIQUE (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (user_id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: time_reports time_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_reports
    ADD CONSTRAINT time_reports_pkey PRIMARY KEY (id);


--
-- Name: user_tenants user_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_pkey PRIMARY KEY (user_id, tenant_id);


--
-- Name: work_order_photos work_order_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_photos
    ADD CONSTRAINT work_order_photos_pkey PRIMARY KEY (id);


--
-- Name: work_order_status_history work_order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_status_history
    ADD CONSTRAINT work_order_status_history_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: work_sites work_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_sites
    ADD CONSTRAINT work_sites_pkey PRIMARY KEY (id);


--
-- Name: workflow_executions workflow_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: idx_absences_employee_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_absences_employee_id ON app.absences USING btree (employee_id);


--
-- Name: idx_absences_end_date; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_absences_end_date ON app.absences USING btree (end_date);


--
-- Name: idx_absences_start_date; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_absences_start_date ON app.absences USING btree (start_date);


--
-- Name: idx_absences_tenant_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_absences_tenant_id ON app.absences USING btree (tenant_id);


--
-- Name: idx_ai_cache_cleanup; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_cache_cleanup ON app.ai_cache USING btree (expires_at);


--
-- Name: idx_ai_cache_lookup; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_cache_lookup ON app.ai_cache USING btree (tenant_id, cache_key, cache_type, expires_at);


--
-- Name: idx_ai_feedback_conversation; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_feedback_conversation ON app.ai_chat_feedback USING btree (conversation_id);


--
-- Name: idx_ai_feedback_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_feedback_tenant ON app.ai_chat_feedback USING btree (tenant_id);


--
-- Name: idx_ai_intent_created; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_intent_created ON app.ai_intent_history USING btree (created_at DESC);


--
-- Name: idx_ai_intent_hash; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_intent_hash ON app.ai_intent_history USING btree (query_hash);


--
-- Name: idx_ai_intent_tenant_user; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ai_intent_tenant_user ON app.ai_intent_history USING btree (tenant_id, user_id);


--
-- Name: idx_app_integrations_tenant_id_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_integrations_tenant_id_id ON app.integrations USING btree (tenant_id, id);


--
-- Name: idx_app_integrations_tenant_id_status; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_integrations_tenant_id_status ON app.integrations USING btree (tenant_id, status);


--
-- Name: idx_app_supplier_invoice_history_created_at; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoice_history_created_at ON app.supplier_invoice_history USING btree (created_at DESC);


--
-- Name: idx_app_supplier_invoice_history_invoice; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoice_history_invoice ON app.supplier_invoice_history USING btree (supplier_invoice_id);


--
-- Name: idx_app_supplier_invoice_history_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoice_history_tenant ON app.supplier_invoice_history USING btree (tenant_id);


--
-- Name: idx_app_supplier_invoices_invoice_number; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoices_invoice_number ON app.supplier_invoices USING btree (tenant_id, supplier_id, invoice_number);


--
-- Name: idx_app_supplier_invoices_project; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoices_project ON app.supplier_invoices USING btree (project_id);


--
-- Name: idx_app_supplier_invoices_supplier; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoices_supplier ON app.supplier_invoices USING btree (supplier_id);


--
-- Name: idx_app_supplier_invoices_tenant_status; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_supplier_invoices_tenant_status ON app.supplier_invoices USING btree (tenant_id, status);


--
-- Name: idx_app_user_roles_tenant_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_user_roles_tenant_id ON app.user_roles USING btree (tenant_id);


--
-- Name: idx_app_user_roles_user_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_app_user_roles_user_id ON app.user_roles USING btree (user_id);


--
-- Name: idx_factoring_offers_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_factoring_offers_tenant ON app.factoring_offers USING btree (tenant_id);


--
-- Name: idx_factoring_payments_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_factoring_payments_tenant ON app.factoring_payments USING btree (tenant_id);


--
-- Name: idx_factoring_webhooks_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_factoring_webhooks_tenant ON app.factoring_webhooks USING btree (tenant_id);


--
-- Name: idx_integration_jobs_integration; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_integration_jobs_integration ON app.integration_jobs USING btree (integration_id);


--
-- Name: idx_integration_jobs_pick; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_integration_jobs_pick ON app.integration_jobs USING btree (tenant_id, status, scheduled_at);


--
-- Name: idx_integrations_status; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_integrations_status ON app.integrations USING btree (tenant_id, status);


--
-- Name: idx_integrations_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_integrations_tenant ON app.integrations USING btree (tenant_id, provider);


--
-- Name: idx_mappings_lookup_local; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_mappings_lookup_local ON app.integration_mappings USING btree (tenant_id, integration_id, entity_type, local_id);


--
-- Name: idx_mappings_lookup_remote; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_mappings_lookup_remote ON app.integration_mappings USING btree (tenant_id, integration_id, entity_type, remote_id);


--
-- Name: idx_ocr_logs_correlation; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ocr_logs_correlation ON app.ocr_processing_logs USING btree (correlation_id);


--
-- Name: idx_ocr_logs_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_ocr_logs_tenant ON app.ocr_processing_logs USING btree (tenant_id, created_at DESC);


--
-- Name: idx_rate_limits_tenant_route_ts; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_rate_limits_tenant_route_ts ON app.api_rate_limits USING btree (tenant_id, route, ts DESC);


--
-- Name: idx_rot_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_rot_tenant ON app.rot_deductions USING btree (tenant_id);


--
-- Name: idx_schedule_slots_employee_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_employee_id ON app.schedule_slots USING btree (employee_id);


--
-- Name: idx_schedule_slots_project_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_project_id ON app.schedule_slots USING btree (project_id);


--
-- Name: idx_schedule_slots_shift_type; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_shift_type ON app.schedule_slots USING btree (shift_type);


--
-- Name: idx_schedule_slots_start_time; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_start_time ON app.schedule_slots USING btree (start_time);


--
-- Name: idx_schedule_slots_status; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_status ON app.schedule_slots USING btree (status);


--
-- Name: idx_schedule_slots_tenant_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_schedule_slots_tenant_id ON app.schedule_slots USING btree (tenant_id);


--
-- Name: idx_sync_logs_created_at; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_sync_logs_created_at ON app.sync_logs USING btree (created_at DESC);


--
-- Name: idx_sync_logs_integration; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_sync_logs_integration ON app.sync_logs USING btree (integration_id);


--
-- Name: idx_sync_logs_status; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_sync_logs_status ON app.sync_logs USING btree (status);


--
-- Name: idx_sync_logs_tenant; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_sync_logs_tenant ON app.sync_logs USING btree (tenant_id, created_at DESC);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_user_roles_role ON app.user_roles USING btree (role);


--
-- Name: idx_user_roles_tenant_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_user_roles_tenant_id ON app.user_roles USING btree (tenant_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: app; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON app.user_roles USING btree (user_id);


--
-- Name: ux_role_permissions_role_resource_action; Type: INDEX; Schema: app; Owner: postgres
--

CREATE UNIQUE INDEX ux_role_permissions_role_resource_action ON app.role_permissions USING btree (role, resource, action);


--
-- Name: ux_user_roles_tenant_user; Type: INDEX; Schema: app; Owner: postgres
--

CREATE UNIQUE INDEX ux_user_roles_tenant_user ON app.user_roles USING btree (tenant_id, user_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: api_cache_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_cache_expires_at_idx ON public.api_cache USING btree (expires_at);


--
-- Name: clients_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clients_search_idx ON public.clients USING gin (search_text);


--
-- Name: idx_accounting_integrations_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounting_integrations_tenant ON public.accounting_integrations USING btree (tenant_id);


--
-- Name: idx_aeta_requests_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeta_requests_created_at ON public.aeta_requests USING btree (created_at DESC);


--
-- Name: idx_aeta_requests_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeta_requests_project_id ON public.aeta_requests USING btree (project_id);


--
-- Name: idx_aeta_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeta_requests_status ON public.aeta_requests USING btree (status);


--
-- Name: idx_aeta_requests_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeta_requests_tenant ON public.aeta_requests USING btree (tenant_id);


--
-- Name: idx_aeta_requests_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aeta_requests_tenant_id ON public.aeta_requests USING btree (tenant_id);


--
-- Name: idx_ai_cache_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_cache_expires ON public.ai_cache USING btree (expires_at);


--
-- Name: idx_ai_cache_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_cache_tenant ON public.ai_cache USING btree (tenant_id);


--
-- Name: idx_ata_items_rot_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ata_items_rot_application_id ON public.ata_items USING btree (rot_application_id);


--
-- Name: idx_ata_items_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ata_items_sort_order ON public.ata_items USING btree (rot_application_id, sort_order);


--
-- Name: idx_ata_items_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ata_items_tenant_id ON public.ata_items USING btree (tenant_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_employee_id ON public.audit_logs USING btree (employee_id);


--
-- Name: idx_audit_logs_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_search ON public.audit_logs USING gin (to_tsvector('swedish'::regconfig, ((table_name || ' '::text) || action)));


--
-- Name: idx_audit_logs_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_table_record ON public.audit_logs USING btree (table_name, record_id);


--
-- Name: idx_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);


--
-- Name: idx_audit_logs_tenant_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_tenant_table_record ON public.audit_logs USING btree (tenant_id, table_name, record_id, created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_budget_alerts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_alerts_created_at ON public.budget_alerts USING btree (created_at DESC);


--
-- Name: idx_budget_alerts_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_alerts_project_id ON public.budget_alerts USING btree (project_id);


--
-- Name: idx_budget_alerts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_alerts_status ON public.budget_alerts USING btree (status) WHERE (status = 'active'::text);


--
-- Name: idx_budget_alerts_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_alerts_tenant_id ON public.budget_alerts USING btree (tenant_id);


--
-- Name: idx_budget_alerts_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_alerts_tenant_status ON public.budget_alerts USING btree (tenant_id, status, created_at DESC) WHERE (status = 'active'::text);


--
-- Name: idx_clients_archived; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_archived ON public.clients USING btree (archived);


--
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- Name: idx_clients_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_tenant ON public.clients USING btree (tenant_id);


--
-- Name: idx_clients_tenant_archived; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_tenant_archived ON public.clients USING btree (tenant_id, archived);


--
-- Name: idx_clients_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_tenant_status ON public.clients USING btree (tenant_id, status);


--
-- Name: idx_employees_auth_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_auth_user ON public.employees USING btree (auth_user_id) WHERE (auth_user_id IS NOT NULL);


--
-- Name: idx_employees_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_name ON public.employees USING btree (name) WHERE (name IS NOT NULL);


--
-- Name: idx_employees_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_role ON public.employees USING btree (role) WHERE (role IS NOT NULL);


--
-- Name: idx_employees_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_tenant ON public.employees USING btree (tenant_id);


--
-- Name: idx_factoring_requests_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_factoring_requests_invoice ON public.factoring_requests USING btree (invoice_id) WHERE (status = 'pending'::text);


--
-- Name: idx_gps_tracking_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gps_tracking_tenant ON public.gps_tracking_points USING btree (tenant_id);


--
-- Name: idx_gps_tracking_time_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gps_tracking_time_entry ON public.gps_tracking_points USING btree (time_entry_id);


--
-- Name: idx_gps_tracking_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gps_tracking_timestamp ON public.gps_tracking_points USING btree ("timestamp");


--
-- Name: idx_invoices_factoring_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_factoring_id ON public.invoices USING btree (factoring_id) WHERE (factoring_id IS NOT NULL);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: idx_invoices_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant ON public.invoices USING btree (tenant_id);


--
-- Name: idx_invoices_tenant_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant_created ON public.invoices USING btree (tenant_id, created_at DESC);


--
-- Name: idx_mr_tenant_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mr_tenant_active ON public.markup_rules USING btree (tenant_id, active, priority);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_recipient_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient_employee_id ON public.notifications USING btree (recipient_employee_id);


--
-- Name: idx_notifications_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_notifications_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_tenant_id ON public.notifications USING btree (tenant_id);


--
-- Name: idx_payroll_exports_tenant_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_exports_tenant_period ON public.payroll_exports USING btree (tenant_id, period_id);


--
-- Name: idx_payroll_periods_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_periods_tenant_status ON public.payroll_periods USING btree (tenant_id, status);


--
-- Name: idx_payroll_sync_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_sync_logs_created_at ON public.payroll_sync_logs USING btree (created_at DESC);


--
-- Name: idx_payroll_sync_logs_integration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_sync_logs_integration ON public.payroll_sync_logs USING btree (integration_id);


--
-- Name: idx_payroll_sync_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_sync_logs_status ON public.payroll_sync_logs USING btree (status);


--
-- Name: idx_payroll_sync_logs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_sync_logs_tenant ON public.payroll_sync_logs USING btree (tenant_id);


--
-- Name: idx_pricing_rules_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pricing_rules_active ON public.pricing_rules USING btree (tenant_id, active, priority);


--
-- Name: idx_project_budgets_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_budgets_project_id ON public.project_budgets USING btree (project_id);


--
-- Name: idx_project_budgets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_budgets_tenant_id ON public.project_budgets USING btree (tenant_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status) WHERE (status IS NOT NULL);


--
-- Name: idx_projects_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_tenant ON public.projects USING btree (tenant_id);


--
-- Name: idx_public_link_events_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_link_events_created ON public.public_link_events USING btree (created_at);


--
-- Name: idx_public_link_events_link_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_link_events_link_id ON public.public_link_events USING btree (public_link_id);


--
-- Name: idx_public_links_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_links_expires ON public.public_links USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_public_links_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_links_resource ON public.public_links USING btree (resource_type, resource_id);


--
-- Name: idx_public_links_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_links_tenant_id ON public.public_links USING btree (tenant_id);


--
-- Name: idx_public_links_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_links_token ON public.public_links USING btree (access_token) WHERE (active = true);


--
-- Name: idx_public_links_unique_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_public_links_unique_active ON public.public_links USING btree (tenant_id, resource_type, resource_id) WHERE (active = true);


--
-- Name: idx_push_subs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_push_subs_tenant ON public.push_subscriptions USING btree (tenant_id);


--
-- Name: idx_push_subs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_push_subs_user ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_quote_approvals_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quote_approvals_quote ON public.quote_approvals USING btree (quote_id);


--
-- Name: idx_quote_history_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quote_history_quote ON public.quote_history USING btree (quote_id);


--
-- Name: idx_quote_items_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quote_items_quote ON public.quote_items USING btree (quote_id);


--
-- Name: idx_quotes_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_tenant_status ON public.quotes USING btree (tenant_id, status);


--
-- Name: idx_release_labels_effective_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_release_labels_effective_from ON public.release_labels USING btree (effective_from DESC);


--
-- Name: idx_release_labels_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_release_labels_tenant_id ON public.release_labels USING btree (tenant_id);


--
-- Name: idx_release_labels_tenant_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_release_labels_tenant_name ON public.release_labels USING btree (tenant_id, label_name);


--
-- Name: idx_resource_locks_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_locks_job ON public.resource_locks USING btree (job_id);


--
-- Name: idx_rot_api_logs_application; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_api_logs_application ON public.rot_api_logs USING btree (rot_application_id);


--
-- Name: idx_rot_api_logs_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_api_logs_tenant ON public.rot_api_logs USING btree (tenant_id);


--
-- Name: idx_rot_applications_case_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_case_number ON public.rot_applications USING btree (case_number);


--
-- Name: idx_rot_applications_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_client ON public.rot_applications USING btree (client_id);


--
-- Name: idx_rot_applications_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_invoice ON public.rot_applications USING btree (invoice_id) WHERE (invoice_id IS NOT NULL);


--
-- Name: idx_rot_applications_invoice_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_invoice_mode ON public.rot_applications USING btree (invoice_mode);


--
-- Name: idx_rot_applications_parent_invoice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_parent_invoice_id ON public.rot_applications USING btree (parent_invoice_id) WHERE (parent_invoice_id IS NOT NULL);


--
-- Name: idx_rot_applications_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_project ON public.rot_applications USING btree (project_id);


--
-- Name: idx_rot_applications_signature_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_signature_id ON public.rot_applications USING btree (signature_id) WHERE (signature_id IS NOT NULL);


--
-- Name: idx_rot_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_status ON public.rot_applications USING btree (status);


--
-- Name: idx_rot_applications_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_applications_tenant ON public.rot_applications USING btree (tenant_id);


--
-- Name: idx_rot_status_history_app; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rot_status_history_app ON public.rot_status_history USING btree (rot_application_id);


--
-- Name: idx_schedule_slots_shift_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_slots_shift_type ON public.schedule_slots USING btree (shift_type);


--
-- Name: idx_schedule_slots_time_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_slots_time_range ON public.schedule_slots USING gist (employee_id, tstzrange(start_time, end_time));


--
-- Name: idx_sia_approval_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sia_approval_invoice ON public.supplier_invoice_approvals USING btree (supplier_invoice_id);


--
-- Name: idx_sia_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sia_invoice ON public.supplier_invoice_allocations USING btree (supplier_invoice_id);


--
-- Name: idx_signature_events_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signature_events_created ON public.signature_events USING btree (created_at);


--
-- Name: idx_signature_events_signature_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signature_events_signature_id ON public.signature_events USING btree (signature_id);


--
-- Name: idx_signatures_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_document ON public.signatures USING btree (document_type, document_id);


--
-- Name: idx_signatures_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_expires ON public.signatures USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_signatures_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_status ON public.signatures USING btree (status);


--
-- Name: idx_signatures_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signatures_tenant_id ON public.signatures USING btree (tenant_id);


--
-- Name: idx_sih_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sih_invoice ON public.supplier_invoice_history USING btree (supplier_invoice_id);


--
-- Name: idx_sii_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sii_invoice ON public.supplier_invoice_items USING btree (supplier_invoice_id);


--
-- Name: idx_sii_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sii_tenant ON public.supplier_invoice_items USING btree (tenant_id);


--
-- Name: idx_sip_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sip_invoice ON public.supplier_invoice_payments USING btree (supplier_invoice_id);


--
-- Name: idx_suppliers_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_tenant ON public.suppliers USING btree (tenant_id);


--
-- Name: idx_sync_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_jobs_status ON public.sync_jobs USING btree (status);


--
-- Name: idx_sync_jobs_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_jobs_updated_at ON public.sync_jobs USING btree (updated_at DESC);


--
-- Name: idx_sync_queue_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_priority ON public.sync_queue USING btree (priority DESC, created_at);


--
-- Name: idx_sync_queue_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_status ON public.sync_queue USING btree (status);


--
-- Name: idx_tenant_feature_flags_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_feature_flags_tenant_id ON public.tenant_feature_flags USING btree (tenant_id);


--
-- Name: idx_tenant_id_employees; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_id_employees ON public.employees USING btree (tenant_id);


--
-- Name: idx_tenant_id_invoices; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_id_invoices ON public.invoices USING btree (tenant_id);


--
-- Name: idx_tenant_id_projects; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_id_projects ON public.projects USING btree (tenant_id);


--
-- Name: idx_tenant_id_time_entries; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenant_id_time_entries ON public.time_entries USING btree (tenant_id);


--
-- Name: idx_time_entries_approval_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_entries_approval_status ON public.time_entries USING btree (approval_status) WHERE (approval_status <> 'approved'::text);


--
-- Name: idx_time_entries_billed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_entries_billed ON public.time_entries USING btree (project_id, is_billed);


--
-- Name: idx_time_entries_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_entries_tenant ON public.time_entries USING btree (tenant_id);


--
-- Name: idx_time_entries_work_site_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_entries_work_site_id ON public.time_entries USING btree (work_site_id);


--
-- Name: idx_wo_tenant_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wo_tenant_deleted ON public.work_orders USING btree (tenant_id, deleted_at DESC) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_wo_tenant_status_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wo_tenant_status_updated ON public.work_orders USING btree (tenant_id, status, updated_at DESC);


--
-- Name: idx_wo_tenant_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wo_tenant_updated ON public.work_orders USING btree (tenant_id, updated_at DESC);


--
-- Name: idx_work_order_hist_wo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_order_hist_wo ON public.work_order_status_history USING btree (work_order_id, changed_at DESC);


--
-- Name: idx_work_order_photos_wo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_order_photos_wo ON public.work_order_photos USING btree (work_order_id);


--
-- Name: idx_work_orders_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_orders_assigned ON public.work_orders USING btree (tenant_id, assigned_to);


--
-- Name: idx_work_orders_sched_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_orders_sched_date ON public.work_orders USING btree (tenant_id, scheduled_date DESC);


--
-- Name: idx_work_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_orders_status ON public.work_orders USING btree (tenant_id, status);


--
-- Name: idx_work_orders_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_orders_tenant ON public.work_orders USING btree (tenant_id);


--
-- Name: idx_work_sites_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_sites_location ON public.work_sites USING btree (latitude, longitude);


--
-- Name: idx_work_sites_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_sites_tenant_id ON public.work_sites USING btree (tenant_id);


--
-- Name: job_queue_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_queue_status_idx ON public.job_queue USING btree (status);


--
-- Name: projects_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projects_search_idx ON public.projects USING gin (search_text);


--
-- Name: sync_job_queue_provider_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_job_queue_provider_status_idx ON public.sync_job_queue USING btree (provider, status);


--
-- Name: sync_job_queue_status_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_job_queue_status_priority_idx ON public.sync_job_queue USING btree (status, priority DESC, created_at);


--
-- Name: sync_metrics_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_metrics_created_at_idx ON public.sync_metrics USING btree (created_at);


--
-- Name: uq_work_orders_tenant_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_work_orders_tenant_number ON public.work_orders USING btree (tenant_id, number);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: v_project_summary _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_project_summary AS
 SELECT p.id,
    p.tenant_id,
    p.name,
    COALESCE(sum(t.hours_total), (0)::numeric) AS total_hours,
    COALESCE(sum(t.amount_total), (0)::numeric) AS total_amount
   FROM (public.projects p
     LEFT JOIN public.time_entries t ON ((t.project_id = p.id)))
  GROUP BY p.id, p.tenant_id;


--
-- Name: factoring_integrations t_u_fact_int; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER t_u_fact_int BEFORE UPDATE ON app.factoring_integrations FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: factoring_offers t_u_fact_off; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER t_u_fact_off BEFORE UPDATE ON app.factoring_offers FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: rot_deductions t_u_rot; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER t_u_rot BEFORE UPDATE ON app.rot_deductions FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: supplier_invoices trg_app_supplier_invoices_updated_at; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER trg_app_supplier_invoices_updated_at BEFORE UPDATE ON app.supplier_invoices FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: integration_jobs trg_integration_jobs_updated; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER trg_integration_jobs_updated BEFORE UPDATE ON app.integration_jobs FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: integration_mappings trg_integration_mappings_updated; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER trg_integration_mappings_updated BEFORE UPDATE ON app.integration_mappings FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: integrations trg_integrations_updated; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER trg_integrations_updated BEFORE UPDATE ON app.integrations FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: user_roles trg_user_roles_touch; Type: TRIGGER; Schema: app; Owner: postgres
--

CREATE TRIGGER trg_user_roles_touch BEFORE UPDATE ON app.user_roles FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


--
-- Name: clients client_search_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER client_search_trigger BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_client_search_text();


--
-- Name: workflow_executions on_new_execution; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_new_execution AFTER INSERT ON public.workflow_executions FOR EACH ROW WHEN ((new.status = 'pending'::text)) EXECUTE FUNCTION public.trigger_workflow_orchestrator();


--
-- Name: projects project_search_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER project_search_trigger BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_project_search_text();


--
-- Name: time_entries time_entries_sync_hours_trg; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER time_entries_sync_hours_trg BEFORE INSERT OR UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.sync_time_entries_hours();


--
-- Name: absences trg_absences_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_absences_updated_at BEFORE UPDATE ON public.absences FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: employees trg_employees_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employees_set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: markup_rules trg_markup_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_markup_rules_updated_at BEFORE UPDATE ON public.markup_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: time_entries trg_prevent_approval_regression; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_approval_regression BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_approval_regression();


--
-- Name: quote_items trg_quote_items_aiud; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_quote_items_aiud AFTER INSERT OR DELETE OR UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.on_quote_items_change();


--
-- Name: quotes trg_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: schedule_slots trg_schedule_slots_completed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_schedule_slots_completed AFTER UPDATE OF status ON public.schedule_slots FOR EACH ROW EXECUTE FUNCTION app.trg_schedule_completed();


--
-- Name: schedule_slots trg_schedule_slots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_schedule_slots_updated_at BEFORE UPDATE ON public.schedule_slots FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: supplier_invoice_items trg_sii_aiud; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sii_aiud AFTER INSERT OR DELETE OR UPDATE ON public.supplier_invoice_items FOR EACH ROW EXECUTE FUNCTION public.on_supplier_invoice_item_change();


--
-- Name: supplier_invoice_payments trg_sip_aiud; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sip_aiud AFTER INSERT OR DELETE OR UPDATE ON public.supplier_invoice_payments FOR EACH ROW EXECUTE FUNCTION public.on_supplier_invoice_payment_change();


--
-- Name: suppliers trg_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: time_entries trg_time_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: work_orders trg_work_orders_status_hist; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_work_orders_status_hist AFTER UPDATE OF status ON public.work_orders FOR EACH ROW EXECUTE FUNCTION app.trg_work_order_status_history();


--
-- Name: work_orders trg_work_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();


--
-- Name: public_link_events trigger_increment_public_link_views; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_increment_public_link_views AFTER INSERT ON public.public_link_events FOR EACH ROW EXECUTE FUNCTION public.increment_public_link_views();


--
-- Name: rot_applications trigger_log_rot_status_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_log_rot_status_change AFTER UPDATE OF status ON public.rot_applications FOR EACH ROW EXECUTE FUNCTION public.log_rot_status_change();


--
-- Name: employees trigger_sync_employee_name; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_sync_employee_name BEFORE INSERT OR UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.sync_employee_name();


--
-- Name: ata_items trigger_update_ata_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_ata_items_updated_at BEFORE UPDATE ON public.ata_items FOR EACH ROW EXECUTE FUNCTION public.update_ata_items_updated_at();


--
-- Name: project_budgets trigger_update_project_budgets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_project_budgets_updated_at BEFORE UPDATE ON public.project_budgets FOR EACH ROW EXECUTE FUNCTION public.update_project_budgets_updated_at();


--
-- Name: public_links trigger_update_public_links_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_public_links_updated_at BEFORE UPDATE ON public.public_links FOR EACH ROW EXECUTE FUNCTION public.update_public_links_updated_at();


--
-- Name: rot_applications trigger_update_rot_applications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_rot_applications_updated_at BEFORE UPDATE ON public.rot_applications FOR EACH ROW EXECUTE FUNCTION public.update_rot_updated_at();


--
-- Name: signatures trigger_update_signatures_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_signatures_updated_at BEFORE UPDATE ON public.signatures FOR EACH ROW EXECUTE FUNCTION public.update_signatures_updated_at();


--
-- Name: tenant_feature_flags trigger_update_tenant_feature_flags_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_tenant_feature_flags_updated_at BEFORE UPDATE ON public.tenant_feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_tenant_feature_flags_updated_at();


--
-- Name: aeta_requests update_aeta_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_aeta_requests_updated_at BEFORE UPDATE ON public.aeta_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: absences absences_approved_by_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.absences
    ADD CONSTRAINT absences_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: absences absences_employee_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.absences
    ADD CONSTRAINT absences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: absences absences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.absences
    ADD CONSTRAINT absences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_cache ai_cache_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_cache
    ADD CONSTRAINT ai_cache_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_chat_feedback ai_chat_feedback_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_chat_feedback
    ADD CONSTRAINT ai_chat_feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_conversations ai_conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_conversations
    ADD CONSTRAINT ai_conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_intent_history ai_intent_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_intent_history
    ADD CONSTRAINT ai_intent_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_intent_history ai_intent_history_user_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_intent_history
    ADD CONSTRAINT ai_intent_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES app.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_messages
    ADD CONSTRAINT ai_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_rate_limits ai_rate_limits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_rate_limits
    ADD CONSTRAINT ai_rate_limits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_response_cache ai_response_cache_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ai_response_cache
    ADD CONSTRAINT ai_response_cache_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: api_rate_limits api_rate_limits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.api_rate_limits
    ADD CONSTRAINT api_rate_limits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: factoring_integrations factoring_integrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_integrations
    ADD CONSTRAINT factoring_integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: factoring_offers factoring_offers_invoice_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_offers
    ADD CONSTRAINT factoring_offers_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: factoring_offers factoring_offers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_offers
    ADD CONSTRAINT factoring_offers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: factoring_payments factoring_payments_offer_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_payments
    ADD CONSTRAINT factoring_payments_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES app.factoring_offers(id) ON DELETE CASCADE;


--
-- Name: factoring_payments factoring_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_payments
    ADD CONSTRAINT factoring_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: factoring_webhooks factoring_webhooks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.factoring_webhooks
    ADD CONSTRAINT factoring_webhooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: idempotency_keys idempotency_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.idempotency_keys
    ADD CONSTRAINT idempotency_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: integration_jobs integration_jobs_integration_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_jobs
    ADD CONSTRAINT integration_jobs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES app.integrations(id) ON DELETE CASCADE;


--
-- Name: integration_jobs integration_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_jobs
    ADD CONSTRAINT integration_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: integration_mappings integration_mappings_integration_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_mappings
    ADD CONSTRAINT integration_mappings_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES app.integrations(id) ON DELETE CASCADE;


--
-- Name: integration_mappings integration_mappings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integration_mappings
    ADD CONSTRAINT integration_mappings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: integrations integrations_created_by_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integrations
    ADD CONSTRAINT integrations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: integrations integrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.integrations
    ADD CONSTRAINT integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ocr_processing_logs ocr_processing_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.ocr_processing_logs
    ADD CONSTRAINT ocr_processing_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rot_deduction_history rot_deduction_history_rot_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deduction_history
    ADD CONSTRAINT rot_deduction_history_rot_id_fkey FOREIGN KEY (rot_id) REFERENCES app.rot_deductions(id) ON DELETE CASCADE;


--
-- Name: rot_deduction_history rot_deduction_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deduction_history
    ADD CONSTRAINT rot_deduction_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rot_deductions rot_deductions_invoice_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deductions
    ADD CONSTRAINT rot_deductions_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: rot_deductions rot_deductions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.rot_deductions
    ADD CONSTRAINT rot_deductions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: schedule_slots schedule_slots_created_by_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: schedule_slots schedule_slots_employee_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: schedule_slots schedule_slots_project_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: schedule_slots schedule_slots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: schedule_slots schedule_slots_work_site_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.schedule_slots
    ADD CONSTRAINT schedule_slots_work_site_id_fkey FOREIGN KEY (work_site_id) REFERENCES public.work_sites(id) ON DELETE SET NULL;


--
-- Name: supplier_invoice_history supplier_invoice_history_supplier_invoice_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_supplier_invoice_id_fkey FOREIGN KEY (supplier_invoice_id) REFERENCES app.supplier_invoices(id) ON DELETE CASCADE;


--
-- Name: sync_logs sync_logs_integration_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.sync_logs
    ADD CONSTRAINT sync_logs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES app.integrations(id) ON DELETE SET NULL;


--
-- Name: sync_logs sync_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: app; Owner: postgres
--

ALTER TABLE ONLY app.sync_logs
    ADD CONSTRAINT sync_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: accounting_integrations accounting_integrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_integrations
    ADD CONSTRAINT accounting_integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: aeta_requests aeta_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeta_requests
    ADD CONSTRAINT aeta_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: aeta_requests aeta_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeta_requests
    ADD CONSTRAINT aeta_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: aeta_requests aeta_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aeta_requests
    ADD CONSTRAINT aeta_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: ai_cache ai_cache_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_cache
    ADD CONSTRAINT ai_cache_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ata_items ata_items_rot_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ata_items
    ADD CONSTRAINT ata_items_rot_application_id_fkey FOREIGN KEY (rot_application_id) REFERENCES public.rot_applications(id) ON DELETE CASCADE;


--
-- Name: ata_items ata_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ata_items
    ADD CONSTRAINT ata_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: budget_alerts budget_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.employees(id);


--
-- Name: budget_alerts budget_alerts_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.project_budgets(id) ON DELETE CASCADE;


--
-- Name: budget_alerts budget_alerts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: budget_alerts budget_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: clients clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE NOT VALID;


--
-- Name: employees employees_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);


--
-- Name: absences fk_absences_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT fk_absences_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: absences fk_absences_tenant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT fk_absences_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: schedule_slots fk_schedule_slots_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_slots
    ADD CONSTRAINT fk_schedule_slots_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: schedule_slots fk_schedule_slots_project; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_slots
    ADD CONSTRAINT fk_schedule_slots_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: schedule_slots fk_schedule_slots_tenant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_slots
    ADD CONSTRAINT fk_schedule_slots_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gps_tracking_points gps_tracking_points_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gps_tracking_points
    ADD CONSTRAINT gps_tracking_points_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: gps_tracking_points gps_tracking_points_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gps_tracking_points
    ADD CONSTRAINT gps_tracking_points_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gps_tracking_points gps_tracking_points_time_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gps_tracking_points
    ADD CONSTRAINT gps_tracking_points_time_entry_id_fkey FOREIGN KEY (time_entry_id) REFERENCES public.time_entries(id) ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: invoices invoices_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE NOT VALID;


--
-- Name: markup_rules markup_rules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markup_rules
    ADD CONSTRAINT markup_rules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: materials materials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_employee_id_fkey FOREIGN KEY (recipient_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payroll_exports payroll_exports_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_exports
    ADD CONSTRAINT payroll_exports_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;


--
-- Name: payroll_exports payroll_exports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_exports
    ADD CONSTRAINT payroll_exports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payroll_periods payroll_periods_exported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_exported_by_fkey FOREIGN KEY (exported_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payroll_sync_logs payroll_sync_logs_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_sync_logs
    ADD CONSTRAINT payroll_sync_logs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.accounting_integrations(id) ON DELETE CASCADE;


--
-- Name: payroll_sync_logs payroll_sync_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_sync_logs
    ADD CONSTRAINT payroll_sync_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pricing_rules pricing_rules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: project_budgets project_budgets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_budgets project_budgets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: public_link_events public_link_events_public_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_link_events
    ADD CONSTRAINT public_link_events_public_link_id_fkey FOREIGN KEY (public_link_id) REFERENCES public.public_links(id) ON DELETE CASCADE;


--
-- Name: public_links public_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT public_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: public_links public_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT public_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quote_approvals quote_approvals_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_approvals
    ADD CONSTRAINT quote_approvals_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quote_approvals quote_approvals_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_approvals
    ADD CONSTRAINT quote_approvals_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_approvals quote_approvals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_approvals
    ADD CONSTRAINT quote_approvals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quote_history quote_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_history
    ADD CONSTRAINT quote_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: quote_history quote_history_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_history
    ADD CONSTRAINT quote_history_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_history quote_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_history
    ADD CONSTRAINT quote_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quote_templates quote_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT quote_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: quotes quotes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: quotes quotes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: quotes quotes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: release_labels release_labels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_labels
    ADD CONSTRAINT release_labels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: release_labels release_labels_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_labels
    ADD CONSTRAINT release_labels_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: resource_locks resource_locks_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_locks
    ADD CONSTRAINT resource_locks_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.sync_jobs(id) ON DELETE CASCADE;


--
-- Name: rot_api_logs rot_api_logs_rot_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_api_logs
    ADD CONSTRAINT rot_api_logs_rot_application_id_fkey FOREIGN KEY (rot_application_id) REFERENCES public.rot_applications(id) ON DELETE SET NULL;


--
-- Name: rot_api_logs rot_api_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_api_logs
    ADD CONSTRAINT rot_api_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rot_applications rot_applications_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: rot_applications rot_applications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: rot_applications rot_applications_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: rot_applications rot_applications_parent_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_parent_invoice_id_fkey FOREIGN KEY (parent_invoice_id) REFERENCES public.invoices(id);


--
-- Name: rot_applications rot_applications_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: rot_applications rot_applications_signature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_signature_id_fkey FOREIGN KEY (signature_id) REFERENCES public.signatures(id);


--
-- Name: rot_applications rot_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_applications
    ADD CONSTRAINT rot_applications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE NOT VALID;


--
-- Name: rot_status_history rot_status_history_rot_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rot_status_history
    ADD CONSTRAINT rot_status_history_rot_application_id_fkey FOREIGN KEY (rot_application_id) REFERENCES public.rot_applications(id) ON DELETE CASCADE;


--
-- Name: signature_events signature_events_signature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signature_events
    ADD CONSTRAINT signature_events_signature_id_fkey FOREIGN KEY (signature_id) REFERENCES public.signatures(id) ON DELETE CASCADE;


--
-- Name: signatures signatures_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_allocations supplier_invoice_allocations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_allocations
    ADD CONSTRAINT supplier_invoice_allocations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.supplier_invoice_items(id) ON DELETE SET NULL;


--
-- Name: supplier_invoice_allocations supplier_invoice_allocations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_allocations
    ADD CONSTRAINT supplier_invoice_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: supplier_invoice_allocations supplier_invoice_allocations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_allocations
    ADD CONSTRAINT supplier_invoice_allocations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_approvals supplier_invoice_approvals_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_approvals
    ADD CONSTRAINT supplier_invoice_approvals_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_approvals supplier_invoice_approvals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_approvals
    ADD CONSTRAINT supplier_invoice_approvals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_history supplier_invoice_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: supplier_invoice_history supplier_invoice_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_history
    ADD CONSTRAINT supplier_invoice_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_items supplier_invoice_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_items
    ADD CONSTRAINT supplier_invoice_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_invoice_payments supplier_invoice_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_invoice_payments
    ADD CONSTRAINT supplier_invoice_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sync_jobs sync_jobs_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_jobs
    ADD CONSTRAINT sync_jobs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.accounting_integrations(id) ON DELETE CASCADE;


--
-- Name: sync_jobs sync_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_jobs
    ADD CONSTRAINT sync_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sync_queue sync_queue_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.accounting_integrations(id) ON DELETE CASCADE;


--
-- Name: sync_queue sync_queue_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_feature_flags tenant_feature_flags_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_feature_flags
    ADD CONSTRAINT tenant_feature_flags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: time_entries time_entries_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id);


--
-- Name: time_entries time_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: time_entries time_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: time_entries time_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: time_entries time_entries_work_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_work_site_id_fkey FOREIGN KEY (work_site_id) REFERENCES public.work_sites(id);


--
-- Name: time_reports time_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_reports
    ADD CONSTRAINT time_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_tenants user_tenants_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_tenants user_tenants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: work_order_photos work_order_photos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_photos
    ADD CONSTRAINT work_order_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: work_order_photos work_order_photos_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_photos
    ADD CONSTRAINT work_order_photos_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_status_history work_order_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_status_history
    ADD CONSTRAINT work_order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: work_order_status_history work_order_status_history_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_status_history
    ADD CONSTRAINT work_order_status_history_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: work_orders work_orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: work_sites work_sites_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_sites
    ADD CONSTRAINT work_sites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: workflow_executions workflow_executions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: workflow_executions workflow_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: absences; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.absences ENABLE ROW LEVEL SECURITY;

--
-- Name: absences absences_delete; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY absences_delete ON app.absences FOR DELETE USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = absences.tenant_id)))))));


--
-- Name: absences absences_insert; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY absences_insert ON app.absences FOR INSERT WITH CHECK (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = absences.tenant_id)))))));


--
-- Name: absences absences_select; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY absences_select ON app.absences FOR SELECT USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = absences.tenant_id)))))));


--
-- Name: absences absences_update; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY absences_update ON app.absences FOR UPDATE USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = absences.tenant_id)))))));


--
-- Name: ai_cache; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_cache ai_cache_admin; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_cache_admin ON app.ai_cache USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK ((tenant_id = app.current_tenant_id()));


--
-- Name: ai_cache ai_cache_ro; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_cache_ro ON app.ai_cache FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: ai_response_cache ai_cache_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_cache_tenant ON app.ai_response_cache USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: ai_chat_feedback; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_chat_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations ai_conv_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_conv_tenant ON app.ai_conversations USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: ai_conversation_summaries; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_conversation_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_chat_feedback ai_feedback_insert; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_feedback_insert ON app.ai_chat_feedback FOR INSERT WITH CHECK ((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: ai_chat_feedback ai_feedback_select; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_feedback_select ON app.ai_chat_feedback FOR SELECT USING ((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: ai_intent_history; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_intent_history ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_intent_history ai_intent_insert; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_intent_insert ON app.ai_intent_history FOR INSERT WITH CHECK ((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: ai_intent_history ai_intent_select; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_intent_select ON app.ai_intent_history FOR SELECT USING ((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)));


--
-- Name: ai_messages; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages ai_msg_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_msg_tenant ON app.ai_messages USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: ai_rate_limits; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_response_cache; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ai_response_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_rate_limits ai_rl_admin; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_rl_admin ON app.ai_rate_limits USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK ((tenant_id = app.current_tenant_id()));


--
-- Name: ai_rate_limits ai_rl_ro; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ai_rl_ro ON app.ai_rate_limits FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: api_rate_limits; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.api_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: factoring_integrations fact_int_tenant_read; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY fact_int_tenant_read ON app.factoring_integrations FOR SELECT USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: factoring_integrations fact_int_tenant_write; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY fact_int_tenant_write ON app.factoring_integrations USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: factoring_offers fact_offers_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY fact_offers_tenant ON app.factoring_offers USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: factoring_payments fact_payments_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY fact_payments_tenant ON app.factoring_payments USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: factoring_webhooks fact_webhooks_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY fact_webhooks_tenant ON app.factoring_webhooks USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: factoring_integrations; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.factoring_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: factoring_offers; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.factoring_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: factoring_payments; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.factoring_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: factoring_webhooks; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.factoring_webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: idempotency_keys idem_tenant_isolation; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY idem_tenant_isolation ON app.idempotency_keys USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: idempotency_keys; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.idempotency_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_jobs; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.integration_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_mappings; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.integration_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations integrations_admin_all; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY integrations_admin_all ON app.integrations USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: integrations integrations_read; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY integrations_read ON app.integrations FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: integration_jobs jobs_admin_all; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY jobs_admin_all ON app.integration_jobs USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: integration_jobs jobs_read; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY jobs_read ON app.integration_jobs FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: sync_logs logs_admin_all; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY logs_admin_all ON app.sync_logs USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: sync_logs logs_read; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY logs_read ON app.sync_logs FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: integration_mappings mappings_admin_all; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY mappings_admin_all ON app.integration_mappings USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: integration_mappings mappings_read; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY mappings_read ON app.integration_mappings FOR SELECT USING ((tenant_id = app.current_tenant_id()));


--
-- Name: ocr_processing_logs ocr_logs_tenant_isolation; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY ocr_logs_tenant_isolation ON app.ocr_processing_logs USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: ocr_processing_logs; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.ocr_processing_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: api_rate_limits rate_limits_tenant_isolation; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY rate_limits_tenant_isolation ON app.api_rate_limits USING ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id)) WITH CHECK ((((auth.jwt() ->> 'tenant_id'::text))::uuid = tenant_id));


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_select_all; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY role_permissions_select_all ON app.role_permissions FOR SELECT TO authenticated USING (true);


--
-- Name: rot_deduction_history; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.rot_deduction_history ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_deductions; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.rot_deductions ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_deduction_history rot_hist_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY rot_hist_tenant ON app.rot_deduction_history USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: rot_deductions rot_tenant; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY rot_tenant ON app.rot_deductions USING ((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid));


--
-- Name: schedule_slots; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.schedule_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_slots schedule_slots_delete; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY schedule_slots_delete ON app.schedule_slots FOR DELETE USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = schedule_slots.tenant_id)))))));


--
-- Name: schedule_slots schedule_slots_insert; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY schedule_slots_insert ON app.schedule_slots FOR INSERT WITH CHECK (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = schedule_slots.tenant_id)))))));


--
-- Name: schedule_slots schedule_slots_select; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY schedule_slots_select ON app.schedule_slots FOR SELECT USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = schedule_slots.tenant_id)))))));


--
-- Name: schedule_slots schedule_slots_update; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY schedule_slots_update ON app.schedule_slots FOR UPDATE USING (((tenant_id = ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1)) AND ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text) AND (employees.tenant_id = schedule_slots.tenant_id)))))));


--
-- Name: sync_logs; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: app; Owner: postgres
--

ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_admin_del; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_admin_del ON app.user_roles FOR DELETE USING ((EXISTS ( SELECT 1
   FROM app.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.tenant_id = user_roles.tenant_id) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_roles user_roles_admin_ins; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_admin_ins ON app.user_roles FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM app.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.tenant_id = user_roles.tenant_id) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_roles user_roles_admin_upd; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_admin_upd ON app.user_roles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM app.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.tenant_id = user_roles.tenant_id) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_roles user_roles_select_own; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_select_own ON app.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_roles user_roles_select_tenant_admin; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_select_tenant_admin ON app.user_roles FOR SELECT USING ((tenant_id IN ( SELECT user_roles_1.tenant_id
   FROM app.user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND (user_roles_1.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_roles user_roles_self_select; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY user_roles_self_select ON app.user_roles FOR SELECT TO authenticated USING ((user_id = app.current_auth_uid()));


--
-- Name: sync_logs users_can_view_their_sync_logs; Type: POLICY; Schema: app; Owner: postgres
--

CREATE POLICY users_can_view_their_sync_logs ON app.sync_logs FOR SELECT USING ((( SELECT auth.uid() AS uid) IN ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = sync_logs.tenant_id))));


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: work_sites Admins can manage work sites for their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage work sites for their tenant" ON public.work_sites USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text))))) WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: gps_tracking_points Admins can view all GPS tracking for their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all GPS tracking for their tenant" ON public.gps_tracking_points FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: notifications Only admins can create notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only admins can create notifications" ON public.notifications FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = ANY (ARRAY['admin'::text, 'Admin'::text, 'ADMIN'::text])) AND (employees.tenant_id = notifications.tenant_id)))));


--
-- Name: notifications Only admins can delete notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only admins can delete notifications" ON public.notifications FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = ANY (ARRAY['admin'::text, 'Admin'::text, 'ADMIN'::text])) AND (employees.tenant_id = notifications.tenant_id)))));


--
-- Name: projects RLS Projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "RLS Projects" ON public.projects USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: aeta_requests RLS aeta; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "RLS aeta" ON public.aeta_requests USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: invoices RLS invoices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "RLS invoices" ON public.invoices USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: time_reports RLS time reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "RLS time reports" ON public.time_reports USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: rot_applications Users can insert ROT applications for their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert ROT applications for their tenant" ON public.rot_applications FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: rot_status_history Users can insert ROT status history for their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert ROT status history for their tenant" ON public.rot_status_history FOR INSERT WITH CHECK ((rot_application_id IN ( SELECT rot_applications.id
   FROM public.rot_applications
  WHERE (rot_applications.tenant_id IN ( SELECT employees.tenant_id
           FROM public.employees
          WHERE (employees.auth_user_id = auth.uid()))))));


--
-- Name: gps_tracking_points Users can insert their own GPS tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own GPS tracking" ON public.gps_tracking_points FOR INSERT WITH CHECK ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: notifications Users can read their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own notifications" ON public.notifications FOR SELECT USING ((((recipient_id IS NULL) AND (tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))) OR (recipient_id = auth.uid()) OR (recipient_employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))));


--
-- Name: rot_applications Users can update ROT applications from their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update ROT applications from their tenant" ON public.rot_applications FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (((recipient_id = auth.uid()) OR (recipient_employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR ((recipient_id IS NULL) AND (tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())))))) WITH CHECK (((recipient_id = auth.uid()) OR (recipient_employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) OR ((recipient_id IS NULL) AND (tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))))));


--
-- Name: rot_api_logs Users can view ROT API logs from their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view ROT API logs from their tenant" ON public.rot_api_logs FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: rot_applications Users can view ROT applications from their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view ROT applications from their tenant" ON public.rot_applications FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: rot_status_history Users can view ROT status history from their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view ROT status history from their tenant" ON public.rot_status_history FOR SELECT USING ((rot_application_id IN ( SELECT rot_applications.id
   FROM public.rot_applications
  WHERE (rot_applications.tenant_id IN ( SELECT employees.tenant_id
           FROM public.employees
          WHERE (employees.auth_user_id = auth.uid()))))));


--
-- Name: accounting_integrations Users can view their integrations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their integrations" ON public.accounting_integrations FOR SELECT USING ((auth.uid() IN ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = accounting_integrations.tenant_id))));


--
-- Name: sync_jobs Users can view their jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their jobs" ON public.sync_jobs FOR SELECT USING ((auth.uid() IN ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = sync_jobs.tenant_id))));


--
-- Name: resource_locks Users can view their locks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their locks" ON public.resource_locks FOR SELECT USING ((job_id IN ( SELECT sync_jobs.id
   FROM public.sync_jobs
  WHERE (sync_jobs.tenant_id IN ( SELECT tenants.id
           FROM public.tenants
          WHERE (tenants.user_id = auth.uid()))))));


--
-- Name: gps_tracking_points Users can view their own GPS tracking; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own GPS tracking" ON public.gps_tracking_points FOR SELECT USING ((employee_id IN ( SELECT employees.id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: payroll_sync_logs Users can view their sync logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their sync logs" ON public.payroll_sync_logs FOR SELECT USING ((auth.uid() IN ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = payroll_sync_logs.tenant_id))));


--
-- Name: sync_queue Users can view their sync queue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their sync queue" ON public.sync_queue FOR SELECT USING ((auth.uid() IN ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = sync_queue.tenant_id))));


--
-- Name: work_sites Users can view work sites for their tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view work sites for their tenant" ON public.work_sites FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: absences abs_delete_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_delete_self ON public.absences FOR DELETE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: absences abs_modify_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_modify_admin ON public.absences USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK ((tenant_id = app.current_tenant_id()));


--
-- Name: absences abs_modify_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_modify_self ON public.absences FOR INSERT WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: absences abs_select_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_select_admin ON public.absences FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: absences abs_select_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_select_self ON public.absences FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: absences abs_update_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY abs_update_self ON public.absences FOR UPDATE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id()))) WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: absences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

--
-- Name: accounting_integrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.accounting_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: aeta_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.aeta_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: aeta_requests aeta_requests_delete_by_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aeta_requests_delete_by_tenant ON public.aeta_requests FOR DELETE TO authenticated USING ((tenant_id = public.current_tenant_id()));


--
-- Name: aeta_requests aeta_requests_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aeta_requests_insert ON public.aeta_requests FOR INSERT TO authenticated WITH CHECK (((tenant_id = public.current_tenant_id()) AND (requested_by = auth.uid())));


--
-- Name: aeta_requests aeta_requests_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aeta_requests_select ON public.aeta_requests FOR SELECT TO authenticated USING ((tenant_id = public.current_tenant_id()));


--
-- Name: aeta_requests aeta_requests_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aeta_requests_update ON public.aeta_requests FOR UPDATE TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));


--
-- Name: supplier_invoice_approvals approval_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approval_select ON public.supplier_invoice_approvals FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_approvals approval_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approval_write ON public.supplier_invoice_approvals USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_approvals approvals_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approvals_delete ON public.quote_approvals FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_approvals approvals_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approvals_insert ON public.quote_approvals FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_approvals approvals_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approvals_select ON public.quote_approvals FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_approvals approvals_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY approvals_update ON public.quote_approvals FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: ata_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ata_items ENABLE ROW LEVEL SECURITY;

--
-- Name: ata_items ata_items_tenant_isolation_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ata_items_tenant_isolation_delete ON public.ata_items FOR DELETE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: ata_items ata_items_tenant_isolation_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ata_items_tenant_isolation_insert ON public.ata_items FOR INSERT WITH CHECK (((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) AND (rot_application_id IN ( SELECT rot_applications.id
   FROM public.rot_applications
  WHERE (rot_applications.tenant_id = ata_items.tenant_id)))));


--
-- Name: ata_items ata_items_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ata_items_tenant_isolation_select ON public.ata_items FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: ata_items ata_items_tenant_isolation_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ata_items_tenant_isolation_update ON public.ata_items FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: audit_logs audit_logs_no_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_no_delete ON public.audit_logs FOR DELETE USING (false);


--
-- Name: audit_logs audit_logs_no_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_no_update ON public.audit_logs FOR UPDATE USING (false);


--
-- Name: audit_logs audit_logs_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_tenant_isolation_select ON public.audit_logs FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: budget_alerts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: budget_alerts budget_alerts_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY budget_alerts_insert ON public.budget_alerts FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) OR (auth.uid() IS NULL)))));


--
-- Name: budget_alerts budget_alerts_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY budget_alerts_tenant_isolation_select ON public.budget_alerts FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: budget_alerts budget_alerts_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY budget_alerts_update ON public.budget_alerts FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: employees employees_select_by_tenant_or_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY employees_select_by_tenant_or_self ON public.employees FOR SELECT TO authenticated USING (((tenant_id = public.current_tenant_id()) OR (auth_user_id = auth.uid())));


--
-- Name: employees employees_update_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY employees_update_self ON public.employees FOR UPDATE TO authenticated USING ((auth_user_id = auth.uid())) WITH CHECK ((auth_user_id = auth.uid()));


--
-- Name: gps_tracking_points; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.gps_tracking_points ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_history history_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY history_delete ON public.quote_history FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_history history_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY history_insert ON public.quote_history FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_history history_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY history_select ON public.quote_history FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: invoice_lines; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_webhook_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY invoices_webhook_read ON public.invoices FOR SELECT USING (((auth.uid() = user_id) OR ((current_setting('app.current_tenant_id'::text, true))::uuid = tenant_id)));


--
-- Name: markup_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.markup_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: materials; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

--
-- Name: materials materials_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY materials_delete ON public.materials FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: materials materials_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY materials_insert ON public.materials FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: materials materials_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY materials_select ON public.materials FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: materials materials_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY materials_update ON public.materials FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: markup_rules mr_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY mr_select ON public.markup_rules FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: markup_rules mr_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY mr_write ON public.markup_rules USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_exports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payroll_exports ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_exports payroll_exports_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payroll_exports_select ON public.payroll_exports FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: payroll_exports payroll_exports_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payroll_exports_write ON public.payroll_exports USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: payroll_sync_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payroll_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: project_budgets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: project_budgets project_budgets_admin_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY project_budgets_admin_delete ON public.project_budgets FOR DELETE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: project_budgets project_budgets_admin_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY project_budgets_admin_insert ON public.project_budgets FOR INSERT WITH CHECK (((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))) AND (project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.tenant_id = project_budgets.tenant_id)))));


--
-- Name: project_budgets project_budgets_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY project_budgets_admin_update ON public.project_budgets FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: project_budgets project_budgets_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY project_budgets_tenant_isolation_select ON public.project_budgets FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: projects projects_any_by_claim; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_any_by_claim ON public.projects TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));


--
-- Name: projects projects_delete_by_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_delete_by_tenant ON public.projects FOR DELETE TO authenticated USING ((tenant_id = public.current_tenant_id()));


--
-- Name: projects projects_insert_by_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_insert_by_tenant ON public.projects FOR INSERT TO authenticated WITH CHECK ((tenant_id = public.current_tenant_id()));


--
-- Name: projects projects_select_by_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_select_by_tenant ON public.projects FOR SELECT TO authenticated USING ((tenant_id = public.current_tenant_id()));


--
-- Name: projects projects_update_by_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY projects_update_by_tenant ON public.projects FOR UPDATE TO authenticated USING ((tenant_id = public.current_tenant_id())) WITH CHECK ((tenant_id = public.current_tenant_id()));


--
-- Name: push_subscriptions ps_modify_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ps_modify_self ON public.push_subscriptions USING (((tenant_id = app.current_tenant_id()) AND (user_id = auth.uid()))) WITH CHECK (((tenant_id = app.current_tenant_id()) AND (user_id = auth.uid())));


--
-- Name: push_subscriptions ps_select_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY ps_select_self ON public.push_subscriptions FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND (user_id = auth.uid())));


--
-- Name: public_link_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.public_link_events ENABLE ROW LEVEL SECURITY;

--
-- Name: public_link_events public_link_events_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_link_events_insert ON public.public_link_events FOR INSERT WITH CHECK (true);


--
-- Name: public_link_events public_link_events_select_via_link; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_link_events_select_via_link ON public.public_link_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.public_links pl
  WHERE ((pl.id = public_link_events.public_link_id) AND (pl.tenant_id IN ( SELECT employees.tenant_id
           FROM public.employees
          WHERE (employees.auth_user_id = auth.uid())))))));


--
-- Name: public_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.public_links ENABLE ROW LEVEL SECURITY;

--
-- Name: public_links public_links_tenant_isolation_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_links_tenant_isolation_delete ON public.public_links FOR DELETE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: public_links public_links_tenant_isolation_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_links_tenant_isolation_insert ON public.public_links FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: public_links public_links_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_links_tenant_isolation_select ON public.public_links FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: public_links public_links_tenant_isolation_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_links_tenant_isolation_update ON public.public_links FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_approvals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_items quote_items_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quote_items_delete ON public.quote_items FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_items quote_items_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quote_items_insert ON public.quote_items FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_items quote_items_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quote_items_select ON public.quote_items FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_items quote_items_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quote_items_update ON public.quote_items FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: quotes quotes_tenant_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quotes_tenant_delete ON public.quotes FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quotes quotes_tenant_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quotes_tenant_insert ON public.quotes FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quotes quotes_tenant_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quotes_tenant_select ON public.quotes FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quotes quotes_tenant_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY quotes_tenant_update ON public.quotes FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: release_labels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.release_labels ENABLE ROW LEVEL SECURITY;

--
-- Name: release_labels release_labels_admin_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY release_labels_admin_insert ON public.release_labels FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: release_labels release_labels_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY release_labels_admin_update ON public.release_labels FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: release_labels release_labels_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY release_labels_tenant_isolation_select ON public.release_labels FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: resource_locks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_locks ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_api_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rot_api_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rot_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_status_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rot_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rot_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: rot_submissions rot_submissions_access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rot_submissions_access ON public.rot_submissions FOR SELECT USING (((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['accountant'::text, 'admin'::text]))));


--
-- Name: pricing_rules rules_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rules_delete ON public.pricing_rules FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: pricing_rules rules_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rules_insert ON public.pricing_rules FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: pricing_rules rules_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rules_select ON public.pricing_rules FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: pricing_rules rules_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rules_update ON public.pricing_rules FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: schedule_slots sch_delete_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_delete_self ON public.schedule_slots FOR DELETE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: schedule_slots sch_modify_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_modify_admin ON public.schedule_slots USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK ((tenant_id = app.current_tenant_id()));


--
-- Name: schedule_slots sch_modify_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_modify_self ON public.schedule_slots FOR INSERT WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: schedule_slots sch_select_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_select_admin ON public.schedule_slots FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: schedule_slots sch_select_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_select_self ON public.schedule_slots FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: schedule_slots sch_update_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sch_update_self ON public.schedule_slots FOR UPDATE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id()))) WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: schedule_slots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices service_role_bypass; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_bypass ON public.invoices USING (((CURRENT_USER = 'authenticator'::name) AND (current_setting('role'::text, true) = 'service_role'::text)));


--
-- Name: supplier_invoice_allocations sia_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sia_select ON public.supplier_invoice_allocations FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_allocations sia_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sia_write ON public.supplier_invoice_allocations USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: signature_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

--
-- Name: signature_events signature_events_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY signature_events_insert ON public.signature_events FOR INSERT WITH CHECK (true);


--
-- Name: signature_events signature_events_select_via_signature; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY signature_events_select_via_signature ON public.signature_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.signatures s
  WHERE ((s.id = signature_events.signature_id) AND (s.tenant_id IN ( SELECT employees.tenant_id
           FROM public.employees
          WHERE (employees.auth_user_id = auth.uid())))))));


--
-- Name: signatures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: signatures signatures_tenant_isolation_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY signatures_tenant_isolation_insert ON public.signatures FOR INSERT WITH CHECK ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: signatures signatures_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY signatures_tenant_isolation_select ON public.signatures FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: signatures signatures_tenant_isolation_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY signatures_tenant_isolation_update ON public.signatures FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: supplier_invoice_history sih_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sih_insert ON public.supplier_invoice_history FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_history sih_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sih_select ON public.supplier_invoice_history FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_items sii_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sii_select ON public.supplier_invoice_items FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_items sii_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sii_write ON public.supplier_invoice_items USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_payments sip_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sip_select ON public.supplier_invoice_payments FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_payments sip_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sip_write ON public.supplier_invoice_payments USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: supplier_invoice_allocations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_invoice_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_invoice_approvals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_invoice_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_invoice_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_invoice_history ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_invoice_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_invoice_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_invoice_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers suppliers_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY suppliers_select ON public.suppliers FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: suppliers suppliers_write; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY suppliers_write ON public.suppliers USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: sync_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_queue; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries te_delete_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_delete_self ON public.time_entries FOR DELETE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: time_entries te_modify_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_modify_admin ON public.time_entries USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK ((tenant_id = app.current_tenant_id()));


--
-- Name: time_entries te_modify_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_modify_self ON public.time_entries FOR INSERT WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: time_entries te_select_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_select_admin ON public.time_entries FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: time_entries te_select_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_select_self ON public.time_entries FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: time_entries te_update_self; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY te_update_self ON public.time_entries FOR UPDATE USING (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id()))) WITH CHECK (((tenant_id = app.current_tenant_id()) AND (employee_id = app.current_employee_id())));


--
-- Name: quote_templates templates_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY templates_delete ON public.quote_templates FOR DELETE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_templates templates_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY templates_insert ON public.quote_templates FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_templates templates_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY templates_select ON public.quote_templates FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: quote_templates templates_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY templates_update ON public.quote_templates FOR UPDATE USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))) WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: tenant_feature_flags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_feature_flags tenant_feature_flags_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_feature_flags_admin_update ON public.tenant_feature_flags FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = 'admin'::text)))));


--
-- Name: tenant_feature_flags tenant_feature_flags_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_feature_flags_insert ON public.tenant_feature_flags FOR INSERT WITH CHECK (true);


--
-- Name: tenant_feature_flags tenant_feature_flags_tenant_isolation_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_feature_flags_tenant_isolation_select ON public.tenant_feature_flags FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: invoices tenant_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation ON public.invoices USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));


--
-- Name: clients tenant_isolation_clients; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_clients ON public.clients USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: employees tenant_isolation_employees; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_employees ON public.employees USING ((auth_user_id = auth.uid())) WITH CHECK ((auth_user_id = auth.uid()));


--
-- Name: invoice_lines tenant_isolation_invoice_lines; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_invoice_lines ON public.invoice_lines USING ((invoice_id IN ( SELECT invoices.id
   FROM public.invoices
  WHERE (invoices.tenant_id IN ( SELECT employees.tenant_id
           FROM public.employees
          WHERE (employees.auth_user_id = auth.uid()))))));


--
-- Name: invoices tenant_isolation_invoices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_invoices ON public.invoices USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: projects tenant_isolation_projects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_projects ON public.projects USING ((tenant_id = public.get_current_tenant())) WITH CHECK ((tenant_id = public.get_current_tenant()));


--
-- Name: tenants tenant_isolation_tenants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_tenants ON public.tenants USING ((user_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: time_entries tenant_isolation_time_entries; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_isolation_time_entries ON public.time_entries USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: time_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.time_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: aeta_requests users_create_aeta_requests_for_their_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_create_aeta_requests_for_their_tenant ON public.aeta_requests FOR INSERT WITH CHECK (((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))) AND (requested_by = auth.uid())));


--
-- Name: aeta_requests users_update_aeta_requests_for_their_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_aeta_requests_for_their_tenant ON public.aeta_requests FOR UPDATE USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: aeta_requests users_view_aeta_requests_for_their_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_view_aeta_requests_for_their_tenant ON public.aeta_requests FOR SELECT USING ((tenant_id IN ( SELECT employees.tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid()))));


--
-- Name: work_orders wo_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wo_admin_all ON public.work_orders USING (((tenant_id = app.current_tenant_id()) AND app.is_admin())) WITH CHECK (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: work_orders wo_select_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wo_select_admin ON public.work_orders FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND app.is_admin()));


--
-- Name: work_orders wo_select_employee; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wo_select_employee ON public.work_orders FOR SELECT USING (((tenant_id = app.current_tenant_id()) AND ((EXISTS ( SELECT 1
   FROM public.employees e
  WHERE ((e.auth_user_id = auth.uid()) AND (e.id = work_orders.assigned_to)))) OR (created_by = auth.uid()))));


--
-- Name: work_order_photos wop_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wop_admin_all ON public.work_order_photos USING ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_photos.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND app.is_admin())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_photos.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND app.is_admin()))));


--
-- Name: work_order_photos wop_select_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wop_select_tenant ON public.work_order_photos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_photos.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND (app.is_admin() OR (w.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.employees e
          WHERE ((e.auth_user_id = auth.uid()) AND (e.id = w.assigned_to)))))))));


--
-- Name: work_order_photos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: work_order_status_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.work_order_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: work_orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: work_sites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.work_sites ENABLE ROW LEVEL SECURITY;

--
-- Name: work_order_status_history wosh_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wosh_admin_all ON public.work_order_status_history USING ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_status_history.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND app.is_admin())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_status_history.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND app.is_admin()))));


--
-- Name: work_order_status_history wosh_select_tenant; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY wosh_select_tenant ON public.work_order_status_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.work_orders w
  WHERE ((w.id = work_order_status_history.work_order_id) AND (w.tenant_id = app.current_tenant_id()) AND (app.is_admin() OR (w.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.employees e
          WHERE ((e.auth_user_id = auth.uid()) AND (e.id = w.assigned_to)))))))));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow admin deletes; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow admin deletes" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'aeta-attachments'::text) AND (EXISTS ( SELECT 1
   FROM public.employees
  WHERE ((employees.auth_user_id = auth.uid()) AND (employees.role = ANY (ARRAY['admin'::text, 'Admin'::text])) AND ((employees.tenant_id)::text = (storage.foldername(employees.name))[1]))))));


--
-- Name: objects Allow authenticated reads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'aeta-attachments'::text) AND ((storage.foldername(name))[1] = ( SELECT (employees.tenant_id)::text AS tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1))));


--
-- Name: objects Allow authenticated tenant users to delete their own payroll ex; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated tenant users to delete their own payroll ex" ON storage.objects FOR DELETE USING (((bucket_id = 'payroll_exports'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1))));


--
-- Name: objects Allow authenticated tenant users to read their own payroll expo; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated tenant users to read their own payroll expo" ON storage.objects FOR SELECT USING (((bucket_id = 'payroll_exports'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1))));


--
-- Name: objects Allow authenticated tenant users to update their own payroll ex; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated tenant users to update their own payroll ex" ON storage.objects FOR UPDATE USING (((bucket_id = 'payroll_exports'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1))));


--
-- Name: objects Allow authenticated tenant users to upload their own payroll ex; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated tenant users to upload their own payroll ex" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'payroll_exports'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1))));


--
-- Name: objects Allow authenticated uploads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'aeta-attachments'::text) AND ((storage.foldername(name))[1] = ( SELECT (employees.tenant_id)::text AS tenant_id
   FROM public.employees
  WHERE (employees.auth_user_id = auth.uid())
 LIMIT 1))));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: objects users_can_delete_supplier_invoices; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY users_can_delete_supplier_invoices ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'supplier_invoices'::text) AND ((storage.foldername(name))[1] IN ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: objects users_can_read_supplier_invoices; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY users_can_read_supplier_invoices ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'supplier_invoices'::text) AND ((storage.foldername(name))[1] IN ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: objects users_can_upload_supplier_invoices; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY users_can_upload_supplier_invoices ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'supplier_invoices'::text) AND ((storage.foldername(name))[1] IN ( SELECT (user_roles.tenant_id)::text AS tenant_id
   FROM app.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime workflow_executions; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.workflow_executions;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION gbtreekey16_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey16_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey16_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey16_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey16_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey16_out(public.gbtreekey16); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey16_out(public.gbtreekey16) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey16_out(public.gbtreekey16) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey16_out(public.gbtreekey16) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey16_out(public.gbtreekey16) TO service_role;


--
-- Name: FUNCTION gbtreekey2_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey2_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey2_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey2_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey2_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey2_out(public.gbtreekey2); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey2_out(public.gbtreekey2) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey2_out(public.gbtreekey2) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey2_out(public.gbtreekey2) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey2_out(public.gbtreekey2) TO service_role;


--
-- Name: FUNCTION gbtreekey32_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey32_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey32_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey32_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey32_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey32_out(public.gbtreekey32); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey32_out(public.gbtreekey32) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey32_out(public.gbtreekey32) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey32_out(public.gbtreekey32) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey32_out(public.gbtreekey32) TO service_role;


--
-- Name: FUNCTION gbtreekey4_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey4_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey4_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey4_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey4_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey4_out(public.gbtreekey4); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey4_out(public.gbtreekey4) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey4_out(public.gbtreekey4) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey4_out(public.gbtreekey4) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey4_out(public.gbtreekey4) TO service_role;


--
-- Name: FUNCTION gbtreekey8_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey8_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey8_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey8_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey8_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey8_out(public.gbtreekey8); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey8_out(public.gbtreekey8) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey8_out(public.gbtreekey8) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey8_out(public.gbtreekey8) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey8_out(public.gbtreekey8) TO service_role;


--
-- Name: FUNCTION gbtreekey_var_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey_var_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey_var_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey_var_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey_var_in(cstring) TO service_role;


--
-- Name: FUNCTION gbtreekey_var_out(public.gbtreekey_var); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbtreekey_var_out(public.gbtreekey_var) TO postgres;
GRANT ALL ON FUNCTION public.gbtreekey_var_out(public.gbtreekey_var) TO anon;
GRANT ALL ON FUNCTION public.gbtreekey_var_out(public.gbtreekey_var) TO authenticated;
GRANT ALL ON FUNCTION public.gbtreekey_var_out(public.gbtreekey_var) TO service_role;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO service_role;


--
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO service_role;


--
-- Name: FUNCTION halfvec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION halfvec_out(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION halfvec_send(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION sparsevec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION sparsevec_out(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION sparsevec_send(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION vector_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO service_role;


--
-- Name: FUNCTION vector_out(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_out(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO service_role;


--
-- Name: FUNCTION vector_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO service_role;


--
-- Name: FUNCTION vector_send(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_send(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO service_role;


--
-- Name: FUNCTION vector_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_halfvec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_sparsevec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION array_to_vector(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec_to_float4(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec_to_sparsevec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION halfvec_to_vector(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO service_role;


--
-- Name: FUNCTION sparsevec_to_halfvec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION sparsevec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION sparsevec_to_vector(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector_to_float4(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector_to_halfvec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector_to_sparsevec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION vector(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO service_role;


--
-- Name: FUNCTION approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date, p_end_date date); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.approve_time_entries_all(p_tenant_id uuid, p_employee_id uuid, p_start_date date, p_end_date date) TO service_role;


--
-- Name: FUNCTION check_permission(p_user_id uuid, p_tenant_id uuid, p_resource text, p_action text); Type: ACL; Schema: app; Owner: postgres
--

REVOKE ALL ON FUNCTION app.check_permission(p_user_id uuid, p_tenant_id uuid, p_resource text, p_action text) FROM PUBLIC;


--
-- Name: TABLE time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.time_entries TO anon;
GRANT ALL ON TABLE public.time_entries TO authenticated;
GRANT ALL ON TABLE public.time_entries TO service_role;


--
-- Name: FUNCTION create_time_entry_from_schedule(p_schedule_id uuid); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.create_time_entry_from_schedule(p_schedule_id uuid) TO authenticated;


--
-- Name: FUNCTION dashboard_stats(p_tenant uuid, p_since date); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.dashboard_stats(p_tenant uuid, p_since date) TO authenticated;


--
-- Name: TABLE schedule_slots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schedule_slots TO anon;
GRANT ALL ON TABLE public.schedule_slots TO authenticated;
GRANT ALL ON TABLE public.schedule_slots TO service_role;


--
-- Name: FUNCTION find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) TO authenticated;


--
-- Name: FUNCTION get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) TO service_role;


--
-- Name: FUNCTION get_user_role(p_user_id uuid, p_tenant_id uuid); Type: ACL; Schema: app; Owner: postgres
--

REVOKE ALL ON FUNCTION app.get_user_role(p_user_id uuid, p_tenant_id uuid) FROM PUBLIC;


--
-- Name: FUNCTION next_work_order_number(p_tenant uuid); Type: ACL; Schema: app; Owner: postgres
--

GRANT ALL ON FUNCTION app.next_work_order_number(p_tenant uuid) TO authenticated;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.append_audit_event(p_tenant_id uuid, p_table_name text, p_record_id uuid, p_action text, p_user_id uuid, p_employee_id uuid, p_old_values jsonb, p_new_values jsonb, p_changed_fields text[], p_ip_address inet, p_user_agent text, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO service_role;


--
-- Name: FUNCTION cash_dist(money, money); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cash_dist(money, money) TO postgres;
GRANT ALL ON FUNCTION public.cash_dist(money, money) TO anon;
GRANT ALL ON FUNCTION public.cash_dist(money, money) TO authenticated;
GRANT ALL ON FUNCTION public.cash_dist(money, money) TO service_role;


--
-- Name: FUNCTION cleanup_expired_notifications(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_notifications() TO service_role;


--
-- Name: FUNCTION cosine_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) TO anon;
GRANT ALL ON FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) TO authenticated;
GRANT ALL ON FUNCTION public.create_budget_alert(p_project_id uuid, p_alert_type text, p_threshold_percentage numeric, p_current_percentage numeric) TO service_role;


--
-- Name: FUNCTION create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) TO anon;
GRANT ALL ON FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_integration(p_tenant_id uuid, p_provider text, p_status text, p_client_id text, p_client_secret_encrypted text, p_created_by uuid) TO service_role;


--
-- Name: FUNCTION create_invoice_from_project(p_project_id uuid, p_due_days integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_invoice_from_project(p_project_id uuid, p_due_days integer) TO anon;
GRANT ALL ON FUNCTION public.create_invoice_from_project(p_project_id uuid, p_due_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.create_invoice_from_project(p_project_id uuid, p_due_days integer) TO service_role;


--
-- Name: FUNCTION current_tenant_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.current_tenant_id() TO anon;
GRANT ALL ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT ALL ON FUNCTION public.current_tenant_id() TO service_role;


--
-- Name: FUNCTION daitch_mokotoff(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.daitch_mokotoff(text) TO postgres;
GRANT ALL ON FUNCTION public.daitch_mokotoff(text) TO anon;
GRANT ALL ON FUNCTION public.daitch_mokotoff(text) TO authenticated;
GRANT ALL ON FUNCTION public.daitch_mokotoff(text) TO service_role;


--
-- Name: FUNCTION date_dist(date, date); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.date_dist(date, date) TO postgres;
GRANT ALL ON FUNCTION public.date_dist(date, date) TO anon;
GRANT ALL ON FUNCTION public.date_dist(date, date) TO authenticated;
GRANT ALL ON FUNCTION public.date_dist(date, date) TO service_role;


--
-- Name: FUNCTION difference(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.difference(text, text) TO postgres;
GRANT ALL ON FUNCTION public.difference(text, text) TO anon;
GRANT ALL ON FUNCTION public.difference(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.difference(text, text) TO service_role;


--
-- Name: FUNCTION disconnect_integration(p_integration_id uuid, p_tenant_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) TO anon;
GRANT ALL ON FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.disconnect_integration(p_integration_id uuid, p_tenant_id uuid) TO service_role;


--
-- Name: FUNCTION dmetaphone(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dmetaphone(text) TO postgres;
GRANT ALL ON FUNCTION public.dmetaphone(text) TO anon;
GRANT ALL ON FUNCTION public.dmetaphone(text) TO authenticated;
GRANT ALL ON FUNCTION public.dmetaphone(text) TO service_role;


--
-- Name: FUNCTION dmetaphone_alt(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.dmetaphone_alt(text) TO postgres;
GRANT ALL ON FUNCTION public.dmetaphone_alt(text) TO anon;
GRANT ALL ON FUNCTION public.dmetaphone_alt(text) TO authenticated;
GRANT ALL ON FUNCTION public.dmetaphone_alt(text) TO service_role;


--
-- Name: FUNCTION expire_old_quotes(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.expire_old_quotes() TO anon;
GRANT ALL ON FUNCTION public.expire_old_quotes() TO authenticated;
GRANT ALL ON FUNCTION public.expire_old_quotes() TO service_role;


--
-- Name: FUNCTION find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) TO anon;
GRANT ALL ON FUNCTION public.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.find_schedule_conflicts(p_tenant_id uuid, p_employee_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_exclude_id uuid) TO service_role;


--
-- Name: FUNCTION float4_dist(real, real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.float4_dist(real, real) TO postgres;
GRANT ALL ON FUNCTION public.float4_dist(real, real) TO anon;
GRANT ALL ON FUNCTION public.float4_dist(real, real) TO authenticated;
GRANT ALL ON FUNCTION public.float4_dist(real, real) TO service_role;


--
-- Name: FUNCTION float8_dist(double precision, double precision); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.float8_dist(double precision, double precision) TO postgres;
GRANT ALL ON FUNCTION public.float8_dist(double precision, double precision) TO anon;
GRANT ALL ON FUNCTION public.float8_dist(double precision, double precision) TO authenticated;
GRANT ALL ON FUNCTION public.float8_dist(double precision, double precision) TO service_role;


--
-- Name: FUNCTION fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date) TO anon;
GRANT ALL ON FUNCTION public.fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date) TO authenticated;
GRANT ALL ON FUNCTION public.fuzzy_match_invoice_to_project(p_supplier_name text, p_invoice_date date) TO service_role;


--
-- Name: FUNCTION gbt_bit_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_bit_consistent(internal, bit, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_bit_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bit_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bit_same(public.gbtreekey_var, public.gbtreekey_var, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO service_role;


--
-- Name: FUNCTION gbt_bit_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bit_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bit_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bit_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bit_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_consistent(internal, boolean, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_same(public.gbtreekey2, public.gbtreekey2, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_same(public.gbtreekey2, public.gbtreekey2, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_same(public.gbtreekey2, public.gbtreekey2, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_same(public.gbtreekey2, public.gbtreekey2, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_same(public.gbtreekey2, public.gbtreekey2, internal) TO service_role;


--
-- Name: FUNCTION gbt_bool_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bool_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bool_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bool_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bool_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bpchar_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bpchar_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bpchar_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bpchar_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bpchar_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_bpchar_consistent(internal, character, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_consistent(internal, bytea, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_same(public.gbtreekey_var, public.gbtreekey_var, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO service_role;


--
-- Name: FUNCTION gbt_bytea_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_bytea_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_bytea_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_bytea_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_bytea_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_consistent(internal, money, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_distance(internal, money, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_cash_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_cash_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_cash_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_cash_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_cash_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_date_consistent(internal, date, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_distance(internal, date, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_date_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_same(public.gbtreekey8, public.gbtreekey8, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_same(public.gbtreekey8, public.gbtreekey8, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_same(public.gbtreekey8, public.gbtreekey8, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_same(public.gbtreekey8, public.gbtreekey8, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_same(public.gbtreekey8, public.gbtreekey8, internal) TO service_role;


--
-- Name: FUNCTION gbt_date_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_date_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_date_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_date_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_date_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_decompress(internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_consistent(internal, anyenum, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_same(public.gbtreekey8, public.gbtreekey8, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_same(public.gbtreekey8, public.gbtreekey8, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_same(public.gbtreekey8, public.gbtreekey8, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_same(public.gbtreekey8, public.gbtreekey8, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_same(public.gbtreekey8, public.gbtreekey8, internal) TO service_role;


--
-- Name: FUNCTION gbt_enum_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_enum_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_enum_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_enum_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_enum_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_consistent(internal, real, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_distance(internal, real, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_same(public.gbtreekey8, public.gbtreekey8, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_same(public.gbtreekey8, public.gbtreekey8, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_same(public.gbtreekey8, public.gbtreekey8, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_same(public.gbtreekey8, public.gbtreekey8, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_same(public.gbtreekey8, public.gbtreekey8, internal) TO service_role;


--
-- Name: FUNCTION gbt_float4_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float4_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float4_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float4_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float4_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_consistent(internal, double precision, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_distance(internal, double precision, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_float8_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_float8_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_float8_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_float8_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_float8_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_consistent(internal, inet, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_inet_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_inet_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_inet_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_inet_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_inet_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_consistent(internal, smallint, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_distance(internal, smallint, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_same(public.gbtreekey4, public.gbtreekey4, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_same(public.gbtreekey4, public.gbtreekey4, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_same(public.gbtreekey4, public.gbtreekey4, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_same(public.gbtreekey4, public.gbtreekey4, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_same(public.gbtreekey4, public.gbtreekey4, internal) TO service_role;


--
-- Name: FUNCTION gbt_int2_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int2_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int2_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int2_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int2_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_consistent(internal, integer, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_distance(internal, integer, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_same(public.gbtreekey8, public.gbtreekey8, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_same(public.gbtreekey8, public.gbtreekey8, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_same(public.gbtreekey8, public.gbtreekey8, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_same(public.gbtreekey8, public.gbtreekey8, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_same(public.gbtreekey8, public.gbtreekey8, internal) TO service_role;


--
-- Name: FUNCTION gbt_int4_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int4_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int4_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int4_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int4_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_consistent(internal, bigint, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_distance(internal, bigint, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_int8_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_int8_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_int8_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_int8_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_int8_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_consistent(internal, interval, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_decompress(internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_distance(internal, interval, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_distance(internal, interval, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_same(public.gbtreekey32, public.gbtreekey32, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_same(public.gbtreekey32, public.gbtreekey32, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_same(public.gbtreekey32, public.gbtreekey32, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_same(public.gbtreekey32, public.gbtreekey32, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_same(public.gbtreekey32, public.gbtreekey32, internal) TO service_role;


--
-- Name: FUNCTION gbt_intv_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_intv_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_intv_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_intv_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_intv_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_consistent(internal, macaddr8, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad8_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad8_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad8_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad8_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad8_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_consistent(internal, macaddr, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_consistent(internal, macaddr, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_macad_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_macad_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_macad_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_macad_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_macad_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_consistent(internal, numeric, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_consistent(internal, numeric, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_same(public.gbtreekey_var, public.gbtreekey_var, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO service_role;


--
-- Name: FUNCTION gbt_numeric_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_numeric_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_numeric_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_numeric_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_numeric_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_consistent(internal, oid, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_consistent(internal, oid, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_consistent(internal, oid, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_consistent(internal, oid, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_consistent(internal, oid, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_distance(internal, oid, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_distance(internal, oid, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_distance(internal, oid, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_distance(internal, oid, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_distance(internal, oid, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_same(public.gbtreekey8, public.gbtreekey8, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_same(public.gbtreekey8, public.gbtreekey8, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_same(public.gbtreekey8, public.gbtreekey8, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_same(public.gbtreekey8, public.gbtreekey8, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_same(public.gbtreekey8, public.gbtreekey8, internal) TO service_role;


--
-- Name: FUNCTION gbt_oid_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_oid_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_oid_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_oid_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_oid_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_text_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_text_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_text_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_text_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_text_same(public.gbtreekey_var, public.gbtreekey_var, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_same(public.gbtreekey_var, public.gbtreekey_var, internal) TO service_role;


--
-- Name: FUNCTION gbt_text_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_text_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_text_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_text_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_text_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_time_consistent(internal, time without time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_consistent(internal, time without time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_consistent(internal, time without time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_consistent(internal, time without time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_consistent(internal, time without time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_distance(internal, time without time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_distance(internal, time without time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_time_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_time_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_time_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_time_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_time_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_time_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_timetz_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_timetz_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_timetz_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_timetz_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_timetz_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_timetz_consistent(internal, time with time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_consistent(internal, timestamp without time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_distance(internal, timestamp without time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_same(public.gbtreekey16, public.gbtreekey16, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_same(public.gbtreekey16, public.gbtreekey16, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_same(public.gbtreekey16, public.gbtreekey16, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_same(public.gbtreekey16, public.gbtreekey16, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_same(public.gbtreekey16, public.gbtreekey16, internal) TO service_role;


--
-- Name: FUNCTION gbt_ts_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_ts_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_ts_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_ts_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_ts_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_tstz_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_tstz_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_tstz_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_tstz_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_tstz_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_tstz_consistent(internal, timestamp with time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_tstz_distance(internal, timestamp with time zone, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_compress(internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_consistent(internal, uuid, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_consistent(internal, uuid, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_fetch(internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_same(public.gbtreekey32, public.gbtreekey32, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_same(public.gbtreekey32, public.gbtreekey32, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_same(public.gbtreekey32, public.gbtreekey32, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_same(public.gbtreekey32, public.gbtreekey32, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_same(public.gbtreekey32, public.gbtreekey32, internal) TO service_role;


--
-- Name: FUNCTION gbt_uuid_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_uuid_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_uuid_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_uuid_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_uuid_union(internal, internal) TO service_role;


--
-- Name: FUNCTION gbt_var_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_var_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_var_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_var_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_var_decompress(internal) TO service_role;


--
-- Name: FUNCTION gbt_var_fetch(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gbt_var_fetch(internal) TO postgres;
GRANT ALL ON FUNCTION public.gbt_var_fetch(internal) TO anon;
GRANT ALL ON FUNCTION public.gbt_var_fetch(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gbt_var_fetch(internal) TO service_role;


--
-- Name: FUNCTION generate_quote_number(p_tenant uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_quote_number(p_tenant uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_quote_number(p_tenant uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_quote_number(p_tenant uuid) TO service_role;


--
-- Name: FUNCTION get_budget_usage(p_project_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_budget_usage(p_project_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_budget_usage(p_project_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_budget_usage(p_project_id uuid) TO service_role;


--
-- Name: FUNCTION get_current_tenant(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_current_tenant() TO anon;
GRANT ALL ON FUNCTION public.get_current_tenant() TO authenticated;
GRANT ALL ON FUNCTION public.get_current_tenant() TO service_role;


--
-- Name: FUNCTION get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) TO anon;
GRANT ALL ON FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_existing_columns(p_table_schema text, p_table_name text, p_candidates text[]) TO service_role;


--
-- Name: FUNCTION get_feature_flag(p_tenant_id uuid, p_flag_name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) TO anon;
GRANT ALL ON FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) TO authenticated;
GRANT ALL ON FUNCTION public.get_feature_flag(p_tenant_id uuid, p_flag_name text) TO service_role;


--
-- Name: FUNCTION get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_supplier_invoice(p_invoice_id uuid, p_tenant_id uuid) TO service_role;


--
-- Name: FUNCTION get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date) TO anon;
GRANT ALL ON FUNCTION public.get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_tenant_dashboard_analytics(p_tenant_id uuid, p_start_date date, p_end_date date) TO service_role;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO service_role;


--
-- Name: FUNCTION halfvec_accum(double precision[], public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_add(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_avg(double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_cmp(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_concat(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_eq(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ge(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_gt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_l2_squared_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_le(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_lt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_mul(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ne(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_negative_inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_spherical_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_sub(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION hamming_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION hnsw_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_sparsevec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO service_role;


--
-- Name: FUNCTION hnswhandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnswhandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO anon;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO service_role;


--
-- Name: FUNCTION increment_ai_cache_hits(p_key text, p_tenant_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_ai_cache_hits(p_key text, p_tenant_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_ai_cache_hits(p_key text, p_tenant_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_ai_cache_hits(p_key text, p_tenant_id uuid) TO service_role;


--
-- Name: FUNCTION increment_public_link_views(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_public_link_views() TO anon;
GRANT ALL ON FUNCTION public.increment_public_link_views() TO authenticated;
GRANT ALL ON FUNCTION public.increment_public_link_views() TO service_role;


--
-- Name: FUNCTION inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid) TO anon;
GRANT ALL ON FUNCTION public.insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.insert_supplier_invoice(tenant_id uuid, supplier_id uuid, project_id uuid, file_path text, file_size integer, mime_type text, original_filename text, invoice_number text, invoice_date date, status text, ocr_confidence numeric, ocr_data jsonb, extracted_data jsonb, created_by uuid) TO service_role;


--
-- Name: FUNCTION insert_supplier_invoice_v2(p_payload jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) TO anon;
GRANT ALL ON FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.insert_supplier_invoice_v2(p_payload jsonb) TO service_role;


--
-- Name: FUNCTION int2_dist(smallint, smallint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.int2_dist(smallint, smallint) TO postgres;
GRANT ALL ON FUNCTION public.int2_dist(smallint, smallint) TO anon;
GRANT ALL ON FUNCTION public.int2_dist(smallint, smallint) TO authenticated;
GRANT ALL ON FUNCTION public.int2_dist(smallint, smallint) TO service_role;


--
-- Name: FUNCTION int4_dist(integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.int4_dist(integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.int4_dist(integer, integer) TO anon;
GRANT ALL ON FUNCTION public.int4_dist(integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.int4_dist(integer, integer) TO service_role;


--
-- Name: FUNCTION int8_dist(bigint, bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.int8_dist(bigint, bigint) TO postgres;
GRANT ALL ON FUNCTION public.int8_dist(bigint, bigint) TO anon;
GRANT ALL ON FUNCTION public.int8_dist(bigint, bigint) TO authenticated;
GRANT ALL ON FUNCTION public.int8_dist(bigint, bigint) TO service_role;


--
-- Name: FUNCTION interval_dist(interval, interval); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.interval_dist(interval, interval) TO postgres;
GRANT ALL ON FUNCTION public.interval_dist(interval, interval) TO anon;
GRANT ALL ON FUNCTION public.interval_dist(interval, interval) TO authenticated;
GRANT ALL ON FUNCTION public.interval_dist(interval, interval) TO service_role;


--
-- Name: FUNCTION ivfflat_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflat_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflathandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO service_role;


--
-- Name: FUNCTION jaccard_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION jwt_tenant_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.jwt_tenant_id() TO anon;
GRANT ALL ON FUNCTION public.jwt_tenant_id() TO authenticated;
GRANT ALL ON FUNCTION public.jwt_tenant_id() TO service_role;


--
-- Name: FUNCTION l1_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_norm(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_norm(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO service_role;


--
-- Name: FUNCTION levenshtein(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.levenshtein(text, text) TO postgres;
GRANT ALL ON FUNCTION public.levenshtein(text, text) TO anon;
GRANT ALL ON FUNCTION public.levenshtein(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.levenshtein(text, text) TO service_role;


--
-- Name: FUNCTION levenshtein(text, text, integer, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.levenshtein(text, text, integer, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.levenshtein(text, text, integer, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.levenshtein(text, text, integer, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.levenshtein(text, text, integer, integer, integer) TO service_role;


--
-- Name: FUNCTION levenshtein_less_equal(text, text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer) TO postgres;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer) TO anon;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer) TO service_role;


--
-- Name: FUNCTION levenshtein_less_equal(text, text, integer, integer, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer, integer, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer, integer, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer, integer, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.levenshtein_less_equal(text, text, integer, integer, integer, integer) TO service_role;


--
-- Name: FUNCTION list_supplier_invoices(p_tenant_id uuid, p_limit integer, p_offset integer, p_status text, p_project_id uuid, p_supplier_id uuid, p_search text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.list_supplier_invoices(p_tenant_id uuid, p_limit integer, p_offset integer, p_status text, p_project_id uuid, p_supplier_id uuid, p_search text) TO anon;
GRANT ALL ON FUNCTION public.list_supplier_invoices(p_tenant_id uuid, p_limit integer, p_offset integer, p_status text, p_project_id uuid, p_supplier_id uuid, p_search text) TO authenticated;
GRANT ALL ON FUNCTION public.list_supplier_invoices(p_tenant_id uuid, p_limit integer, p_offset integer, p_status text, p_project_id uuid, p_supplier_id uuid, p_search text) TO service_role;


--
-- Name: FUNCTION lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO anon;
GRANT ALL ON FUNCTION public.lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.lock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO service_role;


--
-- Name: FUNCTION log_rot_status_change(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.log_rot_status_change() FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_rot_status_change() TO anon;
GRANT ALL ON FUNCTION public.log_rot_status_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_rot_status_change() TO service_role;


--
-- Name: FUNCTION metaphone(text, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.metaphone(text, integer) TO postgres;
GRANT ALL ON FUNCTION public.metaphone(text, integer) TO anon;
GRANT ALL ON FUNCTION public.metaphone(text, integer) TO authenticated;
GRANT ALL ON FUNCTION public.metaphone(text, integer) TO service_role;


--
-- Name: FUNCTION oid_dist(oid, oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.oid_dist(oid, oid) TO postgres;
GRANT ALL ON FUNCTION public.oid_dist(oid, oid) TO anon;
GRANT ALL ON FUNCTION public.oid_dist(oid, oid) TO authenticated;
GRANT ALL ON FUNCTION public.oid_dist(oid, oid) TO service_role;


--
-- Name: FUNCTION on_quote_items_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_quote_items_change() TO anon;
GRANT ALL ON FUNCTION public.on_quote_items_change() TO authenticated;
GRANT ALL ON FUNCTION public.on_quote_items_change() TO service_role;


--
-- Name: FUNCTION on_supplier_invoice_item_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_supplier_invoice_item_change() TO anon;
GRANT ALL ON FUNCTION public.on_supplier_invoice_item_change() TO authenticated;
GRANT ALL ON FUNCTION public.on_supplier_invoice_item_change() TO service_role;


--
-- Name: FUNCTION on_supplier_invoice_payment_change(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_supplier_invoice_payment_change() TO anon;
GRANT ALL ON FUNCTION public.on_supplier_invoice_payment_change() TO authenticated;
GRANT ALL ON FUNCTION public.on_supplier_invoice_payment_change() TO service_role;


--
-- Name: FUNCTION prevent_approval_regression(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prevent_approval_regression() TO anon;
GRANT ALL ON FUNCTION public.prevent_approval_regression() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_approval_regression() TO service_role;


--
-- Name: FUNCTION recalc_quote_totals(p_quote_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.recalc_quote_totals(p_quote_id uuid) TO anon;
GRANT ALL ON FUNCTION public.recalc_quote_totals(p_quote_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.recalc_quote_totals(p_quote_id uuid) TO service_role;


--
-- Name: FUNCTION recalc_supplier_invoice_totals(p_invoice_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.recalc_supplier_invoice_totals(p_invoice_id uuid) TO anon;
GRANT ALL ON FUNCTION public.recalc_supplier_invoice_totals(p_invoice_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.recalc_supplier_invoice_totals(p_invoice_id uuid) TO service_role;


--
-- Name: FUNCTION reload_postgrest_schema(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reload_postgrest_schema() TO anon;
GRANT ALL ON FUNCTION public.reload_postgrest_schema() TO authenticated;
GRANT ALL ON FUNCTION public.reload_postgrest_schema() TO service_role;


--
-- Name: FUNCTION set_invoice_status(p_invoice_id uuid, p_status text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_invoice_status(p_invoice_id uuid, p_status text) TO anon;
GRANT ALL ON FUNCTION public.set_invoice_status(p_invoice_id uuid, p_status text) TO authenticated;
GRANT ALL ON FUNCTION public.set_invoice_status(p_invoice_id uuid, p_status text) TO service_role;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.set_limit(real) TO postgres;
GRANT ALL ON FUNCTION public.set_limit(real) TO anon;
GRANT ALL ON FUNCTION public.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION public.set_limit(real) TO service_role;


--
-- Name: FUNCTION set_tenant_from_jwt(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_tenant_from_jwt() TO anon;
GRANT ALL ON FUNCTION public.set_tenant_from_jwt() TO authenticated;
GRANT ALL ON FUNCTION public.set_tenant_from_jwt() TO service_role;


--
-- Name: FUNCTION set_tenant_id_from_jwt(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_tenant_id_from_jwt() TO anon;
GRANT ALL ON FUNCTION public.set_tenant_id_from_jwt() TO authenticated;
GRANT ALL ON FUNCTION public.set_tenant_id_from_jwt() TO service_role;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION set_user_id_from_jwt(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_user_id_from_jwt() TO anon;
GRANT ALL ON FUNCTION public.set_user_id_from_jwt() TO authenticated;
GRANT ALL ON FUNCTION public.set_user_id_from_jwt() TO service_role;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_limit() TO postgres;
GRANT ALL ON FUNCTION public.show_limit() TO anon;
GRANT ALL ON FUNCTION public.show_limit() TO authenticated;
GRANT ALL ON FUNCTION public.show_limit() TO service_role;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;
GRANT ALL ON FUNCTION public.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION public.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION public.show_trgm(text) TO service_role;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity(text, text) TO service_role;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO service_role;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION soundex(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.soundex(text) TO postgres;
GRANT ALL ON FUNCTION public.soundex(text) TO anon;
GRANT ALL ON FUNCTION public.soundex(text) TO authenticated;
GRANT ALL ON FUNCTION public.soundex(text) TO service_role;


--
-- Name: FUNCTION sparsevec_cmp(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_cmp(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_eq(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_eq(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_ge(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_ge(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_gt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_gt(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_l2_squared_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_le(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_le(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_lt(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_lt(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_ne(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_ne(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION sparsevec_negative_inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_negative_inner_product(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION subvector(public.halfvec, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.subvector(public.halfvec, integer, integer) TO service_role;


--
-- Name: FUNCTION subvector(public.vector, integer, integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO postgres;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO anon;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO authenticated;
GRANT ALL ON FUNCTION public.subvector(public.vector, integer, integer) TO service_role;


--
-- Name: FUNCTION sync_employee_name(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_employee_name() TO anon;
GRANT ALL ON FUNCTION public.sync_employee_name() TO authenticated;
GRANT ALL ON FUNCTION public.sync_employee_name() TO service_role;


--
-- Name: FUNCTION sync_time_entries_hours(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_time_entries_hours() TO anon;
GRANT ALL ON FUNCTION public.sync_time_entries_hours() TO authenticated;
GRANT ALL ON FUNCTION public.sync_time_entries_hours() TO service_role;


--
-- Name: FUNCTION text_soundex(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.text_soundex(text) TO postgres;
GRANT ALL ON FUNCTION public.text_soundex(text) TO anon;
GRANT ALL ON FUNCTION public.text_soundex(text) TO authenticated;
GRANT ALL ON FUNCTION public.text_soundex(text) TO service_role;


--
-- Name: FUNCTION time_dist(time without time zone, time without time zone); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.time_dist(time without time zone, time without time zone) TO postgres;
GRANT ALL ON FUNCTION public.time_dist(time without time zone, time without time zone) TO anon;
GRANT ALL ON FUNCTION public.time_dist(time without time zone, time without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.time_dist(time without time zone, time without time zone) TO service_role;


--
-- Name: FUNCTION trigger_workflow_orchestrator(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_workflow_orchestrator() TO anon;
GRANT ALL ON FUNCTION public.trigger_workflow_orchestrator() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_workflow_orchestrator() TO service_role;


--
-- Name: FUNCTION ts_dist(timestamp without time zone, timestamp without time zone); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone) TO postgres;
GRANT ALL ON FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone) TO anon;
GRANT ALL ON FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.ts_dist(timestamp without time zone, timestamp without time zone) TO service_role;


--
-- Name: FUNCTION tstz_dist(timestamp with time zone, timestamp with time zone); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone) TO postgres;
GRANT ALL ON FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.tstz_dist(timestamp with time zone, timestamp with time zone) TO service_role;


--
-- Name: FUNCTION unaccent(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(text) TO service_role;


--
-- Name: FUNCTION unaccent(regdictionary, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO service_role;


--
-- Name: FUNCTION unaccent_init(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_init(internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO service_role;


--
-- Name: FUNCTION unaccent_lexize(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO anon;
GRANT ALL ON FUNCTION public.unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.unlock_payroll_period(p_tenant uuid, p_period uuid, p_user uuid) TO service_role;


--
-- Name: FUNCTION update_ata_items_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_ata_items_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_ata_items_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_ata_items_updated_at() TO service_role;


--
-- Name: FUNCTION update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text) TO anon;
GRANT ALL ON FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text) TO authenticated;
GRANT ALL ON FUNCTION public.update_ata_status_timeline(p_rot_application_id uuid, p_status text, p_user_id uuid, p_comment text) TO service_role;


--
-- Name: FUNCTION update_client_search_text(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_client_search_text() TO anon;
GRANT ALL ON FUNCTION public.update_client_search_text() TO authenticated;
GRANT ALL ON FUNCTION public.update_client_search_text() TO service_role;


--
-- Name: FUNCTION update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text) TO anon;
GRANT ALL ON FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text) TO authenticated;
GRANT ALL ON FUNCTION public.update_integration_status(p_integration_id uuid, p_status text, p_access_token_encrypted text, p_refresh_token_encrypted text, p_expires_at timestamp with time zone, p_scope text, p_last_error text) TO service_role;


--
-- Name: FUNCTION update_project_budgets_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_project_budgets_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_project_budgets_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_project_budgets_updated_at() TO service_role;


--
-- Name: FUNCTION update_project_search_text(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_project_search_text() TO anon;
GRANT ALL ON FUNCTION public.update_project_search_text() TO authenticated;
GRANT ALL ON FUNCTION public.update_project_search_text() TO service_role;


--
-- Name: FUNCTION update_public_links_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_public_links_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_public_links_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_public_links_updated_at() TO service_role;


--
-- Name: FUNCTION update_rot_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_rot_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_rot_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_rot_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_rot_updated_at() TO service_role;


--
-- Name: FUNCTION update_signatures_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_signatures_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_signatures_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_signatures_updated_at() TO service_role;


--
-- Name: FUNCTION update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb) TO anon;
GRANT ALL ON FUNCTION public.update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.update_supplier_invoice(invoice_id uuid, status text, extracted_data jsonb) TO service_role;


--
-- Name: FUNCTION update_tenant_feature_flags_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_tenant_feature_flags_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_tenant_feature_flags_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_tenant_feature_flags_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION validate_timesheets_for_payroll(p_tenant uuid, p_period uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_timesheets_for_payroll(p_tenant uuid, p_period uuid) TO anon;
GRANT ALL ON FUNCTION public.validate_timesheets_for_payroll(p_tenant uuid, p_period uuid) TO authenticated;
GRANT ALL ON FUNCTION public.validate_timesheets_for_payroll(p_tenant uuid, p_period uuid) TO service_role;


--
-- Name: FUNCTION vector_accum(double precision[], public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_accum(double precision[], public.vector) TO service_role;


--
-- Name: FUNCTION vector_add(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_add(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_avg(double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO anon;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_avg(double precision[]) TO service_role;


--
-- Name: FUNCTION vector_cmp(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_cmp(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO anon;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_combine(double precision[], double precision[]) TO service_role;


--
-- Name: FUNCTION vector_concat(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_concat(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_dims(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.vector_dims(public.halfvec) TO service_role;


--
-- Name: FUNCTION vector_dims(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_dims(public.vector) TO service_role;


--
-- Name: FUNCTION vector_eq(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_eq(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_ge(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_ge(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_gt(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_gt(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_l2_squared_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_l2_squared_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_le(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_le(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_lt(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_lt(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_mul(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_mul(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_ne(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_ne(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_negative_inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_negative_inner_product(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_norm(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_norm(public.vector) TO service_role;


--
-- Name: FUNCTION vector_spherical_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_spherical_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION vector_sub(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_sub(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION avg(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.avg(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.avg(public.halfvec) TO service_role;


--
-- Name: FUNCTION avg(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.avg(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.avg(public.vector) TO anon;
GRANT ALL ON FUNCTION public.avg(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.avg(public.vector) TO service_role;


--
-- Name: FUNCTION sum(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sum(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.sum(public.halfvec) TO service_role;


--
-- Name: FUNCTION sum(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.sum(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.sum(public.vector) TO anon;
GRANT ALL ON FUNCTION public.sum(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.sum(public.vector) TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: app; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE app.user_roles TO authenticated;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE absences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.absences TO anon;
GRANT ALL ON TABLE public.absences TO authenticated;
GRANT ALL ON TABLE public.absences TO service_role;


--
-- Name: TABLE accounting_integrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accounting_integrations TO anon;
GRANT ALL ON TABLE public.accounting_integrations TO authenticated;
GRANT ALL ON TABLE public.accounting_integrations TO service_role;


--
-- Name: TABLE aeta_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.aeta_requests TO anon;
GRANT ALL ON TABLE public.aeta_requests TO authenticated;
GRANT ALL ON TABLE public.aeta_requests TO service_role;


--
-- Name: TABLE agent_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.agent_audit TO anon;
GRANT ALL ON TABLE public.agent_audit TO authenticated;
GRANT ALL ON TABLE public.agent_audit TO service_role;


--
-- Name: SEQUENCE agent_audit_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.agent_audit_id_seq TO anon;
GRANT ALL ON SEQUENCE public.agent_audit_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.agent_audit_id_seq TO service_role;


--
-- Name: TABLE ai_cache; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_cache TO anon;
GRANT ALL ON TABLE public.ai_cache TO authenticated;
GRANT ALL ON TABLE public.ai_cache TO service_role;


--
-- Name: TABLE api_cache; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_cache TO anon;
GRANT ALL ON TABLE public.api_cache TO authenticated;
GRANT ALL ON TABLE public.api_cache TO service_role;


--
-- Name: TABLE ata_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ata_items TO anon;
GRANT ALL ON TABLE public.ata_items TO authenticated;
GRANT ALL ON TABLE public.ata_items TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE budget_alerts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budget_alerts TO anon;
GRANT ALL ON TABLE public.budget_alerts TO authenticated;
GRANT ALL ON TABLE public.budget_alerts TO service_role;


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--
-- Name: TABLE employees; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.employees TO anon;
GRANT ALL ON TABLE public.employees TO authenticated;
GRANT ALL ON TABLE public.employees TO service_role;


--
-- Name: TABLE factoring_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.factoring_requests TO anon;
GRANT ALL ON TABLE public.factoring_requests TO authenticated;
GRANT ALL ON TABLE public.factoring_requests TO service_role;


--
-- Name: TABLE gps_tracking_points; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gps_tracking_points TO anon;
GRANT ALL ON TABLE public.gps_tracking_points TO authenticated;
GRANT ALL ON TABLE public.gps_tracking_points TO service_role;


--
-- Name: TABLE integration_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integration_jobs TO anon;
GRANT ALL ON TABLE public.integration_jobs TO authenticated;
GRANT ALL ON TABLE public.integration_jobs TO service_role;


--
-- Name: TABLE integration_mappings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integration_mappings TO anon;
GRANT ALL ON TABLE public.integration_mappings TO authenticated;
GRANT ALL ON TABLE public.integration_mappings TO service_role;


--
-- Name: TABLE integrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integrations TO anon;
GRANT ALL ON TABLE public.integrations TO authenticated;
GRANT ALL ON TABLE public.integrations TO service_role;


--
-- Name: TABLE invoice_lines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoice_lines TO anon;
GRANT ALL ON TABLE public.invoice_lines TO authenticated;
GRANT ALL ON TABLE public.invoice_lines TO service_role;


--
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoices TO anon;
GRANT ALL ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoices TO service_role;


--
-- Name: TABLE job_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.job_queue TO anon;
GRANT ALL ON TABLE public.job_queue TO authenticated;
GRANT ALL ON TABLE public.job_queue TO service_role;


--
-- Name: SEQUENCE job_queue_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.job_queue_id_seq TO anon;
GRANT ALL ON SEQUENCE public.job_queue_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.job_queue_id_seq TO service_role;


--
-- Name: TABLE markup_rules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.markup_rules TO anon;
GRANT ALL ON TABLE public.markup_rules TO authenticated;
GRANT ALL ON TABLE public.markup_rules TO service_role;


--
-- Name: TABLE materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.materials TO anon;
GRANT ALL ON TABLE public.materials TO authenticated;
GRANT ALL ON TABLE public.materials TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE payroll_exports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_exports TO anon;
GRANT ALL ON TABLE public.payroll_exports TO authenticated;
GRANT ALL ON TABLE public.payroll_exports TO service_role;


--
-- Name: TABLE payroll_periods; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_periods TO anon;
GRANT ALL ON TABLE public.payroll_periods TO authenticated;
GRANT ALL ON TABLE public.payroll_periods TO service_role;


--
-- Name: TABLE payroll_sync_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payroll_sync_logs TO anon;
GRANT ALL ON TABLE public.payroll_sync_logs TO authenticated;
GRANT ALL ON TABLE public.payroll_sync_logs TO service_role;


--
-- Name: TABLE pricing_rules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pricing_rules TO anon;
GRANT ALL ON TABLE public.pricing_rules TO authenticated;
GRANT ALL ON TABLE public.pricing_rules TO service_role;


--
-- Name: TABLE project_budgets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_budgets TO anon;
GRANT ALL ON TABLE public.project_budgets TO authenticated;
GRANT ALL ON TABLE public.project_budgets TO service_role;


--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.projects TO anon;
GRANT ALL ON TABLE public.projects TO authenticated;
GRANT ALL ON TABLE public.projects TO service_role;


--
-- Name: TABLE public_link_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.public_link_events TO anon;
GRANT ALL ON TABLE public.public_link_events TO authenticated;
GRANT ALL ON TABLE public.public_link_events TO service_role;


--
-- Name: TABLE public_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.public_links TO anon;
GRANT ALL ON TABLE public.public_links TO authenticated;
GRANT ALL ON TABLE public.public_links TO service_role;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.push_subscriptions TO anon;
GRANT ALL ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;


--
-- Name: TABLE quote_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quote_approvals TO anon;
GRANT ALL ON TABLE public.quote_approvals TO authenticated;
GRANT ALL ON TABLE public.quote_approvals TO service_role;


--
-- Name: TABLE quote_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quote_history TO anon;
GRANT ALL ON TABLE public.quote_history TO authenticated;
GRANT ALL ON TABLE public.quote_history TO service_role;


--
-- Name: TABLE quote_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quote_items TO anon;
GRANT ALL ON TABLE public.quote_items TO authenticated;
GRANT ALL ON TABLE public.quote_items TO service_role;


--
-- Name: TABLE quote_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quote_templates TO anon;
GRANT ALL ON TABLE public.quote_templates TO authenticated;
GRANT ALL ON TABLE public.quote_templates TO service_role;


--
-- Name: TABLE quotes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.quotes TO anon;
GRANT ALL ON TABLE public.quotes TO authenticated;
GRANT ALL ON TABLE public.quotes TO service_role;


--
-- Name: TABLE rate_limits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rate_limits TO anon;
GRANT ALL ON TABLE public.rate_limits TO authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;


--
-- Name: TABLE release_labels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.release_labels TO anon;
GRANT ALL ON TABLE public.release_labels TO authenticated;
GRANT ALL ON TABLE public.release_labels TO service_role;


--
-- Name: TABLE research_chunks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.research_chunks TO anon;
GRANT ALL ON TABLE public.research_chunks TO authenticated;
GRANT ALL ON TABLE public.research_chunks TO service_role;


--
-- Name: SEQUENCE research_chunks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.research_chunks_id_seq TO anon;
GRANT ALL ON SEQUENCE public.research_chunks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.research_chunks_id_seq TO service_role;


--
-- Name: TABLE resource_locks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.resource_locks TO anon;
GRANT ALL ON TABLE public.resource_locks TO authenticated;
GRANT ALL ON TABLE public.resource_locks TO service_role;


--
-- Name: TABLE rot_api_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rot_api_logs TO anon;
GRANT ALL ON TABLE public.rot_api_logs TO authenticated;
GRANT ALL ON TABLE public.rot_api_logs TO service_role;


--
-- Name: TABLE rot_applications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rot_applications TO anon;
GRANT ALL ON TABLE public.rot_applications TO authenticated;
GRANT ALL ON TABLE public.rot_applications TO service_role;


--
-- Name: TABLE rot_status_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rot_status_history TO anon;
GRANT ALL ON TABLE public.rot_status_history TO authenticated;
GRANT ALL ON TABLE public.rot_status_history TO service_role;


--
-- Name: TABLE rot_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rot_submissions TO anon;
GRANT ALL ON TABLE public.rot_submissions TO authenticated;
GRANT ALL ON TABLE public.rot_submissions TO service_role;


--
-- Name: TABLE rot_submissions_secure; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rot_submissions_secure TO anon;
GRANT ALL ON TABLE public.rot_submissions_secure TO authenticated;
GRANT ALL ON TABLE public.rot_submissions_secure TO service_role;


--
-- Name: TABLE signature_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.signature_events TO anon;
GRANT ALL ON TABLE public.signature_events TO authenticated;
GRANT ALL ON TABLE public.signature_events TO service_role;


--
-- Name: TABLE signatures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.signatures TO anon;
GRANT ALL ON TABLE public.signatures TO authenticated;
GRANT ALL ON TABLE public.signatures TO service_role;


--
-- Name: TABLE supplier_invoice_allocations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoice_allocations TO anon;
GRANT ALL ON TABLE public.supplier_invoice_allocations TO authenticated;
GRANT ALL ON TABLE public.supplier_invoice_allocations TO service_role;


--
-- Name: TABLE supplier_invoice_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoice_approvals TO anon;
GRANT ALL ON TABLE public.supplier_invoice_approvals TO authenticated;
GRANT ALL ON TABLE public.supplier_invoice_approvals TO service_role;


--
-- Name: TABLE supplier_invoice_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoice_history TO anon;
GRANT ALL ON TABLE public.supplier_invoice_history TO authenticated;
GRANT ALL ON TABLE public.supplier_invoice_history TO service_role;


--
-- Name: TABLE supplier_invoice_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoice_items TO anon;
GRANT ALL ON TABLE public.supplier_invoice_items TO authenticated;
GRANT ALL ON TABLE public.supplier_invoice_items TO service_role;


--
-- Name: TABLE supplier_invoice_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoice_payments TO anon;
GRANT ALL ON TABLE public.supplier_invoice_payments TO authenticated;
GRANT ALL ON TABLE public.supplier_invoice_payments TO service_role;


--
-- Name: TABLE supplier_invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_invoices TO anon;
GRANT ALL ON TABLE public.supplier_invoices TO authenticated;
GRANT ALL ON TABLE public.supplier_invoices TO service_role;


--
-- Name: TABLE suppliers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.suppliers TO anon;
GRANT ALL ON TABLE public.suppliers TO authenticated;
GRANT ALL ON TABLE public.suppliers TO service_role;


--
-- Name: TABLE sync_job_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_job_queue TO anon;
GRANT ALL ON TABLE public.sync_job_queue TO authenticated;
GRANT ALL ON TABLE public.sync_job_queue TO service_role;


--
-- Name: TABLE sync_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_jobs TO anon;
GRANT ALL ON TABLE public.sync_jobs TO authenticated;
GRANT ALL ON TABLE public.sync_jobs TO service_role;


--
-- Name: TABLE sync_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_logs TO anon;
GRANT ALL ON TABLE public.sync_logs TO authenticated;
GRANT ALL ON TABLE public.sync_logs TO service_role;


--
-- Name: TABLE sync_metrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_metrics TO anon;
GRANT ALL ON TABLE public.sync_metrics TO authenticated;
GRANT ALL ON TABLE public.sync_metrics TO service_role;


--
-- Name: TABLE sync_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_queue TO anon;
GRANT ALL ON TABLE public.sync_queue TO authenticated;
GRANT ALL ON TABLE public.sync_queue TO service_role;


--
-- Name: TABLE tenant_feature_flags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenant_feature_flags TO anon;
GRANT ALL ON TABLE public.tenant_feature_flags TO authenticated;
GRANT ALL ON TABLE public.tenant_feature_flags TO service_role;


--
-- Name: TABLE tenants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenants TO anon;
GRANT ALL ON TABLE public.tenants TO authenticated;
GRANT ALL ON TABLE public.tenants TO service_role;


--
-- Name: TABLE time_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.time_reports TO anon;
GRANT ALL ON TABLE public.time_reports TO authenticated;
GRANT ALL ON TABLE public.time_reports TO service_role;


--
-- Name: TABLE user_tenants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_tenants TO anon;
GRANT ALL ON TABLE public.user_tenants TO authenticated;
GRANT ALL ON TABLE public.user_tenants TO service_role;


--
-- Name: TABLE v_absences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_absences TO anon;
GRANT ALL ON TABLE public.v_absences TO authenticated;
GRANT ALL ON TABLE public.v_absences TO service_role;


--
-- Name: TABLE v_project_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_project_summary TO anon;
GRANT ALL ON TABLE public.v_project_summary TO authenticated;
GRANT ALL ON TABLE public.v_project_summary TO service_role;


--
-- Name: TABLE v_schedule_slots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_schedule_slots TO anon;
GRANT ALL ON TABLE public.v_schedule_slots TO authenticated;
GRANT ALL ON TABLE public.v_schedule_slots TO service_role;


--
-- Name: TABLE v_unbilled_time_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_unbilled_time_entries TO anon;
GRANT ALL ON TABLE public.v_unbilled_time_entries TO authenticated;
GRANT ALL ON TABLE public.v_unbilled_time_entries TO service_role;


--
-- Name: TABLE work_order_photos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.work_order_photos TO anon;
GRANT ALL ON TABLE public.work_order_photos TO authenticated;
GRANT ALL ON TABLE public.work_order_photos TO service_role;


--
-- Name: TABLE work_order_status_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.work_order_status_history TO anon;
GRANT ALL ON TABLE public.work_order_status_history TO authenticated;
GRANT ALL ON TABLE public.work_order_status_history TO service_role;


--
-- Name: TABLE work_orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.work_orders TO anon;
GRANT ALL ON TABLE public.work_orders TO authenticated;
GRANT ALL ON TABLE public.work_orders TO service_role;


--
-- Name: TABLE work_sites; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.work_sites TO anon;
GRANT ALL ON TABLE public.work_sites TO authenticated;
GRANT ALL ON TABLE public.work_sites TO service_role;


--
-- Name: TABLE workflow_executions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workflow_executions TO anon;
GRANT ALL ON TABLE public.workflow_executions TO authenticated;
GRANT ALL ON TABLE public.workflow_executions TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict Qr2mxQjb3aVVTQNSznUPE384Yac1fEtmRIDgPKu7yuitqZCjGCwDe8i9qmkJeOV

