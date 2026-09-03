-- ============================================================================
-- SUPABASE / POSTGRESQL ENTERPRISE MIGRATION SCHEMA (V5.0)
-- Telegram Bot Enterprise Architecture: Single Source of Truth
-- 12 Complete Production Tables + RLS Policies + Foreign Keys + Performance Indexes
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('super_admin', 'dev', 'admin', 'member', 'new_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_status_enum AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('draft', 'pending', 'assigned', 'waiting_user', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CORE TABLE DEFINITIONS
-- ============================================================================

-- Table 1: USERS (Identity, Gatekeeper Onboarding, Phone & DNS Verification)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(128) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(32),
    domain_name VARCHAR(255),
    verification_token VARCHAR(64),
    token_expiry BIGINT,
    tg_handle VARCHAR(128),
    role user_role_enum DEFAULT 'new_user' NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    domain_verified BOOLEAN DEFAULT FALSE NOT NULL,
    onboarding_status onboarding_status_enum DEFAULT 'PENDING_REVIEW' NOT NULL,
    join_reason TEXT,
    phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
    phone_verified_at TIMESTAMPTZ,
    risk_score VARCHAR(32) DEFAULT 'LOW' NOT NULL,
    risk_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
    approved_by BIGINT,
    approved_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 2: TICKETS (Customer Requests, Admin Operations & Tiered Escalations)
CREATE TABLE IF NOT EXISTS public.tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    status ticket_status_enum DEFAULT 'pending' NOT NULL,
    assigned_to BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    priority ticket_priority_enum DEFAULT 'medium' NOT NULL,
    decision VARCHAR(64), -- APPROVED, REJECTED, ESCALATED, INFO_REQUESTED
    decision_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    decision_note TEXT,
    escalation_level INT DEFAULT 0 NOT NULL, -- 0=Admin, 1=Dev, 2=SuperAdmin
    escalated_to VARCHAR(32), -- 'dev' or 'super_admin'
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 3: TICKET_MESSAGES (Conversation Thread & Follow-up History)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    sender_type VARCHAR(32) NOT NULL, -- 'user', 'admin', 'dev', 'bot'
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::JSONB,
    is_internal_note BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 4: CONVERSATION_STATES (Persistent Bot State, Step Machine & Drafts)
CREATE TABLE IF NOT EXISTS public.conversation_states (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    current_step VARCHAR(64),
    session_data JSONB DEFAULT '{}'::JSONB,
    context JSONB DEFAULT '{}'::JSONB,
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 5: PAYMENTS (Transaction Billing & Manual Transfer Proofs)
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR' NOT NULL,
    proof_file_id VARCHAR(255),
    proof_image_url TEXT,
    status payment_status_enum DEFAULT 'pending' NOT NULL,
    verified_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 6: WEB_REQUESTS (Domain Provisioning & Order Queue)
CREATE TABLE IF NOT EXISTS public.web_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_domain VARCHAR(255) NOT NULL,
    package_type VARCHAR(64) DEFAULT 'standard' NOT NULL,
    status VARCHAR(32) DEFAULT 'pending' NOT NULL,
    assigned_dev_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    server_ip VARCHAR(64),
    dns_configured BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 7: MEMBER_WEBSITES (Active Provisioned Websites & DNS Health)
CREATE TABLE IF NOT EXISTS public.member_websites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(64),
    ssl_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(32) DEFAULT 'healthy' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 8: FORUM_TOPICS (Community Discussion Threads)
CREATE TABLE IF NOT EXISTS public.forum_topics (
    id BIGSERIAL PRIMARY KEY,
    topic_id VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(64) DEFAULT 'Umum' NOT NULL,
    status VARCHAR(32) DEFAULT 'open' NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    comments_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 9: FORUM_COMMENTS (Replies to Forum Threads)
CREATE TABLE IF NOT EXISTS public.forum_comments (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 10: ANNOUNCEMENTS (Broadcast Broadcasts & System Notices)
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGSERIAL PRIMARY KEY,
    created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role user_role_enum,
    sent_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 11: RATE_LIMITS (Anti-Spam & API Flooding Protection)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    action_key VARCHAR(64) NOT NULL,
    hit_count INT DEFAULT 1 NOT NULL,
    window_start TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
    block_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table 12: AUDIT_LOGS (Immutable System-Wide Security Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role VARCHAR(32),
    action VARCHAR(128) NOT NULL,
    target_id VARCHAR(255),
    details JSONB DEFAULT '{}'::JSONB,
    ip_address VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON public.users(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_escalation ON public.tickets(escalation_level);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_tg_action ON public.rate_limits(telegram_id, action_key);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Member Data Privacy Policy: Users can only read their own record
CREATE POLICY member_select_own_user ON public.users
    FOR SELECT
    USING (telegram_id = auth.uid()::bigint OR EXISTS (
        SELECT 1 FROM public.users u WHERE u.telegram_id = auth.uid()::bigint AND u.role IN ('admin', 'dev', 'super_admin')
    ));

-- Ticket Privacy Policy: Members only see their own tickets; Staff sees operational queue
CREATE POLICY ticket_access_policy ON public.tickets
    FOR SELECT
    USING (
        user_id IN (SELECT id FROM public.users WHERE telegram_id = auth.uid()::bigint)
        OR EXISTS (
            SELECT 1 FROM public.users u WHERE u.telegram_id = auth.uid()::bigint AND u.role IN ('admin', 'dev', 'super_admin')
        )
    );

-- Audit Log Policy: Only Super Admin and Dev can view audit logs
CREATE POLICY audit_view_policy ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u WHERE u.telegram_id = auth.uid()::bigint AND u.role IN ('super_admin', 'dev')
        )
    );
