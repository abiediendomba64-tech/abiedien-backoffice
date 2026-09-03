from telebot import types
from core.bot import bot
from core.rbac import has_access
from models.user import User
from config import SUPER_ADMIN_IDS

def show_main_menu(chat_id, text="🏠 **Menu Utama**"):
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("✅ Verifikasi", callback_data="menu_verify"),
        types.InlineKeyboardButton("🎫 Tiket", callback_data="menu_ticket"),
        types.InlineKeyboardButton("💬 Forum", callback_data="menu_forum"),
        types.InlineKeyboardButton("💳 Payment", callback_data="menu_payment"),
        types.InlineKeyboardButton("📋 Status", callback_data="menu_status"),
        types.InlineKeyboardButton("❓ Bantuan", callback_data="menu_help")
    )
    # Gunakan hierarki RBAC (bukan hanya SUPER_ADMIN_IDS hardcoded), supaya
    # role 'admin'/'dev' yang di-set lewat /setrole juga melihat tombol ini.
    if has_access(User.get_role(chat_id), 'admin'):
        markup.add(types.InlineKeyboardButton("🔧 Admin Ops", callback_data="menu_admin"))
    bot.send_message(chat_id, text, reply_markup=markup, parse_mode="Markdown")

def show_admin_panel(chat_id):
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("📋 List Member", callback_data="admin_list"),
        types.InlineKeyboardButton("💳 Pending Pay", callback_data="admin_pay"),
        types.InlineKeyboardButton("🌐 Cek Domain", callback_data="admin_domain"),
        types.InlineKeyboardButton("🔙 Kembali", callback_data="menu_back")
    )
    bot.send_message(chat_id, "🔧 **Admin Panel**", reply_markup=markup, parse_mode="Markdown")

def show_ticket_menu(chat_id, user_id):
    role = User.get_role(user_id)
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("📝 Buat Tiket", callback_data="ticket_new"),
        types.InlineKeyboardButton("📜 Tiket Saya", callback_data="ticket_my")
    )
    if has_access(role, 'member'):
        markup.add(types.InlineKeyboardButton("📊 Kelola Pending", callback_data="ticket_manage"))
    markup.add(types.InlineKeyboardButton("🔙 Kembali", callback_data="menu_back"))
    bot.send_message(chat_id, "🎫 **Sistem Tiket**", reply_markup=markup, parse_mode="Markdown")

def show_forum_menu(chat_id, user_id):
    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        types.InlineKeyboardButton("📚 Lihat Topik", callback_data="forum_list_0"),
        types.InlineKeyboardButton("📝 Buat Topik", callback_data="forum_create")
    )
    if has_access(User.get_role(user_id), 'admin'):
        markup.add(types.InlineKeyboardButton("📊 All Topics", callback_data="forum_list_all_0"))
    markup.add(types.InlineKeyboardButton("🔙 Kembali", callback_data="menu_back"))
    bot.send_message(chat_id, "💬 **Forum**", reply_markup=markup, parse_mode="Markdown")