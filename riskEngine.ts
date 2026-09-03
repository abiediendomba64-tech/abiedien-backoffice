// ============================================================================
// 🧠 AUTOMATED PRIORITY & ROUTING RISK ENGINE
// Architecture: NLU / Text Signal Classifier -> Risk Engine -> Auto Priority -> Routing
// Principle: "Priority adalah hasil sistem (otomatis), sedangkan decision tetap manusia."
// ============================================================================

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RouteTarget = 'ADMIN' | 'DEV' | 'SUPER_ADMIN';
export type RiskScoreLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketIntent =
  | 'ACCOUNT_TAKEOVER'
  | 'SECURITY_INCIDENT'
  | 'FRAUD'
  | 'FINANCIAL_DISPUTE'
  | 'PRIVILEGE_CHANGE'
  | 'MAINTENANCE'
  | 'SERVER_DOWN'
  | 'PAYMENT_VERIFICATION'
  | 'ACCOUNT_ACCESS'
  | 'DOMAIN_REQUEST'
  | 'WEB_UPDATE'
  | 'GENERAL_INQUIRY';

export interface ClassificationResult {
  intent: TicketIntent;
  category: string;
  priority: TicketPriority;
  route_target: RouteTarget;
  risk_score: RiskScoreLevel;
  signals: string[];
  human_review_required: boolean;
  explanation: string;
  confidence: number;
}

/**
 * Signal dictionaries for Indonesian & English keyword detection
 */
const SECURITY_SIGNALS = [
  'retas', 'diretas', 'hacked', 'hack', 'takeover', 'pembajakan', 'dibajak',
  'breach', 'anomali token', 'token bocor', 'disusupi', 'malware', 'backdoor',
  'phishing', 'exploit', 'ddos', 'serangan siber', 'injeksi', 'kebocoran data'
];

const FRAUD_FINANCIAL_SIGNALS = [
  'saldo hilang', 'rekening diganti', 'dana tidak bisa ditarik', 'penipuan',
  'mutasi palsu', 'sengketa finansial', 'uang tidak masuk', 'double charge',
  'fraud', 'scam', 'tipu', 'penggelapan', 'rekening siluman'
];

const PRIVILEGE_SIGNALS = [
  'ganti role', 'mutasi hak akses', 'super admin authority', 'naikkan role',
  'promote admin', 'akses root', 'ganti superadmin', 'izin khusus'
];

const DOWNTIME_MAINTENANCE_SIGNALS = [
  'tidak bisa dibuka', 'web down', 'server down', 'error 500', 'error 502',
  'bad gateway', 'connection timeout', 'dns failed', 'server crash',
  'website mati', 'rusak total', 'database error', 'crash', 'down parah'
];

const PAYMENT_SIGNALS = [
  'pembayaran', 'invoice', 'transfer', 'bukti bayar', 'topup saldo', 'tagihan',
  'bayar hosting', 'bukti transfer', 'struk', 'bca', 'mandiri', 'qris'
];

const ACCOUNT_ACCESS_SIGNALS = [
  'gagal login', 'lupa password', 'reset password', 'tidak bisa masuk',
  'terkunci', 'otp tidak masuk', 'ganti nomor wa', 'verifikasi ulang'
];

const DOMAIN_SIGNALS = [
  'domain baru', 'buat domain', 'order domain', 'tambah domain', 'beli domain',
  'migrasi dns', 'nameserver', 'txt token', 'cloudflare', 'cpanel', 'subdomain'
];

const WEB_UPDATE_SIGNALS = [
  'ganti nama web', 'update web', 'koreksi nama', 'ubah konten', 'ganti judul',
  'edit halaman', 'tambah menu'
];

/**
 * Normalizes input text for resilient token matching
 */
function normalizeText(text: string): string {
  return (text || '').toLowerCase().replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks which signals match within the text
 */
function findMatchingSignals(normalized: string, dictionary: string[]): string[] {
  const matches: string[] = [];
  for (const sig of dictionary) {
    if (normalized.includes(sig)) {
      matches.push(sig);
    }
  }
  return matches;
}

/**
 * Core Classifier: Analyzes text and category hint to produce priority and route target
 */
export function classifyTicketOrMessage(
  rawText: string,
  categoryHint?: string,
  _userRole?: string
): ClassificationResult {
  const text = normalizeText(rawText);
  const matchedSecurity = findMatchingSignals(text, SECURITY_SIGNALS);
  const matchedFraud = findMatchingSignals(text, FRAUD_FINANCIAL_SIGNALS);
  const matchedPrivilege = findMatchingSignals(text, PRIVILEGE_SIGNALS);
  const matchedDowntime = findMatchingSignals(text, DOWNTIME_MAINTENANCE_SIGNALS);
  const matchedPayment = findMatchingSignals(text, PAYMENT_SIGNALS);
  const matchedAccess = findMatchingSignals(text, ACCOUNT_ACCESS_SIGNALS);
  const matchedDomain = findMatchingSignals(text, DOMAIN_SIGNALS);
  const matchedWebUpdate = findMatchingSignals(text, WEB_UPDATE_SIGNALS);

  // 1. CRITICAL: Account Takeover & Severe Security Breach
  if (matchedSecurity.length > 0) {
    return {
      intent: 'SECURITY_INCIDENT',
      category: '🔒 Keamanan & Akun',
      priority: 'urgent',
      route_target: 'DEV',
      risk_score: 'CRITICAL',
      signals: matchedSecurity,
      human_review_required: true,
      explanation: `Terdeteksi indikasi insiden keamanan (${matchedSecurity.join(', ')}). Diarahkan langsung ke Tim DEV (Tier 1) & Super Admin.`,
      confidence: 0.98
    };
  }

  // 2. CRITICAL: Fraud / Financial Dispute
  if (matchedFraud.length > 0) {
    return {
      intent: 'FINANCIAL_DISPUTE',
      category: '💳 Pembayaran',
      priority: 'urgent',
      route_target: 'SUPER_ADMIN',
      risk_score: 'CRITICAL',
      signals: matchedFraud,
      human_review_required: true,
      explanation: `Terdeteksi indikasi anomali finansial / sengketa saldo (${matchedFraud.join(', ')}). Diarahkan ke Super Admin.`,
      confidence: 0.95
    };
  }

  // 3. URGENT: Privilege / Role Mutation Authority
  if (matchedPrivilege.length > 0) {
    return {
      intent: 'PRIVILEGE_CHANGE',
      category: '🛡️ Otoritas Sistem',
      priority: 'urgent',
      route_target: 'SUPER_ADMIN',
      risk_score: 'HIGH',
      signals: matchedPrivilege,
      human_review_required: true,
      explanation: `Permintaan perubahan role / hak akses membutuhkan otoritas tunggal Super Admin.`,
      confidence: 0.92
    };
  }

  // 4. HIGH: Maintenance / Website Downtime (Down / 500 error / Server crash)
  if (matchedDowntime.length > 0 || (categoryHint && categoryHint.toLowerCase().includes('maintenance'))) {
    return {
      intent: 'MAINTENANCE',
      category: '🛠 Maintenance',
      priority: 'high',
      route_target: 'DEV',
      risk_score: 'HIGH',
      signals: matchedDowntime.length > 0 ? matchedDowntime : ['kategori_maintenance'],
      human_review_required: true,
      explanation: `Terdeteksi kendala server / web down (${matchedDowntime.join(', ') || 'Maintenance'}). Admin & Dev siaga penanganan cepat.`,
      confidence: 0.90
    };
  }

  // 5. HIGH: Payment Verification & Saldo Billing
  if (matchedPayment.length > 0 || (categoryHint && (categoryHint.toLowerCase().includes('payment') || categoryHint.toLowerCase().includes('pembayaran')))) {
    return {
      intent: 'PAYMENT_VERIFICATION',
      category: '💳 Pembayaran',
      priority: 'high',
      route_target: 'ADMIN',
      risk_score: 'MEDIUM',
      signals: matchedPayment.length > 0 ? matchedPayment : ['kategori_pembayaran'],
      human_review_required: true,
      explanation: `Bukti bayar / transaksi masuk antrean verifikasi rekening oleh Admin Operasional.`,
      confidence: 0.88
    };
  }

  // 6. HIGH: Account Access / Login Troubleshooting
  if (matchedAccess.length > 0) {
    return {
      intent: 'ACCOUNT_ACCESS',
      category: '👤 Akses Akun',
      priority: 'high',
      route_target: 'ADMIN',
      risk_score: 'MEDIUM',
      signals: matchedAccess,
      human_review_required: true,
      explanation: `Kendala akses login pengguna membutuhkan verifikasi identitas oleh Admin.`,
      confidence: 0.85
    };
  }

  // 7. MEDIUM: Domain Order / DNS Records Migration
  if (matchedDomain.length > 0 || (categoryHint && categoryHint.toLowerCase().includes('domain'))) {
    return {
      intent: 'DOMAIN_REQUEST',
      category: '🌐 Domain',
      priority: 'medium',
      route_target: 'ADMIN',
      risk_score: 'LOW',
      signals: matchedDomain.length > 0 ? matchedDomain : ['kategori_domain'],
      human_review_required: true,
      explanation: `Permohonan order/update domain normal ditangani oleh Admin Operasional.`,
      confidence: 0.86
    };
  }

  // 8. MEDIUM: Web Content / Name Update
  if (matchedWebUpdate.length > 0 || (categoryHint && (categoryHint.toLowerCase().includes('update') || categoryHint.toLowerCase().includes('koreksi')))) {
    return {
      intent: 'WEB_UPDATE',
      category: '🔄 Web Update',
      priority: 'medium',
      route_target: 'ADMIN',
      risk_score: 'LOW',
      signals: matchedWebUpdate.length > 0 ? matchedWebUpdate : ['kategori_webupdate'],
      human_review_required: true,
      explanation: `Perubahan konfigurasi nama / brand web diarahkan ke Admin.`,
      confidence: 0.84
    };
  }

  // 9. LOW: General Inquiry / Questions
  return {
    intent: 'GENERAL_INQUIRY',
    category: categoryHint || '❓ Bantuan',
    priority: 'low',
    route_target: 'ADMIN',
    risk_score: 'LOW',
    signals: ['inquiry_umum'],
    human_review_required: true,
    explanation: `Permintaan informasi standar diproses secara normal oleh Admin.`,
    confidence: 0.80
  };
}

/**
 * Returns badge styling and icon representations for UI components
 */
export function getPriorityMeta(priority: TicketPriority) {
  switch (priority) {
    case 'urgent':
      return {
        label: '🚨 URGENT',
        colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        dotColor: 'bg-rose-500 animate-ping',
        bgGradient: 'from-rose-950/40 to-rose-900/20'
      };
    case 'high':
      return {
        label: '🔴 HIGH',
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotColor: 'bg-amber-500',
        bgGradient: 'from-amber-950/40 to-amber-900/20'
      };
    case 'medium':
      return {
        label: '🟡 MEDIUM',
        colorClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        dotColor: 'bg-sky-500',
        bgGradient: 'from-sky-950/40 to-sky-900/20'
      };
    case 'low':
    default:
      return {
        label: '🟢 LOW',
        colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dotColor: 'bg-emerald-500',
        bgGradient: 'from-emerald-950/40 to-emerald-900/20'
      };
  }
}

export function getRouteMeta(route: RouteTarget) {
  switch (route) {
    case 'DEV':
      return {
        label: '👨‍💻 DEV (Tier 1)',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        description: 'Eskalasi Teknis, DNS & Infrastruktur'
      };
    case 'SUPER_ADMIN':
      return {
        label: '👑 SUPER ADMIN (Tier 2)',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        description: 'Otoritas Tertinggi & Sengketa Finansial'
      };
    case 'ADMIN':
    default:
      return {
        label: '🛡️ ADMIN OPS',
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        description: 'Gatekeeper & Operasional Harian'
      };
  }
}
