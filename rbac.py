"""
RBAC (Role-Based Access Control) - Single Gate untuk semua pengecekan akses.
"""

ROLE_HIERARCHY = {
    'new_user': 1,
    'member': 2,
    'admin': 3,
    'dev': 4,
    'super_admin': 5
}

def get_role_level(role: str) -> int:
    return ROLE_HIERARCHY.get(role, 0)

def has_access(user_role: str, required_role: str) -> bool:
    """Cek apakah user_role memiliki akses setara atau di atas required_role."""
    return get_role_level(user_role) >= get_role_level(required_role)

def is_admin_or_higher(role: str) -> bool:
    return has_access(role, 'admin')

def is_dev_or_higher(role: str) -> bool:
    return has_access(role, 'dev')

def can_manage_roles(role: str) -> bool:
    return role == 'super_admin'

# ================== DECORATOR UNTUK HANDLER ==================
from functools import wraps
from core.bot import bot
from models.user import User

def require_role(min_role: str):
    """
    Decorator untuk membatasi akses handler berdasarkan role minimum.
    Contoh: @require_role('admin')
    """
    def decorator(func):
        @wraps(func)
        def wrapper(message_or_call, *args, **kwargs):
            # Ambil user_id
            if hasattr(message_or_call, 'from_user'):
                user_id = message_or_call.from_user.id
            else:
                return func(message_or_call, *args, **kwargs)
            
            role = User.get_role(user_id)
            
            if has_access(role, min_role):
                return func(message_or_call, *args, **kwargs)
            else:
                error_msg = f"⛔ Akses ditolak. Role Anda: {role}. Dibutuhkan: {min_role} atau lebih tinggi."
                if hasattr(message_or_call, 'reply_to'):
                    bot.reply_to(message_or_call, error_msg)
                elif hasattr(message_or_call, 'id'):
                    bot.answer_callback_query(message_or_call.id, error_msg, show_alert=True)
                return None
        return wrapper
    return decorator