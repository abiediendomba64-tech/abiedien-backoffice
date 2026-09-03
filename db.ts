// ============================================================================
// 🗄️ SUPABASE / POSTGREST DATABASE CLIENT & CRUD INTERFACE
// Tables: users, tickets, ticket_messages, conversation_states, payments, 
//         web_requests, forum_topics, forum_comments, audit_logs, risk_events, notifications
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not fully configured. Using mock fallback mode.');
    }
    supabaseInstance = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
      auth: { persistSession: false },
      db: { schema: 'public' },
      global: {
        headers: { 'x-client-info': 'telegram-bot-enterprise-web' },
      },
    });
  }
  return supabaseInstance;
}

// ============================================================================
// 1. USERS CRUD
// ============================================================================
export async function dbGetUsers() {
  const sb = getSupabase();
  const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbGetUserByTelegramId(telegramId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('users').select('*').eq('telegram_id', telegramId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function dbUpsertUser(userData: {
  telegram_id: number;
  telegram_username?: string;
  full_name: string;
  whatsapp_number?: string;
  domain_name?: string;
  role?: string;
  is_verified?: boolean;
  domain_verified?: boolean;
  onboarding_status?: string;
  join_reason?: string;
  risk_status?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('users')
    .upsert({ ...userData, updated_at: new Date().toISOString() }, { onConflict: 'telegram_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 2. TICKETS CRUD
// ============================================================================
export async function dbGetTickets() {
  const sb = getSupabase();
  const { data, error } = await sb.from('tickets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateTicket(ticketData: {
  ticket_code: string;
  user_id: number;
  user_name: string;
  category: string;
  message: string;
  priority?: string;
  route_target?: string;
  status?: string;
  human_review_required?: boolean;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('tickets').insert([ticketData]).select().single();
  if (error) throw error;
  return data;
}

export async function dbUpdateTicketStatus(ticketId: number, status: string, adminNotes?: string) {
  const sb = getSupabase();
  const updatePayload: any = { status, updated_at: new Date().toISOString() };
  if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;

  const { data, error } = await sb.from('tickets').update(updatePayload).eq('id', ticketId).select().single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 3. TICKET MESSAGES CRUD
// ============================================================================
export async function dbGetTicketMessages(ticketId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function dbCreateTicketMessage(msgData: {
  ticket_id: number;
  sender_type: string;
  sender_name: string;
  message: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('ticket_messages').insert([msgData]).select().single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 4. CONVERSATION STATES CRUD
// ============================================================================
export async function dbGetConversationState(telegramId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('conversation_states').select('*').eq('telegram_id', telegramId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function dbUpsertConversationState(stateData: {
  telegram_id: number;
  active_ticket_id?: number | null;
  current_intent?: string;
  waiting_for?: string;
  last_message_hash?: string;
  context_json?: any;
}) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('conversation_states')
    .upsert({ ...stateData, updated_at: new Date().toISOString() }, { onConflict: 'telegram_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 5. PAYMENTS CRUD
// ============================================================================
export async function dbGetPayments() {
  const sb = getSupabase();
  const { data, error } = await sb.from('payments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreatePayment(paymentData: {
  user_id: number;
  amount: number;
  proof_file_id: string;
  status?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('payments').insert([paymentData]).select().single();
  if (error) throw error;
  return data;
}

export async function dbUpdatePaymentStatus(paymentId: number, status: string, adminNotes?: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('payments')
    .update({ status, admin_notes: adminNotes, verified_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 6. WEB REQUESTS CRUD
// ============================================================================
export async function dbGetWebRequests() {
  const sb = getSupabase();
  const { data, error } = await sb.from('web_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateWebRequest(reqData: {
  user_id: number;
  domain_name: string;
  status?: string;
  health_status?: string;
  dns_records_json?: any;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('web_requests').insert([reqData]).select().single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 7. FORUM TOPICS & COMMENTS CRUD
// ============================================================================
export async function dbGetForumTopics() {
  const sb = getSupabase();
  const { data, error } = await sb.from('forum_topics').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateForumTopic(topicData: {
  user_id: number;
  author_name: string;
  title: string;
  content: string;
  category?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('forum_topics').insert([topicData]).select().single();
  if (error) throw error;
  return data;
}

export async function dbGetForumComments(topicId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('forum_comments').select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function dbCreateForumComment(commentData: {
  topic_id: number;
  user_id: number;
  author_name: string;
  content: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('forum_comments').insert([commentData]).select().single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 8. AUDIT LOGS & RISK EVENTS CRUD
// ============================================================================
export async function dbLogAudit(auditData: {
  actor_id?: number;
  actor_role?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details_json?: any;
  ip_address?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('audit_logs').insert([auditData]).select().single();
  if (error) throw error;
  return data;
}

export async function dbLogRiskEvent(riskData: {
  user_id?: number;
  ticket_id?: number;
  risk_score: string;
  intent: string;
  signals_json?: any;
  action_taken: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('risk_events').insert([riskData]).select().single();
  if (error) throw error;
  return data;
}

// ============================================================================
// 9. NOTIFICATIONS CRUD
// ============================================================================
export async function dbGetNotifications(telegramId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('notifications').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateNotification(notifData: {
  user_id: number;
  telegram_id: number;
  title: string;
  message: string;
  type?: string;
}) {
  const sb = getSupabase();
  const { data, error } = await sb.from('notifications').insert([notifData]).select().single();
  if (error) throw error;
  return data;
}

export async function dbMarkNotificationRead(notifId: number) {
  const sb = getSupabase();
  const { data, error } = await sb.from('notifications').update({ is_read: true }).eq('id', notifId).select().single();
  if (error) throw error;
  return data;
}
