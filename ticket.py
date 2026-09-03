from core.database import safe_execute
from core.utils import generate_ticket_number

class Ticket:
    @staticmethod
    def create(user_id, category, message):
        ticket_num = generate_ticket_number()
        safe_execute("INSERT INTO tickets (ticket_number, user_id, category, message, status) VALUES (?,?,?,?,'pending')",
                     (ticket_num, user_id, category, message))
        return ticket_num
    
    @staticmethod
    def get_user_tickets(user_id, limit=10):
        return safe_execute("""
            SELECT ticket_number, category, message, status, created_at
            FROM tickets WHERE user_id=? ORDER BY id DESC LIMIT ?
        """, (user_id, limit), fetch=True)
    
    @staticmethod
    def get_all_pending(limit=20):
        return safe_execute("""
            SELECT id, ticket_number, user_id, category, message, status, created_at
            FROM tickets WHERE status='pending' ORDER BY id ASC LIMIT ?
        """, (limit,), fetch=True)
    
    @staticmethod
    def get_detail(ticket_id):
        result = safe_execute("SELECT * FROM tickets WHERE id=?", (ticket_id,), fetch=True)
        return result[0] if result else None
    
    @staticmethod
    def update_status(ticket_id, status, assigned_to=None, admin_reply=None):
        # PENTING: gunakan COALESCE agar assigned_to tidak ter-reset ke NULL
        # saat resolve dipanggil tanpa parameter assigned_to (mis. setelah
        # tiket sudah di-assign sebelumnya).
        if admin_reply:
            safe_execute("UPDATE tickets SET status=?, assigned_to=COALESCE(?, assigned_to), admin_reply=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                         (status, assigned_to, admin_reply, ticket_id))
        else:
            safe_execute("UPDATE tickets SET status=?, assigned_to=COALESCE(?, assigned_to), updated_at=CURRENT_TIMESTAMP WHERE id=?",
                         (status, assigned_to, ticket_id))