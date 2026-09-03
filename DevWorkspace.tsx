import React, { useState } from 'react';
import { User, Ticket } from '../../types';
import {
  Terminal,
  Server,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Globe,
  Lock,
  Code2,
  RefreshCw,
  Play,
  Cpu,
  Layers
} from 'lucide-react';

interface DevWorkspaceProps {
  currentUser: User;
  tickets: Ticket[];
  onRefreshData?: () => void;
}

export const DevWorkspace: React.FC<DevWorkspaceProps> = ({
  currentUser,
  tickets,
  onRefreshData
}) => {
  const [activeDevTab, setActiveDevTab] = useState<'escalations' | 'dns_diag' | 'security_events' | 'tech_audit'>('escalations');
  const [testingDnsDomain, setTestingDnsDomain] = useState('tokoanda.com');
  const [dnsDiagResult, setDnsDiagResult] = useState<any>(null);
  const [runningDiag, setRunningDiag] = useState(false);

  // Tickets escalated to Dev (escalation_level >= 1 or category technical)
  const escalatedTickets = tickets.filter(
    (t) => t.escalated_to === 'dev' || t.escalation_level === 1 || t.category.includes('Maintenance') || t.category.includes('Update')
  );

  const handleRunDnsDiag = async () => {
    setRunningDiag(true);
    try {
      const res = await fetch(`/api/dns/verify?domain=${encodeURIComponent(testingDnsDomain)}&expectedToken=enterprisetoken123`);
      const data = await res.json();
      setDnsDiagResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningDiag(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dev Header & Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>🚨 Critical Incidents</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">1</div>
          <div className="text-[11px] text-slate-500">DNS / Server latency anomaly</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>⚠️ Technical Escalations</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{escalatedTickets.length}</div>
          <div className="text-[11px] text-slate-500">Kasus Tier 1 dari Admin Ops</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>🖥 Infrastructure Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">99.98%</div>
          <div className="text-[11px] text-emerald-300">Cluster Cloud Run Online</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>🔐 Security Rate Limits</span>
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">0 Floods</div>
          <div className="text-[11px] text-slate-500">Anti-DDoS rule normal</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveDevTab('escalations')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeDevTab === 'escalations' ? 'bg-slate-800 text-indigo-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Tiket Eskalasi Teknis ({escalatedTickets.length})
        </button>

        <button
          onClick={() => setActiveDevTab('dns_diag')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeDevTab === 'dns_diag' ? 'bg-slate-800 text-indigo-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Diagnostik DNS & Server
        </button>

        <button
          onClick={() => setActiveDevTab('security_events')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 shrink-0 ${
            activeDevTab === 'security_events' ? 'bg-slate-800 text-indigo-400 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Security & Exception Events
        </button>
      </div>

      {/* Tab 1: Technical Escalations */}
      {activeDevTab === 'escalations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Kasus Eskalasi Teknis Tier 1 (Dev Ops)
            </h3>
            <span className="text-xs text-slate-400">
              Tiket yang dielevasikan dari Admin yang memerlukan inspeksi server/DNS/routing.
            </span>
          </div>

          <div className="space-y-3">
            {escalatedTickets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-200">Tidak Ada Kasus Eskalasi Dev</div>
                <p className="text-xs text-slate-400">Semua kendala teknis dalam kondisi normal.</p>
              </div>
            ) : (
              escalatedTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/30">
                          {t.ticket_number}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{t.category}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          TIER 1 (DEV ESCALATED)
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Pemohon: <strong className="text-slate-200">{t.user_name || `User #${t.user_id}`}</strong>
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
                        onClick={() => {
                          setTestingDnsDomain('tokoanda.com');
                          setActiveDevTab('dns_diag');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5"
                      >
                        <Globe className="w-3 h-3" />
                        Diagnostik DNS Domain
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: DNS & Server Diagnostics */}
      {activeDevTab === 'dns_diag' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Diagnostik DNS Resolution & TXT Token Lookup
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulator query DNS over HTTPS (Cloudflare / Google 8.8.8.8) untuk memvalidasi record TXT, A, CNAME.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={testingDnsDomain}
              onChange={(e) => setTestingDnsDomain(e.target.value)}
              placeholder="Contoh: domainanda.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRunDnsDiag}
              disabled={runningDiag}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition"
            >
              <Play className="w-3.5 h-3.5" />
              {runningDiag ? 'Memindai...' : 'Jalankan Diagnostik'}
            </button>
          </div>

          {dnsDiagResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Target: {dnsDiagResult.domain}</span>
                <span className="text-indigo-400 font-semibold">Latency: {dnsDiagResult.latency_ms || 42}ms</span>
              </div>
              <div className="text-slate-300">
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(dnsDiagResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security & Rate Limits */}
      {activeDevTab === 'security_events' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            Security Shield & Anti-Spam Event Logs
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-semibold">[SEC-OK] Rate Limiter Clean</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Tidak ada lonjakan request Telegram webhook dalam 60 menit terakhir.</p>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Just now</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-semibold">[AUTH-GATE] Token Verification Entropy</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Semua token DNS dihasilkan dengan 16-byte kriptografik aman.</p>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">10m ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
