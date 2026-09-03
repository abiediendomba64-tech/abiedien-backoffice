from core.bot import bot
from core.rbac import has_access, is_admin_or_higher, is_dev_or_higher, can_manage_roles
from models.user import User

def register_auth_middleware(bot):
    """Daftarkan middleware autentikasi ke bot."""
    
    @bot.middleware_handler(update_types=['callback_query'])
    def auth_callback_middleware(bot_instance, call):
        if not hasattr(call, 'data'):
            return
        
        user_id = call.from_user.id
        role = User.get_role(user_id)
        
        # Super Admin only
        if call.data.startswith(('admin_role_', 'setrole_')):
            if not can_manage_roles(role):
                bot_instance.answer_callback_query(call.id, "⛔ Hanya Super Admin!", show_alert=True)
                return
        
        # Admin ke atas (Admin, Dev, Super Admin)
        if call.data.startswith(('admin_', 'broadcast_', 'verify_pay', 'list_members')):
            if not is_admin_or_higher(role):
                bot_instance.answer_callback_query(call.id, "⛔ Minimum role: Admin!", show_alert=True)
                return
        
        # Dev ke atas (Dev, Super Admin)
        if call.data.startswith(('admin_domain', 'admin_index')):
            if not is_dev_or_higher(role):
                bot_instance.answer_callback_query(call.id, "⛔ Minimum role: Developer!", show_alert=True)
                return
        
        # Member ke atas (Member, Admin, Dev, Super Admin)
        if call.data.startswith(('forum_create', 'forum_comment_')):
            if not has_access(role, 'member'):
                bot_instance.answer_callback_query(call.id, "⛔ Verifikasi dulu untuk jadi Member!", show_alert=True)
                return
    
    @bot.middleware_handler(update_types=['message'])
    def auth_message_middleware(bot_instance, message):
        if not hasattr(message, 'text'):
            return
        text = message.text or ""
        if not text.startswith('/'):
            return
        
        user_id = message.from_user.id
        role = User.get_role(user_id)
        
        # Super Admin only
        if text.startswith('/setrole'):
            if not can_manage_roles(role):
                bot_instance.reply_to(message, "⛔ Hanya Super Admin!")
                return
        
        # Admin ke atas
        if text.startswith(('/broadcast', '/verify_pay', '/list_members')):
            if not is_admin_or_higher(role):
                bot_instance.reply_to(message, "⛔ Minimum role: Admin!")
                return
        
        # Dev ke atas
        if text.startswith(('/cekdomain', '/indexing')):
            if not is_dev_or_higher(role):
                bot_instance.reply_to(message, "⛔ Minimum role: Developer!")
                return