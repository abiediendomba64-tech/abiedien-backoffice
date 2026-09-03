import React, { useState, useEffect } from 'react';
import { BotSimulator } from './components/BotSimulator';
import { NewUserWorkspace } from './components/workspaces/NewUserWorkspace';
import { MemberWorkspace } from './components/workspaces/MemberWorkspace';
import { AdminWorkspace } from './components/workspaces/AdminWorkspace';
import { DevWorkspace } from './components/workspaces/DevWorkspace';
import { SuperAdminWorkspace } from './components/workspaces/SuperAdminWorkspace';
import { User, Ticket, DashboardStats, UserRole } from './types';
import {
  Bot,
  LayoutDashboard,
  Users,
  Ticket as TicketIcon,
  ShieldCheck,
  Crown,
  Terminal,
  UserCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  Phone,
  Lock,
  Database
} from 'lucide-react';

export default function App() {
  const ADVANCED_TOOL_URL = 'https://6a965419f0937d2a7d73e774--zesty-jalebi-9f565d.netlify.app/';
  
  // Main view mode: Role Workspace or Bot Simulator
  const [activeView, setActiveView] = useState<'workspace' | 'simulator'>('workspace');
  
  // Global Data
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedMembers: 0,
    pendingTickets: 0,
    totalTopics: 0,
    pendingPayments: 0,
    totalWebsites: 0,
    superAdminCount: 1,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Authenticated Persona Simulation (5 Tier RBAC)
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  
  // Pre-configured persona users
  const personas: Record<UserRole, User> = {
    new_user: {
      id: 99,
      telegram_id: 112233445,
      telegram_username: 'calon_member',
      full_name: 'Budi Hartono (Calon)',
      whatsapp_number: '081299887766',
      domain_name: '',
      verification_token: 'PENDING_TOKEN',
      role: 'new_user',
      is_verified: false,
      domain_verified: false,
      onboarding_status: 'PENDING_REVIEW',
      join_reason: 'Butuh manajemen website dan konsultasi DNS',
      created_at: new Date().toISOString()
    },
    member: {
      id: 10,
      telegram_id: 987654321,
      telegram_username: 'johndoe',
      full_name: 'John Doe',
      whatsapp_number: '081234567890',
      domain_name: 'tokoanda.com',
      verification_token: 'tok_verified_9876',
      role: 'member',
      is_verified: true,
      domain_verified: true,
      onboarding_status: 'VERIFIED',
      join_reason: 'Kelola e-commerce domain tokoanda.com',
      created_at: new Date().toISOString()
    },
    admin: {
      id: 2,
      telegram_id: 889900112,
      telegram_username: 'admin_ops',
      full_name: 'Siti Aminah (Admin Ops)',
      whatsapp_number: '081399881122',
      domain_name: 'admin.internal',
      verification_token: 'tok_admin_8899',
      role: 'admin',
      is_verified: true,
      domain_verified: true,
      onboarding_status: 'VERIFIED',
      created_at: new Date().toISOString()
    },
    dev: {
      id: 3,
      telegram_id: 778899001,
      telegram_username: 'dev_lead',
      full_name: 'Rian DevOps',
      whatsapp_number: '081566778899',
      domain_name: 'dev.internal',
      verification_token: 'tok_dev_7788',
      role: 'dev',
      is_verified: true,
      domain_verified: true,
      onboarding_status: 'VERIFIED',
      created_at: new Date().toISOString()
    },
    super_admin: {
      id: 1,
      telegram_id: 123456789,
      telegram_username: 'super_boss',
      full_name: 'Super Administrator',
      whatsapp_number: '081122334455',
      domain_name: 'super.internal',
      verification_token: 'tok_super_1234',
      role: 'super_admin',
      is_verified: true,
      domain_verified: true,
      onboarding_status: 'VERIFIED',
      created_at: new Date().toISOString()
    },
    root: {
      id: 999,
      telegram_id: 999888777,
      telegram_username: 'system_root',
      full_name: 'Root / System Owner',
      whatsapp_number: '081100009999',
      domain_name: 'root.system',
      verification_token: 'tok_root_9999',
      role: 'root',
      is_verified: true,
      domain_verified: true,
      onboarding_status: 'VERIFIED',
      created_at: new Date().toISOString()
    }
  };

  const currentUser = personas[selectedRole];

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, usersRes, ticketsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/users'),
        fetch('/api/tickets'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">Telegram Enterprise Engine</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  v5.0 Supabase RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Bot Gatekeeper • Role-Aware Workspaces • Supabase PostgreSQL Repository Layer
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Role Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* External Tool Link */}
            <a
              href={ADVANCED_TOOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition hover:scale-105 active:scale-95"
              title="Buka Lanjutan Alat Eksternal di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lanjutan Alat</span>
            </a>

            {/* View Switcher: Operational Workspace vs Bot Simulator */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveView('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'workspace'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Role Workspace</span>
              </button>

              <button
                onClick={() => setActiveView('simulator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'simulator'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Bot Simulator (NLU)</span>
              </button>
            </div>

            {/* Data Refresh */}
            <button
              onClick={fetchAllData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5-Tier RBAC Persona Switcher Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-300">Login Role Persona:</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">(Mengubah hak akses & tampilan dashboard seketika)</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {/* Tier 0. New User */}
              <button
                onClick={() => setSelectedRole('new_user')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'new_user'
                    ? 'bg-slate-700/40 text-slate-200 border border-slate-600 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Tier 0: New User</span>
              </button>

              {/* Tier 1. Member */}
              <button
                onClick={() => setSelectedRole('member')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'member'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Tier 1: Member</span>
              </button>

              {/* Tier 2. Admin Ops */}
              <button
                onClick={() => setSelectedRole('admin')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'admin'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Tier 2: Admin Ops</span>
              </button>

              {/* Tier 3. Dev */}
              <button
                onClick={() => setSelectedRole('dev')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'dev'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Tier 3: Dev</span>
              </button>

              {/* Tier 4. Super Admin */}
              <button
                onClick={() => setSelectedRole('super_admin')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'super_admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Tier 4: Super Admin</span>
              </button>

              {/* Tier 5. Root */}
              <button
                onClick={() => setSelectedRole('root')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs shrink-0 ${
                  selectedRole === 'root'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Crown className="w-3 h-3 text-rose-400" />
                <span>Tier 5: Root / Owner</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'simulator' ? (
          /* Isolated Bot Simulator & Natural Language Playground */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <BotSimulator onRefreshData={fetchAllData} />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Alur Gatekeeper Bot Telegram
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bot Telegram ini bertindak sebagai <strong>gatekeeper & assistant operasional</strong>:
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
                    <span><strong>Identitas Otomatis</strong>: Telegram ID & username dideteksi langsung tanpa mengetik manual.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
                    <span><strong>NLU & State Machine</strong>: Memahami percakapan bebas (typo, slang, filler kata "Pak/Bos") dan draft konfirmasi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">3</div>
                    <span><strong>Tiket Binding</strong>: Mengikat user ke 1 tiket aktif, mencegah duplikasi pesan spam dalam 30 detik.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">4</div>
                    <span><strong>Decisions Handled in Workspace</strong>: Keputusan final dilakukan oleh Admin/Super Admin di Role Workspace.</span>
                  </li>
                </ul>
              </div>

              {/* Bot Commands Quick Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
                <h3 className="text-sm font-semibold text-slate-100 font-sans flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  Perintah Bot Utama
                </h3>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-sky-400">/start</span> - Inisialisasi percakapan & onboarding
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-sky-400">/menu</span> - Tampilkan navigasi inline keyboard
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-purple-400">/cekdomain [domain]</span> - Cek DNS & status token
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-emerald-400">/status</span> - Cek status tiket aktif & verifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Role-Aware Operational Workspaces strictly governed by 5-Tier RBAC */
          <div>
            {selectedRole === 'new_user' && (
              <NewUserWorkspace currentUser={currentUser} onRefreshData={fetchAllData} />
            )}

            {selectedRole === 'member' && (
              <MemberWorkspace
                currentUser={currentUser}
                tickets={tickets}
                onRefreshData={fetchAllData}
              />
            )}

            {selectedRole === 'admin' && (
              <AdminWorkspace
                currentUser={currentUser}
                users={users}
                tickets={tickets}
                stats={stats}
                onRefreshData={fetchAllData}
              />
            )}

            {selectedRole === 'dev' && (
              <DevWorkspace
                currentUser={currentUser}
                tickets={tickets}
                onRefreshData={fetchAllData}
              />
            )}

            {selectedRole === 'super_admin' && (
              <SuperAdminWorkspace
                currentUser={currentUser}
                users={users}
                tickets={tickets}
                stats={stats}
                onRefreshData={fetchAllData}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
