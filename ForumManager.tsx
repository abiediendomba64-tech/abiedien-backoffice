import React, { useState, useEffect } from 'react';
import { ForumTopic, ForumComment } from '../types';
import { MessageSquare, Lock, Unlock, Trash2, Send, Plus, CornerDownRight } from 'lucide-react';

interface ForumManagerProps {
  onRefresh: () => void;
}

export const ForumManager: React.FC<ForumManagerProps> = ({ onRefresh }) => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeTopic, setActiveTopic] = useState<(ForumTopic & { comments?: ForumComment[] }) | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/forum/topics');
      const data = await res.json();
      setTopics(data);
      if (activeTopic) {
        loadTopicDetail(activeTopic.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const loadTopicDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/forum/topics/${id}`);
      const data = await res.json();
      setActiveTopic(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 123456789,
          title: newTitle,
          content: newContent,
          category: newCategory
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewTitle('');
        setNewContent('');
        fetchTopics();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic || !commentInput.trim()) return;
    try {
      const res = await fetch(`/api/forum/topics/${activeTopic.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 123456789,
          comment_text: commentInput
        })
      });
      if (res.ok) {
        setCommentInput('');
        loadTopicDetail(activeTopic.id);
        fetchTopics();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/forum/topics/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        fetchTopics();
        if (activeTopic?.id === id) {
          loadTopicDetail(id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!confirm('Hapus topik ini?')) return;
    try {
      const res = await fetch(`/api/forum/topics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeTopic?.id === id) setActiveTopic(null);
        fetchTopics();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Topics List (Left Side) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Topik Forum</h3>
          </div>
          <button
            onClick={() => {
              setIsCreating(!isCreating);
              setActiveTopic(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Topik
          </button>
        </div>

        {/* Create Topic Card */}
        {isCreating && (
          <form onSubmit={handleCreateTopic} className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-3">
            <h4 className="text-xs font-semibold text-indigo-300">Tulis Topik Diskusi Baru</h4>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul topik (5-60 karakter)..."
              className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              required
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Tuliskan pesan / konten topik (20-1000 karakter)..."
              rows={3}
              className="w-full p-3 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="flex items-center justify-between">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800"
              >
                <option value="General">General</option>
                <option value="DNS & Hosting">DNS & Hosting</option>
                <option value="SEO & Indexing">SEO & Indexing</option>
                <option value="Bisnis & Affiliate">Bisnis & Affiliate</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow"
                >
                  Publikasikan
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List items */}
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setIsCreating(false);
                loadTopicDetail(t.id);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-md ${
                activeTopic?.id === t.id
                  ? 'bg-slate-800/90 border-indigo-500/80 shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-indigo-400">{t.topic_id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  t.status === 'open'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                  {t.status === 'open' ? '🔓 OPEN' : '🔒 CLOSED'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 line-clamp-1">{t.title}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.content}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                <span>Oleh: {t.author_name}</span>
                <span>{t.comments_count || 0} Komentar</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Detail View (Right Side) */}
      <div className="lg:col-span-7">
        {activeTopic ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {activeTopic.topic_id}
                  </span>
                  <span className="text-xs text-slate-400">Kategori: <strong>{activeTopic.category}</strong></span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">{activeTopic.title}</h3>
                <p className="text-xs text-slate-400">
                  Diposting oleh <strong className="text-slate-200">{activeTopic.author_name}</strong> • {new Date(activeTopic.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(activeTopic.id)}
                  title={activeTopic.status === 'open' ? 'Kunci Topik' : 'Buka Topik'}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {activeTopic.status === 'open' ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  onClick={() => handleDeleteTopic(activeTopic.id)}
                  title="Hapus Topik"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {activeTopic.content}
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Tanggapan & Komentar ({activeTopic.comments?.length || 0})
              </h4>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activeTopic.comments && activeTopic.comments.length > 0 ? (
                  activeTopic.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-slate-200">{c.author_name}</span>
                        <span className="text-[10px]">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-300">{c.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">Belum ada tanggapan.</p>
                )}
              </div>

              {/* Add Comment Input */}
              {activeTopic.status === 'open' ? (
                <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Tulis tanggapan / komentar Anda..."
                    className="flex-1 px-4 py-2.5 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition shadow flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim
                  </button>
                </form>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950 text-center text-xs text-slate-500 border border-slate-800">
                  🔒 Topik ini telah dikunci. Komentar baru ditutup.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[400px] rounded-2xl bg-slate-900/60 border border-slate-800 border-dashed flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">Pilih topik untuk melihat isi diskusi dan tanggapan</p>
            <p className="text-xs text-slate-600 mt-1">Atau buat topik baru untuk memulai diskusi dengan member lain</p>
          </div>
        )}
      </div>
    </div>
  );
};
