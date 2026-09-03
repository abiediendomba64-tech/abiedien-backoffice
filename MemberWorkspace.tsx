import React, { useState } from 'react';
import { User, Ticket, ForumTopic, Payment } from '../../types';
import { classifyTicketOrMessage, getPriorityMeta, getRouteMeta } from '../../lib/riskEngine';
import {
  Ticket as TicketIcon,
  PlusCircle,
  Clock,
  CheckCircle,
  Globe,
  CreditCard,
  MessageSquare,
  User as UserIcon,
  HelpCircle,
  Send,
  AlertCircle,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';

interface MemberWorkspaceProps {
  currentUser?: User;
  user?: User;
  tickets: Ticket[];
  onRefreshData?: () => void;
}

export const MemberWorkspace: React.FC<MemberWorkspaceProps> = ({ currentUser, user: propUser, tickets, onRefreshData }) => {
  const user = currentUser || propUser || {
    id: 55667788,
    telegram_id: 55667788,
    telegram_username: 'hendrawan',
    full_name: 'Hendra Gunawan',
    whatsapp_number: '081233445566',
    domain_name: 'bisnis-hendra.com',
    role: 'member',
    is_verified: true,
    domain_verified: true,
    onboarding_status: 'VERIFIED',
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  const activeUser = user;
  const [activeTab, setActiveTab] = useState<'create_ticket' | 'my_tickets' | 'my_domains' | 'payments' | 'forum' | 'profile'>('my_tickets');
  
  // Filter tickets STRICTLY to this member only!
  const myTickets = tickets.filter(
    (t) => t.user_id === activeUser.id || t.user_id === activeUser.telegram_id || (t.user_name && t.user_name.includes(activeUser.full_name))
  );

  // New ticket form state
  const [category, setCategory] = useState('🌐 Domain');
  const [ticketMessage, setTicketMessage] = useState('');
  const classification = classifyTicketOrMessage(ticketMessage, category);
  const autoPriority = classification.priority;
  const autoRoute = classification.route_target;
  const priorityMeta = getPriorityMeta(autoPriority);
  const routeMeta = getRouteMeta(autoRoute);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Payment upload state
  const [paymentAmount, setPaymentAmount] = useState('150000');
  const [paymentDomain, setPaymentDomain] = useState(activeUser.domain_name || 'bisnisanda.com');
  const [paymentProofUrl, setPaymentProofUrl] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    if (!showDraftConfirm) {
      setShowDraftConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.telegram_id,
          userName: user.full_name,
          category,
          message: ticketMessage,
          priority: autoPriority
        })
      });
      if (res.ok) {
        setSubmitSuccess('🎉 Tiket berhasil dibuat dan masuk ke antrean Admin!');
        setTicketMessage('');
        setShowDraftConfirm(false);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSubmitSuccess(null), 5000);
        setActiveTab('my_tickets');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.telegram_id,
          userName: user.full_name,
          domain: paymentDomain,
          amount: paymentAmount,
          proofFileId: 'tf_' + Date.now(),
          proofImageUrl: paymentProofUrl
        })
      });
      if (res.ok) {
        setPaymentNotice('✅ Bukti pembayaran berhasil diunggah! Menunggu verifikasi Admin/Super Admin.');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setPaymentNotice(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-900 to-slate-900 border border-sky-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Portal Member: {user.full_name}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VERIFIED MEMBER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Domain: <span className="font-mono text-sky-300 font-semibold">{user.domain_name || 'Belum didaftarkan'}</span> • TG: @{user.telegram_username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('create_ticket')}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Buat Tiket Baru
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('my_tickets')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'my_tickets' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TicketIcon className="w-3.5 h-3.5" />
          Tiket Saya ({myTickets.length})
        </button>

        <button
          onClick={() => setActiveTab('create_ticket')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'create_ticket' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Buat Tiket Baru
        </button>

        <button
          onClick={() => setActiveTab('my_domains')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'my_domains' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Domain & Web Saya
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'payments' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Upload Pembayaran
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'profile' ? 'bg-slate-800 text-sky-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          Profil Saya
        </button>
      </div>

      {/* Tab 1: My Tickets */}
      {activeTab === 'my_tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-sky-400" />
              Daftar Tiket Permohonan & Bantuan Anda
            </h3>
            <span className="text-xs text-slate-400">
              Menampilkan {myTickets.length} tiket milik Anda
            </span>
          </div>

          {myTickets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">Belum Ada Tiket Terbuka</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Anda belum pernah mengajukan tiket permohonan domain, koreksi web, atau bantuan teknis.
              </p>
              <button
                onClick={() => setActiveTab('create_ticket')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Buat Tiket Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {t.ticket_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                        "{t.message}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {t.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          🟡 Pending (Menunggu Admin)
                        </span>
                      )}
                      {t.status === 'assigned' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          🔵 Sedang Ditangani Admin
                        </span>
                      )}
                      {t.status === 'resolved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          🟢 Selesai / Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin Reply or Resolution Note */}
                  {t.admin_reply && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Jawaban Tim Admin:
                      </div>
                      <p className="text-slate-200">{t.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Dibuat: {new Date(t.created_at).toLocaleString()}</span>
                    <span>Prioritas: <strong className="uppercase text-slate-200">{t.priority || 'medium'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create Ticket */}
      {activeTab === 'create_ticket' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 max-w-3xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sky-400" />
              Buat Tiket Permohonan Baru
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sistem akan membuat draft otomatis dan menindaklanjuti permintaan Anda ke antrean Admin.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              {submitSuccess}
            </div>
          )}

          {showDraftConfirm ? (
            /* Human-in-the-loop Draft Confirmation Card */
            <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Konfirmasi Draft Tiket Anda
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="font-semibold text-slate-200">{category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 items-center">
                  <span className="text-slate-400">Prioritas Otomatis (Risk Engine):</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priorityMeta.colorClass}`}>
                    {priorityMeta.label}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 items-center">
                  <span className="text-slate-400">Routing Target:</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${routeMeta.badgeClass}`}>
                    {routeMeta.label}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/20 text-[11px] text-sky-200 flex items-start gap-2">
                  <Bot className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Analisis Sistem:</strong> {classification.explanation}
                  </div>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Rincian Permohonan:</span>
                  <p className="p-3 rounded-lg bg-slate-900 text-slate-200 italic font-mono text-xs">
                    "{ticketMessage}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDraftConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Edit Kembali
                </button>
                <button
                  type="button"
                  onClick={handleCreateTicketSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Mengirim...' : 'Konfirmasi & Kirim ke Admin'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kategori Request</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="🌐 Domain">🌐 Order / Pengajuan Domain Baru</option>
                    <option value="🔄 Web Update">🔄 Koreksi / Ganti Nama Domain</option>
                    <option value="🛠 Maintenance">🛠 Maintenance & Kendala Server</option>
                    <option value="💳 Pembayaran">💳 Bantuan Pembayaran & Billing</option>
                    <option value="❓ Bantuan">❓ Pertanyaan Umum</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Tingkat Prioritas (Risk Engine)</span>
                    <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Auto-Synced
                    </span>
                  </label>
                  <div className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between ${priorityMeta.colorClass}`}>
                    <span className="font-bold">🤖 Otomatis — {priorityMeta.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Routing: {routeMeta.label.split(' ')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Rincian Permohonan / Masalah <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Contoh: Tolong ganti web Cobra81 dengan Cobramax, atau buatkan domain tokoonline.com"
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Pratinjau Draft Tiket
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: My Domains */}
      {activeTab === 'my_domains' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Domain & Web Anda yang Terhubung
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-white font-mono">{user.domain_name || 'tokoanda.com'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Terhubung sejak: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> DNS Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Status SSL:</span>
                  <span className="text-emerald-400 font-semibold">Aktif (Let's Encrypt)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Server IP Target:</span>
                  <span className="text-slate-200 font-mono font-semibold">103.145.226.88</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Rolling Expiry:</span>
                  <span className="text-sky-300 font-semibold">28 Hari Tersisa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Payments Upload */}
      {activeTab === 'payments' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 max-w-2xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Unggah Bukti Transfer Pembayaran
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Kirimkan bukti transfer untuk perpanjangan domain, hosting, atau maintenance web.
            </p>
          </div>

          {paymentNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              {paymentNotice}
            </div>
          )}

          <form onSubmit={handleUploadPayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nominal Transfer (IDR)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Untuk Domain / Layanan</label>
                <input
                  type="text"
                  value={paymentDomain}
                  onChange={(e) => setPaymentDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">URL / Preview Bukti Transfer</label>
              <input
                type="text"
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono text-[11px]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={paymentProofUrl}
                alt="Bukti Transfer"
                className="w-16 h-16 rounded-lg object-cover border border-slate-700"
              />
              <div className="text-xs text-slate-400">
                <div className="text-slate-200 font-semibold">Pratinjau Bukti Pembayaran</div>
                <span>Foto struk/screenshot transfer bank atau e-wallet.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {submittingPayment ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-w-2xl mx-auto">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-sky-400" />
            Informasi Profil & Keanggotaan
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Nama Lengkap:</span>
              <span className="text-slate-100 font-semibold">{user.full_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Telegram ID:</span>
              <span className="font-mono text-slate-200 font-semibold">{user.telegram_id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Username Telegram:</span>
              <span className="text-slate-200 font-semibold">@{user.telegram_username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">WhatsApp Terverifikasi:</span>
              <span className="font-mono text-emerald-400 font-semibold">{user.whatsapp_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Status Keanggotaan:</span>
              <span className="text-emerald-400 font-bold">VERIFIED MEMBER (Tier 2)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
