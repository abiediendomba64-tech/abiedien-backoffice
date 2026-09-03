export type UserRole = 'root' | 'super_admin' | 'dev' | 'admin' | 'member' | 'new_user';

export type OnboardingStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'BLOCKED';

export interface User {
  id: number;
  telegram_id: number;
  telegram_username: string;
  full_name: string;
  whatsapp_number: string;
  domain_name: string;
  verification_token?: string;
  token_expiry?: number | null;
  tg_handle?: string | null;
  role: UserRole;
  is_verified: boolean;
  domain_verified: boolean;
  onboarding_status: OnboardingStatus;
  join_reason?: string;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  risk_score?: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_flags?: string[];
  approved_by?: number | null;
  approved_at?: string | null;
  last_activity_at?: string;
  last_verified_at?: string | null;
  created_at: string;
}

export type TicketStatus = 'draft' | 'pending' | 'assigned' | 'resolved';

export interface Ticket {
  id: number;
  ticket_number: string;
  user_id: number;
  user_name?: string;
  category: string;
  message: string;
  status: TicketStatus;
  assigned_to?: number | null;
  priority?: 'low' | 'medium' | 'high';
  decision?: 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'INFO_REQUESTED' | null;
  decision_by?: number | null;
  decision_note?: string | null;
  escalation_level?: number; // 0 = Admin, 1 = Dev, 2 = Super Admin
  escalated_to?: 'dev' | 'super_admin' | null;
  admin_reply?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumComment {
  id: number;
  topic_id: number;
  user_id: number;
  author_name?: string;
  comment_text: string;
  created_at: string;
}

export interface ForumTopic {
  id: number;
  topic_id: string;
  user_id: number;
  author_name?: string;
  title: string;
  content: string;
  category: string;
  status: 'open' | 'closed';
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  user_name?: string;
  domain?: string;
  amount: string;
  proof_file_id: string;
  status: 'pending' | 'verified' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  action: string;
  target_id: string;
  timestamp: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  replyMarkup?: {
    inline_keyboard?: InlineKeyboardButton[][];
  };
  photoUrl?: string;
  isMarkdown?: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  verifiedMembers: number;
  pendingTickets: number;
  totalTopics: number;
  pendingPayments: number;
  totalWebsites: number;
  superAdminCount: number;
}

export interface SupabaseConfigStatus {
  connected: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  sslMode: string;
  rlsEnabled: boolean;
  connectionPooler: string;
  latencyMs: number;
  syncedTables: {
    name: string;
    rowCount: number;
    rlsStatus: 'enforced' | 'disabled';
    securityLevel: string;
  }[];
}

export interface SupabaseQueryResult {
  success: boolean;
  table: string;
  action: string;
  data?: any;
  error?: string;
  executionTimeMs?: number;
  querySql?: string;
  securityNotice?: string;
}
