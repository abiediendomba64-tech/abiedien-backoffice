import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image,
  RefreshCw,
  UserCheck,
  Shield,
  Sparkles,
  Terminal,
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Command,
  ChevronDown,
  Layers,
  HelpCircle,
  CheckCheck,
  Globe,
  Ticket,
  FileText,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { BotChatMessage, UserRole } from '../types';

interface BotSimulatorProps {
  onRefreshData?: () => void;
}

interface QuickScenario {
  id: string;
  category: 'command' | 'nlu_slang' | 'domain' | 'admin';
  categoryLabel: string;
  label: string;
  payload: string;
  description: string;
  roleRequired?: UserRole[];
}

export const BotSimulator: React.FC<BotSimulatorProps> = ({ onRefreshData }) => {
  // Test personas covering the full 5-tier RBAC hierarchy
  const personas = [
    {
      id: 123456789,
      username: 'superadmin',
      name: 'Abiedien (Super Admin)',
      role: 'super_admin' as UserRole,
      badge: '👑 Tier 4',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      id: 44556677,
      username: 'dev_rizky',
      name: 'Rizky Pratama (Dev)',
      role: 'dev' as UserRole,
      badge: '👨‍💻 Tier 3',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 33445566,
      username: 'admin_ops',
      name: 'Fajar Admin (Ops)',
      role: 'admin' as UserRole,
      badge: '⚙️ Tier 2',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    {
      id: 55667788,
      username: 'hendrawan',
      name: 'Hendra Gunawan (Member)',
      role: 'member' as UserRole,
      badge: '🛡 Tier 1',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 99887766,
      username: 'budi_santoso',
      name: 'Budi Santoso (Calon)',
      role: 'new_user' as UserRole,
      badge: '👤 Tier 0',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  ];

  const [activePersona, setActivePersona] = useState(personas[0]);
  const [messages, setMessages] = useState<BotChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'command' | 'nlu_slang' | 'domain' | 'admin'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initialize bot greeting
  useEffect(() => {
    initChat();
  }, [activePersona]);

  // Click outside to close command menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandMenuRef.current && !commandMenuRef.current.contains(e.target as Node)) {
        setShowCommandMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activePersona.id,
          username: activePersona.username,
          text: '/start'
        })
      });
      const data = await res.json();
      if (data.replies) {
        const newMsgs: BotChatMessage[] = [
          {
            id: 'init-usr-' + Date.now(),
            sender: 'user',
            text: '/start',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...data.replies.map((r: any, idx: number) => ({
            id: 'bot-' + Date.now() + '-' + idx,
            sender: 'bot' as const,
            text: r.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyMarkup: r.replyMarkup,
            photoUrl: r.photoUrl,
            isMarkdown: r.isMarkdown
          }))
        ];
        setMessages(newMsgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, photoUrl?: string) => {
    const msg = (textToSend || input).trim();
    if (!msg && !photoUrl) return;

    setShowCommandMenu(false);

    const userMsg: BotChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: msg || (photoUrl ? '📷 [Mengirim Bukti Transfer Rekening]' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoUrl
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activePersona.id,
          username: activePersona.username,
          text: msg,
          photoUrl
        })
      });
      const data = await res.json();

      if (data.replies) {
        const botMsgs: BotChatMessage[] = data.replies.map((r: any, idx: number) => ({
          id: 'bot-' + Date.now() + '-' + idx,
          sender: 'bot' as const,
          text: r.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          replyMarkup: r.replyMarkup,
          photoUrl: r.photoUrl,
          isMarkdown: r.isMarkdown
        }));
        setMessages((prev) => [...prev, ...botMsgs]);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallbackClick = async (callbackData: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activePersona.id,
          callbackData
        })
      });
      const data = await res.json();

      if (data.replies) {
        const botMsgs: BotChatMessage[] = data.replies.map((r: any, idx: number) => ({
          id: 'bot-' + Date.now() + '-' + idx,
          sender: 'bot' as const,
          text: r.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          replyMarkup: r.replyMarkup,
          photoUrl: r.photoUrl,
          isMarkdown: r.isMarkdown
        }));
        setMessages((prev) => [...prev, ...botMsgs]);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Structured test scenarios for professional NLU & Bot verification
  const structuredScenarios: QuickScenario[] = [
    // 1. Standard Commands
    {
      id: 'cmd-start',
      category: 'command',
      categoryLabel: '⚡ Perintah Bot',
      label: '/start',
      payload: '/start',
      description: 'Inisialisasi sesi bot & deteksi peran profil'
    },
    {
      id: 'cmd-menu',
      category: 'command',
      categoryLabel: '⚡ Perintah Bot',
      label: '/menu',
      payload: '/menu',
      description: 'Navigasi inline keyboard & pusat layanan'
    },
    {
      id: 'cmd-status',
      category: 'command',
      categoryLabel: '⚡ Perintah Bot',
      label: '/status',
      payload: '/status',
      description: 'Cek tiket aktif, domain, & riwayat pengajuan'
    },

    // 2. Natural Language & Slang Testing
    {
      id: 'nlu-greeting',
      category: 'nlu_slang',
      categoryLabel: '💬 Sapaan & Slang NLU',
      label: 'Sapaan Informal',
      payload: 'Pak, selamat siang mau tanya',
      description: 'Menguji parser sapaan ("Pak/Bos/Halo")'
    },
    {
      id: 'nlu-status',
      category: 'nlu_slang',
      categoryLabel: '💬 Sapaan & Slang NLU',
      label: 'Tanya Status Web',
      payload: 'Gimana pak domain saya sudah ready belum?',
      description: 'Pertanyaan status tanpa mengetik command'
    },
    {
      id: 'nlu-typo',
      category: 'nlu_slang',
      categoryLabel: '💬 Sapaan & Slang NLU',
      label: 'Revisi / Koreksi Order',
      payload: 'Domain yang kemarin ganti jadi tokosejahtera.com ya pak',
      description: 'Mendeteksi konteks revisi domain & draft update'
    },

    // 3. Domain & Web Management
    {
      id: 'dom-multi',
      category: 'domain',
      categoryLabel: '🌐 Domain & Order',
      label: 'Multi-Domain Request',
      payload: 'Buat domain baru: 1. JAYAPRO.COM 2. GAMBIRTOKO.COM 3. COBRAMAX.ID',
      description: 'Parser multi-line list pemesanan domain'
    },
    {
      id: 'dom-check',
      category: 'domain',
      categoryLabel: '🌐 Domain & Order',
      label: 'Cek DNS Token',
      payload: '/cekdomain tokoanda.com',
      description: 'Query DNS over HTTPS & verifikasi record TXT'
    },

    // 4. Admin & Operational Commands
    {
      id: 'adm-pending',
      category: 'admin',
      categoryLabel: '🛡 Admin Command',
      label: '/pending',
      payload: '/pending',
      description: 'Antrean tiket pending yang butuh respon',
      roleRequired: ['admin', 'super_admin', 'dev']
    },
    {
      id: 'adm-members',
      category: 'admin',
      categoryLabel: '🛡 Admin Command',
      label: '/list_members',
      payload: '/list_members',
      description: 'Daftar ringkas direktori member aktif',
      roleRequired: ['admin', 'super_admin']
    },
    {
      id: 'adm-help',
      category: 'admin',
      categoryLabel: '🛡 Admin Command',
      label: '/bantuan_admin',
      payload: '/bantuan_admin',
      description: 'Panduan lengkap modul operasional admin',
      roleRequired: ['admin', 'super_admin']
    }
  ];

  const filteredScenarios = structuredScenarios.filter((s) => {
    if (activeCategoryTab !== 'all' && s.category !== activeCategoryTab) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-[780px] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
      {/* Top Header - Telegram Client Style */}
      <div className="bg-slate-950/90 backdrop-blur-md px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">
                Enterprise Support Bot
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Bot Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              @EnterpriseSupportBot • NLU Intent Engine
            </p>
          </div>
        </div>

        {/* Persona Switcher Selector */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Simulasi Pengirim:</span>
            <span className="font-semibold text-slate-200">{activePersona.name}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${activePersona.badgeColor}`}>
              {activePersona.badge}
            </span>
          </div>

          <select
            value={activePersona.id}
            onChange={(e) => {
              const p = personas.find((item) => item.id === Number(e.target.value));
              if (p) setActivePersona(p);
            }}
            className="bg-slate-950 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer shadow"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.badge} - {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={initChat}
            title="Reset Chat Session"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Professional Scenario Bar (Categorized Chips replacing messy raw buttons) */}
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Skenario Pengujian (NLU & Command):</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                activeCategoryTab === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveCategoryTab('command')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                activeCategoryTab === 'command' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Commands
            </button>
            <button
              onClick={() => setActiveCategoryTab('nlu_slang')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                activeCategoryTab === 'nlu_slang' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NLU & Slang
            </button>
            <button
              onClick={() => setActiveCategoryTab('domain')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                activeCategoryTab === 'domain' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Domain
            </button>
            <button
              onClick={() => setActiveCategoryTab('admin')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                activeCategoryTab === 'admin' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Action Chip List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filteredScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSendMessage(sc.payload)}
              title={sc.description}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 hover:border-sky-500/50 border border-slate-800 text-slate-300 hover:text-sky-300 text-xs font-medium transition shadow-sm group"
            >
              <span className="font-mono text-[11px] group-hover:text-sky-400">{sc.label}</span>
              <span className="text-[10px] text-slate-500 hidden xl:inline">({sc.categoryLabel.split(' ')[1] || 'Uji'})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area with Telegram Web Wallpaper Pattern */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-4 shadow-xl relative ${
                  isUser
                    ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-br-xs border border-sky-400/20'
                    : 'bg-slate-900/95 border border-slate-800 text-slate-100 rounded-bl-xs backdrop-blur-sm'
                }`}
              >
                {/* Photo attachment if present */}
                {msg.photoUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-700/80 shadow-md">
                    <img
                      src={msg.photoUrl}
                      alt="Attachment Preview"
                      className="max-h-52 w-full object-cover"
                    />
                  </div>
                )}

                {/* Message text with refined Markdown formatting */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans space-y-1">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <div key={idx} className="font-bold text-slate-100 text-sm pb-1 border-b border-slate-800/80 mb-1">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    if (line.startsWith('- ') || line.startsWith('• ')) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 pl-1 py-0.5 text-slate-200">
                          <span className="text-sky-400 font-bold shrink-0">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    if (line.includes('⏳ Slow down!') || line.includes('⚠️')) {
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold my-1 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{line}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className={line === '' ? 'h-2' : ''}>
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Telegram Inline Keyboards */}
                {msg.replyMarkup?.inline_keyboard && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    {msg.replyMarkup.inline_keyboard.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-2 gap-2">
                        {row.map((btn, btnIdx) => (
                          <button
                            key={btnIdx}
                            onClick={() => btn.callback_data && handleCallbackClick(btn.callback_data)}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${
                              row.length === 1 ? 'col-span-2' : ''
                            } bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white border border-slate-700/80 hover:border-sky-400 active:scale-[0.98]`}
                          >
                            <span>{btn.text}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp & Read Status Indicators */}
                <div
                  className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                    isUser ? 'text-sky-200' : 'text-slate-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-200 inline" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 shadow-lg text-slate-400 text-xs flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-slate-300 font-mono text-[11px]">Bot sedang merespon...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Telegram Command Palette Popover (Opens when typing "/" or clicking command icon) */}
      {showCommandMenu && (
        <div
          ref={commandMenuRef}
          className="absolute bottom-20 left-4 right-4 sm:left-6 sm:max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-30 space-y-1.5 animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-sky-400" />
              Menu Perintah Bot Telegram
            </span>
            <button
              onClick={() => setShowCommandMenu(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              Tutup
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs">
            <div
              onClick={() => handleSendMessage('/start')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-sky-400">/start</span>
                <p className="text-[11px] text-slate-400">Inisialisasi bot & onboarding</p>
              </div>
              <span className="text-[10px] text-slate-500">Semua Role</span>
            </div>

            <div
              onClick={() => handleSendMessage('/menu')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-sky-400">/menu</span>
                <p className="text-[11px] text-slate-400">Tampilkan inline navigation menu</p>
              </div>
              <span className="text-[10px] text-slate-500">Semua Role</span>
            </div>

            <div
              onClick={() => handleSendMessage('/status')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-emerald-400">/status</span>
                <p className="text-[11px] text-slate-400">Cek status tiket aktif & verifikasi</p>
              </div>
              <span className="text-[10px] text-emerald-400">Member</span>
            </div>

            <div
              onClick={() => handleSendMessage('/cekdomain tokoanda.com')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-purple-400">/cekdomain [domain]</span>
                <p className="text-[11px] text-slate-400">Diagnostik DNS TXT & token lookup</p>
              </div>
              <span className="text-[10px] text-purple-400">Dev & Member</span>
            </div>

            <div
              onClick={() => handleSendMessage('/pending')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-amber-400">/pending</span>
                <p className="text-[11px] text-slate-400">Review antrean tiket operasional</p>
              </div>
              <span className="text-[10px] text-amber-400">Admin</span>
            </div>

            <div
              onClick={() => handleSendMessage('/list_members')}
              className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <span className="font-mono font-bold text-rose-400">/list_members</span>
                <p className="text-[11px] text-slate-400">Direktori seluruh anggota sistem</p>
              </div>
              <span className="text-[10px] text-rose-400">Admin/Super</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Native Telegram Style with Command & Media Trigger */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
        {/* Command Menu Button */}
        <button
          type="button"
          onClick={() => setShowCommandMenu(!showCommandMenu)}
          title="Buka Daftar Command Bot (/)"
          className={`p-2.5 rounded-xl border transition shadow-sm flex items-center justify-center ${
            showCommandMenu
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-slate-900 text-slate-400 hover:text-sky-400 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Media / Photo Attachment Button */}
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              '',
              'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
            )
          }
          title="Simulasi Kirim Bukti Transfer Bank / Foto"
          className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl border border-slate-800 bg-slate-900 transition shadow-sm"
        >
          <Image className="w-4 h-4" />
        </button>

        {/* Main Text Input Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.startsWith('/')) {
                setShowCommandMenu(true);
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ketik pesan bebas, pertanyaan, atau / untuk command...`}
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 transition shadow-inner font-sans"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
