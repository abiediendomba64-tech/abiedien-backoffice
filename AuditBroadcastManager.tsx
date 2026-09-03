import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { Radio, ShieldAlert, Send, History, CheckCircle, Clock } from 'lucide-react';

interface AuditBroadcastManagerProps {
  onRefresh: () => void;
}

export const AuditBroadcastManager: React.FC<AuditBroadcastManagerProps> = ({ onRefresh }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 123456789,
          username: 'superadmin',
          text: `/broadcast ${broadcastText.trim()}`
        })
      });
      if (res.ok) {
        // Also auto-confirm broadcast in simulation
        await fetch('/api/bot/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 123456789,
            callbackData: 'bcast_confirm'
          })
        });
        setBroadcastText('');
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 4000);
        fetchLogs();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broadcast Sender */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Siaran Pengumuman Massal (Broadcast)</h3>
            <p className="text-xs text-slate-400">Kirim notifikasi pesan serentak ke seluruh member aktif bot</p>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-3">
          <textarea
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Tuliskan pesan pengumuman resmi yang akan dikirim ke seluruh pengguna..."
            rows={3}
            className="w-full p-3 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
            required
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Memerlukan hak akses Admin atau Super Admin
            </span>

            <button
              type="submit"
              disabled={broadcasting || !broadcastText.trim()}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium transition shadow flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {broadcasting ? 'Mengirim Siaran...' : 'Kirim Siaran Sekarang'}
            </button>
          </div>

          {broadcastSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Siaran pengumuman berhasil dikirim ke seluruh member!
            </div>
          )}
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <History className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Audit Trail Log Keamanan & Operasional</h3>
            <p className="text-xs text-slate-400">Rekam jejak setiap perubahan role, verifikasi pembayaran, dan tindakan admin</p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-2 text-xs">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Belum ada riwayat audit log.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between hover:bg-slate-800/20 px-2 rounded-lg transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {log.action}
                    </span>
                    <span className="text-slate-300">Target: <strong className="text-slate-100">{log.target_id}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Oleh Admin ID: <span className="font-mono text-slate-400">{log.admin_id}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
