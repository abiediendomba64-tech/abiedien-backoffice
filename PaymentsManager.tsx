import React, { useState, useEffect } from 'react';
import { Payment } from '../types';
import { CreditCard, CheckCircle2, XCircle, Clock, Eye, ShieldCheck, FileText } from 'lucide-react';

interface PaymentsManagerProps {
  onRefresh: () => void;
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({ onRefresh }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/payments/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_notes: `Diverifikasi oleh Super Admin pada ${new Date().toLocaleDateString()}`
        })
      });
      if (res.ok) {
        fetchPayments();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Pusat Verifikasi Pembayaran & Membership</h3>
            <p className="text-xs text-slate-400">Pemeriksaan bukti transfer dan konfirmasi manual admin</p>
          </div>
        </div>
      </div>

      {/* Grid of Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">ID #{p.id}</span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
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

              <div>
                <h4 className="text-sm font-semibold text-slate-100">{p.user_name || `User #${p.user_id}`}</h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Telegram ID: <strong className="text-slate-300">{p.user_id}</strong> • {p.domain || '-'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Nominal Transfer:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{p.amount || 'Rp 150.000'}</span>
              </div>

              {/* Proof Preview button */}
              {p.proof_file_id && (
                <button
                  onClick={() => setSelectedProof(p.proof_file_id)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  Lihat Lampiran Bukti Transfer
                </button>
              )}

              {p.admin_notes && (
                <div className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                  Catatan: {p.admin_notes}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              {p.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleVerify(p.id, 'verified')}
                    disabled={updatingId === p.id}
                    className="flex-1 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Setujui (Verify)
                  </button>
                  <button
                    onClick={() => handleVerify(p.id, 'rejected')}
                    disabled={updatingId === p.id}
                    className="py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-200 transition"
                  >
                    Tolak
                  </button>
                </>
              ) : (
                <div className="w-full text-center text-xs text-slate-500 py-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Telah Diproses
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-100">Pratinjau Bukti Transfer</h4>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Tutup
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <img src={selectedProof} alt="Bukti Transfer" className="w-full max-h-96 object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
