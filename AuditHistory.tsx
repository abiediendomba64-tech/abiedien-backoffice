import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { FileText, RefreshCw, Search, ChevronLeft, ChevronRight, ShieldCheck, Database } from 'lucide-react';

interface AuditHistoryProps {
  initialLogs?: AuditLog[];
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({ initialLogs }) => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs || []);
  const [loading, setLoading] = useState<boolean>(!initialLogs || initialLogs.length === 0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLogs || initialLogs.length === 0) {
      fetchAuditLogs();
    }
  }, [initialLogs]);

  // Filter logs based on search term (action, target_id, or admin_id)
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(term);
    const targetMatch = String(log.target_id || '').toLowerCase().includes(term);
    const actorMatch = String(log.admin_id || '').toLowerCase().includes(term);
    return actionMatch || targetMatch || actorMatch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Audit Trail & System Accountability (Supabase `audit_logs`)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only immutable record of all administrative actions, ticket decisions, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aksi, actor ID, target..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Log ID</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor ID (Admin/User)</th>
                <th className="px-4 py-3.5">Action Type</th>
                <th className="px-4 py-3.5">Target Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Memuat data audit dari Supabase...
                  </td>
                </tr>
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Tidak ada log audit yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 text-slate-500">#{log.id}</td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-purple-300">
                      Actor #{log.admin_id}
                    </td>
                    <td className="px-4 py-3.5 text-slate-100 font-bold">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-sky-300 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-emerald-400 font-mono">
                      {log.target_id || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Menampilkan {filteredLogs.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} entri audit</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 text-xs focus:outline-none"
            >
              <option value={5}>5 per hal</option>
              <option value={10}>10 per hal</option>
              <option value={20}>20 per hal</option>
              <option value={50}>50 per hal</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 font-mono text-slate-200">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
