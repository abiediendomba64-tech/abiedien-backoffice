import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { Ticket as TicketIcon, CheckCircle2, Clock, MessageSquare, UserCheck, Filter, Send, X } from 'lucide-react';

interface TicketsManagerProps {
  tickets: Ticket[];
  onRefresh: () => void;
}

export const TicketsManager: React.FC<TicketsManagerProps> = ({ tickets, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleResolve = async (id: number, reply?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          admin_reply: reply || 'Tiket telah diselesaikan via Dashboard Admin.'
        })
      });
      if (res.ok) {
        setSelectedTicket(null);
        setReplyText('');
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (id: number) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'assigned',
          assigned_to: 123456789
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'assigned':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <TicketIcon className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Pusat Layanan & Tiket Support</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Semua ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Pending ({tickets.filter((t) => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Selesai ({tickets.filter((t) => t.status === 'resolved').length})
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTickets.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-sky-400">{t.ticket_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                    {t.category}
                  </span>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${getStatusBadge(t.status)}`}>
                  {t.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Pengirim ID: <strong className="text-slate-300">{t.user_id}</strong></span>
                <span>•</span>
                <span>{new Date(t.created_at).toLocaleString()}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                {t.message}
              </div>

              {t.admin_reply && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Balasan Resmi Admin:
                  </div>
                  {t.admin_reply}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
              {t.status === 'pending' && (
                <button
                  onClick={() => handleAssign(t.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Ambil Tiket
                </button>
              )}

              {t.status !== 'resolved' && (
                <button
                  onClick={() => setSelectedTicket(t)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Balas & Selesaikan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-slate-100">Balas Tiket {selectedTicket.ticket_number}</h3>
                <p className="text-xs text-slate-400">Pengirim: User #{selectedTicket.user_id} • {selectedTicket.category}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300">
              <strong>Pesan User:</strong> {selectedTicket.message}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Tulis Jawaban / Solusi Admin:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tuliskan jawaban yang akan dikirimkan kepada pengguna..."
                rows={4}
                className="w-full p-3 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleResolve(selectedTicket.id, replyText)}
                disabled={submitting || !replyText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim & Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
