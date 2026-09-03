import React, { useState } from 'react';
import { User } from '../../types';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Phone,
  User as UserIcon,
  FileText,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Send,
  Lock,
  AlertCircle
} from 'lucide-react';

interface NewUserWorkspaceProps {
  currentUser?: User;
  user?: User;
  onRefreshData?: () => void;
}

export const NewUserWorkspace: React.FC<NewUserWorkspaceProps> = ({ currentUser, user: propUser, onRefreshData }) => {
  const user = currentUser || propUser || {
    id: 99887766,
    telegram_id: 99887766,
    telegram_username: 'budi_santoso',
    full_name: 'Budi Santoso',
    whatsapp_number: '081298877665',
    domain_name: 'toko-budi.com',
    role: 'new_user',
    is_verified: false,
    domain_verified: false,
    onboarding_status: 'PENDING_REVIEW',
    join_reason: 'Ingin integrasi notifikasi order bot Telegram untuk toko online',
    last_verified_at: null,
    created_at: new Date().toISOString()
  };
  const activeUser = user;
  const [refreshing, setRefreshing] = useState(false);
  const [waInput, setWaInput] = useState(activeUser.whatsapp_number || '');
  const [reasonInput, setReasonInput] = useState(activeUser.join_reason || '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${activeUser.telegram_id}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: waInput,
          joinReason: reasonInput
        })
      });
      if (res.ok) {
        setSavedNotice('✅ Profil pendaftaran berhasil diperbarui dan dikirim ke Admin!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefreshData) await onRefreshData();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Notice */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Akun Menunggu Review (Gatekeeper Review)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PENDING REVIEW
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Prinsip Human-in-the-Loop: Permohonan akun Anda sedang ditinjau oleh Admin Operasional sebelum hak akses tiket & domain diaktifkan.
            </p>
          </div>
        </div>
      </div>

      {/* Account Info & Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-sky-400" />
              Identitas Akun
            </h3>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Refresh Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Telegram ID:</span>
              <span className="font-mono text-slate-200 font-medium">{activeUser.telegram_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Username:</span>
              <span className="text-slate-200 font-medium">@{activeUser.telegram_username}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Nama Lengkap:</span>
              <span className="text-slate-200 font-medium">{activeUser.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Role Sistem:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                {activeUser.role} (Tier 0)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Status Gate:</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> PENDING REVIEW
              </span>
            </div>
          </div>
        </div>

        {/* Verification & Risk Assessment */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              Verifikasi Kontak
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nomor WhatsApp:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terdata
                </span>
              </div>
              <div className="font-mono text-sm text-slate-100 font-bold">
                {user.whatsapp_number || 'Belum Diisi'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-[11px]">Evaluasi Risiko Otomatis:</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-semibold">Skor Risiko:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LOW RISK (0 Flags)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Restrictions Notice */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 text-rose-300">
              <Lock className="w-4 h-4 text-rose-400" />
              Fitur Yang Dibatasi
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Buat Tiket Layanan (Terkunci)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Order & Kelola Web Domain (Terkunci)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Posting Forum Komunitas (Terkunci)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Akses Queue Admin (Dilarang)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
            Fitur akan terbuka otomatis begitu Admin Operasional menyetujui pendaftaran Anda.
          </div>
        </div>
      </div>

      {/* Form Lengkapi / Perbarui Pendaftaran */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Lengkapi & Perbarui Data Pendaftaran
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Pastikan data nomor WhatsApp dan tujuan bergabung Anda jelas untuk mempercepat proses verifikasi oleh tim Admin.
          </p>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {savedNotice}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nomor WhatsApp Aktif <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={user.full_name}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Alasan Bergabung / Keperluan Layanan <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Contoh: Saya memerlukan layanan untuk kelola domain bisnis toko online dan bantuan support teknis web."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Perubahan Data ke Admin
            </button>
          </div>
        </form>
      </div>

      {/* FAQ & Help Section */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          Pertanyaan Umum (FAQ) Member Baru
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="font-semibold text-slate-200">Berapa lama proses verifikasi?</div>
            <div className="text-slate-400 leading-relaxed">
              Admin operasional biasanya memproses antrean pendaftaran dalam waktu 5-15 menit pada jam kerja.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="font-semibold text-slate-200">Bagaimana cara mengetahui akun disetujui?</div>
            <div className="text-slate-400 leading-relaxed">
              Bot Telegram akan mengirimkan notifikasi instan begitu Admin menekan tombol persetujuan di dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
