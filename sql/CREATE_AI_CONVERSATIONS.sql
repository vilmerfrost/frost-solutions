-- AI Conversations & Memory System
-- Stores conversation history, summaries, and feedback

-- Ensure app schema exists
CREATE SCHEMA IF NOT EXISTS app;

-- Conversations table
CREATE TABLE IF NOT EXISTS app.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  summary TEXT, -- Summary of conversation (updated every 8-12 messages)
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS app.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES app.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT, -- Detected intent
  tools_used JSONB, -- Array of tool calls made
  metadata JSONB, -- Additional metadata (sources, confidence, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation summaries (for long-term memory)
CREATE TABLE IF NOT EXISTS app.ai_conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES app.ai_conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  message_range_start INT NOT NULL, -- Start message index
  message_range_end INT NOT NULL, -- End message index
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS app.ai_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES app.ai_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES app.ai_messages(id) ON DELETE SET NULL,
  rating TEXT CHECK (rating IN ('positive', 'negative')),
  reason TEXT, -- Why positive/negative
  feedback_text TEXT, -- Additional feedback
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intent tracking (for anti-loop detection)
CREATE TABLE IF NOT EXISTS app.ai_intent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  intent TEXT NOT NULL,
  query_hash TEXT, -- SHA256 hash of query (for duplicate detection)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON app.ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON app.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message ON app.ai_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON app.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON app.ai_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_tenant ON app.ai_chat_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation ON app.ai_chat_feedback(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_intent_tenant_user ON app.ai_intent_history(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_intent_created ON app.ai_intent_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_intent_hash ON app.ai_intent_history(query_hash);

-- RLS Policies
ALTER TABLE app.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ai_conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ai_chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ai_intent_history ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY ai_conversations_select ON app.ai_conversations
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY ai_conversations_insert ON app.ai_conversations
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY ai_conversations_update ON app.ai_conversations
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Policies for messages (users can only see messages in their conversations)
CREATE POLICY ai_messages_select ON app.ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM app.ai_conversations 
      WHERE tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY ai_messages_insert ON app.ai_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM app.ai_conversations 
      WHERE tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

-- Similar policies for other tables
CREATE POLICY ai_summaries_select ON app.ai_conversation_summaries
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM app.ai_conversations 
      WHERE tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY ai_feedback_select ON app.ai_chat_feedback
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY ai_feedback_insert ON app.ai_chat_feedback
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY ai_intent_select ON app.ai_intent_history
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY ai_intent_insert ON app.ai_intent_history
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1)
  );

