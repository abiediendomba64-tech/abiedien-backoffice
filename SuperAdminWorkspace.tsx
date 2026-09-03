import React, { useState, useEffect } from 'react';
import { User, Ticket, Payment, AuditLog, DashboardStats, UserRole } from '../../types';
import { SupabaseSqlConnector } from '../SupabaseSqlConnector';
import { AuditHistory } from './AuditHistory';
import {
  ShieldAlert,
  Crown,
  DollarSign,
  Lock,
  Database,
  Radio,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  KeyRound,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Send
} from 'lucide-react';

interface SuperAdminWorkspaceProps {
  currentUser: User;
  users: User[];
  tickets: Ticket[];
  stats: DashboardStats;
  onRefreshData?: () => void;
}

export const SuperAdminWorkspace: React.FC<SuperAdminWorkspaceProps> = ({
  currentUser,
  users,
  tickets,
  stats,
  onRefreshData
}) => {
  const [activeSuperTab, setActiveSuperTab] = useState<'risk_center' | 'financial' | 'roles' | 'audit_trail' | 'supabase_db'>('risk_center');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [updatingUserRole, setUpdatingUserRole] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'member' | 'admin'>('all');
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Fetch payments and audit logs
  const fetchSuperData = async () => {
    try {
      const [payRes, audRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/audit-logs')
      ]);
      if (payRes.ok) setPayments(await payRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSuperData();
  }, []);

  const handleRoleChange = async (telegramId: number, newRole: UserRole) => {
    setUpdatingUserRole(telegramId);
    try {
      const res = await fetch(`/api/users/${telegramId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          adminId: currentUser.telegram_id
        })
      });
      if (res.ok) {
        setSuccessMsg(`Otoritas pengguna #${telegramId} berhasil diubah menjadi [${newRole}].`);
        if (onRefreshData) onRefreshData();
        fetchSuperData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingUserRole(null);
    }
  };

  const handleVerifyPayment = async (paymentId: number, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: status === 'verified' ? 'Disetujui oleh Super Admin Oversight' : 'Bukti transfer tidak valid/gagal audit'
        })
      });
      if (res.ok) {
        setSuccessMsg(`Status pembayaran #${paymentId} diperbarui menjadi [${status.toUpperCase()}].`);
        fetchSuperData();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          targetRole: broadcastTarget === 'all' ? undefined : broadcastTarget,
          adminId: currentUser.telegram_id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Broadcast pesan berhasil terkirim ke ${data.sentCount || 'semua'} akun!`);
        setBroadcastMessage('');
        fetchSuperData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcastSending(false);
    }
  };

  // High risk tickets escalated to Super Admin
  const superRiskTickets = tickets.filter(
    (t) => t.escalated_to === 'super_admin' || t.escalation_level === 2 || t.priority === 'high'
  );

  return (
    <div className="space-y-6">
      {/* Super Admin Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-lg space-y-1">
          <div className="text-xs text-purple-300 flex items-center justify-between">
            <span>🛡 Critical Risk Items</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {superRiskTickets.length || 1}
          </div>
          <div className="text-[11px] text-slate-500">Kasus eskalasi tertinggi</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>💰 Financial Verification</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {payments.filter((p) => p.status === 'pending').length}
          </div>
          <div className="text-[11px] text-slate-500">Pending audit kas/transfer</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>👑 Role Governance</span>
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            5 Tier RBAC
          </div>
          <div className="text-[11px] text-purple-400/80">Otoritas tunggal Super Admin</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>📜 Audit Logs Total</span>
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500">Immutable ledger trail</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveSuperTab('risk_center')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeSuperTab === 'risk_center' ? 'bg-slate-800 text-purple-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Pusat Risiko & Eskalasi Tier 2
        </button>

        <button
          onClick={() => setActiveSuperTab('financial')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeSuperTab === 'financial' ? 'bg-slate-800 text-purple-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Audit Keuangan & Pembayaran ({payments.length})
        </button>

        <button
          onClick={() => setActiveSuperTab('roles')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeSuperTab === 'roles' ? 'bg-slate-800 text-purple-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          Manajemen Otoritas Role ({users.length})
        </button>

        <button
          onClick={() => setActiveSuperTab('audit_trail')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeSuperTab === 'audit_trail' ? 'bg-slate-800 text-purple-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Trail Lengkap (Unmasked)
        </button>

        <button
          onClick={() => setActiveSuperTab('supabase_db')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeSuperTab === 'supabase_db' ? 'bg-slate-800 text-purple-300 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Supabase SQL & Schema Engine
        </button>
      </div>

      {/* Alert Notice */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Tab 1: Risk Center */}
      {activeSuperTab === 'risk_center' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Pusat Pengawasan Risiko & Otoritas Tertinggi (Tier 2)</h3>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Super Admin memegang wewenang mutasi role, penyelesaian sengketa keuangan berisiko tinggi, dan audit integritas sistem.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Antrean Kasus Eskalasi Super Admin:
            </h4>

            {superRiskTickets.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Tidak ada tiket berisiko kritis yang memerlukan keputusan Super Admin saat ini.
              </div>
            ) : (
              superRiskTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                          {t.ticket_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{t.category}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          SUPER ADMIN ESCALATED
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Pemohon: <strong className="text-slate-200">{t.user_name}</strong> • User ID: {t.user_id}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{t.message}"
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-500">Dibuat: {new Date(t.created_at).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRoleChange(t.user_id, 'member')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                      >
                        Otorisasi Keputusan
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Financial Audit */}
      {activeSuperTab === 'financial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Audit Keuangan & Verifikasi Mutasi Pembayaran ({payments.length})
            </h3>
            <span className="text-xs text-slate-400">Verifikasi manual invoice & transfer bank</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">{p.user_name || `User #${p.user_id}`}</div>
                    <div className="text-xs text-slate-400 font-mono">Domain: {p.domain || '-'}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      p.status === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : p.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Nominal Transfer:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    Rp {Number(p.amount).toLocaleString('id-ID')}
                  </span>
                </div>

                {p.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleVerifyPayment(p.id, 'verified')}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Sahkan Transfer (Verify)
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(p.id, 'rejected')}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Role Management */}
      {activeSuperTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-400" />
                Manajemen Otoritas & Hirarki RBAC 5-Tier
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hanya Super Admin yang berhak menaikkan/menurunkan role user ke `super_admin`, `dev`, `admin`, `member`, atau `new_user`.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Total Pengguna: {users.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Telegram ID (Unmasked)</th>
                    <th className="px-4 py-3.5">Kontak WhatsApp</th>
                    <th className="px-4 py-3.5">Role Saat Ini</th>
                    <th className="px-5 py-3.5 text-right">Mutasi Role Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-100">
                        {u.full_name}
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {u.telegram_id} • @{u.telegram_username}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400">
                        {u.whatsapp_number || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            u.role === 'super_admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : u.role === 'dev'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : u.role === 'admin'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : u.role === 'member'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          disabled={updatingUserRole === u.telegram_id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.telegram_id, e.target.value as UserRole)}
                          className="bg-slate-950 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                        >
                          <option value="new_user">New User (Tier 0)</option>
                          <option value="member">Member (Tier 1)</option>
                          <option value="admin">Admin Ops (Tier 2)</option>
                          <option value="dev">Dev Tech (Tier 3)</option>
                          <option value="super_admin">Super Admin (Tier 4)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail (Unmasked) */}
      {activeSuperTab === 'audit_trail' && (
        <AuditHistory initialLogs={auditLogs} />
      )}

      {/* Tab 5: Supabase SQL & Schema Engine */}
      {activeSuperTab === 'supabase_db' && (
        <SupabaseSqlConnector />
      )}
    </div>
  );
};
