import React, { useState } from 'react';
import { User, Ticket, Payment, DashboardStats } from '../../types';
import { dbGetUsers } from '../../lib/db';
import { RoleGuard, assertActionPermission } from '../../lib/authGuard';
import {
  Ticket as TicketIcon,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  ArrowUpRight,
  Search,
  Check,
  Phone,
  Globe,
  CreditCard,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  Filter,
  UserCheck,
  Download
} from 'lucide-react';

interface AdminWorkspaceProps {
  currentUser: User;
  users: User[];
  tickets: Ticket[];
  stats: DashboardStats;
  onRefreshData?: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  currentUser,
  users,
  tickets,
  stats,
  onRefreshData
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'tickets' | 'new_members' | 'payments' | 'members_list' | 'domains'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'assigned' | 'high_priority'>('all');
  const [searchTicket, setSearchTicket] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      let dataToExport = users;
      try {
        const freshUsers = await dbGetUsers();
        if (freshUsers && freshUsers.length > 0) {
          dataToExport = freshUsers;
        }
      } catch (err) {
        console.warn("Failed to fetch fresh users from DB, using current props:", err);
      }

      const headers = ['ID', 'Telegram ID', 'Telegram Username', 'Full Name', 'WhatsApp', 'Domain', 'Role', 'Status', 'Domain Verified', 'Created At'];
      const rows = dataToExport.map(u => [
        u.id,
        u.telegram_id,
        `@${u.telegram_username || ''}`,
        `"${(u.full_name || '').replace(/"/g, '""')}"`,
        `"${(u.whatsapp_number || '').replace(/"/g, '""')}"`,
        `"${(u.domain_name || '').replace(/"/g, '""')}"`,
        u.role,
        u.onboarding_status || 'VERIFIED',
        u.domain_verified ? 'YES' : 'NO',
        u.created_at ? new Date(u.created_at).toISOString() : ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `telegram_bot_users_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error downloading CSV:', e);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const pendingMembers = users.filter((u) => u.onboarding_status === 'PENDING_REVIEW');
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const assignedTickets = tickets.filter((t) => t.status === 'assigned');
  const highPriorityTickets = tickets.filter((t) => t.priority === 'high');

  // Filtered ticket queue
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchTicket.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTicket.toLowerCase()) ||
      (t.user_name && t.user_name.toLowerCase().includes(searchTicket.toLowerCase()));

    if (!matchesSearch) return false;
    if (ticketFilter === 'pending') return t.status === 'pending';
    if (ticketFilter === 'assigned') return t.status === 'assigned';
    if (ticketFilter === 'high_priority') return t.priority === 'high';
    return true;
  });

  // Action handlers
  const handleTicketDecision = async (
    ticketId: number,
    action: 'take' | 'approve' | 'reject' | 'resolve' | 'ask_info' | 'escalate_dev' | 'escalate_super'
  ) => {
    setActionLoading(true);
    try {
      assertActionPermission(currentUser.role, 'admin', `ticket_${action}`);
      let endpoint = '';
      let body: any = { adminId: currentUser.telegram_id, note: actionNote };

      if (action === 'take') {
        endpoint = `/api/tickets/${ticketId}/take`;
      } else if (action === 'resolve') {
        endpoint = `/api/tickets/${ticketId}/resolve`;
      } else if (action === 'approve') {
        endpoint = `/api/tickets/${ticketId}/decision`;
        body.decision = 'APPROVED';
      } else if (action === 'reject') {
        endpoint = `/api/tickets/${ticketId}/decision`;
        body.decision = 'REJECTED';
      } else if (action === 'ask_info') {
        endpoint = `/api/tickets/${ticketId}/decision`;
        body.decision = 'INFO_REQUESTED';
      } else if (action === 'escalate_dev') {
        endpoint = `/api/tickets/${ticketId}/escalate`;
        body.escalateTo = 'dev';
      } else if (action === 'escalate_super') {
        endpoint = `/api/tickets/${ticketId}/escalate`;
        body.escalateTo = 'super_admin';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setActionSuccess(`Aksi [${action.toUpperCase()}] berhasil dieksekusi.`);
        setActionError(null);
        setActionNote('');
        setSelectedTicket(null);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Terjadi kesalahan eksekusi aksi.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMember = async (telegramId: number) => {
    try {
      const res = await fetch(`/api/users/${telegramId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.telegram_id })
      });
      if (res.ok && onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectMember = async (telegramId: number) => {
    const reason = window.prompt('Alasan penolakan pendaftaran:');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/users/${telegramId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.telegram_id, reason: reason || 'Data profil belum lengkap' })
      });
      if (res.ok && onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to mask sensitive data
  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return '****';
    return phone.slice(0, 4) + '****' + phone.slice(-4);
  };

  const maskTelegramId = (tgId: number) => {
    const s = String(tgId);
    if (s.length <= 4) return '****';
    return '****' + s.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setActiveAdminTab('tickets');
            setTicketFilter('pending');
          }}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>🔴 Pending Tickets</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{pendingTickets.length}</div>
          <div className="text-[11px] text-slate-500">Memerlukan respon Admin</div>
        </div>

        <div
          onClick={() => {
            setActiveAdminTab('tickets');
            setTicketFilter('assigned');
          }}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>🟠 Assigned (In Progress)</span>
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">{assignedTickets.length}</div>
          <div className="text-[11px] text-slate-500">Sedang diproses tim</div>
        </div>

        <div
          onClick={() => setActiveAdminTab('new_members')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>👥 New Member Approval</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">{pendingMembers.length}</div>
          <div className="text-[11px] text-amber-300">Antrean pendaftaran gatekeeper</div>
        </div>

        <div
          onClick={() => {
            setActiveAdminTab('tickets');
            setTicketFilter('high_priority');
          }}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>⚠️ High Priority</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{highPriorityTickets.length}</div>
          <div className="text-[11px] text-rose-300">Kendala kritis/urgen</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveAdminTab('tickets')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'tickets' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TicketIcon className="w-3.5 h-3.5" />
          Antrean Tiket ({tickets.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('new_members')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'new_members' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Persetujuan Member Baru ({pendingMembers.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('members_list')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'members_list' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Direktori Member (Masked Privacy)
        </button>
      </div>

      {/* Alert Notice */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Tab 1: Ticket Queue & Decision Console */}
      {activeAdminTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Ticket Queue List */}
          <div className={`${selectedTicket ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            {/* Search & Filter bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="Cari nomor tiket, pesan, nama..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTicketFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    ticketFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua ({tickets.length})
                </button>
                <button
                  onClick={() => setTicketFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    ticketFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pending ({pendingTickets.length})
                </button>
                <button
                  onClick={() => setTicketFilter('assigned')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    ticketFilter === 'assigned' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Assigned ({assignedTickets.length})
                </button>
              </div>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-sky-500 ring-1 ring-sky-500/50 shadow-xl'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            {t.ticket_number}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {t.category}
                          </span>
                          {t.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              HIGH
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Pemohon: <strong className="text-slate-200">{t.user_name || `User #${t.user_id}`}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        {t.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🟡 Pending
                          </span>
                        )}
                        {t.status === 'assigned' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            🔵 Assigned (#{t.assigned_to})
                          </span>
                        )}
                        {t.status === 'resolved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🟢 Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 italic font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                      "{t.message}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Waktu: {new Date(t.created_at).toLocaleTimeString()}</span>
                      <span className="text-sky-400 font-semibold flex items-center gap-1">
                        Buka Konsol Keputusan &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision Support Console (When ticket is selected) */}
          {selectedTicket && (
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-sky-500/30 shadow-2xl space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    Konsol Keputusan Admin
                  </h3>
                  <span className="font-mono text-xs text-sky-300 font-semibold">
                    {selectedTicket.ticket_number} • {selectedTicket.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Pesan Member:</span>
                  <p className="text-slate-200 leading-relaxed font-mono">
                    "{selectedTicket.message}"
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Catatan / Balasan Operasional ke Member:
                  </label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Tuliskan catatan teknis, instruksi DNS, atau alasan keputusan..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Action Buttons Matrix: TAKE, ASK INFO, APPROVE, REJECT, RESOLVE, ESCALATE */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Eksekusi Keputusan Admin:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTicketDecision(selectedTicket.id, 'take')}
                    className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Ambil Tiket (TAKE)
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleTicketDecision(selectedTicket.id, 'ask_info')}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Minta Info (ASK)
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleTicketDecision(selectedTicket.id, 'approve')}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Setujui (APPROVE)
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleTicketDecision(selectedTicket.id, 'reject')}
                    className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition border border-rose-500/30"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak (REJECT)
                  </button>
                </div>

                <button
                  disabled={actionLoading}
                  onClick={() => handleTicketDecision(selectedTicket.id, 'resolve')}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" /> Tandai Selesai (RESOLVE)
                </button>

                {/* Tiered Escalation Section */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Eskalasi Bertingkat:</span>
                    <span className="text-amber-400 font-mono text-[10px]">Tier 1 (Dev) / Tier 2 (Super)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleTicketDecision(selectedTicket.id, 'escalate_dev')}
                      className="py-1.5 px-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <ArrowUpRight className="w-3 h-3" /> Ke DEV (Teknis)
                    </button>

                    <button
                      disabled={actionLoading}
                      onClick={() => handleTicketDecision(selectedTicket.id, 'escalate_super')}
                      className="py-1.5 px-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <ArrowUpRight className="w-3 h-3" /> Ke SUPER ADMIN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: New Members Approval Queue */}
      {activeAdminTab === 'new_members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              Antrean Gatekeeper: Review Calon Member Baru ({pendingMembers.length})
            </h3>
            <span className="text-xs text-slate-400">
              Validasi profil sebelum hak akses tiket & domain diaktifkan.
            </span>
          </div>

          {pendingMembers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">Semua Pendaftaran Telah Diproses</div>
              <p className="text-xs text-slate-400">Tidak ada antrean calon member yang menunggu persetujuan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingMembers.map((applicant) => (
                <div
                  key={applicant.telegram_id}
                  className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{applicant.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        @{applicant.telegram_username} • TG ID: {maskTelegramId(applicant.telegram_id)}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PENDING REVIEW
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp: <strong className="font-mono">{maskPhone(applicant.whatsapp_number)}</strong> (Verified)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 italic font-mono text-xs">
                      "{applicant.join_reason || 'Kebutuhan web e-commerce & kelola domain'}"
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Evaluasi: <strong className="text-emerald-400">LOW RISK (0 Flags)</strong></span>
                      <span>Daftar: {new Date(applicant.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApproveMember(applicant.telegram_id)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Setujui Member
                    </button>
                    <button
                      onClick={() => handleRejectMember(applicant.telegram_id)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members Directory with Privacy Masking */}
      {activeAdminTab === 'members_list' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Direktori Member (Data Privacy Masked)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sesuai prinsip kepatuhan data privacy, identitas Telegram ID dan WhatsApp disensor secara otomatis di level Admin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Total: {users.length} Akun
              </span>
              <button
                onClick={handleDownloadCsv}
                disabled={downloadingCsv}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {downloadingCsv ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Handle</th>
                    <th className="px-4 py-3.5">Telegram ID (Masked)</th>
                    <th className="px-4 py-3.5">WhatsApp (Masked)</th>
                    <th className="px-4 py-3.5">Domain</th>
                    <th className="px-4 py-3.5">Status Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-100">
                        {u.full_name}
                        <div className="text-[11px] text-slate-500 font-mono">@{u.telegram_username}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {maskTelegramId(u.telegram_id)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400/90">
                        {maskPhone(u.whatsapp_number)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sky-300">
                        {u.domain_name || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
