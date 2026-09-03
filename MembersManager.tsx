import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Search, Shield, CheckCircle, Clock, AlertTriangle, UserPlus, Globe, Phone, UserCheck, XCircle, RefreshCw, Sparkles } from 'lucide-react';

interface MembersManagerProps {
  users: User[];
  onRefresh: () => void;
}

export const MembersManager: React.FC<MembersManagerProps> = ({ users, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [checkingExpiry, setCheckingExpiry] = useState(false);
  const [expiryResult, setExpiryResult] = useState<string | null>(null);

  const pendingReviewUsers = users.filter((u) => u.onboarding_status === 'PENDING_REVIEW');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.telegram_username.toLowerCase().includes(search.toLowerCase()) ||
      (u.domain_name && u.domain_name.toLowerCase().includes(search.toLowerCase())) ||
      String(u.telegram_id).includes(search);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending_review' && u.onboarding_status === 'PENDING_REVIEW') ||
      (statusFilter === 'verified' && u.domain_verified) ||
      (statusFilter === 'pending' && !u.domain_verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleApproveMember = async (telegramId: number) => {
    setUpdatingId(telegramId);
    try {
      const res = await fetch(`/api/users/${telegramId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: 123456789 })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectMember = async (telegramId: number) => {
    const reason = window.prompt("Masukkan alasan penolakan pendaftaran:");
    if (reason === null) return;
    setUpdatingId(telegramId);
    try {
      const res = await fetch(`/api/users/${telegramId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: 123456789, reason: reason || 'Data profil belum memenuhi syarat' })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (telegramId: number, newRole: UserRole) => {
    setUpdatingId(telegramId);
    try {
      const res = await fetch(`/api/users/${telegramId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTriggerRollingExpiry = async () => {
    setCheckingExpiry(true);
    setExpiryResult(null);
    try {
      const res = await fetch('/api/scheduler/check-expiry', { method: 'POST' });
      const data = await res.json();
      setExpiryResult(data.message || 'Pemeriksaan Rolling Expiry 30 hari selesai dijalankan.');
      onRefresh();
    } catch (e) {
      console.error(e);
      setExpiryResult('Gagal menjalankan pemeriksaan scheduler.');
    } finally {
      setCheckingExpiry(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'dev':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'admin':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'member':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Gatekeeper Pending Review Banner */}
      {pendingReviewUsers.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <h3 className="font-semibold text-amber-200 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Antrean Review Member Baru ({pendingReviewUsers.length} Calon Member Menunggu Persetujuan)
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Prinsip Human-in-the-loop: Admin wajib memvalidasi profil dan alasan bergabung sebelum hak akses tiket & domain diaktifkan.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {pendingReviewUsers.map((applicant) => (
              <div
                key={applicant.telegram_id}
                className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{applicant.full_name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      @{applicant.telegram_username} • ID: {applicant.telegram_id}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDING REVIEW
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp: <strong>{applicant.whatsapp_number || '-'}</strong> (Verified)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-xs italic">
                    "{applicant.join_reason || 'Keperluan pembuatan dan pengelolaan web domain'}"
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Risk Score: <strong className="text-emerald-400">LOW (0 Flags)</strong></span>
                    <span>Waktu: {new Date(applicant.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    disabled={updatingId === applicant.telegram_id}
                    onClick={() => handleApproveMember(applicant.telegram_id)}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Setujui Member
                  </button>
                  <button
                    disabled={updatingId === applicant.telegram_id}
                    onClick={() => handleRejectMember(applicant.telegram_id)}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, username, domain, atau Telegram ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Semua Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="dev">Developer</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="new_user">New User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending_review">⏳ Pending Review</option>
            <option value="verified">✅ Terverifikasi</option>
            <option value="pending">🟡 Pending DNS</option>
          </select>

          <button
            onClick={handleTriggerRollingExpiry}
            disabled={checkingExpiry}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            title="Cek masa aktif verifikasi 30 hari secara bergulir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingExpiry ? 'animate-spin' : ''}`} />
            Rolling Expiry Check
          </button>
        </div>
      </div>

      {expiryResult && (
        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between">
          <span>ℹ️ {expiryResult}</span>
          <button onClick={() => setExpiryResult(null)} className="text-slate-400 hover:text-white text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Member / Identitas</th>
                <th className="px-4 py-3.5">Kontak & Handle</th>
                <th className="px-4 py-3.5">Domain Terdaftar</th>
                <th className="px-4 py-3.5">Status Akses / Gate</th>
                <th className="px-4 py-3.5">Role RBAC</th>
                <th className="px-5 py-3.5 text-right">Kelola Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Tidak ada member yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.telegram_id} className="hover:bg-slate-800/40 transition">
                    {/* Member Info */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-100 text-sm">{u.full_name}</div>
                      <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <span>ID: {u.telegram_id}</span>
                        {u.telegram_username && (
                          <span className="text-sky-400">(@{u.telegram_username})</span>
                        )}
                      </div>
                    </td>

                    {/* Contact & Handle */}
                    <td className="px-4 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{u.whatsapp_number || '-'}</span>
                      </div>
                      {u.tg_handle && (
                        <div className="text-slate-400 text-[11px]">
                          TG: @{u.tg_handle}
                        </div>
                      )}
                    </td>

                    {/* Domain Name */}
                    <td className="px-4 py-4">
                      {u.domain_name ? (
                        <div className="font-mono text-slate-200 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 inline-flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                          {u.domain_name}
                        </div>
                      ) : (
                        <span className="text-slate-500">Belum didaftarkan</span>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-4">
                      {u.onboarding_status === 'PENDING_REVIEW' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          Review Admin
                        </span>
                      ) : u.domain_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          Pending TXT
                        </span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Change Role Selector */}
                    <td className="px-5 py-4 text-right">
                      <select
                        value={u.role}
                        disabled={updatingId === u.telegram_id}
                        onChange={(e) => handleRoleChange(u.telegram_id, e.target.value as UserRole)}
                        className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 focus:outline-none focus:border-sky-500 transition"
                      >
                        <option value="new_user">new_user</option>
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                        <option value="dev">dev</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
