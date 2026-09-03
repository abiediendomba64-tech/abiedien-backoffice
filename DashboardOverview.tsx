import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Ticket,
  MessageSquare,
  CreditCard,
  Globe,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Play,
  Check,
  AlertCircle,
  Terminal,
  Zap,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';

interface StatsProps {
  stats: {
    totalUsers: number;
    verifiedMembers: number;
    pendingTickets: number;
    totalTopics: number;
    pendingPayments: number;
    totalWebsites: number;
    superAdminCount: number;
  };
  onNavigateTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<StatsProps> = ({ stats, onNavigateTab }) => {
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState<{
    totalChecked: number;
    validActive: number;
    revokedCount: number;
    durationMs: number;
    executedAt: string;
    logs: string[];
  } | null>(null);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<string>('super_admin');

  const runMonthlyCheck = async () => {
    setRunningJob(true);
    try {
      const res = await fetch('/api/admin/monthly-check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setJobResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningJob(false);
    }
  };

  const cards = [
    {
      title: 'Total Member Terdaftar',
      value: stats.totalUsers,
      sub: `${stats.verifiedMembers} Domain Terverifikasi`,
      icon: Users,
      color: 'from-blue-500/20 to-sky-500/10 text-sky-400 border-sky-500/30',
      action: () => onNavigateTab('members'),
    },
    {
      title: 'Tiket Support Pending',
      value: stats.pendingTickets,
      sub: 'Perlu respon tim admin',
      icon: Ticket,
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      action: () => onNavigateTab('tickets'),
    },
    {
      title: 'Topik Komunitas Forum',
      value: stats.totalTopics,
      sub: 'Diskusi aktif member',
      icon: MessageSquare,
      color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30',
      action: () => onNavigateTab('forum'),
    },
    {
      title: 'Pembayaran Menunggu Konfirmasi',
      value: stats.pendingPayments,
      sub: 'Bukti transfer pending',
      icon: CreditCard,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      action: () => onNavigateTab('payments'),
    },
  ];

  const roleHierarchySpecs: Record<
    string,
    { title: string; level: number; color: string; domainScope: string; botPermissions: string[]; dashboardScope: string }
  > = {
    root: {
      title: 'Root / System Owner (Tier 5)',
      level: 5,
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      domainScope: 'Emergency control, disaster recovery, database & infrastructure restoration.',
      botPermissions: ['Emergency Shutdown', 'DB Migration', 'Authority Reset', 'System Recovery'],
      dashboardScope: 'Hidden / emergency only; disaster recovery console and master system controls.',
    },
    super_admin: {
      title: 'Super Admin (Tier 4)',
      level: 4,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      domainScope: 'High-risk security, financial risk, authority escalation, final high-risk decisions.',
      botPermissions: ['/setrole', '/verify_pay', '/broadcast', 'High-Risk Review', 'Account Freeze'],
      dashboardScope: 'Authority for high-risk decisions exceeding operational limits, security auditing.',
    },
    dev: {
      title: 'Developer / Technical (Tier 3)',
      level: 3,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      domainScope: 'Technical / security investigation, DNS / WHOIS inspection, infrastructure debugging.',
      botPermissions: ['/cekdomain', 'Technical Escalation Queue', 'DNS/WHOIS Tools'],
      dashboardScope: 'Domain tools & WHOIS inspector, technical diagnostics, escalation handling.',
    },
    admin: {
      title: 'Admin Operasional (Tier 2)',
      level: 2,
      color: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
      domainScope: 'Operational center, member request evaluation, domain & ticket queue management.',
      botPermissions: ['Assign Ticket', 'Ask Info', 'Approve / Reject', 'Resolve / Escalate'],
      dashboardScope: 'Operational workflow, ticket queues, handling member requests and follow-ups.',
    },
    member: {
      title: 'Member / Requester (Tier 1)',
      level: 1,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      domainScope: 'Personal domain requests, support tickets, follow-ups, payment proof upload, community forum.',
      botPermissions: ['Buat Tiket', 'Upload Payment Proof', 'Forum Komunitas', 'Status Cek'],
      dashboardScope: 'Requester dashboard, track personal tickets and domain verification status.',
    },
    new_user: {
      title: 'New User / Calon (Tier 0)',
      level: 0,
      color: 'text-slate-400 border-slate-700 bg-slate-800/40',
      domainScope: 'Onboarding registration, identity, phone verification, join reason, pending status check.',
      botPermissions: ['/start pendaftaran', 'Input Nama & No. WhatsApp', 'Alasan Bergabung', 'Tunggu Approval Admin'],
      dashboardScope: 'Restricted onboarding view awaiting admin approval; no operational request access.',
    },
  };

  return (
    <div className="space-y-6">
      {/* External Tool & Supabase Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alat Lanjutan Banner Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Portal Eksternal Aktif
              </span>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Lanjutan Alat & Platform Web Terpadu
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Akses utilitas dan instrumen operasional tingkat lanjut melalui portal Netlify yang terhubung langsung.
            </p>
          </div>
          <a
            href="https://6a965419f0937d2a7d73e774--zesty-jalebi-9f565d.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Lanjutan Alat (zesty-jalebi.netlify.app)</span>
          </a>
        </div>

        {/* Supabase SQL Database Security Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 border border-indigo-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Row Level Security (RLS)
              </span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Supabase SQL Security & Skema Data
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Skema DDL terisolasi, parameterized query runner, enkripsi Pgcrypto, dan audit logs anti-tampering.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('database')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>Kelola Skema & Uji Query Supabase</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={c.action}
              className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} bg-slate-900/90 border cursor-pointer hover:scale-[1.02] transition-all shadow-lg group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{c.title}</span>
                <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-slate-700 transition">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-100">{c.value}</div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
              </div>
              <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Feature & Architecture Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Engine */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Engine Verifikasi Domain DNS
            </h4>
            <span className="px-2 py-0.5 rounded text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sistem memvalidasi kepemilikan domain melalui <strong>TXT Record</strong> DNS (1.1.1.1 / 8.8.8.8) secara asinkron dengan proteksi klaim duplikat nama domain.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-300">Default Expiry Token</span>
              <span className="font-mono text-slate-200">30 Hari</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-300">DNS Query Protocol</span>
              <span className="font-mono text-slate-200">TXT / WHOIS Resolver</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-300">Anti-Duplicate Ownership</span>
              <span className="text-emerald-400 font-medium">Enforced</span>
            </div>
          </div>
        </div>

        {/* RBAC Single-Gate Hierarchy */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Hierarki RBAC 5-Tingkat
            </h4>
            <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Single-Gate
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Setiap handler dan callback query divalidasi via middleware bertingkat untuk mencegah bypass hak akses.
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-rose-300">Tier 5. root</span>
              <span className="text-slate-400">Emergency & System Recovery</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-amber-300">Tier 4. super_admin</span>
              <span className="text-slate-400">High-Risk & Security Authority</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-purple-300">Tier 3. dev</span>
              <span className="text-slate-400">Technical / DNS / Infrastructure</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-sky-300">Tier 2. admin</span>
              <span className="text-slate-400">Operational & Ticket Decisions</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-emerald-300">Tier 1. member</span>
              <span className="text-slate-400">Requester, Tickets & Forum</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700/40">
              <span className="font-mono text-slate-300">Tier 0. new_user</span>
              <span className="text-slate-400">Onboarding & Pending Review</span>
            </div>
          </div>
        </div>

        {/* Safety & Performance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Ketahanan & Proteksi
            </h4>
            <span className="px-2 py-0.5 rounded text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Reliable
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Proteksi flood attack, rate limiting per action (3-5s), audit trail real-time, dan polling terjadwal otomatis.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-1">
              <div className="flex justify-between font-medium text-slate-200">
                <span>Rate Limiter Cooldown</span>
                <span className="text-sky-400 font-mono">3s text / 5s callback</span>
              </div>
              <p className="text-[11px] text-slate-400">Mencegah spam click inline keyboard & spam chat.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 space-y-1">
              <div className="flex justify-between font-medium text-slate-200">
                <span>Monthly Verification Job</span>
                <span className="text-emerald-400 font-mono">Setiap 00:00</span>
              </div>
              <p className="text-[11px] text-slate-400">Otomatis cabut status jika TXT record domain dihapus.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Verification Check Live Runner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-slate-100">Monthly Domain Verification Job (Batch Engine)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pythonic • Tenacity Retry • Pytz Asia/Jakarta
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mengeksekusi pengecekan DNS TXT berkala secara batch tanpa N+1 query, otomatis mencabut status jika record TXT dihapus/kadaluarsa.
            </p>
          </div>
          <button
            onClick={runMonthlyCheck}
            disabled={runningJob}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
          >
            {runningJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {runningJob ? 'Memproses Batch...' : 'Jalankan Monthly Check Sekarang'}
          </button>
        </div>

        {jobResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-4 h-4" /> Total Diperiksa: {jobResult.totalChecked}
              </span>
              <span className="text-sky-300">Aktif: {jobResult.validActive}</span>
              <span className="text-rose-400">Kadaluarsa / Dicabut: {jobResult.revokedCount}</span>
              <span className="text-slate-400">Waktu: {jobResult.durationMs}ms</span>
              <span className="text-slate-400 ml-auto font-mono">{jobResult.executedAt}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/50 font-mono text-[11px] text-slate-300 space-y-1 max-h-40 overflow-y-auto">
              {jobResult.logs.map((log, idx) => (
                <div key={idx} className={log.includes('[WARN]') ? 'text-amber-300' : log.includes('[SUCCESS]') ? 'text-emerald-300' : 'text-slate-400'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive RBAC Hierarchy Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-slate-100">Matriks Hak Akses & Perbedaan Fungsi Domain per Role</h3>
            <p className="text-xs text-slate-400">Pilih role untuk melihat spesifikasi kewenangan domain dan batasan dashboard:</p>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(roleHierarchySpecs).map((rKey) => (
            <button
              key={rKey}
              onClick={() => setSelectedRoleDetail(rKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                selectedRoleDetail === rKey
                  ? roleHierarchySpecs[rKey].color + ' shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {roleHierarchySpecs[rKey].title}
            </button>
          ))}
        </div>

        {/* Selected Role Detail Box */}
        {selectedRoleDetail && roleHierarchySpecs[selectedRoleDetail] && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">
                {roleHierarchySpecs[selectedRoleDetail].title}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                Level Hierarki: {roleHierarchySpecs[selectedRoleDetail].level}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">🌐 Kewenangan Domain:</span>
                <p className="text-slate-200">{roleHierarchySpecs[selectedRoleDetail].domainScope}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">🤖 Bot Command & Menu:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {roleHierarchySpecs[selectedRoleDetail].botPermissions.map((p, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-sky-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">💻 Cakupan Dashboard:</span>
                <p className="text-slate-200">{roleHierarchySpecs[selectedRoleDetail].dashboardScope}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

