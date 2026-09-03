from core.database import safe_execute
from config import SUPER_ADMIN_IDS
import time
import secrets

class User:
    @staticmethod
    def get(telegram_id):
        result = safe_execute(
            "SELECT telegram_id, full_name, whatsapp_number, domain_name, verification_token, token_expiry, tg_handle, role, is_verified, domain_verified, last_verified_at FROM users WHERE telegram_id = ?",
            (telegram_id,), fetch=True
        )
        return result[0] if result else None

    @staticmethod
    def get_role(telegram_id):
        if telegram_id in SUPER_ADMIN_IDS:
            return "super_admin"
        user = User.get(telegram_id)
        return user[7] if user else "new_user"

    @staticmethod
    def create_or_update(telegram_id, username, full_name, wa, domain, tg_handle=None):
        token = secrets.token_urlsafe(16)
        expiry = int(time.time()) + (30 * 86400)
        existing = safe_execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,), fetch=True)
        if existing:
            safe_execute("""
                UPDATE users SET telegram_username=?, full_name=?, whatsapp_number=?, domain_name=?, verification_token=?, token_expiry=?, tg_handle=?, is_verified=1, domain_verified=0
                WHERE telegram_id=?
            """, (username, full_name, wa, domain, token, expiry, tg_handle, telegram_id))
        else:
            safe_execute("""
                INSERT INTO users (telegram_id, telegram_username, full_name, whatsapp_number, domain_name, verification_token, token_expiry, tg_handle, role, is_verified, domain_verified)
                VALUES (?,?,?,?,?,?,?,?, 'new_user', 1, 0)
            """, (telegram_id, username, full_name, wa, domain, token, expiry, tg_handle))
        return token

    @staticmethod
    def update_domain_verified(telegram_id, status):
        if status == 1:
            safe_execute("UPDATE users SET domain_verified=1, token_expiry=NULL, last_verified_at=CURRENT_TIMESTAMP WHERE telegram_id=?", (telegram_id,))
        else:
            safe_execute("UPDATE users SET domain_verified=0, token_expiry=NULL WHERE telegram_id=?", (telegram_id,))

    @staticmethod
    def update_domain_verified_batch(telegram_ids: list, status: int):
        """Batch update status domain verification untuk mencegah N+1 query."""
        if not telegram_ids:
            return
        placeholders = ",".join(["?"] * len(telegram_ids))
        if status == 1:
            safe_execute(
                f"UPDATE users SET domain_verified=1, token_expiry=NULL, last_verified_at=CURRENT_TIMESTAMP WHERE telegram_id IN ({placeholders})",
                tuple(telegram_ids)
            )
        else:
            safe_execute(
                f"UPDATE users SET domain_verified=0, token_expiry=NULL WHERE telegram_id IN ({placeholders})",
                tuple(telegram_ids)
            )

    @staticmethod
    def update_role(telegram_id, role):
        safe_execute("UPDATE users SET role=? WHERE telegram_id=?", (role, telegram_id))

    @staticmethod
    def get_by_username(username):
        result = safe_execute("SELECT telegram_id, full_name, role FROM users WHERE telegram_username=?", (username,), fetch=True)
        return result[0] if result else None

    @staticmethod
    def get_all_members(limit=50):
        return safe_execute("""
            SELECT telegram_id, full_name, domain_name, domain_verified, role
            FROM users WHERE domain_verified=1 ORDER BY id DESC LIMIT ?
        """, (limit,), fetch=True)

    # ================== METODE RBAC (SINGLE GATE) ==================
    @staticmethod
    def get_role_level(telegram_id: int) -> int:
        """Mengembalikan level numerik role user (1-5)."""
        from core.rbac import get_role_level as get_level
        role = User.get_role(telegram_id)
        return get_level(role)

    @staticmethod
    def is_admin(telegram_id: int) -> bool:
        """Cek apakah user adalah Admin, Dev, atau Super Admin."""
        from core.rbac import is_admin_or_higher
        return is_admin_or_higher(User.get_role(telegram_id))

    @staticmethod
    def is_dev(telegram_id: int) -> bool:
        """Cek apakah user adalah Dev atau Super Admin."""
        from core.rbac import is_dev_or_higher
        return is_dev_or_higher(User.get_role(telegram_id))