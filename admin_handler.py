"""
RBAC-Aware Admin Commands - Bukan simulator, tapi operasional nyata
Menggunakan repository layer untuk akses data Supabase
"""
from telebot import types
from core.bot import bot
from core.rbac import can_perform_action, ROLES
from repositories.ticket_repository import TicketRepository, UserRepository, PaymentRepository, AuditRepository

# ==================== DECORATOR FOR RBAC ====================
def require_role(*allowed_roles):
    """Decorator untuk validasi role sebelum eksekusi command"""
    def decorator(func):
        def wrapper(message):
            user_id = message.from_user.id
            user = UserRepository.get_by_telegram_id(user_id)
            
            if not user:
                bot.reply_to(message, "❌ User tidak ditemukan. Silakan /start dulu.")
                return
            
            user_role = user.get("role")
            if user_role not in allowed_roles:
                bot.reply_to(
                    message,
                    f"❌ Akses ditolak. Role Anda: {user_role}\n"
                    f"Diperlukan: {', '.join(allowed_roles)}"
                )
                return
            
            return func(message, user)
        return wrapper
    return decorator

# ==================== ADMIN COMMANDS ====================

@bot.message_handler(commands=['pending'])
@require_role('admin', 'super_admin')
def pending_command(message, user):
    """
    /pending - Show queue of pending tickets
    Real data dari Supabase
    """
    try:
        tickets = TicketRepository.get_pending_tickets(limit=20)
        
        if not tickets:
            bot.reply_to(message, "📭 Tidak ada tiket pending.")
            return
        
        lines = ["📋 TIKET PENDING", ""]
        
        for ticket in tickets:
            user_info = ticket.get("users", {})
            full_name = user_info.get("full_name", "Unknown") if isinstance(user_info, dict) else "Unknown"
            
            emoji_priority = {
                'urgent': '🔴',
                'high': '🟠',
                'medium': '🟡',
                'low': '🟢'
            }.get(ticket['priority'], '❓')
            
            lines.append(
                f"{emoji_priority} <b>#{ticket['ticket_number']}</b>\n"
                f"👤 {full_name}\n"
                f"📂 {ticket['category']}\n"
                f"⏰ {ticket['created_at'][:10]}\n"
                f"━━━━━━━━━━━━"
            )
        
        bot.reply_to(message, "\n".join(lines), parse_mode="HTML")
        
        # Log action
        AuditRepository.log_action(
            actor_id=user['id'],
            action_type="VIEW_PENDING",
            resource_type="tickets",
            resource_id=0
        )
        
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['ticket'])
@require_role('admin', 'super_admin')
def ticket_command(message, user):
    """
    /ticket [ID] - Show ticket detail
    Contoh: /ticket TKT-0001
    """
    try:
        args = message.text.split()
        if len(args) < 2:
            bot.reply_to(message, "Gunakan: /ticket [TICKET_NUMBER]\nContoh: /ticket TKT-0001")
            return
        
        ticket_number = args[1]
        
        # Query by ticket_number (assuming we add this to repository)
        # For now, using ticket ID
        ticket = TicketRepository.get_ticket_detail(int(ticket_number.split('-')[1]))
        
        if not ticket:
            bot.reply_to(message, "❌ Tiket tidak ditemukan.")
            return
        
        # Build detail message
        user_info = ticket.get("users", {})
        assigned_info = ticket.get("assigned_user")
        messages = ticket.get("ticket_messages", [])
        
        detail = f"""
<b>🎫 {ticket['ticket_number']}</b>

<b>DETAIL</b>
Kategori: {ticket['category']}
Priority: {ticket['priority']}
Status: {ticket['status']}
Dibuat: {ticket['created_at']}

<b>USER</b>
Nama: {user_info.get('full_name', '-')}
Domain: {user_info.get('domain_name', '-')}

<b>ASSIGNED</b>
Admin: {assigned_info.get('full_name', 'Belum assigned') if assigned_info else 'Belum assigned'}

<b>DESKRIPSI</b>
{ticket.get('description', '-')}

<b>COLLECTED DATA</b>
{str(ticket.get('collected_data', {}))[:200]}...

<b>CONVERSATION ({len(messages)} pesan)</b>
"""
        for msg in messages[-5:]:  # Last 5 messages
            detail += f"\n- {msg['message'][:50]}..."
        
        bot.reply_to(message, detail, parse_mode="HTML")
        
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['ambil'])
@require_role('admin', 'super_admin')
def claim_command(message, user):
    """
    /ambil [ID] - Claim ticket untuk dikerjakan
    Contoh: /ambil 1 (TKT-0001)
    """
    try:
        args = message.text.split()
        if len(args) < 2:
            bot.reply_to(message, "Gunakan: /ambil [TICKET_ID]\nContoh: /ambil 1")
            return
        
        ticket_id = int(args[1])
        success = TicketRepository.assign_ticket(ticket_id, user['id'])
        
        if success:
            bot.reply_to(
                message,
                f"✅ Anda mengambil tiket #{ticket_id}\nStatus: ASSIGNED"
            )
            
            # Log action
            AuditRepository.log_action(
                actor_id=user['id'],
                action_type="CLAIM_TICKET",
                resource_type="tickets",
                resource_id=ticket_id
            )
        else:
            bot.reply_to(message, "❌ Gagal mengambil tiket.")
            
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['balas'])
@require_role('admin', 'super_admin')
def reply_command(message, user):
    """
    /balas [ID] [MSG] - Send reply to member
    Contoh: /balas 1 Domain sudah ready, cek DNS settings
    """
    try:
        parts = message.text.split(maxsplit=2)
        if len(parts) < 3:
            bot.reply_to(message, "Gunakan: /balas [ID] [MSG]\nContoh: /balas 1 Domain ready")
            return
        
        ticket_id = int(parts[1])
        reply_msg = parts[2]
        
        success = TicketRepository.append_message(ticket_id, user['id'], reply_msg)
        
        if success:
            bot.reply_to(message, f"✅ Balasan dikirim ke member")
            
            AuditRepository.log_action(
                actor_id=user['id'],
                action_type="REPLY_TICKET",
                resource_type="tickets",
                resource_id=ticket_id,
                new_value={"message": reply_msg}
            )
        else:
            bot.reply_to(message, "❌ Gagal mengirim balasan.")
            
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['selesai'])
@require_role('admin', 'super_admin')
def resolve_command(message, user):
    """
    /selesai [ID] - Mark ticket as resolved
    """
    try:
        args = message.text.split()
        if len(args) < 2:
            bot.reply_to(message, "Gunakan: /selesai [TICKET_ID]")
            return
        
        ticket_id = int(args[1])
        success = TicketRepository.update_ticket_status(ticket_id, "resolved")
        
        if success:
            bot.reply_to(message, f"✅ Tiket #{ticket_id} RESOLVED")
            
            AuditRepository.log_action(
                actor_id=user['id'],
                action_type="RESOLVE_TICKET",
                resource_type="tickets",
                resource_id=ticket_id,
                new_value={"status": "resolved"}
            )
        else:
            bot.reply_to(message, "❌ Gagal resolve tiket.")
            
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['payment_review'])
@require_role('admin', 'super_admin')
def payment_review_command(message, user):
    """
    /payment_review - Show pending payments
    """
    try:
        payments = PaymentRepository.get_pending_payments(limit=10)
        
        if not payments:
            bot.reply_to(message, "📭 Tidak ada pembayaran pending.")
            return
        
        lines = ["💳 PEMBAYARAN PENDING", ""]
        
        for payment in payments:
            user_info = payment.get("users", {})
            full_name = user_info.get("full_name", "Unknown") if isinstance(user_info, dict) else "Unknown"
            
            lines.append(
                f"💰 <b>#{payment['payment_number']}</b>\n"
                f"Rp {payment['amount']:,.0f}\n"
                f"👤 {full_name}\n"
                f"📅 {payment['created_at'][:10]}\n"
                f"━━━━━━━━━━━━"
            )
        
        bot.reply_to(message, "\n".join(lines), parse_mode="HTML")
        
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['audit'])
@require_role('super_admin')
def audit_command(message, user):
    """
    /audit - Show audit trail (Super Admin only)
    """
    try:
        logs = AuditRepository.get_audit_trail(limit=20)
        
        if not logs:
            bot.reply_to(message, "📭 Tidak ada audit log.")
            return
        
        lines = ["📜 AUDIT TRAIL", ""]
        
        for log in logs:
            actor_info = log.get("users", {})
            actor_name = actor_info.get("full_name", "Unknown") if isinstance(actor_info, dict) else "Unknown"
            
            lines.append(
                f"<b>{log['action_type']}</b> - {log['resource_type']}\n"
                f"👤 {actor_name}\n"
                f"⏰ {log['created_at'][:19]}\n"
                f"━━━━━━━━━━━━"
            )
        
        bot.reply_to(message, "\n".join(lines), parse_mode="HTML")
        
    except Exception as e:
        bot.reply_to(message, f"❌ Error: {str(e)}")

@bot.message_handler(commands=['admin_help'])
@require_role('admin', 'dev', 'super_admin')
def admin_help_command(message, user):
    """
    /admin_help - Show admin commands
    """
    help_text = """
<b>📖 ADMIN COMMANDS</b>

<b>TICKET MANAGEMENT</b>
/pending - Lihat tiket pending
/ticket [ID] - Detail tiket
/ambil [ID] - Ambil tiket
/balas [ID] [MSG] - Balas member
/selesai [ID] - Resolve tiket

<b>PAYMENT</b>
/payment_review - Lihat pembayaran pending

<b>AUDIT (Super Admin)</b>
/audit - Lihat audit trail

<b>MEMBER MANAGEMENT</b>
/members [STATUS] - Lihat daftar member
/verify_member [ID] - Verifikasi member baru
"""
    
    bot.reply_to(message, help_text, parse_mode="HTML")

print("✅ Admin commands registered (Supabase-backed)")