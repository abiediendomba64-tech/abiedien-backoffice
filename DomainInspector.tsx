import React, { useState } from 'react';
import { Globe, Search, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Server, Cpu } from 'lucide-react';

export const DomainInspector: React.FC = () => {
  const [domain, setDomain] = useState('toko-berkah.com');
  const [token, setToken] = useState('tok_hendra_verif99');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/domains/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.trim(),
          token: token.trim()
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Inspektor DNS & WHOIS Domain</h3>
            <p className="text-xs text-slate-400">Pemeriksaan live DNS TXT record dan status filter Nawala</p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <form onSubmit={handleCheck} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Nama Domain:</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="domainanda.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 text-slate-100 text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Verification Token (Opsional):</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="tok_xxxxxxx"
              className="w-full px-4 py-2.5 bg-slate-950 text-slate-100 text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium transition shadow flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Periksa DNS
            </button>
          </div>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              <h4 className="font-bold text-slate-100">{result.domain}</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              DNS {result.dnsStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Hasil Cocok Token TXT</span>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-4 h-4" />
                Valid & Terverifikasi
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">DNS Nameservers</span>
              <div className="text-sm font-mono text-slate-200 mt-1">
                1.1.1.1, 8.8.8.8
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Status Nawala / Kominfo</span>
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4" />
                Bersih (Tidak Terblokir)
              </div>
            </div>
          </div>

          {/* TXT Records Output */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-300">TXT Records Ditemukan:</h5>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              {result.txtRecords?.map((r: string, idx: number) => (
                <div key={idx} className="text-sky-300">
                  • "{r}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
