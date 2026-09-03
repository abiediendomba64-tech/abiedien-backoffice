from telebot import types
from core.bot import bot
from core.rbac import require_role, can_manage_roles
from core.utils import check_domain_status, submit_to_google
from models.user import User
from models.payment import Payment
from config import SUPER_ADMIN_IDS

# ================== ADMIN PANEL ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("admin_"))
@require_role('admin')
def admin_callback(call):
    action = call.data.split("_")[1]
    cid = call.message.chat.id

    if action == "list":
        members = User.get_all_members()
        text = "📋 Member:\n" + "\n".join([f"{m[1]} | {m[2] or '-'} | {'✅' if m[3] else '❌'}" for m in members or []])
        bot.edit_message_text(text, cid, call.message.message_id, parse_mode="Markdown")
    elif action == "pay":
        pays = Payment.get_pending()
        text = "💳 Pending:\n" + "\n".join([f"ID:{p[0]} | User:{p[1]} | {p[4][:10]}" for p in pays or []]) if pays else "Kosong."
        text += "\nGunakan /verify_pay [id]"
        bot.edit_message_text(text, cid, call.message.message_id, parse_mode="Markdown")
    elif action == "domain":
        bot.send_message(cid, "Gunakan /cekdomain [domain.com]")

# ================== SET ROLE (HANYA SUPER ADMIN) ==================
@bot.message_handler(commands=['setrole'])
@require_role('super_admin')
def setrole_command(message):
    args = message.text.split()
    if len(args) < 3:
        return bot.reply_to(message, "❌ Format: /setrole @username [new_user|member|admin|dev|super_admin]")
    
    target_username = args[1].replace('@', '')
    new_role = args[2].lower()
    
    valid_roles = ['new_user', 'member', 'admin', 'dev', 'super_admin']
    if new_role not in valid_roles:
        return bot.reply_to(message, f"❌ Role tidak valid. Pilih: {', '.join(valid_roles)}")
    
    target = User.get_by_username(target_username)
    if not target:
        return bot.reply_to(message, f"❌ User @{target_username} tidak ditemukan.")
    
    target_id, target_name, current_role = target
    
    if target_id == message.from_user.id and new_role != 'super_admin':
        return bot.reply_to(message, "❌ Anda tidak bisa menurunkan role sendiri!")
    
    if current_role == 'super_admin' and new_role != 'super_admin':
        return bot.reply_to(message, "❌ Tidak bisa mengubah role Super Admin lain!")
    
    User.update_role(target_id, new_role)
    bot.reply_to(message, f"✅ Role @{target_username} diubah menjadi `{new_role}`.", parse_mode="Markdown")
    
    try:
        bot.send_message(target_id, f"🔔 Role Anda diubah menjadi `{new_role}` oleh Super Admin.", parse_mode="Markdown")
    except:
        pass

# ================== COMMAND ADMIN ==================
@bot.message_handler(commands=['cekdomain'])
@require_role('dev')
def cekdomain_cmd(message):
    args = message.text.split()
    if len(args) < 2:
        return bot.reply_to(message, "/cekdomain domain.com")
    domain = args[1]
    status, expiry, reg = check_domain_status(domain)
    bot.reply_to(message, f"🌐 {domain}\nStatus: {status}\nExpiry: {expiry}\nRegistrar: {reg}")

@bot.message_handler(commands=['list_members'])
@require_role('admin')
def list_members_cmd(message):
    members = User.get_all_members()
    text = "📋 Member:\n" + "\n".join([f"{m[1]} | {m[2] or '-'} | {'✅' if m[3] else '❌'}" for m in members or []])
    bot.reply_to(message, text, parse_mode="Markdown")

# ================== BROADCAST ==================
broadcast_cache = {}

@bot.message_handler(commands=['broadcast'])
@require_role('admin')
def broadcast_cmd(message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        return bot.reply_to(message, "/broadcast [pesan]")
    markup = types.InlineKeyboardMarkup()
    markup.add(
        types.InlineKeyboardButton("✅ KIRIM", callback_data=f"bcast_send_{hash(args[1])}"),
        types.InlineKeyboardButton("❌ BATAL", callback_data="bcast_cancel")
    )
    bot.reply_to(message, f"📢 Preview:\n{args[1][:300]}\n\nYakin?", reply_markup=markup)
    broadcast_cache[message.from_user.id] = args[1]

@bot.callback_query_handler(func=lambda call: call.data.startswith("bcast_send_"))
@require_role('admin')
def bcast_send(call):
    msg = broadcast_cache.pop(call.from_user.id, None)
    if not msg:
        return bot.edit_message_text("Sesi kadaluarsa.", call.message.chat.id, call.message.message_id)
    from core.database import safe_execute
    users = safe_execute("SELECT telegram_id FROM users", fetch=True)
    cnt = 0
    for (user_id,) in users or []:
        try:
            bot.send_message(user_id, f"📢 *PENGUMUMAN*\n\n{msg}", parse_mode="Markdown")
            cnt += 1
        except: pass
    bot.edit_message_text(f"✅ Broadcast ke {cnt} member.", call.message.chat.id, call.message.message_id)

@bot.callback_query_handler(func=lambda call: call.data == "bcast_cancel")
def bcast_cancel(call):
    broadcast_cache.pop(call.from_user.id, None)
    bot.edit_message_text("❌ Dibatalkan.", call.message.chat.id, call.message.message_id)