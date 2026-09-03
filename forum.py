from telebot import types
from core.bot import bot
from core.rbac import has_access, require_role
from models.user import User
from models.forum import ForumTopic, ForumComment
from handlers.menu import show_forum_menu
from config import SUPER_ADMIN_IDS

# ================== STATES ==================
from telebot.handler_backends import State, StatesGroup

class ForumStates(StatesGroup):
    waiting_title = State()
    waiting_content = State()
    waiting_comment = State()

# ================== LIST TOPIK ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("forum_list_"))
def forum_list(call):
    parts = call.data.split("_")
    mode = parts[2] if len(parts) > 2 else 'open'
    offset = int(parts[-1]) if parts[-1].isdigit() else 0
    cid = call.message.chat.id
    uid = call.from_user.id
    
    if mode == 'all' and not has_access(User.get_role(uid), 'admin'):
        return bot.answer_callback_query(call.id, "Akses ditolak!")
    
    topics = ForumTopic.get_all(10, offset, 'open' if mode != 'all' else 'open')
    if mode == 'all':
        from core.database import safe_execute
        topics = safe_execute("SELECT id, topic_id, user_id, title, category, status, created_at FROM forum_topics ORDER BY id DESC LIMIT 10 OFFSET ?", (offset,), fetch=True)
    
    if not topics:
        return bot.edit_message_text("Belum ada topik.", cid, call.message.message_id)
    
    text = "📚 Topik:\n" + "\n".join([f"`{t[1]}` | {t[3][:30]}" for t in topics])
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("⏪", callback_data=f"forum_list_{mode}_{offset-10 if offset>=10 else 0}"),
        types.InlineKeyboardButton("⏩", callback_data=f"forum_list_{mode}_{offset+10}")
    )
    for t in topics[:5]:
        markup.add(types.InlineKeyboardButton(f"📩 {t[1]}", callback_data=f"forum_view_{t[0]}"))
    markup.add(types.InlineKeyboardButton("🔙", callback_data="forum_back"))
    bot.edit_message_text(text, cid, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# ================== CREATE TOPIK ==================
@bot.callback_query_handler(func=lambda call: call.data == "forum_create")
@require_role('member')
def forum_create(call):
    bot.send_message(call.message.chat.id, "✍️ Judul (5-60 karakter):")
    bot.set_state(call.from_user.id, ForumStates.waiting_title, call.message.chat.id)

@bot.message_handler(state=ForumStates.waiting_title)
def forum_title(message):
    title = message.text.strip()
    if len(title) < 5 or len(title) > 60:
        return bot.reply_to(message, "❌ 5-60 karakter.")
    with bot.retrieve_data(message.from_user.id, message.chat.id) as data:
        data['title'] = title
    bot.reply_to(message, "✍️ Konten (20-1000 karakter):")
    bot.set_state(message.from_user.id, ForumStates.waiting_content, message.chat.id)

@bot.message_handler(state=ForumStates.waiting_content)
def forum_content(message):
    content = message.text.strip()
    if len(content) < 20 or len(content) > 1000:
        return bot.reply_to(message, "❌ 20-1000 karakter.")
    with bot.retrieve_data(message.from_user.id, message.chat.id) as data:
        title = data.get('title', 'Topik')
    tid = ForumTopic.create(message.from_user.id, title, content)
    bot.reply_to(message, f"✅ Topik {tid} dibuat!")
    bot.delete_state(message.from_user.id, message.chat.id)

# ================== VIEW TOPIK ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("forum_view_"))
def forum_view(call):
    tid = int(call.data.split("_")[2])
    cid = call.message.chat.id
    uid = call.from_user.id
    topic, comments = ForumTopic.get_detail(tid)
    if not topic:
        return bot.edit_message_text("Topik hilang.", cid, call.message.message_id)
    t = topic[0]
    # Kolom forum_topics: 0=id,1=topic_id,2=user_id,3=title,4=content,
    # 5=category,6=status,7=created_at,8=updated_at,9=full_name(join)
    text = f"💬 **{t[3]}**\nOleh: {t[9] or t[2]} | Kategori: {t[5]}\nStatus: {'🔓 Terbuka' if t[6]=='open' else '🔒 Ditutup'} | {t[7][:16]}\n\n{t[4]}\n\n--- Komentar ---\n"
    for c in comments or []:
        text += f"💬 {c[4] or c[1]}: {c[2]} ({c[3][:16]})\n"
    markup = types.InlineKeyboardMarkup()
    role = User.get_role(uid)
    if t[6] == 'open' and has_access(role, 'member'):
        markup.add(types.InlineKeyboardButton("💬 Komentar", callback_data=f"forum_comment_{t[0]}"))
    if uid == t[2] or has_access(role, 'admin'):
        markup.add(types.InlineKeyboardButton("🔒 Tutup" if t[6]=='open' else "🔓 Buka", callback_data=f"forum_toggle_{t[0]}"))
    if has_access(role, 'admin'):
        markup.add(types.InlineKeyboardButton("🗑️ Hapus", callback_data=f"forum_delete_{t[0]}"))
    markup.add(types.InlineKeyboardButton("🔙", callback_data="forum_back"))
    bot.edit_message_text(text, cid, call.message.message_id, reply_markup=markup, parse_mode="Markdown")

# ================== KOMENTAR ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("forum_comment_"))
@require_role('member')
def forum_comment(call):
    tid = int(call.data.split("_")[2])
    bot.send_message(call.message.chat.id, "✍️ Ketik komentar (5-500 karakter):")
    bot.set_state(call.from_user.id, ForumStates.waiting_comment, call.message.chat.id)
    with bot.retrieve_data(call.from_user.id, call.message.chat.id) as data:
        data['comment_tid'] = tid

@bot.message_handler(state=ForumStates.waiting_comment)
def forum_save_comment(message):
    text = message.text.strip()
    if len(text) < 5 or len(text) > 500:
        return bot.reply_to(message, "❌ 5-500 karakter.")
    with bot.retrieve_data(message.from_user.id, message.chat.id) as data:
        tid = data.get('comment_tid')
    if not tid:
        return bot.reply_to(message, "Error.")
    ForumComment.add(tid, message.from_user.id, text)
    bot.reply_to(message, "✅ Komentar ditambahkan.")
    bot.delete_state(message.from_user.id, message.chat.id)

# ================== TOGGLE & DELETE ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("forum_toggle_"))
def forum_toggle(call):
    tid = int(call.data.split("_")[2])
    topic_rows = ForumTopic.get_detail(tid)[0]
    if not topic_rows:
        return
    topic_row = topic_rows[0]
    # Kolom: 0=id,1=topic_id,2=user_id,3=title,4=content,5=category,6=status,...
    uid = call.from_user.id
    if uid != topic_row[2] and not has_access(User.get_role(uid), 'admin'):
        return bot.answer_callback_query(call.id, "Bukan pemilik atau admin!", show_alert=True)
    status = topic_row[6]
    if status == 'open':
        ForumTopic.close(tid)
        new_status = 'closed'
    else:
        ForumTopic.reopen(tid)
        new_status = 'open'
    bot.answer_callback_query(call.id, f"Status: {new_status}")

@bot.callback_query_handler(func=lambda call: call.data.startswith("forum_delete_"))
@require_role('admin')
def forum_delete_cmd(call):
    tid = int(call.data.split("_")[2])
    ForumTopic.delete(tid)
    bot.answer_callback_query(call.id, "Topik dihapus.")

# ================== BACK ==================
@bot.callback_query_handler(func=lambda call: call.data == "forum_back")
def forum_back(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    show_forum_menu(call.message.chat.id, call.from_user.id)