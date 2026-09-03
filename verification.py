import re
import time
from telebot import types
from core.bot import bot
from core.utils import check_domain_ownership
from core.database import safe_execute          # <-- import bersih
from models.user import User
from handlers.menu import show_main_menu
from config import VERIFICATION_EXPIRY_DAYS, SUPER_ADMIN_IDS

# ================== STATES ==================
from telebot.handler_backends import State, StatesGroup

class VerificationStates(StatesGroup):
    waiting_name = State()
    waiting_wa = State()
    waiting_domain = State()
    waiting_tg = State()

# ================== HANDLER START ==================
@bot.message_handler(commands=['start', 'menu'])
def start_command(message):
    uid = message.from_user.id
    user = User.get(uid)
    
    if user:
        full_name, wa, domain, token, expiry, tg, role, is_verified, domain_verified = (
            user[1], user[2], user[3], user[4], user[5], user[6], user[7], user[8], user[9]
        )
        if domain_verified == 1 and wa and domain:
            bot.reply_to(
                message,
                f"✅ Selamat datang kembali, {full_name}!\nDomain: {domain}\nStatus: Terverifikasi",
                parse_mode="Markdown"
            )
            return show_main_menu(message.chat.id)
        if domain and domain_verified == 0:
            ask_verify_domain(message, uid, domain, token, expiry)
            return
        if not wa:
            bot.reply_to(message, "📱 Masukkan nomor WhatsApp:")
            bot.set_state(uid, VerificationStates.waiting_wa, message.chat.id)
            return
        if not domain:
            bot.reply_to(message, "🌐 Masukkan domain Anda:")
            bot.set_state(uid, VerificationStates.waiting_domain, message.chat.id)
            return
    else:
        bot.reply_to(message, "🔐 Verifikasi Data\nMasukkan Nama Lengkap:", parse_mode="Markdown")
        bot.set_state(uid, VerificationStates.waiting_name, message.chat.id)

def ask_verify_domain(message, uid, domain, token, expiry):
    current = int(time.time())
    if current > expiry:
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🔄 Token Baru", callback_data=f"renew_{uid}"))
        bot.send_message(message.chat.id, "⏰ Token kadaluarsa.", reply_markup=markup)
        return
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("🔍 Cek Sekarang", callback_data=f"check_{uid}"))
    bot.send_message(
        message.chat.id,
        f"🌐 Domain: `{domain}`\nToken: `{token}`\n\nTambahkan TXT record, lalu klik cek.",
        reply_markup=markup,
        parse_mode="Markdown"
    )
    bot.set_state(uid, VerificationStates.waiting_tg, message.chat.id)

# ================== STATE HANDLERS ==================
@bot.message_handler(state=VerificationStates.waiting_name)
def get_name(message):
    name = message.text.strip()
    if len(name) < 2:
        return bot.reply_to(message, "❌ Terlalu pendek.")
    with bot.retrieve_data(message.from_user.id, message.chat.id) as data:
        data['name'] = name
    bot.reply_to(message, "✅ Masukkan nomor WhatsApp:")
    bot.set_state(message.from_user.id, VerificationStates.waiting_wa, message.chat.id)

@bot.message_handler(state=VerificationStates.waiting_wa)
def get_wa(message):
    wa = message.text.strip().replace(" ", "").replace("-", "").replace("+", "")
    if not wa.isdigit() or len(wa) < 9:
        return bot.reply_to(message, "❌ Format WA salah.")
    with bot.retrieve_data(message.from_user.id, message.chat.id) as data:
        data['wa'] = wa
    bot.reply_to(message, "✅ Masukkan domain (contoh: toko.com):")
    bot.set_state(message.from_user.id, VerificationStates.waiting_domain, message.chat.id)

@bot.message_handler(state=VerificationStates.waiting_domain)
def get_domain(message):
    domain = message.text.strip().lower()
    if " " in domain or not re.search(r"\.[a-z]{2,}", domain):
        return bot.reply_to(message, "❌ Format domain invalid.")
    
    uid = message.from_user.id

    # ========== CEK DUPLIKAT DOMAIN (FIX BUG KRITIS) ==========
    existing = safe_execute(
        "SELECT telegram_id, full_name FROM users WHERE domain_name = ? AND domain_verified = 1",
        (domain,), fetch=True
    )
    if existing and existing[0][0] != uid:
        owner_name = existing[0][1]
        return bot.reply_to(
            message,
            f"❌ Domain `{domain}` sudah terverifikasi oleh **{owner_name}**. "
            "Jika Anda satu tim, hubungi Admin untuk penambahan anggota.",
            parse_mode="Markdown"
        )
    # ==========================================================

    with bot.retrieve_data(uid, message.chat.id) as data:
        name = data.get('name', '')
        wa = data.get('wa', '')
    username = message.from_user.username or ""
    token = User.create_or_update(uid, username, name, wa, domain, None)
    ask_verify_domain(message, uid, domain, token, int(time.time()) + (VERIFICATION_EXPIRY_DAYS * 86400))

@bot.message_handler(state=VerificationStates.waiting_tg)
def get_tg(message):
    tg = message.text.strip()
    if tg.startswith("@"):
        tg = tg[1:]
    if len(tg) > 0 and len(tg) < 3:
        return bot.reply_to(message, "❌ Terlalu pendek.")
    safe_execute("UPDATE users SET tg_handle=? WHERE telegram_id=?", (tg if tg else None, message.from_user.id))
    bot.reply_to(message, "✅ Data tersimpan.")
    bot.delete_state(message.from_user.id, message.chat.id)
    show_main_menu(message.chat.id)

# ================== CALLBACK VERIFIKASI ==================
@bot.callback_query_handler(func=lambda call: call.data.startswith("check_"))
def check_domain_callback(call):
    uid = int(call.data.split("_")[1])
    cid = call.message.chat.id
    bot.answer_callback_query(call.id, "⏳ Memeriksa DNS...")
    bot.edit_message_text("🔍 Memeriksa TXT record...", cid, call.message.message_id)
    
    user = User.get(uid)
    if not user:
        return bot.edit_message_text("❌ Data user tidak ditemukan.", cid, call.message.message_id)
    domain, token, expiry = user[3], user[4], user[5]
    if int(time.time()) > expiry:
        return bot.edit_message_text("⏰ Token expired. Minta token baru.", cid, call.message.message_id)
    
    result = check_domain_ownership(domain, token)
    if result == "NO_DOMAIN":
        return bot.edit_message_text(f"❌ Domain `{domain}` tidak aktif di DNS.", cid, call.message.message_id, parse_mode="Markdown")
    if result in ["NO_TXT", False]:
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🔄 Coba Lagi", callback_data=f"check_{uid}"))
        return bot.edit_message_text(
            "❌ Token tidak ditemukan. Pastikan record TXT sudah ditambahkan dan propagasi DNS selesai.",
            cid, call.message.message_id, reply_markup=markup
        )
    if result == "TIMEOUT":
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🔄 Coba Lagi", callback_data=f"check_{uid}"))
        return bot.edit_message_text("⏳ Timeout DNS. Coba lagi nanti.", cid, call.message.message_id, reply_markup=markup)
    
    # === SUKSES ===
    User.update_domain_verified(uid, 1)
    bot.edit_message_text(
        f"✅ **VERIFIKASI BERHASIL!**\nDomain: `{domain}`",
        cid, call.message.message_id, parse_mode="Markdown"
    )
    # Notifikasi ke semua Super Admin
    for admin_id in SUPER_ADMIN_IDS:
        try:
            bot.send_message(admin_id, f"✅ Verifikasi domain oleh user `{uid}`\nDomain: `{domain}`", parse_mode="Markdown")
        except:
            pass

@bot.callback_query_handler(func=lambda call: call.data.startswith("renew_"))
def renew_token(call):
    uid = int(call.data.split("_")[1])
    from core.utils import generate_token
    new_token = generate_token(16)
    new_expiry = int(time.time()) + (VERIFICATION_EXPIRY_DAYS * 86400)
    safe_execute(
        "UPDATE users SET verification_token=?, token_expiry=?, domain_verified=0 WHERE telegram_id=?",
        (new_token, new_expiry, uid)
    )
    bot.answer_callback_query(call.id, "Token baru dibuat.")
    bot.edit_message_text(
        "🔄 Token baru telah dibuat. Ketik /start untuk memulai verifikasi ulang.",
        call.message.chat.id, call.message.message_id
    )